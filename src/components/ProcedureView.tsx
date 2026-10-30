import React, { useState } from 'react';
import { CivicReport } from '../types';
import {
  ShieldAlert,
  Clock,
  Send,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Building,
  Gavel,
  Search,
  Download,
  Users,
  Compass,
  Mail,
  Share2,
  Lock,
  Calendar,
  Info,
} from 'lucide-react';
import { evaluateReportEscalation, StageNumber, STAGE_CONFIG } from '../utils/escalationLadder';

interface ProcedureViewProps {
  reports: CivicReport[];
  onOpenReportModal: () => void;
  onOpenReportDetail: (report: CivicReport) => void;
  onOpenReminder?: (report: CivicReport) => void;
  onOpenEscalation: (report: CivicReport) => void;
  onOpenSocialTagging?: (report: CivicReport) => void;
  onOpenRti: (report: CivicReport) => void;
  onOpenLegalCounsel: (report: CivicReport) => void;
  onSelectTab: (tab: string) => void;
}

export const ProcedureView: React.FC<ProcedureViewProps> = ({
  reports,
  onOpenReportModal,
  onOpenReportDetail,
  onOpenReminder,
  onOpenEscalation,
  onOpenSocialTagging,
  onOpenRti,
  onOpenLegalCounsel,
  onSelectTab,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports.length > 0 ? reports[0].id : ''
  );
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const evaluation = evaluateReportEscalation(selectedReport);

  const STAGES_PRESENTATION = [
    {
      stage: 1 as StageNumber,
      title: 'Public Countdown',
      subtitle: 'Citizen Charter SLA Clock & Public Audit Trail',
      timeline: 'Timing: Day 0 (Immediate upon report submission)',
      color: 'emerald',
      icon: Clock,
      description:
        'When a citizen submits a report, Nagrik One records the verified submission timestamp, identifies the responsible department, and starts a visible public deadline countdown based on statutory Citizen Charter standards.',
      keyPoints: [
        'Report submission timestamp permanently logged into the civic audit trail.',
        'Current status, elapsed hours, and applicable response turnaround deadline displayed.',
        'Live countdown or overdue indicator based on statutory Citizen Charter SLA (24h - 72h).',
        'Transparent routing to assigned agency (PWD, MCD, Jal Board, DISCOM).',
      ],
      legalBacking:
        'Governed under State Right to Public Services Legislation & Municipal Citizen Charters.',
      actionLabel: 'Report Grievance',
      actionTab: 'report',
      whatCitizenCanDo:
        'Monitor live countdown, verify department assignment, and mobilize ward neighbors to upvote.',
      informationNeeded:
        'Accurate GPS coordinates, photographic proof of hazard, and categorical classification.',
      nextStageLockReason:
        'Stage 2 remains locked until the Citizen Charter SLA deadline has passed without resolution.',
    },
    {
      stage: 2 as StageNumber,
      title: 'Automated Reminder',
      subtitle: 'Polite Formal Reminder to Assigned Department',
      timeline: 'Timing: When the initial response deadline is missed',
      color: 'amber',
      icon: Mail,
      description:
        'If the issue remains unresolved after the initial response deadline passes, the reminder stage unlocks. Generates a professionally written, polite reminder email addressed directly to the responsible department.',
      keyPoints: [
        'Unlocks only after the Citizen Charter deadline is missed without issue resolution.',
        'Includes report ID, issue description, submission date, location, and elapsed duration.',
        'Dispatches via configured email gateway or provides a copyable draft for direct citizen dispatch.',
        'Records actual reminder timestamp and delivery status in the public report audit log.',
      ],
      legalBacking:
        'Administrative notice under Municipal Corporation Grievance Redressal Directives.',
      actionLabel: 'Dispatch Reminder Email',
      actionTab: 'reminder',
      whatCitizenCanDo:
        'Review and transmit a polite reminder email to the department desk or copy the text for personal email.',
      informationNeeded:
        'Unresolved complaint status past the initial response SLA timestamp.',
      nextStageLockReason:
        'Stage 3 remains locked until the escalation deadline passes without resolution.',
    },
    {
      stage: 3 as StageNumber,
      title: 'Senior Officer Escalation',
      subtitle: 'Hierarchical Escalation: Ward Officer to Commissioner',
      timeline: 'Timing: When the applicable escalation deadline passes without resolution',
      color: 'rose',
      icon: Send,
      description:
        'When departmental reminders yield no action and the escalation deadline is breached, the grievance escalates to senior leadership: first to the Zonal Ward Officer / Executive Engineer, and subsequently to the Municipal Commissioner or District Magistrate.',
      keyPoints: [
        'Sequential escalation: 1. Ward Officer / Zonal Engineer, followed by 2. Municipal Commissioner.',
        'Shows reason for escalation, elapsed time, and relevant civic defect details.',
        'Citizen generates an official executive memorandum citing statutory duties to abate public hazards.',
        'Clear tracking: Never claims an officer was contacted unless confirmed dispatch has occurred.',
      ],
      legalBacking:
        'Section 59/60 of Municipal Corporation Acts (Duty of Commissioner to abate public health & safety hazards).',
      actionLabel: 'Generate Escalation Memorandum',
      actionTab: 'escalate',
      whatCitizenCanDo:
        'Draft, print, or download a formal memorandum to the Ward Officer or Municipal Commissioner, and record dispatch.',
      informationNeeded:
        'Persistent unresolved status beyond the configured escalation deadline (typically 48h to 72h post-SLA).',
      nextStageLockReason:
        'Stage 4 unlocks after 14 days have elapsed from original submission.',
    },
    {
      stage: 4 as StageNumber,
      title: 'Public Social Tagging',
      subtitle: 'Factual Public-Awareness & Verified Handle Tagging',
      timeline: 'Timing: After 14 days from original report, if unresolved',
      color: 'cyan',
      icon: Share2,
      description:
        'If the report remains unresolved after 14 continuous days, Stage 4 unlocks an objective public-awareness mechanism tagging verified municipal authority handles (e.g. @PWD_Delhi, @MCD_Delhi) on civic social platforms.',
      keyPoints: [
        'Unlocks strictly on Day 14 for eligible unresolved reports.',
        'Includes Report ID, category, anonymized/safe location, days pending, and verified public handles.',
        'Citizen reviews and edits all copy prior to publishing; never auto-published without consent.',
        'Enforces ethical safeguards: no personal phone numbers, emails, or unsupported accusations.',
      ],
      legalBacking:
        'Citizen freedom of expression & public scrutiny under Article 19(1)(a) of the Constitution of India.',
      actionLabel: 'Prepare Social Notice',
      actionTab: 'social',
      whatCitizenCanDo:
        'Review, customize, and share a factual public-awareness post on X (Twitter), Facebook, or LinkedIn.',
      informationNeeded:
        'Report unresolved for at least 14 days from original creation timestamp.',
      nextStageLockReason:
        'Stage 5 (RTI Application Engine) requires at least 21 days from original submission.',
    },
    {
      stage: 5 as StageNumber,
      title: 'RTI Application Engine',
      subtitle: 'Statutory Section 6(1) Right to Information Investigation',
      timeline: 'Timing: After 21 days from original report, if unresolved',
      color: 'blue',
      icon: FileText,
      description:
        'When an issue remains unaddressed for 21 days, citizens exercise their statutory right under the Right to Information Act 2005. Generates a pre-filled Section 6(1) questionnaire investigating contractor contracts, Measurement Books, and repair funds.',
      keyPoints: [
        'Unlocks on Day 21 only if unresolved and necessary complaint information is present.',
        'Framed strictly as an information request to the Public Information Officer (PIO), not a demand for repair.',
        'Clearly labelled as an RTI Draft, not a submitted application, until citizen records actual filing.',
        'Citizen records submission date, ACK reference number, and evidence (distinguishing citizen-reported from verified).',
      ],
      legalBacking:
        'Section 6(1) & Section 7(1) Right to Information Act 2005 (Mandatory 30-day PIO response window; ₹250/day personal penalty for non-compliance).',
      actionLabel: 'Draft RTI Questionnaire',
      actionTab: 'rti',
      whatCitizenCanDo:
        'Generate, edit, and download a Section 6(1) RTI draft, submit it on the official portal, and record submission details.',
      informationNeeded:
        'Report unresolved for 21+ days with specific location, ticket ID, and category details.',
      nextStageLockReason:
        'Stage 6 requires actual RTI submission recorded, plus the full 30-day statutory response period to elapse.',
    },
    {
      stage: 6 as StageNumber,
      title: 'Legal Notice via Partners',
      subtitle: 'Section 80 CPC Pre-Litigation & Pro Bono Legal Panel',
      timeline: 'Timing: RTI submitted + 30-day response period elapsed + unresolved',
      color: 'purple',
      icon: Scale,
      description:
        'The final escalation stage. Unlocks access to empaneled pro bono lawyers and legal-aid clinics only after all 5 statutory conditions are met: issue unresolved, RTI submitted, 30-day response period elapsed, no adequate response, and citizen consent.',
      keyPoints: [
        'Unlocks only after genuine exhaustion of administrative and statutory RTI remedies.',
        'Requires all 5 conditions: Unresolved, recorded RTI submission, 30-day period elapsed, inadequate/absent response, and citizen consent.',
        'Connects citizen to empaneled pro bono partners (DLSA, Nagrik Nyaya, Vidhi Civic Clinic).',
        'Advocates determine whether a Section 80 CPC Notice, RTI First Appeal, or Section 133 CrPC injunction is appropriate.',
      ],
      legalBacking:
        'Section 80 Code of Civil Procedure (CPC), Article 21 (Right to Safe Life) & Article 226 of the Constitution of India.',
      actionLabel: 'Engage Pro Bono Counsel',
      actionTab: 'legal',
      whatCitizenCanDo:
        'Submit the case dossier and RTI records for review by empaneled pro bono advocates with explicit consent.',
      informationNeeded:
        'Verified RTI submission date, completed 30-day statutory waiting window, inadequate response note, and citizen authorization.',
      nextStageLockReason:
        'This is the highest stage in the Nagrik One Accountability Procedure.',
    },
  ];

  const FAQS = [
    {
      q: 'What is a Citizen Charter SLA?',
      a: 'A Citizen Charter is an official administrative commitment by municipal corporations (such as MCD, PWD, DJB) specifying guaranteed timeframes for resolving citizen grievances. For example, open hazardous manholes must be capped within 24 hours, potholes filled within 48 to 72 hours, and streetlights repaired within 48 hours.',
    },
    {
      q: 'Why does the automated reminder (Stage 2) unlock only after the SLA passes?',
      a: 'Municipal crews must be afforded their statutory Citizen Charter time to remediate complaints during Stage 1. Once that deadline is missed without resolution, Stage 2 generates a courteous, formal reminder directly to the department.',
    },
    {
      q: 'What is the difference between Stage 3 (Escalation) and Stage 5 (RTI)?',
      a: 'Stage 3 is an administrative demand served to executive decision-makers (Ward Officer or Municipal Commissioner) demanding emergency maintenance under municipal acts. Stage 5 is a formal legal application under the Right to Information Act 2005 requiring the Public Information Officer (PIO) to disclose contracts, contractor Defect Liability Periods (DLP), and repair budgets.',
    },
    {
      q: 'Why does Stage 5 (RTI) frame the document as a request for information rather than a demand for repair?',
      a: 'The Right to Information Act 2005 gives citizens the constitutional right to inspect government records, work orders, and expenditure. It does not empower the RTI authority to carry out physical roadwork. Requesting contractor tender copies and inspection registers creates legal accountability that compels prompt action.',
    },
    {
      q: 'What are the exact conditions required to unlock Stage 6 (Legal Notice)?',
      a: 'Stage 6 is strictly conditioned upon: (1) The civic issue remains unresolved, (2) The RTI application has been formally marked as submitted with a recorded date, (3) The statutory 30-day response window under Section 7(1) of the RTI Act 2005 has elapsed, (4) No adequate response has been received, and (5) The citizen explicitly provides consent to engage pro bono legal counsel.',
    },
    {
      q: 'Does Nagrik One guarantee automatic repair or judicial outcomes?',
      a: 'No. Nagrik One is an independent citizen redressal and accountability framework. It structures citizen evidence, automates escalation notices, drafts RTI questionnaires, and matches cases with empaneled legal partners. It does not replace municipal authorities, guarantee departmental compliance, or guarantee judicial verdicts.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 border border-slate-700/60 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-8 opacity-10 hidden md:block">
          <Scale className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Six-Stage Accountability Ladder &bull; Presentation Standard</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Nagrik One Accountability Procedure:
            <span className="block text-emerald-400 mt-1">
              The Six-Stage Citizen Escalation Ladder
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            A constitutional, time-based civic accountability process that guides citizens from Day 0 public countdowns to automated reminders, senior officer escalations, Day 14 public social tagging, Day 21 RTI applications, and Stage 6 pro bono legal notices.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenReportModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Report a Civic Hazard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Explore Live 500m Ward Map</span>
            </button>
            <button
              onClick={() => onSelectTab('sahayak')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Consult Sahayak AI</span>
            </button>
            <button
              onClick={() => onSelectTab('about')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs sm:text-sm font-semibold border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span>About &amp; Civic Directives</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Report Escalation Calculator / Status Checker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Interactive Status Evaluator
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Live 6-Stage Timeline Engine
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Determine the Current Escalation Tier for Any Grievance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select an existing report to inspect its exact position across the six-stage escalation ladder.
            </p>
          </div>

          {/* Report Dropdown Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Report:</span>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} - {r.title.slice(0, 32)} ({r.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Report Assessment Card */}
        {selectedReport && (
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Complaint #{selectedReport.id}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                    evaluation.isResolved
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : typeof evaluation.highestEligibleStage === 'number' && evaluation.highestEligibleStage >= 4
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : typeof evaluation.highestEligibleStage === 'number' && evaluation.highestEligibleStage >= 2
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  Status: {selectedReport.status}
                </span>
                <span className="text-xs text-slate-500">
                  Assigned: <b>{selectedReport.department}</b> &bull; Ward: <b>{selectedReport.ward || 'Central'}</b>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Elapsed: <b>{evaluation.elapsedLabel}</b>
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {selectedReport.description}
                </p>
              </div>

              {/* 6-Step Visual Progression Stepper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Current Active Tier:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {evaluation.isResolved
                      ? 'Resolved & Closed'
                      : `Stage ${evaluation.highestEligibleStage} of 6: ${
                          STAGE_CONFIG[evaluation.highestEligibleStage as StageNumber]?.title
                        }`}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  {([1, 2, 3, 4, 5, 6] as StageNumber[]).map((st) => {
                    const isPassed =
                      evaluation.isResolved ||
                      (typeof evaluation.highestEligibleStage === 'number' &&
                        st <= evaluation.highestEligibleStage);
                    return (
                      <div
                        key={st}
                        className={`h-full rounded-full transition-all ${
                          isPassed
                            ? st === 1
                              ? 'bg-emerald-500'
                              : st === 2
                              ? 'bg-amber-500'
                              : st === 3
                              ? 'bg-rose-500'
                              : st === 4
                              ? 'bg-cyan-500'
                              : st === 5
                              ? 'bg-blue-500'
                              : 'bg-purple-600'
                            : 'bg-transparent'
                        }`}
                        title={`Stage ${st}: ${STAGE_CONFIG[st].title}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommended Action Column */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Recommended Procedural Action
              </span>

              {evaluation.isResolved ? (
                <div>
                  <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    Remediated &amp; Closed
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Grievance has been verified as resolved. Escalation ladder has halted and historical audit timeline is preserved.
                  </p>
                  <button
                    onClick={() => onOpenReportDetail(selectedReport)}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    View Completed Audit Log
                  </button>
                </div>
              ) : evaluation.highestEligibleStage === 1 ? (
                <div>
                  <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    Within Citizen Charter SLA ({evaluation.slaRemainingHours}h Left)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    The municipal crew is currently operating within statutory response time. Mobilize community upvotes to maintain priority.
                  </p>
                  <button
                    onClick={() => onOpenReportDetail(selectedReport)}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Inspect Public Countdown
                  </button>
                </div>
              ) : evaluation.highestEligibleStage === 2 ? (
                <div>
                  <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">
                    SLA Breached &bull; Stage 2 Automated Reminder Unlocked
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    The {selectedReport.sla_hours}h Charter deadline has been missed. Dispatch a formal courteous reminder email to the department desk.
                  </p>
                  <button
                    onClick={() => onOpenReminder && onOpenReminder(selectedReport)}
                    className="w-full mt-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Dispatch Stage 2 Reminder &rarr;</span>
                  </button>
                </div>
              ) : evaluation.highestEligibleStage === 3 ? (
                <div>
                  <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400">
                    Stage 3 Senior Officer Escalation Ready
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Delay exceeds acceptable threshold ({evaluation.elapsedLabel}). Escalate hierarchically to the Ward Officer or Municipal Commissioner.
                  </p>
                  <button
                    onClick={() => onOpenEscalation(selectedReport)}
                    className="w-full mt-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate Officer Escalation &rarr;</span>
                  </button>
                </div>
              ) : evaluation.highestEligibleStage === 4 ? (
                <div>
                  <h4 className="font-bold text-sm text-cyan-600 dark:text-cyan-400">
                    Day 14 Unlocked &bull; Public Social Tagging
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Grievance has remained neglected for 14+ days. Review and publish a factual awareness post tagging verified authority handles.
                  </p>
                  <button
                    onClick={() => onOpenSocialTagging && onOpenSocialTagging(selectedReport)}
                    className="w-full mt-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Prepare Social Tagging Post &rarr;</span>
                  </button>
                </div>
              ) : evaluation.highestEligibleStage === 5 ? (
                <div>
                  <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    Day 21 Unlocked &bull; RTI Application Engine
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Issue is 21+ days old. Prepare a statutory Section 6(1) RTI questionnaire into contractor tenders, Defect Liability Periods, and repair funds.
                  </p>
                  <button
                    onClick={() => onOpenRti(selectedReport)}
                    className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate Section 6(1) RTI Draft &rarr;</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-sm text-purple-600 dark:text-purple-400">
                    Stage 6 &bull; Legal Notice via Partners
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    RTI submission recorded and 30-day statutory response period elapsed. Engage empaneled pro bono advocates for Section 80 CPC notice.
                  </p>
                  <button
                    onClick={() => onOpenLegalCounsel(selectedReport)}
                    className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Engage Pro Bono Legal Counsel &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* The 6-Stage Numbered Timeline / Step-by-Step Visual Flow */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Official Presentation Ladder &bull; Slide 7 Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            The Six-Stage Escalation Ladder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A constitutional, time-based civic accountability sequence where every stage is strictly governed by actual timestamps and statutory thresholds.
          </p>
        </div>

        <div className="relative space-y-6 before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-1 before:bg-slate-200 dark:before:bg-slate-800">
          {STAGES_PRESENTATION.map((st) => {
            const Icon = st.icon;
            const isHighlight =
              !evaluation.isResolved && evaluation.highestEligibleStage === st.stage;
            const evalStage = evaluation.stages.find((s) => s.stage === st.stage);

            return (
              <div
                key={st.stage}
                className={`relative flex items-start gap-4 sm:gap-6 pl-2 sm:pl-4 transition-all ${
                  isHighlight ? 'scale-[1.01]' : ''
                }`}
              >
                {/* Stage Number Badge */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm sm:text-base z-10 shrink-0 shadow-lg ${
                    st.stage === 1
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : st.stage === 2
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : st.stage === 3
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : st.stage === 4
                      ? 'bg-cyan-600 text-white shadow-cyan-600/30'
                      : st.stage === 5
                      ? 'bg-blue-600 text-white shadow-blue-600/30'
                      : 'bg-purple-600 text-white shadow-purple-600/30'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Stage Card */}
                <div
                  className={`flex-1 rounded-3xl p-5 sm:p-7 border transition-all ${
                    isHighlight
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Stage {st.stage} of 6
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {st.timeline}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {st.title}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {st.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {evalStage && (
                        <span
                          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold ${
                            evalStage.isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : evalStage.isUnlocked
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {evalStage.statusBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                    {st.description}
                  </p>

                  {/* Citizen Capabilities & Evidence */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        What citizen can do:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{st.whatCitizenCanDo}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        Evidence / Information needed:
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{st.informationNeeded}</span>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {st.keyPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  {/* Legal Citations & Action CTA */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="italic">{st.legalBacking}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {st.actionTab === 'report' && (
                        <button
                          onClick={onOpenReportModal}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                      {st.actionTab === 'reminder' && selectedReport && (
                        <button
                          onClick={() => onOpenReminder && onOpenReminder(selectedReport)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                      {st.actionTab === 'escalate' && selectedReport && (
                        <button
                          onClick={() => onOpenEscalation(selectedReport)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                      {st.actionTab === 'social' && selectedReport && (
                        <button
                          onClick={() => onOpenSocialTagging && onOpenSocialTagging(selectedReport)}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                      {st.actionTab === 'rti' && selectedReport && (
                        <button
                          onClick={() => onOpenRti(selectedReport)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                      {st.actionTab === 'legal' && selectedReport && (
                        <button
                          onClick={() => onOpenLegalCounsel(selectedReport)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {st.actionLabel} &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Citizen Rights & Legal FAQ Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Citizen Legal Rights &amp; Accountability FAQ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Essential knowledge on RTI laws, municipal responsibilities, and citizen legal protections.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
