import { db } from './index.ts';
import { reports, upvotes, comments } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { INITIAL_REPORTS } from '../data/mockReports.ts';
import { CivicReport } from '../types.ts';

export async function getAllReports(currentUserUid?: string): Promise<CivicReport[]> {
  try {
    const rawReports = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // If database is empty, seed with initial reports
    if (rawReports.length === 0) {
      await seedInitialReports();
      const rechecked = await db.select().from(reports).orderBy(desc(reports.createdAt));
      return formatReports(rechecked, currentUserUid);
    }

    return await formatReports(rawReports, currentUserUid);
  } catch (error) {
    console.warn('Database getAllReports connection failed, serving baseline reports:', error);
    return INITIAL_REPORTS;
  }
}

async function formatReports(rawReports: any[], currentUserUid?: string): Promise<CivicReport[]> {
  let userUpvotedSet = new Set<string>();

  if (currentUserUid) {
    try {
      const userUpvotes = await db
        .select({ reportId: upvotes.reportId })
        .from(upvotes)
        .where(eq(upvotes.userUid, currentUserUid));
      userUpvotedSet = new Set(userUpvotes.map((u) => u.reportId));
    } catch (e) {
      console.warn('Could not fetch user upvotes:', e);
    }
  }

  return rawReports.map((r) => {
    let safetyHazards: string[] = [];
    try {
      if (r.safetyHazards) safetyHazards = JSON.parse(r.safetyHazards);
    } catch {}

    let timeline: any[] = [];
    let escalationLadder: any = undefined;
    try {
      if (r.timeline) {
        const parsed = JSON.parse(r.timeline);
        if (Array.isArray(parsed)) {
          timeline = parsed;
        } else if (parsed && typeof parsed === 'object') {
          timeline = parsed.events || [];
          escalationLadder = parsed.escalationLadder;
        }
      }
    } catch {}

    let verificationResult: any = undefined;
    try {
      if (r.verificationResult) verificationResult = JSON.parse(r.verificationResult);
    } catch {}

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      priority: r.priority,
      severity_score: r.severityScore ?? 5,
      severity_label: r.severityLabel ?? 'Moderate Impact',
      department: r.department,
      sla_hours: r.slaHours ?? 48,
      imageUrl: r.imageUrl || undefined,
      resolved_proof_url: r.resolvedProofUrl || undefined,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      address: r.address,
      location_name: r.locationName,
      ward: r.ward || undefined,
      upvotes: r.upvotes ?? 0,
      hasUpvoted: userUpvotedSet.has(r.id),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      reportedBy: r.reportedBy ?? 'Citizen',
      isUserSubmitted: currentUserUid ? r.reporterUid === currentUserUid : false,
      safety_hazards: safetyHazards,
      timeline: timeline.length > 0 ? timeline : [
        {
          status: r.status,
          timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          note: 'Report filed in Civic Portal',
          officer: 'City Control Room',
        },
      ],
      verificationResult,
      escalationLadder,
      original_description: r.originalDescription || r.description,
      polished_description_en: r.polishedDescriptionEn || r.description,
      severity_index: r.severityIndex ?? (r.severityScore ? r.severityScore * 10 : 50),
      severity_confidence: r.severityConfidence ?? 0.85,
      severity_explanation: r.severityExplanation || 'Standard civic triage assessment',
      manual_category: r.manualCategory || r.category,
      ai_detected_category: r.aiDetectedCategory || r.category,
      final_category: (r.finalCategory || r.category) as any,
      category_confidence: r.categoryConfidence ?? 0.9,
      category_explanation: r.categoryExplanation || 'Assigned based on municipal report triage',
    };
  });
}

