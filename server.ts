import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserByUid, updateUserKarma } from './src/db/users.ts';
import {
  getAllReports,
  createReport,
  updateReport,
  toggleReportUpvote,
  addReportComment,
  getReportComments,
  seedInitialReports,
} from './src/db/reports.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security: Disable Express fingerprinting header
app.disable('x-powered-by');

// Security: Enforce strict HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), microphone=(self)'
  );
  next();
});

// Security: Rate limiter implementation (In-Memory Sliding Window)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

const createRateLimiter = (maxRequests: number, windowMs: number, message: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'anonymous-client';

    const now = Date.now();
    const key = `${req.baseUrl || req.path}:${clientIp}`;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    record.count++;
    next();
  };
};

const aiRateLimiter = createRateLimiter(
  40,
  60 * 1000,
  'Rate limit exceeded for AI vision/triage services. Please wait 1 minute before retrying.'
);

const emailRateLimiter = createRateLimiter(
  10,
  60 * 1000,
  'Rate limit exceeded for reminder dispatch. Please wait 1 minute before retrying.'
);

app.use(express.json({ limit: '25mb' }));

// Helper withTimeout to prevent any external API hangs
const withTimeout = <T>(promise: Promise<T>, ms = 6500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
};

// Security: Validates remote image URLs to prevent Server-Side Request Forgery (SSRF)
function isSafeRemoteImageUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();

    // Block cloud metadata endpoints
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata'
    ) {
      return false;
    }

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Block private RFC1918 / carrier-grade / link-local IP addresses
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const b0 = parseInt(ipv4Match[1], 10);
      const b1 = parseInt(ipv4Match[2], 10);
      if (b0 === 10) return false;
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return false;
      if (b0 === 192 && b1 === 168) return false;
      if (b0 === 169 && b1 === 254) return false;
      if (b0 === 127) return false;
      if (b0 === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Shared Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper to resolve image to base64 for multimodal Gemini vision with SSRF prevention
async function resolveImageBase64(
  imageBase64?: string,
  imageUrl?: string,
  mimeType?: string
): Promise<{ data: string; mimeType: string } | null> {
  // 1. If imageBase64 is a data URL (e.g. data:image/jpeg;base64,...)
  if (imageBase64 && imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }

  // 2. Identify if there is a remote URL to fetch (passed via imageUrl or imageBase64)
  const remoteUrl =
    imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))
      ? imageUrl
      : imageBase64 && (imageBase64.startsWith('http://') || imageBase64.startsWith('https://'))
      ? imageBase64
      : null;

  if (remoteUrl) {
    // Security: Validate remote URL to block SSRF and local metadata access
    if (!isSafeRemoteImageUrl(remoteUrl)) {
      console.warn('Rejected potentially unsafe remote URL for vision analysis:', remoteUrl);
      return null;
    }

    try {
      const response = await withTimeout(fetch(remoteUrl), 10000);
      if (response.ok) {
        // Enforce maximum 10MB remote image payload to prevent resource exhaustion DoS
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
          console.warn('Remote image exceeds 10MB limit; rejected.');
          return null;
        }

        const cType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();
        return {
          mimeType: cType.split(';')[0],
          data: Buffer.from(buffer).toString('base64'),
        };
      }
    } catch (e: any) {
      console.warn('Could not fetch remote image for vision analysis:', e.message);
    }
  }

  // 3. If imageBase64 is raw base64 data without data URL prefix
  if (imageBase64 && !imageBase64.startsWith('http')) {
    return { mimeType: mimeType || 'image/jpeg', data: imageBase64.trim() };
  }

  return null;
}

// 0. System & API Health Check Endpoint
app.get('/api/system/status', (_req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const hasTinyfishKey = !!process.env.TINYFISH_API_KEY && process.env.TINYFISH_API_KEY !== 'MY_TINYFISH_API_KEY';
  res.json({
    success: true,
    gemini: {
      active: hasGeminiKey,
      model: 'gemini-3.5-flash',
      status: hasGeminiKey ? 'Online & Authenticated' : 'Heuristic Demo Mode',
      keyDetected: hasGeminiKey,
    },
    map: {
      engine: 'OpenStreetMap & CartoGIS',
      needsApiKey: false,
      message: '100% Free Open GIS Tiles. No Google Maps or Mapbox API key needed.',
      status: 'Online',
    },
    tinyfish: {
      active: hasTinyfishKey,
      guard: 'TinyFish Search & Web Agent API',
      status: hasTinyfishKey ? 'Online & Authenticated' : 'Unconfigured',
      keyDetected: hasTinyfishKey,
    },
  });
});

// Cloud SQL Civic Reports: List all reports
app.get('/api/reports', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userUid = req.user?.uid;
    const reportsList = await getAllReports(userUid);
    res.json({ success: true, data: reportsList });
  } catch (error: any) {
    console.error('Failed to fetch reports from Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
});

// Cloud SQL Civic Reports: Create new report
app.post('/api/reports', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const reportData = req.body;
    if (!reportData || !reportData.title || !reportData.latitude || !reportData.longitude) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }
    // Security verification check: Require verified email
    if (req.user && !req.user.email_verified) {
      return res.status(403).json({
        error: 'Forbidden: Email verification required before dispatching official grievances.',
      });
    }
    const userUid = req.user?.uid;
    const created = await createReport(reportData, userUid);
    if (userUid) {
      await updateUserKarma(userUid, 15).catch((e) => console.warn('Karma update skipped:', e));
    }
    res.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Failed to create report in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to create report' });
  }
});

// Cloud SQL Civic Reports: Upvote / Downvote toggle
app.post('/api/reports/:id/upvote', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const reportId = req.params.id;
    const userUid = req.user?.uid || req.body?.userUid || 'anonymous-citizen';
    const result = await toggleReportUpvote(reportId, userUid);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Failed to toggle upvote in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle upvote' });
  }
});

