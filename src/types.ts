export type CivicCategoryType =
  | 'road_pothole'
  | 'garbage_waste'
  | 'streetlight'
  | 'water_drainage'
  | 'traffic_parking'
  | 'public_infrastructure'
  | 'sanitation';

export type ReportStatus = 'Reported' | 'In Review' | 'In Progress' | 'Resolved';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface TimelineEvent {
  status: ReportStatus;
  timestamp: string;
  note: string;
  officer?: string;
  actionTaken?: string;
}

export interface EscalationLadderState {
  // Stage 1: Public countdown
  submissionTimestamp?: string;
  responseDeadline?: string;

  // Stage 2: Automated reminder
  reminderSent?: boolean;
  reminderSentAt?: string;
  reminderDeliveryStatus?: 'sent' | 'draft_copied' | 'failed' | 'pending';
  reminderRecipient?: string;
  reminderEmailDraft?: string;

  // Stage 3: Senior officer escalation
  escalationDeadlineHours?: number; // Configurable escalation deadline (e.g. sla_hours + 48h)
  escalationOfficerType?: 'ward_officer' | 'commissioner';
  escalationDraftedAt?: string;
  escalationFiled?: boolean;
  escalationFiledAt?: string;
  escalationDispatchMode?: 'speed_post' | 'portal' | 'in_person';
  escalationTrackingNumber?: string;

  // Stage 4: Public social tagging (>= 14 days)
  socialPostDrafted?: boolean;
  socialPostDraftedAt?: string;
  socialPostContent?: string;
  socialPlatform?: 'twitter' | 'linkedin' | 'facebook';

  // Stage 5: RTI Application Engine (>= 21 days)
  rtiDrafted?: boolean;
  rtiDraftedAt?: string;
  rtiSubmitted?: boolean;
  rtiSubmissionType?: 'citizen_confirmed' | 'independently_verified';
  rtiSubmittedAt?: string; // ISO date string
  rtiReferenceNumber?: string;
  rtiSubmissionEvidence?: string;
  rtiResponsePeriodDays?: number; // default 30 days under Sec 7(1) RTI Act 2005
  rtiResponseReceived?: boolean;
  rtiResponseReceivedAt?: string;
  rtiResponseStatus?: 'no_response' | 'adequate' | 'inadequate';
  rtiResponseNotes?: string;

  // Stage 6: Legal notice via partners (RTI submitted + 30-day elapsed + unresolved)
  legalConsultationRequested?: boolean;
  legalConsultationRequestedAt?: string;
  legalPartnerId?: string;
  legalPartnerName?: string;
  legalRemedyRecommended?: 'legal_notice_sec80' | 'rti_first_appeal' | 'pil_writ' | 'sec133_nuisance';
  legalConsentGiven?: boolean;
}

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  category: CivicCategoryType;
  status: ReportStatus;
  priority: PriorityLevel;
  severity_score: number; // 1-10
  severity_label: string;
  department: string;
  sla_hours: number;
  imageUrl?: string;
  images?: string[]; // Array of 2-3 genuine JPG photos attached
  storagePath?: string; // Firebase Storage primary object path
  storagePaths?: string[]; // Firebase Storage all uploaded object paths
  resolved_proof_url?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address: string;
  location_name: string;
  ward?: string;
  upvotes: number;
  hasUpvoted?: boolean;
  createdAt: string;
  reportedBy: string;
  authorUid?: string;
  isUserSubmitted?: boolean;
  safety_hazards?: string[];
  administrative_summary?: string;
  timeline: TimelineEvent[];
  official_response?: string;
  verificationResult?: ImageVerificationResult;
  escalationLadder?: EscalationLadderState;
}

export interface CivicBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'reporting' | 'accuracy' | 'community' | 'milestone' | 'legal';
  unlocked: boolean;
  progress: number;
  target: number;
  currentValue: number;
  unit: string;
  unlockedAt?: string;
}

export interface CivicCategory {
  id: CivicCategoryType;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
  borderLight: string;
  typicalDepartment: string;
  defaultSlaHours: number;
  description: string;
}

export interface CitizenProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  karmaPoints: number;
  levelTitle: string;
  levelNumber: number;
  verifiedId: boolean;
  ward: string;
  city: string;
  reportsFiledCount: number;
  upvotesGivenCount: number;
  resolvedCount: number;
}

export interface CivicNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'status_update' | 'milestone' | 'upvote' | 'alert' | 'badge';
  reportId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
}

export type OnlineReuseStatus = 'Possible match found' | 'No match found' | 'Check unavailable';
export type AiAssessmentStatus =
  | 'Possible AI-generated'
  | 'Potentially manipulated'
  | 'No strong evidence detected'
  | 'Inconclusive'
  | 'Check unavailable';
export type VerificationOverallStatus = 'Needs review' | 'Checks completed' | 'Verification incomplete';

export interface TinyFishCheckDetail {
  status: OnlineReuseStatus;
  isConfigured: boolean;
  matches: Array<{
    title?: string;
    url?: string;
    source?: string;
    similarityScore?: number;
  }>;
  sourceLinks: string[];
  explanation: string;
}

export interface GeminiCheckDetail {
  status: AiAssessmentStatus;
  assessmentRaw:
    | 'possible_ai_generated'
    | 'potentially_manipulated'
    | 'inconclusive'
    | 'no_strong_evidence'
    | 'unavailable';
  confidence?: number;
  explanation: string;
  detectedClues: string[];
}

export interface CombinedImageVerification {
  onlineReuse: OnlineReuseStatus;
  aiAssessment: AiAssessmentStatus;
  evidence: {
    sourceLinks: string[];
    briefExplanations: string[];
  };
  verificationStatus: VerificationOverallStatus;
  tinyfish: TinyFishCheckDetail;
  gemini: GeminiCheckDetail;
  verifiedAt: string;
  // Backward compatibility fields
  is_authentic?: boolean;
  origin_type?: 'authentic_camera' | 'pinterest_or_stock' | 'ai_generated';
  confidence_score?: number;
  detected_clues?: string[];
  tinyfish_agent_status?: 'passed' | 'flagged' | 'suspicious';
  recommendation?: string;
}

export type ImageVerificationResult = CombinedImageVerification;

