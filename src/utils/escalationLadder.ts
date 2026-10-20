import { CivicReport, ReportStatus } from '../types';

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface StageDetails {
  stage: StageNumber;
  title: string;
  subtitle: string;
  timing: string;
  color: 'emerald' | 'amber' | 'rose' | 'cyan' | 'blue' | 'purple';
  isEligible: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  isUnnecessary: boolean;
  unlockRequirement: string;
  remainingTimeText?: string;
  statusBadge: string;
  description: string;
  whatCitizenCanDo: string;
  requiredEvidence: string;
  actionNature: 'draft' | 'dispatch' | 'statutory_submission' | 'legal_consultation';
}

export interface ReportEscalationEvaluation {
  reportId: string;
  reportStatus: ReportStatus;
  isResolved: boolean;
  hasValidTimestamp: boolean;
  timestampError?: string;

  // Timestamps & Duration
  createdAt: string;
  createdDate: Date;
  elapsedHours: number;
  elapsedDays: number;
  elapsedLabel: string;

  // Stage 1: Public Countdown
  slaHours: number;
  responseDeadlineDate: Date;
  responseDeadlineISO: string;
  slaRemainingHours: number;
  slaRemainingMinutes: number;
  isSlaBreached: boolean;

  // Stage 2: Reminder
  isReminderEligible: boolean;
  isReminderSent: boolean;
  reminderSentAt?: string;
  reminderDeliveryStatus?: 'sent' | 'draft_copied' | 'failed' | 'pending';

  // Stage 3: Senior Escalation
  escalationDeadlineHours: number;
  isEscalationEligible: boolean;
  isEscalationFiled: boolean;
  escalationOfficerType?: 'ward_officer' | 'commissioner';

  // Stage 4: Social Tagging (Day 14)
  is14DaysPassed: boolean;
  daysUntil14Days: number;
  isSocialTaggingEligible: boolean;
  isSocialPostDrafted: boolean;

  // Stage 5: RTI Application (Day 21)
  is21DaysPassed: boolean;
  daysUntil21Days: number;
  isRtiEligible: boolean;
  isRtiDrafted: boolean;
  isRtiSubmitted: boolean;
  rtiSubmittedAt?: string;
  rtiSubmissionType?: 'citizen_confirmed' | 'independently_verified';
  rtiReferenceNumber?: string;
  rtiSubmissionEvidence?: string;

  // Stage 6: Legal Notice (RTI Submitted + 30-day response period)
  rtiResponsePeriodDays: number;
  rtiElapsedDaysSinceSubmission: number;
  isRtiResponsePeriodElapsed: boolean;
  daysUntilRtiResponsePeriodElapsed: number;
  rtiResponseReceived: boolean;
  rtiResponseStatus?: 'no_response' | 'adequate' | 'inadequate';
  isLegalNoticeEligible: boolean;
  legalNoticeConditions: {
    issueUnresolved: boolean;
    rtiSubmittedWithDate: boolean;
    rtiResponsePeriodElapsed: boolean;
    noAdequateResponse: boolean;
    citizenConsentChecked: boolean;
  };
  legalNoticeLockReasons: string[];
  isLegalConsultationRequested: boolean;

  // Overall Escalation Ladder Level
  highestEligibleStage: StageNumber | 'resolved';
  activeStageNumber: StageNumber | 'resolved';
  stages: StageDetails[];
}

export const STAGE_CONFIG: Record<
  StageNumber,
  {
    title: string;
    subtitle: string;
    timing: string;
    color: 'emerald' | 'amber' | 'rose' | 'cyan' | 'blue' | 'purple';
    description: string;
    whatCitizenCanDo: string;
    requiredEvidence: string;
    actionNature: 'draft' | 'dispatch' | 'statutory_submission' | 'legal_consultation';
  }