export async function createReport(reportData: CivicReport, userUid?: string): Promise<CivicReport> {
  try {
    const inserted = await db
      .insert(reports)
      .values({
        id: reportData.id,
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        status: reportData.status || 'Reported',
        priority: reportData.priority || 'medium',
        severityScore: reportData.severity_score || 5,
        severityLabel: reportData.severity_label || 'Moderate Impact',
        department: reportData.department,
        slaHours: reportData.sla_hours || 48,
        imageUrl: reportData.imageUrl || null,
        resolvedProofUrl: reportData.resolved_proof_url || null,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address,
        locationName: reportData.location_name || reportData.address,
        ward: reportData.ward || null,
        upvotes: reportData.upvotes || 0,
        reporterUid: userUid || null,
        reportedBy: reportData.reportedBy || 'Citizen',
        safetyHazards: reportData.safety_hazards ? JSON.stringify(reportData.safety_hazards) : null,
        timeline: reportData.timeline ? JSON.stringify(reportData.timeline) : null,
        verificationResult: reportData.verificationResult ? JSON.stringify(reportData.verificationResult) : null,
        originalDescription: reportData.original_description || reportData.description,
        polishedDescriptionEn: reportData.polished_description_en || reportData.description,
        severityIndex: reportData.severity_index ?? (reportData.severity_score ? reportData.severity_score * 10 : 50),
        severityConfidence: reportData.severity_confidence ?? 0.85,
        severityExplanation: reportData.severity_explanation || null,
        manualCategory: reportData.manual_category || reportData.category,
        aiDetectedCategory: reportData.ai_detected_category || reportData.category,
        finalCategory: reportData.final_category || reportData.category,
        categoryConfidence: reportData.category_confidence ?? 0.9,
        categoryExplanation: reportData.category_explanation || null,
      })
      .returning();

    const created = inserted[0];
    return {
      ...reportData,
      id: created.id,
      hasUpvoted: false,
    };
  } catch (error) {
    console.error('Database createReport failed:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}

export async function toggleReportUpvote(reportId: string, userUid: string): Promise<{ upvotes: number; hasUpvoted: boolean }> {
  try {
    // Check if user already upvoted
    const existing = await db
      .select()
      .from(upvotes)
      .where(and(eq(upvotes.reportId, reportId), eq(upvotes.userUid, userUid)))
      .limit(1);

    const reportRec = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!reportRec.length) {
      throw new Error('Report not found');
    }
    const currentCount = reportRec[0].upvotes ?? 0;

    if (existing.length > 0) {
      // Remove upvote
      await db.delete(upvotes).where(eq(upvotes.id, existing[0].id));
      const newCount = Math.max(0, currentCount - 1);
      await db.update(reports).set({ upvotes: newCount }).where(eq(reports.id, reportId));
      return { upvotes: newCount, hasUpvoted: false };
    } else {
      // Add upvote
      await db.insert(upvotes).values({ reportId, userUid });
      const newCount = currentCount + 1;
      await db.update(reports).set({ upvotes: newCount }).where(eq(reports.id, reportId));
      return { upvotes: newCount, hasUpvoted: true };
    }
  } catch (error) {
    console.error('Database toggleReportUpvote failed:', error);
    throw new Error('Failed to update upvote. Please try again later.', { cause: error });
  }
}

export async function addReportComment(reportId: string, authorUid: string, authorName: string, content: string) {
  try {
    const inserted = await db
      .insert(comments)
      .values({
        reportId,
        authorUid,
        authorName,
        content,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database addReportComment failed:', error);
    throw new Error('Failed to add comment. Please try again later.', { cause: error });
  }
}

export async function getReportComments(reportId: string) {
  try {
    return await db.select().from(comments).where(eq(comments.reportId, reportId)).orderBy(comments.createdAt);
  } catch (error) {
    console.error('Database getReportComments failed:', error);
    throw new Error('Failed to fetch comments. Please try again later.', { cause: error });
  }
}

export async function getReportById(reportId: string, currentUserUid?: string): Promise<CivicReport | null> {
  try {
    const rawReports = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!rawReports.length) {
      const fallback = INITIAL_REPORTS.find((r) => r.id === reportId);
      return fallback || null;
    }
    const formatted = await formatReports(rawReports, currentUserUid);
    return formatted[0] || null;
  } catch (error) {
    console.warn('Database getReportById failed, searching baseline reports:', error);
    const fallback = INITIAL_REPORTS.find((r) => r.id === reportId);
    return fallback || null;
  }
}

export async function updateReport(reportId: string, updates: Partial<CivicReport>): Promise<CivicReport | null> {
  try {
    const existing = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!existing.length) return null;

    const valuesToSet: any = {};
    if (updates.status) valuesToSet.status = updates.status;
    if (updates.resolved_proof_url) valuesToSet.resolvedProofUrl = updates.resolved_proof_url;
    if (updates.upvotes !== undefined) valuesToSet.upvotes = updates.upvotes;

    if (updates.timeline || updates.escalationLadder) {
      let currentTimelineEvents: any[] = [];
      let currentLadder: any = undefined;
      try {
        if (existing[0].timeline) {
          const parsed = JSON.parse(existing[0].timeline);
          if (Array.isArray(parsed)) currentTimelineEvents = parsed;
          else if (parsed && typeof parsed === 'object') {
            currentTimelineEvents = parsed.events || [];
            currentLadder = parsed.escalationLadder;
          }
        }
      } catch {}

      const events = updates.timeline || currentTimelineEvents;
      const ladder = updates.escalationLadder !== undefined ? updates.escalationLadder : currentLadder;
      valuesToSet.timeline = JSON.stringify({ events, escalationLadder: ladder });
    }

    const updated = await db.update(reports).set(valuesToSet).where(eq(reports.id, reportId)).returning();
    const formatted = await formatReports(updated);
    return formatted[0] || null;
  } catch (error) {
    console.error('Database updateReport failed:', error);
    throw new Error('Failed to update report', { cause: error });
  }
}

export async function seedInitialReports() {
  try {
    for (const r of INITIAL_REPORTS) {
      const timelinePayload = JSON.stringify({
        events: r.timeline || [],
        escalationLadder: r.escalationLadder,
      });

      await db
        .insert(reports)
        .values({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          status: r.status,
          priority: r.priority,
          severityScore: r.severity_score,
          severityLabel: r.severity_label,
          department: r.department,
          slaHours: r.sla_hours,
          imageUrl: r.imageUrl || null,
          resolvedProofUrl: r.resolved_proof_url || null,
          latitude: r.latitude,
          longitude: r.longitude,
          address: r.address,
          locationName: r.location_name,
          ward: r.ward || null,
          upvotes: r.upvotes,
          reportedBy: r.reportedBy,
          safetyHazards: r.safety_hazards ? JSON.stringify(r.safety_hazards) : null,
          timeline: timelinePayload,
          verificationResult: r.verificationResult ? JSON.stringify(r.verificationResult) : null,
          createdAt: new Date(r.createdAt),
        })
        .onConflictDoNothing();
    }
    console.log(`Seeded ${INITIAL_REPORTS.length} initial civic reports to Cloud SQL.`);
  } catch (error) {
    console.error('Error seeding initial reports:', error);
  }
}