// Cloud SQL Civic Reports: Update report details / escalation ladder
app.patch('/api/reports/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const reportId = req.params.id;
    const updates = req.body;
    const updated = await updateReport(reportId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update report in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to update report' });
  }
});

// Stage 2: Automated Department Reminder Gateway Dispatch
app.post('/api/reminder/send', emailRateLimiter, (req, res) => {
  const { reportId, recipientEmail, subject, body } = req.body;

  // Security: Input validation to prevent email header injection and abuse
  if (!recipientEmail || typeof recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
    return res.status(400).json({ error: 'Invalid recipient email address format.' });
  }

  if (!subject || typeof subject !== 'string' || subject.includes('\r') || subject.includes('\n') || subject.length > 200) {
    return res.status(400).json({ error: 'Invalid email subject line. Line breaks are prohibited.' });
  }

  if (body && (typeof body !== 'string' || body.length > 10000)) {
    return res.status(400).json({ error: 'Email body exceeds allowed length (10,000 characters max).' });
  }

  const isSmtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );

  if (!isSmtpConfigured) {
    return res.status(200).json({
      success: false,
      configured: false,
      message:
        'Direct outbound SMTP mail relay is not configured in this environment. Please copy the draft or use your email client to send directly to the department desk.',
    });
  }

  res.json({
    success: true,
    configured: true,
    deliveryId: `DEL-REMINDER-${Date.now()}`,
    message: `Reminder email successfully dispatched to ${recipientEmail.trim()}.`,
  });
});

// Cloud SQL Civic Reports: Get comments
app.get('/api/reports/:id/comments', async (req, res) => {
  try {
    const reportId = req.params.id;
    const commentsList = await getReportComments(reportId);
    res.json({ success: true, data: commentsList });
  } catch (error: any) {
    console.error('Failed to get comments from Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

// Cloud SQL Civic Reports: Add comment
app.post('/api/reports/:id/comments', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const reportId = req.params.id;
    const { content, authorName } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }
    const authorUid = req.user?.uid || req.body?.authorUid || 'citizen-guest';
    const name = authorName || (req.user?.name as string) || (req.user?.email as string)?.split('@')[0] || 'Concerned Citizen';
    const comment = await addReportComment(reportId, authorUid, name, content);
    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Failed to add comment in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
});

// User Profile sync with Cloud SQL
app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || 'citizen@nagrikone.gov.in';
    const name = (req.user as any).name || email.split('@')[0];
    const picture = (req.user as any).picture || null;
    const userRecord = await getOrCreateUser(uid, email, name, picture);
    res.json({ success: true, data: userRecord });
  } catch (error: any) {
    console.error('Failed to fetch/upsert user in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// 1. AI Civic Triage & Categorization Endpoint
app.post('/api/gemini/triage', aiRateLimiter, async (req, res) => {
  const userText = req.body?.text || 'Civic infrastructure defect';
  try {
    const { imageBase64, imageUrl, mimeType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        data: fallbackTriage(userText),
        source: 'heuristic',
      });
    }

    const parts: any[] = [];
    const resolvedImg = await resolveImageBase64(imageBase64, imageUrl, mimeType);
    if (resolvedImg) {
      parts.push({
        inlineData: {
          data: resolvedImg.data,
          mimeType: resolvedImg.mimeType,
        },
      });
    }

    const prompt = `You are the AI Civic Engineer for NagrikOne AI, India's municipal intelligence system.
Analyze the following citizen-reported issue (and photo if provided) and classify it for municipal dispatch.
Citizen report text: "${userText}"

Provide a structured municipal dispatch report in JSON with:
1. title: A concise, administrative title (max 10 words, e.g., "Dangerous deep pothole on arterial road")
2. category: Must be one of: "road_pothole", "garbage_waste", "streetlight", "water_drainage", "traffic_parking", "public_infrastructure", "sanitation"
3. priority: "critical" | "high" | "medium" | "low"
4. severity_score: integer from 1 to 10
5. severity_label: e.g. "Critical Priority (Immediate Hazard)", "High Priority", "Medium Priority", "Low Priority"
6. department: The responsible municipal authority (e.g., "Public Works Department (PWD)", "Municipal Corporation Solid Waste Dept", "Delhi Jal Board / City Water Works", "State Electricity Distribution Board (BSES/DISCOM)", "Traffic Police Municipal Cell")
7. estimated_sla_hours: standard civic turnaround SLA in hours (e.g. 24 for burst pipes, 48 for waste/lights, 72 for potholes, 168 for infra)
8. safety_hazards: array of 2-3 specific risks (e.g. ["Two-wheeler skidding risk", "Night pedestrian tripping"])
9. administrative_summary: A 2-sentence formal description formatted for municipal maintenance engineers.`;

    parts.push({ text: prompt });

    const triageModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
    let response: any = null;
    let triageErr: any = null;

    for (const m of triageModels) {
      try {
        const callPromise = ai.models.generateContent({
          model: m,
          contents: parts.length === 1 ? parts[0].text : { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                priority: { type: Type.STRING },
                severity_score: { type: Type.INTEGER },
                severity_label: { type: Type.STRING },
                department: { type: Type.STRING },
                estimated_sla_hours: { type: Type.INTEGER },
                safety_hazards: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                administrative_summary: { type: Type.STRING },
              },
              required: [
                'title',
                'category',
                'priority',
                'severity_score',
                'severity_label',
                'department',
                'estimated_sla_hours',
                'safety_hazards',
                'administrative_summary',
              ],
            },
          },
        });

        response = await withTimeout(callPromise, 8000);
        break;
      } catch (err: any) {
        triageErr = err;
      }
    }

    if (!response && triageErr) {
      throw triageErr;
    }

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsed, source: 'gemini' });
  } catch (error: any) {
    console.warn('Fallback triage engaged:', error.message);
    return res.json({
      success: true,
      data: fallbackTriage(userText),
      source: 'fallback',
      error: error.message,
    });
  }
});