> = {
  1: {
    title: 'Public Countdown',
    subtitle: 'Citizen Charter SLA Clock & Public Audit Trail',
    timing: 'Day 0 (Immediate upon submission)',
    color: 'emerald',
    description:
      'When a citizen submits a geotagged hazard, Nagrik One records the submission timestamp, identifies the responsible department, and starts an undisputable public countdown against statutory Citizen Charter standards.',
    whatCitizenCanDo:
      'Monitor live elapsed time, view SLA turnaround hours, verify assigned municipal department, and share with local ward residents for upvoting.',
    requiredEvidence:
      'Accurate GPS coordinates, photographic proof of hazard, and categorical classification.',
    actionNature: 'draft',
  },
  2: {
    title: 'Automated Reminder',
    subtitle: 'Polite Formal Reminder to Assigned Department',
    timing: 'When initial response deadline is missed',
    color: 'amber',
    description:
      'If the municipal crew fails to remediate the defect before the Citizen Charter SLA expires, Stage 2 unlocks. Generates a formal, polite reminder email addressed directly to the responsible department citing the ticket ID and delay.',
    whatCitizenCanDo:
      'Review and dispatch a polite reminder email to the department desk or copy the official draft to send from personal email if automated relay is unconfigured.',
    requiredEvidence:
      'Unresolved report status after initial SLA expiry timestamp.',
    actionNature: 'dispatch',
  },
  3: {
    title: 'Senior Officer Escalation',
    subtitle: 'Hierarchical Escalation: Ward Officer to Commissioner',
    timing: 'When escalation deadline passes without resolution',
    color: 'rose',
    description:
      'When departmental reminders yield no action, the grievance escalates up the bureaucratic ladder: first to the Zonal Ward Officer / Executive Engineer, and subsequently to the Municipal Commissioner or District Magistrate.',
    whatCitizenCanDo:
      'Generate a formal bureaucratic escalation memorandum, review assigned senior officers, download or print the document, and record formal dispatch.',
    requiredEvidence:
      'Persistent unresolved status beyond the initial escalation threshold (typically 48h to 72h post-SLA breach).',
    actionNature: 'dispatch',
  },
  4: {
    title: 'Public Social Tagging',
    subtitle: 'Factual Public-Awareness & Official Handle Tagging',
    timing: 'After 14 days from original report',
    color: 'cyan',
    description:
      'If the hazard remains neglected for 14 continuous days, Stage 4 unlocks an objective, privacy-safe public awareness post tagging verified municipal authorities (e.g., @PWD_Delhi, @MCD_Delhi) on civic channels.',
    whatCitizenCanDo:
      'Review, edit, and post a factual summary containing report ID, safe location, days pending, and verified authority handles. Citizen reviews all text before posting.',
    requiredEvidence:
      'Report unresolved for 14+ days from original submission date.',
    actionNature: 'draft',
  },
  5: {
    title: 'RTI Application Engine',
    subtitle: 'Statutory Section 6(1) Right to Information Investigation',
    timing: 'After 21 days from original report',
    color: 'blue',
    description:
      'When an issue is 21+ days old without resolution, citizens exercise their constitutional right under the RTI Act 2005. Generates a statutory RTI questionnaire investigating contractor work orders, Defect Liability Periods (DLP), Measurement Books, and repair funds.',
    whatCitizenCanDo:
      'Generate a legally formatted Section 6(1) RTI draft, edit or download it, submit it on the official state/central RTI portal, and record the submission date and portal acknowledgement reference.',
    requiredEvidence:
      'Report unresolved for 21+ days from submission. Framed strictly as a request for information from the Public Information Officer (PIO).',
    actionNature: 'statutory_submission',
  },
  6: {
    title: 'Legal Notice via Partners',
    subtitle: 'Section 80 CPC Pre-Litigation & Pro Bono Advocate Panel',
    timing: 'RTI submitted + statutory response period elapsed',
    color: 'purple',
    description:
      'The ultimate escalation tier. Unlocks access to empaneled pro bono legal-aid advocates and law clinics only after the RTI has actually been submitted, the statutory response period has elapsed without adequate response, and the citizen provides explicit consent.',
    whatCitizenCanDo:
      'Connect with empaneled pro bono advocates (e.g. DLSA, Nagrik Nyaya, Vidhi Civic Clinic) to review whether a Section 80 CPC statutory notice, RTI First Appeal, or Magistrate injunction under Sec 133 CrPC is warranted.',
    requiredEvidence:
      'Recorded RTI submission date, elapsed statutory 30-day response window, inadequate/absent response, unresolved status, and citizen consent.',
    actionNature: 'legal_consultation',
  },
};

