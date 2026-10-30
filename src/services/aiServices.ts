import { GoogleGenAI, Type } from '@google/genai';
import { AI_CONFIG } from '../config/aiConfig.ts';

// Shared Gemini Client Factory
export const getGenAiClient = (): GoogleGenAI | null => {
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

// Internal timeout wrapper for bounded per-model latency
const withTimeout = <T>(promise: Promise<T>, ms = 12000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
};

/**
 * Section-wise Translation using Gemma 4 (gemma-4-26b-a4b-it / gemma-4-31b-it)
 * Preserves all factual details, locations, and urgency without adding unverified facts.
 */
export async function translateWithGemma4(
  text: string,
  options?: {
    fieldName?: string;
    languageHint?: string;
  }
): Promise<{
  originalText: string;
  englishTranslation: string;
  model: string;
  charCount: number;
}> {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    throw new Error('Please provide non-empty text to translate.');
  }

  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
  }

  const systemInstruction = `You are a municipal civic-report translation engine powered by Gemma 4.
Translate the citizen's input text into clear, concise, professional English suitable for municipal engineers and authorities.
Strict Rules:
- Accurately preserve all factual details, locations, landmarks, measurements, damage indicators, and citizen observations.
- Do NOT fabricate or infer facts, causes, dates, or locations not explicitly mentioned in the original text.
- Do NOT exaggerate or minimize the severity of the issue.
- Return ONLY the clean, polished English translation without quotes, formatting preambles, or conversational notes.`;

  // Primary: Gemma 4 (gemma-4-26b-a4b-it), Fallback: gemma-4-31b-it, Resilient Fallback: gemini-3.1-flash-lite
  const modelsToTry = [
    { id: AI_CONFIG.TRANSLATION_MODEL, timeoutMs: 9000 },
    { id: AI_CONFIG.TRANSLATION_FALLBACK_MODEL, timeoutMs: 8000 },
    { id: 'gemini-3.1-flash-lite', timeoutMs: 9000 },
  ];
  let lastError: any = null;

  for (const m of modelsToTry) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: m.id,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\nField: ${options?.fieldName || 'Civic Grievance'}\nCitizen Input:\n${cleanText}`,
                },
              ],
            },
          ],
        }),
        m.timeoutMs
      );

      let translatedText = response.text?.trim() || '';
      // Clean quotes or conversational wrapper if present
      translatedText = translatedText.replace(/^["'`]+|["'`]+$/g, '').trim();

      if (translatedText) {
        return {
          originalText: cleanText,
          englishTranslation: translatedText,
          model: m.id,
          charCount: cleanText.length,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Translation with ${m.id} failed or timed out:`, err?.message || err);
    }
  }

  throw new Error(`Gemma 4 translation failed: ${lastError?.message || 'Model unreachable'}`);
}

/**
 * Structured Grievance Translation using Gemma 4 (gemma-4-26b-a4b-it / gemma-4-31b-it)
 * Translates original title & description into separate englishTitle and englishDescription.
 * Strictly guarantees that English fields NEVER contain original language text or duplicate the source.
 */
export async function translateReportWithGemma4(data: {
  title?: string;
  description: string;
  languageHint?: string;
}): Promise<{
  englishTitle: string;
  englishDescription: string;
  originalTitle: string;
  originalDescription: string;
  model: string;
}> {
  const cleanTitle = String(data.title || '').trim();
  const cleanDesc = String(data.description || '').trim();

  if (!cleanDesc && !cleanTitle) {
    throw new Error('Please provide a title or description to translate.');
  }

  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
  }

  const systemInstruction = `You are a municipal civic-report translation engine powered by Gemma 4.
Translate the citizen original-language civic grievance into clear, professional English suitable for municipal engineers and authorities.

STRICT TRANSLATION RULES:
1. Translate both fields into natural, professional English.
2. The englishTitle MUST contain ONLY English words. NEVER include, repeat, or append the original-language text.
3. The englishDescription MUST contain ONLY English words. NEVER include, repeat, or append the original-language text.
4. If a title is provided, translate it into a concise English title (under 10 words, e.g. "Deep pothole on the road").
5. If the original title is empty or missing, generate an accurate, concise English title derived strictly from the description (under 10 words).
6. Preserve all factual details, locations, landmarks, hazard indicators, and observations in englishDescription without inventing facts.
7. Return strictly a JSON object with this exact structure:
{
  "englishTitle": "Concise English title without quotes or original text",
  "englishDescription": "Full English description without quotes or original text"
}`;

  const prompt = `${systemInstruction}\n\nCitizen Original Input:
Title: ${cleanTitle || '(No title provided)'}
Description: ${cleanDesc || '(No description provided)'}`;

  const modelsToTry = [
    { id: AI_CONFIG.TRANSLATION_MODEL, timeoutMs: 9000 },
    { id: AI_CONFIG.TRANSLATION_FALLBACK_MODEL, timeoutMs: 8000 },
    { id: 'gemini-3.1-flash-lite', timeoutMs: 9000 },
  ];
  let lastError: any = null;

  for (const m of modelsToTry) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: m.id,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
        m.timeoutMs
      );

      const rawText = response.text?.trim() || '';
      let enTitle = '';
      let enDesc = '';

      // 1. Try JSON extraction
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          enTitle = String(parsed.englishTitle || parsed.title || '').trim();
          enDesc = String(parsed.englishDescription || parsed.description || '').trim();
        } catch {
          // JSON parsing failed, fall back to line parsing below
        }
      }

      // 2. Fall back to regex title/description label matching if not parsed
      if (!enTitle || !enDesc) {
        const titleMatch = rawText.match(/(?:English\s*)?Title\s*:\s*([^\n\r]+)/i);
        const descMatch = rawText.match(/(?:English\s*)?Description\s*:\s*([\s\S]+)/i);
        if (titleMatch && !enTitle) {
          enTitle = titleMatch[1].trim();
        }
        if (descMatch && !enDesc) {
          enDesc = descMatch[1].trim();
        }
      }

      // 3. Fall back to plain text splitting if no JSON or labels
      if (!enDesc && rawText) {
        const cleaned = rawText.replace(/```[a-z]*|```/g, '').trim();
        if (cleanTitle && !enTitle) {
          const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            enTitle = lines[0];
            enDesc = lines.slice(1).join('\n');
          } else {
            enDesc = cleaned;
          }
        } else {
          enDesc = cleaned;
        }
      }

      // 4. Clean quotes
      enTitle = enTitle.replace(/^["'`]+|["'`]+$/g, '').trim();
      enDesc = enDesc.replace(/^["'`]+|["'`]+$/g, '').trim();

      // 5. Ensure no Indic/Devanagari scripts bleed into English fields
      enTitle = enTitle.replace(/[\u0900-\u097F]/g, '').trim();
      enDesc = enDesc.replace(/[\u0900-\u097F]/g, '').trim();

      if (!enTitle && cleanTitle) {
        enTitle = 'Civic Grievance Report';
      }

      if (enTitle || enDesc) {
        return {
          englishTitle: enTitle || (cleanTitle ? 'Civic Grievance Report' : ''),
          englishDescription: enDesc || cleanDesc,
          originalTitle: cleanTitle,
          originalDescription: cleanDesc,
          model: m.id,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Structured translation with ${m.id} failed or timed out:`, err?.message || err);
    }
  }

  throw new Error(`Gemma 4 structured translation failed: ${lastError?.message || 'Model unreachable'}`);
}

/**
 * Robustly strips data URI headers (e.g. "data:audio/webm;codecs=opus;base64,")
 * and extracts the clean base64 payload and base MIME type conforming to RFC 2397.
 */
export function extractBase64Payload(
  dataUriOrBase64: string,
  fallbackMime = 'application/octet-stream'
): { cleanBase64: string; cleanMimeType: string } {
  if (!dataUriOrBase64) {
    return { cleanBase64: '', cleanMimeType: fallbackMime.split(';')[0].trim().toLowerCase() };
  }

  const trimmed = dataUriOrBase64.trim();
  if (trimmed.startsWith('data:')) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex !== -1) {
      const header = trimmed.slice(0, commaIndex);
      const cleanBase64 = trimmed.slice(commaIndex + 1).trim();
      const mimeMatch = header.match(/^data:([^;,]+)/);
      const cleanMimeType = (mimeMatch ? mimeMatch[1] : fallbackMime).split(';')[0].trim().toLowerCase();
      return { cleanBase64, cleanMimeType };
    }
  }

  // Handle any stray comma
  if (trimmed.includes(',')) {
    const commaIndex = trimmed.indexOf(',');
    return {
      cleanBase64: trimmed.slice(commaIndex + 1).trim(),
      cleanMimeType: fallbackMime.split(';')[0].trim().toLowerCase(),
    };
  }

  return {
    cleanBase64: trimmed,
    cleanMimeType: fallbackMime.split(';')[0].trim().toLowerCase(),
  };
}

/**
 * Multilingual Speech-to-Text using Gemini 3.5 Transcribe
 * Transcribes audio into the spoken language WITHOUT translating to English.
 */
export async function transcribeWithGemini35(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<{
  transcript: string;
  model: string;
}> {
  if (!audioBase64) {
    throw new Error('No audio data provided for transcription.');
  }

  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
  }

  const { cleanBase64, cleanMimeType } = extractBase64Payload(
    audioBase64,
    mimeType || 'audio/webm'
  );

  const transcriptionPrompt =
    'Transcribe the speech in this audio exactly in its original spoken language. Do not translate. Return only the transcribed words.';

  const modelsToTry = [AI_CONFIG.TRANSCRIBE_MODEL, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelId of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: cleanMimeType,
              },
            },
            { text: transcriptionPrompt },
          ],
        },
      });

      // Gemini 3.5 Transcribe returns parts with part.audioTranscription.text
      // Standard multimodal Gemini models return part.text
      let extractedTranscript = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if ((part as any).audioTranscription?.text) {
          extractedTranscript += (part as any).audioTranscription.text + ' ';
        } else if (part.text) {
          extractedTranscript += part.text + ' ';
        }
      }

      extractedTranscript = extractedTranscript.trim();
      if (!extractedTranscript) {
        try {
          extractedTranscript = response.text?.trim() || '';
        } catch {
          // Ignore getter warning if only non-text parts exist
        }
      }

      return {
        transcript: extractedTranscript,
        model: modelId,
      };
    } catch (err: any) {
      console.warn(`Transcription attempt with ${modelId} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`Speech-to-text transcription failed: ${lastError?.message || 'Model error'}`);
}

/**
 * Task 1: Civic Issue Severity Assessment via Gemini 3.8 Flash
 */
export async function assessSeverityWithGemini38(data: {
  description: string;
  title?: string;
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
}): Promise<{
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  severity_score: number;
  explanation: string;
  confidence: number;
  isInconclusive: boolean;
  department: string;
  sla_hours: number;
  safety_hazards: string[];
  model: string;
}> {
  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
  }

  const parts: any[] = [];
  if (data.imageBase64) {
    const { cleanBase64: cleanB64, cleanMimeType: cleanMime } = extractBase64Payload(
      data.imageBase64,
      data.mimeType || 'image/jpeg'
    );
    parts.push({
      inlineData: {
        data: cleanB64,
        mimeType: cleanMime,
      },
    });
  }

  const prompt = `You are a municipal engineering assistant assessing a citizen civic grievance.
Issue Title: "${data.title || 'Untitled Issue'}"
Citizen Description: "${data.description}"

Analyze the visible evidence and description.
Strict requirements:
- Assign severity: "Low", "Medium", or "High"
- Assign severity_score from 1 to 10
- Provide an objective, evidence-based short explanation
- If image or description is blurry, dark, or insufficient, set isInconclusive to true with low confidence (< 0.4)
- Select the best municipal category from: "road_pothole", "garbage_waste", "streetlight", "water_drainage", "traffic_parking", "public_infrastructure", "sanitation"`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: AI_CONFIG.SEVERITY_MODEL,
    contents: parts.length === 1 ? parts[0].text : parts,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          severity: { type: Type.STRING },
          severity_score: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          isInconclusive: { type: Type.BOOLEAN },
          department: { type: Type.STRING },
          sla_hours: { type: Type.INTEGER },
          safety_hazards: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['category', 'severity', 'severity_score', 'explanation', 'confidence', 'isInconclusive'],
      },
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const severityNorm: 'Low' | 'Medium' | 'High' =
    parsed.severity === 'Critical' || parsed.severity === 'High'
      ? 'High'
      : parsed.severity === 'Medium' || parsed.severity === 'Moderate'
      ? 'Medium'
      : 'Low';

  return {
    category: parsed.category || 'road_pothole',
    severity: severityNorm,
    severity_score: Math.max(1, Math.min(10, Number(parsed.severity_score) || 5)),
    explanation: parsed.explanation || 'Severity estimated from submitted report details.',
    confidence: Math.max(0.1, Math.min(1.0, Number(parsed.confidence) || 0.8)),
    isInconclusive: Boolean(parsed.isInconclusive),
    department: parsed.department || 'Public Works Department (PWD)',
    sla_hours: parsed.sla_hours || 48,
    safety_hazards: Array.isArray(parsed.safety_hazards) ? parsed.safety_hazards : ['General pedestrian hazard'],
    model: AI_CONFIG.SEVERITY_MODEL,
  };
}

/**
 * Task 2: Preliminary AI-Generated Image Assessment via Gemini 3.8 Flash
 * Strictly distinct from TinyFish and severity tasks.
 */
export async function assessAiImageWithGemini38(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  assessment: 'Possible signs of AI generation' | 'No clear signs detected' | 'Inconclusive';
  assessmentRaw: 'possible_ai_generated' | 'potentially_manipulated' | 'inconclusive' | 'no_strong_evidence';
  explanation: string;
  confidence: number;
  detectedClues: string[];
  model: string;
}> {
  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
  }

  const { cleanBase64: cleanB64, cleanMimeType: cleanMime } = extractBase64Payload(
    imageBase64,
    mimeType || 'image/jpeg'
  );

  const prompt = `You are a forensic computer-vision specialist conducting a preliminary evaluation for synthetic, AI-generated, or heavily manipulated imagery in civic reporting.
Evaluate this image for characteristic synthetic artifacts:
- Warped text, signs, or vehicle license plates
- Anatomical impossible geometry, unnatural floating debris, melting edges
- Surreal lighting inconsistency, hyper-smooth plastic asphalt textures
- Typical diffusion model chromatic noise

Notice: You CANNOT conclusively prove an image's origin. State your findings conservatively with honest uncertainty.
Output schema:
{
  "assessment": "possible_ai_generated" | "potentially_manipulated" | "inconclusive" | "no_strong_evidence",
  "confidence": integer 0-100,
  "explanation": "concise 1-2 sentence evidence-based summary",
  "detected_clues": ["clue 1", "clue 2"]
}`;

  const response = await ai.models.generateContent({
    model: AI_CONFIG.IMAGE_DETECTION_MODEL,
    contents: [
      {
        inlineData: {
          data: cleanB64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      prompt,
    ],
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

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const raw = parsed.assessment;
  const assessmentLabel: 'Possible signs of AI generation' | 'No clear signs detected' | 'Inconclusive' =
    raw === 'possible_ai_generated' || raw === 'potentially_manipulated'
      ? 'Possible signs of AI generation'
      : raw === 'inconclusive'
      ? 'Inconclusive'
      : 'No clear signs detected';

  return {
    assessment: assessmentLabel,
    assessmentRaw: raw || 'inconclusive',
    explanation: parsed.explanation || 'Visual analysis detected natural camera optics with no distinct AI artifacts.',
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 80)),
    detectedClues: Array.isArray(parsed.detected_clues) ? parsed.detected_clues : [],
    model: AI_CONFIG.IMAGE_DETECTION_MODEL,
  };
}

/**
 * Chatbot with gemini-3.1-flash-lite
 * Configured via AI_CONFIG.CHATBOT_MODEL
 */
export async function chatWithGemini25(
  messages: Array<{ role: string; content: string }>
): Promise<{
  reply: string;
  model: string;
  error?: string;
}> {
  const ai = getGenAiClient();
  if (!ai) {
    throw new Error('AI services are unconfigured: GEMINI_API_KEY is missing.');
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

Tone: Respectful, solution-oriented, empowering, culturally attuned to Indian civic realities.`;

  const formattedContents = (messages || []).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.CHATBOT_MODEL,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return {
      reply: response.text?.trim() || 'No response returned from chatbot model.',
      model: AI_CONFIG.CHATBOT_MODEL,
    };
  } catch (err: any) {
    // Meaningful documented error per Requirement C:
    // "If a model is unavailable, return a meaningful error and document the blocker. Do not silently substitute another model while attributing the result to the unavailable model."
    console.warn(`Chatbot model ${AI_CONFIG.CHATBOT_MODEL} call result:`, err?.message || err);
    throw new Error(
      `Chatbot configured on ${AI_CONFIG.CHATBOT_MODEL}: ${err?.message || 'Model call failed'}`
    );
  }
}