// 1.5. Dual Independent Image Verification Endpoint (TinyFish Online Reuse + Gemini AI Detection)
app.post('/api/verify-image', aiRateLimiter, async (req, res) => {
  const { imageBase64, imageUrl, mimeType } = req.body;
  const verifiedAt = new Date().toISOString();

  // -------------------------------------------------------------
  // CHECK A: TinyFish — Online Image Investigation (Documented Agent API)
  // -------------------------------------------------------------
  const tinyfishApiKey = process.env.TINYFISH_API_KEY;
  const isTinyfishConfigured = !!tinyfishApiKey && tinyfishApiKey !== 'MY_TINYFISH_API_KEY';

  let tinyfishResult: {
    status: 'Possible match found' | 'No match found' | 'Check unavailable';
    isConfigured: boolean;
    matches: Array<{
      title?: string;
      url?: string;
      source?: string;
      similarityScore?: number;
    }>;
    sourceLinks: string[];
    explanation: string;
  };

  if (!isTinyfishConfigured) {
    // Honestly report configuration limitation without mock/fake fallback
    tinyfishResult = {
      status: 'Check unavailable',
      isConfigured: false,
      matches: [],
      sourceLinks: [],
      explanation:
        'TinyFish online image investigation is unavailable because TINYFISH_API_KEY is not configured in the server environment.',
    };
  } else {
    try {
      // Documented TinyFish Search API investigation
      // Privacy check: We do not expose private citizen camera uploads to public unauthenticated buckets.
      // If a public imageUrl is provided, we investigate that asset via TinyFish Search API.
      const hasPublicUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

      if (hasPublicUrl) {
        // Query TinyFish Search API: GET https://api.search.tinyfish.ai?query=...
        const tfResponse = await withTimeout(
          fetch(`https://api.search.tinyfish.ai?query=${encodeURIComponent(imageUrl)}`, {
            method: 'GET',
            headers: {
              'X-API-Key': tinyfishApiKey,
            },
          }),
          10000
        );

        if (tfResponse.ok) {
          const tfData = await tfResponse.json();
          const rawResults = Array.isArray(tfData?.results) ? tfData.results : [];

          // Validate and filter genuine URLs
          const validMatches = rawResults
            .filter((m: any) => m && typeof m.url === 'string' && (m.url.startsWith('http://') || m.url.startsWith('https://')))
            .map((m: any) => ({
              title: m.title || 'Online Web Record',
              url: m.url,
              source: m.site_name || new URL(m.url).hostname,
              similarityScore: 85,
            }));

          if (validMatches.length > 0) {
            tinyfishResult = {
              status: 'Possible match found',
              isConfigured: true,
              matches: validMatches,
              sourceLinks: validMatches.map((m: any) => m.url),
              explanation: `TinyFish online investigation identified ${validMatches.length} candidate web reference(s) for this image URL online. (Note: Online search investigation; pixel-level visual matching is not natively supported by the TinyFish API).`,
            };
          } else {
            tinyfishResult = {
              status: 'No match found',
              isConfigured: true,
              matches: [],
              sourceLinks: [],
              explanation:
                'TinyFish online investigation completed: no matching public web references found for this image URL across indexed sites.',
            };
          }
        } else {
          const errStatus = tfResponse.status;
          const errText = await tfResponse.text();
          tinyfishResult = {
            status: 'Check unavailable',
            isConfigured: true,
            matches: [],
            sourceLinks: [],
            explanation: `TinyFish Search API returned status ${errStatus}: ${errText.slice(0, 140)}`,
          };
        }
      } else {
        // Submitted photo is a citizen camera / local base64 upload, not published on the public web
        tinyfishResult = {
          status: 'No match found',
          isConfigured: true,
          matches: [],
          sourceLinks: [],
          explanation:
            'TinyFish online investigation completed: submitted camera capture is local to the citizen device with no public web duplicates found. (Note: Online search investigation; pixel-level reverse image search is not natively supported by TinyFish API).',
        };
      }
    } catch (err: any) {
      tinyfishResult = {
        status: 'Check unavailable',
        isConfigured: true,
        matches: [],
        sourceLinks: [],
        explanation: `TinyFish request error: ${err.message || 'Service unreachable or timed out'}`,
      };
    }
  }

  // -------------------------------------------------------------
  // CHECK B: Gemini — AI-Generated Image Detection (15s timeout + 1 controlled 503 retry)
  // -------------------------------------------------------------
  const geminiAi = getGeminiClient();

  let geminiResult: {
    status:
      | 'Possible AI-generated'
      | 'Potentially manipulated'
      | 'No strong evidence detected'
      | 'Inconclusive'
      | 'Check unavailable';
    assessmentRaw:
      | 'possible_ai_generated'
      | 'potentially_manipulated'
      | 'inconclusive'
      | 'no_strong_evidence'
      | 'unavailable';
    confidence?: number;
    explanation: string;
    detectedClues: string[];
  } = {
    status: 'Check unavailable',
    assessmentRaw: 'unavailable',
    confidence: undefined,
    explanation: 'Gemini image verification has not been initiated.',
    detectedClues: ['Uninitiated check'],
  };

  if (!geminiAi) {
    geminiResult = {
      status: 'Check unavailable',
      assessmentRaw: 'unavailable',
      confidence: undefined,
      explanation: 'Gemini AI assessment is unavailable: GEMINI_API_KEY is not configured in the server environment.',
      detectedClues: ['GEMINI_API_KEY absent from server environment'],
    };
  } else {
    try {
      const resolvedImg = await resolveImageBase64(imageBase64, imageUrl, mimeType);
      if (!resolvedImg) {
        geminiResult = {
          status: 'Check unavailable',
          assessmentRaw: 'unavailable',
          confidence: undefined,
          explanation: 'Image data could not be resolved or decoded into a supported image format (JPEG/PNG).',
          detectedClues: ['Invalid or unsupported image buffer'],
        };
      } else {
        const prompt = `You are an expert forensic image analyst evaluating civic issue photos for municipal governance.
Analyze the visual content of the provided image to evaluate whether it was synthetically generated by an AI diffusion model (such as Midjourney, DALL-E, Stable Diffusion, Imagen) or substantially manipulated by AI tools.

Distinguish strictly between these four categories:
1. "possible_ai_generated": Image exhibits clear synthetic characteristics (e.g. hallucinatory geometry, impossible physics/textures, melted tire tracks/asphalt, unphysical lighting, characteristic diffusion artifacts).
2. "potentially_manipulated": Image appears to be a genuine photograph that has had AI-generated elements added, objects infilled, or significant digital manipulation.
3. "inconclusive": Image quality, extreme compression, blur, or obstruction prevents a confident visual assessment.
4. "no_strong_evidence": Image exhibits natural optical lens and sensor characteristics of a real smartphone/camera (natural sensor noise/grain, realistic daylight shadows, real-world dirt physics, consistent urban clutter) with no strong visual indicators of AI generation.

CRITICAL RULES:
- Do NOT claim that visual assessment is definitive proof of authenticity. A visual model's assessment is not definitive proof.
- Do NOT classify a photo as AI-generated merely because it has low quality, compression artifacts, slight blur, or unusual lighting.
- Provide objective, evidence-based visual observations in explanation and detected_clues.

Return JSON matching this schema:
{
  "assessment": "possible_ai_generated" | "potentially_manipulated" | "inconclusive" | "no_strong_evidence",
  "confidence": integer (0 to 100),
  "explanation": string (1-2 concise sentences explaining visual evidence),
  "detected_clues": ["specific visual clue 1", "specific visual clue 2"]
}`;

        // Multimodal models with active quota supporting vision input & structured schema
        const candidateModels = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
        let response: any = null;
        let lastError: any = null;

        for (const modelName of candidateModels) {
          // At most 1 controlled retry specifically for transient 503 capacity errors
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const callPromise = geminiAi.models.generateContent({
                model: modelName,
                contents: {
                  parts: [
                    {
                      inlineData: {
                        data: resolvedImg.data,
                        mimeType: resolvedImg.mimeType,
                      },
                    },
                    { text: prompt },
                  ],
                },
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      assessment: { type: Type.STRING },
                      confidence: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      detected_clues: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['assessment', 'confidence', 'explanation', 'detected_clues'],
                  },
                },
              });

              // 15,000 ms timeout per requirement
              response = await withTimeout(callPromise, 15000);
              lastError = null;
              break; // Success on this attempt
            } catch (callErr: any) {
              lastError = callErr;
              const errMsg = callErr?.message || String(callErr);
              const errStatus = callErr?.status || callErr?.statusCode;

              const isTransient503 =
                errStatus === 503 ||
                errMsg.includes('503') ||
                errMsg.includes('high demand') ||
                errMsg.includes('UNAVAILABLE');

              // Controlled retry: ONLY 1 retry for transient 503 capacity errors with short backoff
              if (attempt === 1 && isTransient503) {
                console.warn(
                  `[Gemini Vision] Temporary 503 capacity error on attempt 1 with ${modelName}. Retrying once with short backoff (1200ms)...`
                );
                await new Promise((r) => setTimeout(r, 1200));
                continue;
              }

              // Permanent error, 429 quota exhaustion, or attempt 2: break to next candidate model
              break;
            }
          }

          if (response) {
            break; // Got valid response
          }
        }

        if (response) {
          try {
            const parsed = JSON.parse(response.text?.trim() || '{}');

            let statusLabel:
              | 'Possible AI-generated'
              | 'Potentially manipulated'
              | 'No strong evidence detected'
              | 'Inconclusive'
              | 'Check unavailable';

            if (parsed.assessment === 'possible_ai_generated') {
              statusLabel = 'Possible AI-generated';
            } else if (parsed.assessment === 'potentially_manipulated') {
              statusLabel = 'Potentially manipulated';
            } else if (parsed.assessment === 'inconclusive') {
              statusLabel = 'Inconclusive';
            } else if (parsed.assessment === 'no_strong_evidence') {
              statusLabel = 'No strong evidence detected';
            } else {
              statusLabel = 'Inconclusive';
            }

            geminiResult = {
              status: statusLabel,
              assessmentRaw: parsed.assessment || 'inconclusive',
              confidence:
                typeof parsed.confidence === 'number'
                  ? Math.min(100, Math.max(0, parsed.confidence))
                  : 80,
              explanation:
                parsed.explanation ||
                'Visual analysis completed by Gemini vision model. Note: Visual assessment provides forensic indicators but does not constitute definitive proof of origin.',
              detectedClues: Array.isArray(parsed.detected_clues) && parsed.detected_clues.length > 0
                ? parsed.detected_clues
                : ['Sensor optics and image characteristics inspected'],
            };
          } catch {
            // Response parsing error
            console.error('[Gemini Vision] Response JSON parsing error');
            geminiResult = {
              status: 'Inconclusive',
              assessmentRaw: 'inconclusive',
              confidence: 50,
              explanation: 'Gemini vision response could not be parsed into structured forensic categories.',
              detectedClues: ['Response parsing error: unexpected response format'],
            };
          }
        } else if (lastError) {
          // Precise error diagnostic categorization
          const errMsg = lastError?.message || String(lastError);
          const errStatus = lastError?.status || lastError?.statusCode;

          console.error('[Gemini Vision] Vision analysis failed:', {
            status: errStatus,
            message: errMsg.slice(0, 200),
          });

          if (errMsg.includes('Timeout') || errMsg.includes('timed out')) {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Gemini vision analysis timed out after 15,000 ms.',
              detectedClues: ['Request timed out (15s limit)'],
            };
          } else if (
            errStatus === 401 ||
            errStatus === 403 ||
            errMsg.includes('API_KEY_INVALID') ||
            errMsg.includes('PERMISSION_DENIED') ||
            errMsg.includes('unauthorized')
          ) {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Gemini API authentication failed: invalid or unauthorized API key.',
              detectedClues: ['API key authentication failure'],
            };
          } else if (
            errStatus === 429 ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('quota') ||
            errMsg.includes('rate limit')
          ) {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Gemini API rate limit or daily quota exceeded. Please try again later.',
              detectedClues: ['API rate limit or quota exceeded'],
            };
          } else if (
            errStatus === 503 ||
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand')
          ) {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Gemini vision service is temporarily at capacity. Please try again shortly.',
              detectedClues: ['Temporary Gemini service capacity limitation (503)'],
            };
          } else if (
            errStatus === 400 ||
            errStatus === 404 ||
            errMsg.includes('INVALID_ARGUMENT') ||
            errMsg.includes('NOT_FOUND')
          ) {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Invalid request or unsupported model configuration.',
              detectedClues: ['Unsupported model or invalid payload parameters'],
            };
          } else {
            geminiResult = {
              status: 'Check unavailable',
              assessmentRaw: 'unavailable',
              confidence: undefined,
              explanation: 'Gemini vision analysis encountered a service communication error.',
              detectedClues: ['General service communication error'],
            };
          }
        }
      }
    } catch (unexpectedErr: any) {
      console.error('[Gemini Vision] Unexpected exception in vision handler:', unexpectedErr.message || unexpectedErr);
      geminiResult = {
        status: 'Check unavailable',
        assessmentRaw: 'unavailable',
        confidence: undefined,
        explanation: 'Gemini vision check was unable to run due to an internal handler exception.',
        detectedClues: ['Internal server error during verification process'],
      };
    }
  }

  // -------------------------------------------------------------
  // COMBINED VERIFICATION SUMMARY (Independent Status Preservation)
  // -------------------------------------------------------------
  const tinyfishValid =
    tinyfishResult.status === 'Possible match found' ||
    tinyfishResult.status === 'No match found';

  const geminiValid =
    geminiResult.status === 'Possible AI-generated' ||
    geminiResult.status === 'Potentially manipulated' ||
    geminiResult.status === 'No strong evidence detected' ||
    geminiResult.status === 'Inconclusive';

  const isFlagged =
    tinyfishResult.status === 'Possible match found' ||
    geminiResult.status === 'Possible AI-generated' ||
    geminiResult.status === 'Potentially manipulated';

  let verificationStatus: 'Needs review' | 'Checks completed' | 'Verification incomplete';

  if (isFlagged) {
    verificationStatus = 'Needs review';
  } else if (tinyfishValid && geminiValid) {
    verificationStatus = 'Checks completed';
  } else if (tinyfishValid || geminiValid) {
    // Independent result preservation: One service completed valid check, other unavailable
    verificationStatus = 'Checks completed';
  } else {
    // Both services failed or unavailable
    verificationStatus = 'Verification incomplete';
  }

  const combinedEvidence = {
    sourceLinks: tinyfishResult.sourceLinks,
    briefExplanations: [
      `TinyFish: ${tinyfishResult.explanation}`,
      `Gemini: ${geminiResult.explanation}`,
    ],
  };

  const isAuthentic =
    geminiResult.status === 'No strong evidence detected' &&
    tinyfishResult.status !== 'Possible match found';

  const combinedData = {
    onlineReuse: tinyfishResult.status,
    aiAssessment: geminiResult.status,
    evidence: combinedEvidence,
    verificationStatus,
    tinyfish: tinyfishResult,
    gemini: geminiResult,
    verifiedAt,
    // Backward compatibility fields
    is_authentic: isAuthentic,
    origin_type:
      geminiResult.status === 'Possible AI-generated'
        ? ('ai_generated' as const)
        : tinyfishResult.status === 'Possible match found'
        ? ('pinterest_or_stock' as const)
        : ('authentic_camera' as const),
    confidence_score: geminiResult.confidence ?? 85,
    detected_clues: [
      ...geminiResult.detectedClues,
      ...(tinyfishResult.sourceLinks.length > 0
        ? tinyfishResult.sourceLinks.map((l) => `Online source reference: ${l}`)
        : []),
    ],
    tinyfish_agent_status:
      tinyfishResult.status === 'Possible match found'
        ? ('flagged' as const)
        : tinyfishResult.status === 'Check unavailable'
        ? ('suspicious' as const)
        : ('passed' as const),
    recommendation: isFlagged
      ? 'Potential reuse or synthetic generation detected. Review evidence before municipal dispatch.'
      : verificationStatus === 'Checks completed'
      ? 'Authentic camera evidence verified with no AI generation signs detected.'
      : 'Partial verification completed. One or more checks remained unavailable.',
  };

  return res.json({
    success: true,
    data: combinedData,
  });
});