/**
 * Evaluates the full six-stage escalation ladder for a given CivicReport.
 * Handles missing/invalid timestamps, edge cases, resolved freezes, and RTI response tracking.
 */
export function evaluateReportEscalation(
  report: CivicReport | undefined | null,
  now: Date = new Date()
): ReportEscalationEvaluation {
  if (!report) {
    const fallbackDate = new Date();
    return createEmptyEvaluation(fallbackDate);
  }

  // 1. Timestamp validation
  let createdDate = new Date(report.createdAt);
  const hasValidTimestamp =
    Boolean(report.createdAt) && !isNaN(createdDate.getTime()) && createdDate.getTime() <= now.getTime() + 1000 * 60 * 5;

  if (!hasValidTimestamp) {
    // Graceful fallback: do not fabricate history, report error
    createdDate = new Date();
  }

  const isResolved = report.status === 'Resolved';
  const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  const elapsedLabel =
    elapsedDays >= 1
      ? `${elapsedDays}d ${elapsedHours % 24}h elapsed`
      : `${elapsedHours}h ${Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))}m elapsed`;

  // 2. Stage 1: SLA Countdown
  const slaHours = report.sla_hours || 48;
  const responseDeadlineDate = new Date(createdDate.getTime() + slaHours * 60 * 60 * 1000);
  const responseDeadlineISO = responseDeadlineDate.toISOString();
  const msToDeadline = responseDeadlineDate.getTime() - now.getTime();
  const isSlaBreached = elapsedHours >= slaHours;
  const slaRemainingHours = Math.max(0, Math.ceil(msToDeadline / (1000 * 60 * 60)));
  const slaRemainingMinutes = Math.max(0, Math.ceil(msToDeadline / (1000 * 60)));

  // 3. Stage 2: Automated Reminder
  const isReminderEligible = isSlaBreached && !isResolved && hasValidTimestamp;
  const isReminderSent = Boolean(report.escalationLadder?.reminderSent);
  const reminderSentAt = report.escalationLadder?.reminderSentAt;
  const reminderDeliveryStatus = report.escalationLadder?.reminderDeliveryStatus;

  // 4. Stage 3: Senior Officer Escalation (Configurable, default sla_hours + 48h)
  const escalationDeadlineHours =
    report.escalationLadder?.escalationDeadlineHours || slaHours + 48;
  const isEscalationEligible =
    elapsedHours >= escalationDeadlineHours && !isResolved && hasValidTimestamp;
  const isEscalationFiled = Boolean(report.escalationLadder?.escalationFiled);
  const escalationOfficerType = report.escalationLadder?.escalationOfficerType;

  // 5. Stage 4: Public Social Tagging (Day 14)
  const is14DaysPassed = elapsedDays >= 14;
  const daysUntil14Days = Math.max(0, 14 - elapsedDays);
  const isSocialTaggingEligible = is14DaysPassed && !isResolved && hasValidTimestamp;
  const isSocialPostDrafted = Boolean(report.escalationLadder?.socialPostDrafted);

  // 6. Stage 5: RTI Application Engine (Day 21)
  const is21DaysPassed = elapsedDays >= 21;
  const daysUntil21Days = Math.max(0, 21 - elapsedDays);
  const isRtiEligible = is21DaysPassed && !isResolved && hasValidTimestamp;
  const isRtiDrafted = Boolean(report.escalationLadder?.rtiDrafted);
  const isRtiSubmitted = Boolean(
    report.escalationLadder?.rtiSubmitted && report.escalationLadder?.rtiSubmittedAt
  );
  const rtiSubmittedAt = report.escalationLadder?.rtiSubmittedAt;
  const rtiSubmissionType = report.escalationLadder?.rtiSubmissionType || 'citizen_confirmed';
  const rtiReferenceNumber = report.escalationLadder?.rtiReferenceNumber;
  const rtiSubmissionEvidence = report.escalationLadder?.rtiSubmissionEvidence;

  // 7. Stage 6: Legal Notice via Partners
  const rtiResponsePeriodDays = report.escalationLadder?.rtiResponsePeriodDays || 30; // Statutory 30 days under RTI Act Sec 7(1)
  let rtiElapsedDaysSinceSubmission = 0;
  let isRtiResponsePeriodElapsed = false;
  let daysUntilRtiResponsePeriodElapsed = rtiResponsePeriodDays;

  if (isRtiSubmitted && rtiSubmittedAt) {
    const submittedDate = new Date(rtiSubmittedAt);
    if (!isNaN(submittedDate.getTime())) {
      const msSinceRti = Math.max(0, now.getTime() - submittedDate.getTime());
      rtiElapsedDaysSinceSubmission = Math.floor(msSinceRti / (1000 * 60 * 60 * 24));
      isRtiResponsePeriodElapsed = rtiElapsedDaysSinceSubmission >= rtiResponsePeriodDays;
      daysUntilRtiResponsePeriodElapsed = Math.max(
        0,
        rtiResponsePeriodDays - rtiElapsedDaysSinceSubmission
      );
    }
  }

  const rtiResponseReceived = Boolean(report.escalationLadder?.rtiResponseReceived);
  const rtiResponseStatus = report.escalationLadder?.rtiResponseStatus || 'no_response';

  const condition1_unresolved = !isResolved;
  const condition2_rtiSubmitted = isRtiSubmitted;
  const condition3_periodElapsed = isRtiResponsePeriodElapsed;
  const condition4_noAdequateResponse = rtiResponseStatus !== 'adequate';
  const condition5_consentChecked = Boolean(report.escalationLadder?.legalConsentGiven);

  const legalNoticeLockReasons: string[] = [];
  if (!condition1_unresolved) {
    legalNoticeLockReasons.push('Report has already been marked as Resolved.');
  }
  if (!condition2_rtiSubmitted) {
    legalNoticeLockReasons.push('RTI application must be officially submitted first.');
  } else if (!condition3_periodElapsed) {
    legalNoticeLockReasons.push(
      `Statutory 30-day response period has ${daysUntilRtiResponsePeriodElapsed} day(s) remaining.`
    );
  }
  if (condition2_rtiSubmitted && condition3_periodElapsed && !condition4_noAdequateResponse) {
    legalNoticeLockReasons.push(
      'An adequate response has been logged. Case escalation is paused for citizen review.'
    );
  }

  const isLegalNoticeEligible =
    hasValidTimestamp &&
    condition1_unresolved &&
    condition2_rtiSubmitted &&
    condition3_periodElapsed &&
    condition4_noAdequateResponse;

  const isLegalConsultationRequested = Boolean(
    report.escalationLadder?.legalConsultationRequested
  );

  // Highest Eligible Stage
  let highestEligibleStage: StageNumber | 'resolved' = 1;
  if (isResolved) {
    highestEligibleStage = 'resolved';
  } else if (isLegalNoticeEligible) {
    highestEligibleStage = 6;
  } else if (isRtiEligible) {
    highestEligibleStage = 5;
  } else if (isSocialTaggingEligible) {
    highestEligibleStage = 4;
  } else if (isEscalationEligible) {
    highestEligibleStage = 3;
  } else if (isReminderEligible) {
    highestEligibleStage = 2;
  } else {
    highestEligibleStage = 1;
  }

  // Active Stage Details Array
  const stages: StageDetails[] = ([1, 2, 3, 4, 5, 6] as StageNumber[]).map((st) => {
    const config = STAGE_CONFIG[st];

    let isEligible = false;
    let isUnlocked = false;
    let isCompleted = false;
    let isLocked = false;
    let isUnnecessary = false;
    let unlockRequirement = '';
    let remainingTimeText = '';
    let statusBadge = '';

    if (isResolved) {
      isUnnecessary = st > 1;
      isCompleted = st === 1;
      statusBadge = 'Resolved & Closed';
      unlockRequirement = 'Issue resolved. No further escalation required.';
    } else if (!hasValidTimestamp) {
      isLocked = true;
      statusBadge = 'Timestamp Incomplete';
      unlockRequirement = 'Eligibility cannot be determined due to missing submission timestamp.';
    } else {
      switch (st) {
        case 1:
          isEligible = true;
          isUnlocked = true;
          isCompleted = isSlaBreached;
          unlockRequirement = 'Active from moment of geotagged submission.';
          statusBadge = isSlaBreached ? 'SLA Overdue' : `${slaRemainingHours}h Left`;
          remainingTimeText = isSlaBreached
            ? `Breached by ${elapsedHours - slaHours}h`
            : `${slaRemainingHours} hours remaining`;
          break;

        case 2:
          isEligible = isReminderEligible;
          isUnlocked = isSlaBreached;
          isCompleted = isReminderSent;
          isLocked = !isSlaBreached;
          unlockRequirement = `Unlocks when initial response deadline (${slaHours}h) is missed.`;
          statusBadge = isReminderSent
            ? 'Reminder Sent'
            : isSlaBreached
            ? 'Reminder Eligible'
            : `Unlocks in ${slaRemainingHours}h`;
          remainingTimeText = isSlaBreached
            ? 'Available now'
            : `Unlocks in ${slaRemainingHours}h`;
          break;

        case 3:
          isEligible = isEscalationEligible;
          isUnlocked = isEscalationEligible;
          isCompleted = isEscalationFiled;
          isLocked = !isEscalationEligible;
          unlockRequirement = `Unlocks after escalation threshold (${escalationDeadlineHours}h from submission) with no resolution.`;
          statusBadge = isEscalationFiled
            ? 'Escalated'
            : isEscalationEligible
            ? 'Escalation Ready'
            : `Unlocks at ${escalationDeadlineHours}h`;
          remainingTimeText = isEscalationEligible
            ? 'Available now'
            : `Unlocks in ${Math.max(0, escalationDeadlineHours - elapsedHours)}h`;
          break;

        case 4:
          isEligible = isSocialTaggingEligible;
          isUnlocked = is14DaysPassed;
          isCompleted = isSocialPostDrafted;
          isLocked = !is14DaysPassed;
          unlockRequirement = 'Unlocks after 14 days from original submission if still unresolved.';
          statusBadge = isSocialPostDrafted
            ? 'Drafted / Shared'
            : is14DaysPassed
            ? 'Day 14 Unlocked'
            : `Day 14 (${daysUntil14Days}d left)`;
          remainingTimeText = is14DaysPassed
            ? 'Available now'
            : `Unlocks in ${daysUntil14Days} day(s)`;
          break;

        case 5:
          isEligible = isRtiEligible;
          isUnlocked = is21DaysPassed;
          isCompleted = isRtiSubmitted;
          isLocked = !is21DaysPassed;
          unlockRequirement =
            'Unlocks after 21 days from original submission if grievance remains unresolved.';
          statusBadge = isRtiSubmitted
            ? `RTI Filed (${rtiSubmissionType === 'independently_verified' ? 'Verified' : 'Citizen Confirmed'})`
            : isRtiDrafted
            ? 'RTI Draft Ready'
            : is21DaysPassed
            ? 'Day 21 Unlocked'
            : `Day 21 (${daysUntil21Days}d left)`;
          remainingTimeText = is21DaysPassed
            ? 'Available now'
            : `Unlocks in ${daysUntil21Days} day(s)`;
          break;

        case 6:
          isEligible = isLegalNoticeEligible;
          isUnlocked = isLegalNoticeEligible;
          isCompleted = isLegalConsultationRequested;
          isLocked = !isLegalNoticeEligible;
          unlockRequirement =
            'Unlocks only after RTI submission is recorded, 30-day statutory response period elapses without adequate response, and citizen gives consent.';
          statusBadge = isLegalConsultationRequested
            ? 'Counsel Assigned'
            : isLegalNoticeEligible
            ? 'Legal Aid Unlocked'
            : isRtiSubmitted
            ? `RTI Waiting (${daysUntilRtiResponsePeriodElapsed}d left)`
            : 'Requires RTI Submission';
          remainingTimeText = isLegalNoticeEligible
            ? 'Eligible for Legal Panel'
            : legalNoticeLockReasons[0] || 'Locked';
          break;
      }
    }

    return {
      stage: st,
      title: config.title,
      subtitle: config.subtitle,
      timing: config.timing,
      color: config.color,
      isEligible,
      isUnlocked,
      isCompleted,
      isLocked,
      isUnnecessary,
      unlockRequirement,
      remainingTimeText,
      statusBadge,
      description: config.description,
      whatCitizenCanDo: config.whatCitizenCanDo,
      requiredEvidence: config.requiredEvidence,
      actionNature: config.actionNature,
    };
  });

  return {
    reportId: report.id,
    reportStatus: report.status,
    isResolved,
    hasValidTimestamp,
    timestampError: hasValidTimestamp
      ? undefined
      : 'Submission timestamp missing or unreadable. Eligibility cannot be determined automatically.',
    createdAt: report.createdAt,
    createdDate,
    elapsedHours,
    elapsedDays,
    elapsedLabel,
    slaHours,
    responseDeadlineDate,
    responseDeadlineISO,
    slaRemainingHours,
    slaRemainingMinutes,
    isSlaBreached,
    isReminderEligible,
    isReminderSent,
    reminderSentAt,
    reminderDeliveryStatus,
    escalationDeadlineHours,
    isEscalationEligible,
    isEscalationFiled,
    escalationOfficerType,
    is14DaysPassed,
    daysUntil14Days,
    isSocialTaggingEligible,
    isSocialPostDrafted,
    is21DaysPassed,
    daysUntil21Days,
    isRtiEligible,
    isRtiDrafted,
    isRtiSubmitted,
    rtiSubmittedAt,
    rtiSubmissionType,
    rtiReferenceNumber,
    rtiSubmissionEvidence,
    rtiResponsePeriodDays,
    rtiElapsedDaysSinceSubmission,
    isRtiResponsePeriodElapsed,
    daysUntilRtiResponsePeriodElapsed,
    rtiResponseReceived,
    rtiResponseStatus,
    isLegalNoticeEligible,
    legalNoticeConditions: {
      issueUnresolved: condition1_unresolved,
      rtiSubmittedWithDate: condition2_rtiSubmitted,
      rtiResponsePeriodElapsed: condition3_periodElapsed,
      noAdequateResponse: condition4_noAdequateResponse,
      citizenConsentChecked: condition5_consentChecked,
    },
    legalNoticeLockReasons,
    isLegalConsultationRequested,
    highestEligibleStage,
    activeStageNumber: isResolved ? 'resolved' : highestEligibleStage,
    stages,
  };
}