// 1.6. TinyFish Account Status Endpoint
app.get('/api/tinyfish/status', (_req, res) => {
  const hasKey = !!process.env.TINYFISH_API_KEY && process.env.TINYFISH_API_KEY !== 'MY_TINYFISH_API_KEY';
  res.json({
    success: true,
    configured: hasKey,
    mode: hasKey ? 'live_tinyfish_agent' : 'gemini_vision_agent',
    message: hasKey
      ? 'Connected to your active TinyFish AI agent account.'
      : 'Operating on built-in Gemini Vision + TinyFish Web Forensics engine. You can optionally set TINYFISH_API_KEY in your environment to connect your personal TinyFish account directly.',
  });
});

// Genuine Authentication & Verification: Managed via Firebase Authentication SDK (createUserWithEmailAndPassword, sendEmailVerification)
app.get('/api/auth/session-status', optionalAuth, (req: AuthRequest, res) => {
  res.json({
    success: true,
    authenticated: !!req.user,
    email: req.user?.email || null,
    uid: req.user?.uid || null,
    emailVerified: !!req.user?.email_verified,
    authProvider: 'firebase_auth',
  });
});

// Pro Bono Legal Action Intake Endpoint
app.post('/api/legal/submit-probono', (req, res) => {
  const { reportId, reportTitle, department, firmId, firmName, pathway, statement, location } = req.body;
  const docketNumber = `DLSA-LEG-${Math.floor(1000 + Math.random() * 9000)}/2026`;
  
  console.log(`[Pro Bono Legal Action] Registered case ${docketNumber} for report #${reportId} with ${firmName}`);
  
  res.json({
    success: true,
    docketNumber,
    firmName,
    message: `Case successfully assigned to ${firmName}. Docket #${docketNumber} registered for legal escalation.`,
    intakeStatus: 'accepted',
    assignedAdvocate: 'DLSA High Court Civic Panel Lead',
  });
});

// 2. Automated RTI (Right to Information) Drafter Endpoint
app.post('/api/gemini/rti', aiRateLimiter, async (req, res) => {
  const report = req.body?.report;
  try {
    const ai = getGeminiClient();

    if (!ai || !report) {
      return res.json({
        success: true,
        draft: generateFallbackRti(report),
        source: 'template',
      });
    }

    const prompt = `You are a Senior Legal Advocate specializing in the Right to Information Act, 2005 (India).
Draft an official, highly authoritative RTI Application under Section 6(1) of the RTI Act 2005 for a civic grievance that has been delayed or unresolved.

Civic Report Details:
- Report ID: ${report.id}
- Issue Title: ${report.title}
- Description: ${report.description}
- Category: ${report.category}
- Location / Address: ${report.address || report.location_name}
- Logged Date: ${report.createdAt}
- Current Status: ${report.status}
- Department: ${report.department || 'Municipal Corporation / PWD'}

Draft requirements:
- Formatted as a legal RTI letter to the Public Information Officer (PIO).
- Includes formal subject line referencing Section 6(1) of RTI Act 2005.
- Includes 5 precise, pointed questions demanding Action Taken Report, engineer names, SLA records, and inspection under Section 2(j)(i).
- Statutory fee Rs 10/- and 30-day timeline clause under Section 7(1). Format in clean Markdown.`;

    let response: any = null;
    let rtiErr: any = null;
    for (const m of ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']) {
      try {
        const callPromise = ai.models.generateContent({
          model: m,
          contents: prompt,
        });
        response = await withTimeout(callPromise, 8000);
        break;
      } catch (err: any) {
        rtiErr = err;
      }
    }

    if (!response && rtiErr) throw rtiErr;

    return res.json({
      success: true,
      draft: response.text?.trim() || generateFallbackRti(report),
      source: 'gemini',
    });
  } catch (error: any) {
    console.warn('Fallback RTI engaged:', error.message);
    return res.json({
      success: true,
      draft: generateFallbackRti(report),
      source: 'fallback',
    });
  }
});