function createEmptyEvaluation(fallbackDate: Date): ReportEscalationEvaluation {
  return {
    reportId: 'N/A',
    reportStatus: 'Reported',
    isResolved: false,
    hasValidTimestamp: false,
    timestampError: 'No report selected',
    createdAt: fallbackDate.toISOString(),
    createdDate: fallbackDate,
    elapsedHours: 0,
    elapsedDays: 0,
    elapsedLabel: '0h elapsed',
    slaHours: 48,
    responseDeadlineDate: fallbackDate,
    responseDeadlineISO: fallbackDate.toISOString(),
    slaRemainingHours: 48,
    slaRemainingMinutes: 48 * 60,
    isSlaBreached: false,
    isReminderEligible: false,
    isReminderSent: false,
    escalationDeadlineHours: 96,
    isEscalationEligible: false,
    isEscalationFiled: false,
    is14DaysPassed: false,
    daysUntil14Days: 14,
    isSocialTaggingEligible: false,
    isSocialPostDrafted: false,
    is21DaysPassed: false,
    daysUntil21Days: 21,
    isRtiEligible: false,
    isRtiDrafted: false,
    isRtiSubmitted: false,
    rtiResponsePeriodDays: 30,
    rtiElapsedDaysSinceSubmission: 0,
    isRtiResponsePeriodElapsed: false,
    daysUntilRtiResponsePeriodElapsed: 30,
    rtiResponseReceived: false,
    rtiResponseStatus: 'no_response',
    isLegalNoticeEligible: false,
    legalNoticeConditions: {
      issueUnresolved: true,
      rtiSubmittedWithDate: false,
      rtiResponsePeriodElapsed: false,
      noAdequateResponse: true,
      citizenConsentChecked: false,
    },
    legalNoticeLockReasons: ['No report selected.'],
    isLegalConsultationRequested: false,
    highestEligibleStage: 1,
    activeStageNumber: 1,
    stages: [],
  };
}