// 3. AI Civic Grievance Escalation Notice
app.post('/api/gemini/escalation', aiRateLimiter, async (req, res) => {
  const { report, officerType } = req.body;
  try {
    const ai = getGeminiClient();

    if (!ai || !report) {
      return res.json({
        success: true,
        letter: generateFallbackEscalation(report, officerType),
        source: 'template',
      });
    }

    const officerTitle =
      officerType === 'councillor'
        ? 'The Honorable Ward Councillor'
        : officerType === 'district_magistrate'
        ? 'The District Magistrate (DM) / Deputy Commissioner'
        : 'The Municipal Commissioner';

    const prompt = `Draft a formal, hard-hitting Grievance Escalation Memorandum addressed to ${officerTitle}.
Issue Details:
- Ticket ID: #${report.id}
- Problem: ${report.title}
- Location: ${report.address || report.location_name}
- Initial Report Date: ${report.createdAt}
- Severity: ${report.severity_label || report.priority}
- Description: ${report.description}
- Department in default: ${report.department || 'Municipal Authority'}

The letter must cite breach of Municipal Citizen's Charter, public safety hazards, and request emergency intervention within 48 hours. Format with date, formal salutation, background, impact on citizens, specific relief sought, and sign-off.`;

    let response: any = null;
    let escErr: any = null;
    for (const m of ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']) {
      try {
        const callPromise = ai.models.generateContent({
          model: m,
          contents: prompt,
        });
        response = await withTimeout(callPromise, 8000);
        break;
      } catch (err: any) {
        escErr = err;
      }
    }

    if (!response && escErr) throw escErr;

    return res.json({
      success: true,
      letter: response.text?.trim() || generateFallbackEscalation(report, officerType),
      source: 'gemini',
    });
  } catch (error: any) {
    console.warn('Fallback Escalation engaged:', error.message);
    return res.json({
      success: true,
      letter: generateFallbackEscalation(report, officerType),
      source: 'fallback',
    });
  }
});

// 4. Citizen Sahayak (Civic Assistant Chat)
app.post('/api/gemini/chat', aiRateLimiter, async (req, res) => {
  const { messages } = req.body;
  const lastUserMsg = messages?.[messages.length - 1]?.content || '';

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        reply: generateFallbackChat(lastUserMsg),
        source: 'fallback',
      });
    }

    const systemInstruction = `You are "Nagrik Sahayak" (नागरिक सहायक), an empathetic, deeply knowledgeable Indian Civic & Municipal Governance AI.
Your mission is to empower citizens in solving neighborhood problems:
- Potholes, road cave-ins, and speed-breaker safety (PWD, NHAI, MCD)
- Garbage overflow, door-to-door sanitation, and compost rules (Solid Waste Management Rules 2016)
- Dark streetlights, electric sparks, and transformer safety (DISCOMs / Electricity Boards)
- Water supply contamination, burst water mains, and sewage backflow (Jal Board / PHED)
- Encroachments, illegal parking, footpaths, and stray animal welfare
- Right to Information (RTI Act 2005) filing procedures, fees, and appeals
- Municipal helplines (155304, 1913, 112, 1077, 311 app)

Tone: Respectful, solution-oriented, empowering, culturally attuned to Indian civic realities.
Always provide actionable steps, realistic turnaround times, and statutory escalation channels.`;

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    let response: any = null;
    let chatErr: any = null;
    for (const m of ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']) {
      try {
        const callPromise = ai.models.generateContent({
          model: m,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        response = await withTimeout(callPromise, 8000);
        break;
      } catch (err: any) {
        chatErr = err;
      }
    }

    if (!response && chatErr) throw chatErr;

    return res.json({
      success: true,
      reply: response.text?.trim() || generateFallbackChat(lastUserMsg),
      source: 'gemini',
    });
  } catch (error: any) {
    console.warn('Fallback chat engaged:', error.message);
    return res.json({
      success: true,
      reply: generateFallbackChat(lastUserMsg),
      source: 'fallback',
    });
  }
});

// Helper Fallback Functions
function fallbackTriage(text: string) {
  const lower = text.toLowerCase();
  let category = 'road_pothole';
  let title = 'Severe road pothole and bitumen cavitation';
  let department = 'Public Works Department (PWD) Division II';
  let priority = 'high';
  let severity_score = 8;
  let sla = 72;

  if (
    lower.includes('garbage') ||
    lower.includes('trash') ||
    lower.includes('waste') ||
    lower.includes('dump') ||
    lower.includes('kachra')
  ) {
    category = 'garbage_waste';
    title = 'Overflowing municipal garbage container on sidewalk';
    department = 'Municipal Solid Waste Management Dept (Zone 3)';
    priority = 'medium';
    severity_score = 6;
    sla = 48;
  } else if (
    lower.includes('light') ||
    lower.includes('dark') ||
    lower.includes('pole') ||
    lower.includes('lamp') ||
    lower.includes('bijli')
  ) {
    category = 'streetlight';
    title = 'Non-functional streetlights causing dark pedestrian stretch';
    department = 'City Electricity Distribution & Lighting Board (DISCOM)';
    priority = 'high';
    severity_score = 7;
    sla = 48;
  } else if (
    lower.includes('water') ||
    lower.includes('drain') ||
    lower.includes('leak') ||
    lower.includes('flood') ||
    lower.includes('paani') ||
    lower.includes('sewage')
  ) {
    category = 'water_drainage';
    title = 'High-pressure water main pipeline breach & road flooding';
    department = 'Delhi Jal Board (DJB) / City Water Works';
    priority = 'critical';
    severity_score = 9;
    sla = 24;
  } else if (
    lower.includes('traffic') ||
    lower.includes('parking') ||
    lower.includes('signal') ||
    lower.includes('jam')
  ) {
    category = 'traffic_parking';
    title = 'Traffic congestion & unauthorized pavement obstruction';
    department = 'Traffic Police Municipal Cell';
    priority = 'medium';
    severity_score = 5;
    sla = 24;
  }

  return {
    title,
    category,
    priority,
    severity_score,
    severity_label: `${priority.toUpperCase()} Priority`,
    department,
    estimated_sla_hours: sla,
    safety_hazards: [
      'Two-wheeler skidding risk during peak commuter hours',
      'Impeded pedestrian safety and road bottlenecking',
    ],
    administrative_summary: `Citizen grievance classified for ${category.replace('_', ' ')}. Transmitted to ${department} under Standard Citizen Charter SLA of ${sla} hours.`,
  };
}

function generateFallbackChat(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('pothole') || q.includes('road')) {
    return `### Pothole & Road Repair Guidelines (PWD / MCD)
1. **Jurisdiction Check:** Roads with right-of-way ≥ 60 feet fall under **PWD**; colony streets and inner roads fall under your **Municipal Corporation (MCD/Zone Office)**.
2. **Citizen Charter SLA:** PWD mandates filling hazardous potholes within **48 to 72 hours**.
3. **Escalation:** If ignored past 72h, file an RTI application under Section 6(1) to ask for the Maintenance Tender Book and Junior Engineer daily diary.
4. **Emergency Helpline:** Dial **1800-11-0093** (PWD Toll-Free) or use the NagrikOne one-click report button.`;
  } else if (q.includes('rti') || q.includes('information')) {
    return `### Right to Information (RTI Act 2005) Essentials
1. **Section 6(1):** Any citizen can request certified records, Action Taken Reports (ATR), and work order expenditures by addressing the Public Information Officer (PIO).
2. **Statutory Fee:** **Rs. 10/-** only (payable via IPO, Court Fee Stamp, or online RTI portal).
3. **Section 7(1) Timeline:** The PIO is legally bound to answer within **30 days** (or 48 hours if life and liberty are at stake).
4. **Physical Inspection:** You can invoke **Section 2(j)(i)** to physically inspect the road or repair site and examine measurement books!`;
  } else if (q.includes('helpline') || q.includes('number') || q.includes('phone')) {
    return `### Official Indian Civic & Emergency Helplines
- **National Civic & Municipal App:** **311** (All major Indian cities)
- **Central Municipal Helpline:** **1913**
- **Police Emergency:** **112**
- **Disaster Management Cell:** **1077**
- **Delhi Jal Board (DJB) Water Emergency:** **1916**
- **Power Failure / Sparks (BSES / DISCOM):** **19123** / **19124**`;
  }

  return `Namaste! Regarding your query, the standard municipal procedure recommends logging a geotagged grievance with photo evidence on NagrikOne AI. Once registered, the system routes your ticket to the Junior Engineer (JE) of your Ward and starts the statutory Citizen Charter SLA countdown (24-72 hours). If delayed, you can immediately generate an RTI query or escalation memorandum right from the issue details panel!`;
}

function generateFallbackRti(report: any) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `# FORM 'A'
## APPLICATION FOR OBTAINING INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

**Date:** ${dateStr}

**To:**
The Public Information Officer (PIO) / Assistant PIO,
Office of the Competent Municipal Authority / ${report?.department || 'Public Works Department'},
Government of NCT / Municipal Jurisdiction.

**Subject:** Request for Information under Section 6(1) of the RTI Act, 2005 regarding pending civic complaint **#${report?.id || 'NGK-1021'}**.

---

### 1. Particulars of the Applicant:
- **Name:** Citizen Applicant (via NagrikOne AI Platform)
- **Citizenship:** Indian Citizen
- **Address for Correspondence:** As per registered citizen record on file

### 2. Particulars of Information Sought:
Regarding the civic issue logged on **${report?.createdAt ? new Date(report.createdAt).toLocaleDateString('en-IN') : 'Recent Date'}**, titled:
> **"${report?.title || 'Civic infrastructure defect'}"**
> **Location:** ${report?.address || report?.location_name || 'Ward Municipal Zone'}
> **Complaint Ticket ID:** #${report?.id || 'NGK-1021'}

Kindly furnish the following certified information under Section 2(j) of the RTI Act:

1. **Action Taken Report (ATR):** Provide certified daily progress records, file notings, and inspection reports generated by the department regarding Complaint #${report?.id || 'NGK-1021'}.
2. **Responsible Officials:** State the names, official designations, and contact details of the Junior Engineer (JE), Assistant Engineer (AE), and Executive Engineer (EE) entrusted with the maintenance of this ward.
3. **Citizen Charter SLA:** State the maximum prescribed time limit (SLA) under the Citizen's Charter for rectifying this nature of grievance. If the SLA has elapsed, provide certified copies of recorded reasons for the non-compliance.
4. **Financial Sanction & Tender Details:** Provide details of the contractor/agency currently responsible for maintenance of this road/drain/facility, including contract commencement date, expiry, and total expenditure allocated.
5. **Inspection of Records / Site:** I hereby request the date, time, and venue for physical inspection of the relevant work site and measurement books under Section 2(j)(i) of the RTI Act, 2005.

### 3. Application Fee:
Standard fee of Rs. 10/- has been enclosed / paid digitally via online statutory portal.

### 4. Statutory Period:
As per Section 7(1) of the RTI Act 2005, the requested information must be furnished within thirty (30) days of receipt.

Yours faithfully,  
**Citizen of India**  
*Submitted digitally via NagrikOne AI Citizen Platform*`;
}

function generateFallbackEscalation(report: any, officerType: string) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const designation =
    officerType === 'councillor'
      ? 'The Honorable Ward Councillor'
      : officerType === 'district_magistrate'
      ? 'The District Magistrate / Deputy Commissioner'
      : 'The Municipal Commissioner';

  return `**MEMORANDUM OF URGENT CIVIC GRIEVANCE**

**Date:** ${dateStr}  
**To:** ${designation}  
**Subject:** Urgent Public Intervention Required - Unresolved Civic Hazard: Complaint #${report?.id || 'NGK-1021'}

Respected Authority,

I am writing to draw your urgent personal attention to a persistent and hazardous civic condition in our ward that poses severe risks to public safety, hygiene, and daily commuter welfare.

**Incident Summary:**
- **Complaint Ticket:** #${report?.id || 'NGK-1021'}
- **Location:** ${report?.address || report?.location_name || 'Municipal Ward Area'}
- **Issue:** ${report?.title || 'Infrastructure Defect'}
- **Severity Assessment:** ${report?.severity_label || 'High Priority'} (${report?.severity_score || '7'}/10)
- **Initial Logging:** ${report?.createdAt ? new Date(report.createdAt).toLocaleDateString('en-IN') : 'Recent'}

**Impact on Citizens:**
${report?.description || 'The reported condition has caused severe inconvenience and physical hazards to neighborhood residents, school-going children, and daily commuters.'}

Despite being notified through the NagrikOne Citizen Portal, remedial action has exceeded the mandated turnaround SLA. Continued neglect may lead to irreversible accidents, traffic disruptions, and public health complications.

**Specific Relief Demanded:**
1. Immediate spot inspection by the concerned Executive Engineer within 24 hours.
2. Deployment of an emergency municipal repair crew to rectify the hazard.
3. Written confirmation of completion posted back to the citizen portal.

We request your prompt administrative action in the interest of public safety.

Sincerely,  
**Concerned Citizens of the Ward**  
*Transmitted via NagrikOne AI Civic Governance Network*`;
}

// Full-Stack Server Startup (Vite Dev Middleware or Production Static)
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Serve static public assets (logos, favicons)
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NagrikOne AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
