import React, { useState } from 'react';
import { CivicReport, ReportStatus } from '../types';
import { getCategoryById } from '../data/categories';
import {
  X,
  MapPin,
  Clock,
  Building2,
  ThumbsUp,
  Share2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Trash2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Scale,
  Mail,
  Lock,
  Maximize2,
  Image as ImageIcon,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { evaluateReportEscalation, StageNumber, STAGE_CONFIG } from '../utils/escalationLadder';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { canUserDeleteReport } from '../services/reportFirebaseService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ReportDetailModalProps {
  report: CivicReport | null;
  isOpen: boolean;
  onClose: () => void;
  onUpvote: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenReminder?: (report: CivicReport) => void;
  onOpenEscalation: (report: CivicReport) => void;
  onOpenSocialTagging?: (report: CivicReport) => void;
  onOpenRti: (report: CivicReport) => void;
  onOpenLegalCounsel?: (report: CivicReport) => void;
  onAdvanceStatus?: (reportId: string, nextStatus: ReportStatus) => void;
  onViewProcedure?: () => void;
  currentUserWard?: string;
}

const STATUS_STEPS: ReportStatus[] = ['Reported', 'In Review', 'In Progress', 'Resolved'];

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onUpvote,
  onDeleteReport,
  onOpenReminder,
  onOpenEscalation,
  onOpenSocialTagging,
  onOpenRti,
  onOpenLegalCounsel,
  onAdvanceStatus,
  onViewProcedure,
}) => {
  const { user } = useAuth();
  const { t } = useLanguageTheme();
  const [copied, setCopied] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);

  if (!isOpen || !report) return null;

  const getStatusLabel = (s: ReportStatus) => {
    switch (s) {
      case 'Reported':
        return t('statusReported', 'Reported');
      case 'In Review':
        return t('statusInReview', 'In Review');
      case 'In Progress':
        return t('statusInProgress', 'In Progress');
      case 'Resolved':
        return t('statusResolved', 'Resolved');
      default:
        return s;
    }
  };

  const getCategoryLabel = (id: string, fallback: string) => {
    switch (id) {
      case 'pothole': return t('catPothole', fallback);
      case 'garbage': return t('catGarbage', fallback);
      case 'streetlight': return t('catStreetlight', fallback);
      case 'water': return t('catWater', fallback);
      case 'traffic': return t('catTraffic', fallback);
      case 'infrastructure': return t('catInfrastructure', fallback);
      case 'sanitation': return t('catSanitation', fallback);
      default: return fallback;
    }
  };

  const isOwner = canUserDeleteReport(report, user?.uid, user?.email);
  const cat = getCategoryById(report.category);
  const currentStepIdx = STATUS_STEPS.indexOf(report.status);
  const allEvidencePhotos =
    report.images && report.images.length > 0
      ? report.images
      : report.imageUrl
      ? [report.imageUrl]
      : [];
  const currentPhoto = allEvidencePhotos[activePhotoIdx] || allEvidencePhotos[0] || report.imageUrl;

  const evaluation = evaluateReportEscalation(report);

  const handleShare = async () => {
    const text = `Civic Grievance #${report.id}: "${report.title}" logged on Nagrik One. Support this issue!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: report.title, text, url: window.location.href });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getNextStatus = (): ReportStatus | null => {
    if (currentStepIdx < STATUS_STEPS.length - 1) {
      return STATUS_STEPS[currentStepIdx + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              {cat.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {getCategoryLabel(report.category, cat.label)}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs font-mono font-bold text-slate-500">#{report.id}</span>
                {report.isUserSubmitted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Your Report
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white line-clamp-1">
                {report.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Share Issue"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Resolution Pipeline & Stepper */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Municipal Resolution Pipeline
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  report.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : evaluation.isSlaBreached
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {getStatusLabel(report.status)}
              </span>
            </div>

            {/* Status Steps Bar */}
            <div className="grid grid-cols-4 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} className="flex flex-col items-center text-center">
                    <div
                      className={`w-full h-1.5 rounded-full mb-2 transition-all ${
                        isPassed
                          ? report.status === 'Resolved'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold ${
                        isCurrent
                          ? 'text-slate-900 dark:text-white'
                          : isPassed
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {getStatusLabel(step)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* SLA Clock and Simulator */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Citizen Charter SLA: <b>{report.sla_hours}h</b> &bull; Elapsed:{' '}
                  <b>{evaluation.elapsedLabel}</b>
                </span>
                {evaluation.isSlaBreached ? (
                  <span className="text-rose-600 font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60">
                    SLA Breached! Stage 2 Unlocked
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">
                    ({evaluation.slaRemainingHours}h remaining)
                  </span>
                )}
              </div>

              {/* Progress Simulator Button */}
              {nextStatus && onAdvanceStatus && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(report.id, nextStatus)}
                  className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Simulate municipal crew advancing the issue"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-500" />
                  <span>Advance to: {nextStatus}</span>
                </button>
              )}
            </div>

            {/* Citizen Accountability Procedure Stage Progression (Six-Stage Escalation Ladder) */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 dark:from-slate-950 dark:via-emerald-950/10 dark:to-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    ⚖️
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Six-Stage Escalation Ladder &bull; Presentation Standard
                    </span>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                      {evaluation.isResolved
                        ? 'Status: Case Remediated & Closed'
                        : `Current Tier: Stage ${evaluation.highestEligibleStage} of 6 — ${
                            STAGE_CONFIG[evaluation.highestEligibleStage as StageNumber]?.title
                          }`}
                    </h5>
                  </div>
                </div>

                {onViewProcedure && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewProcedure();
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Procedure Ladder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 6-Step Mini Stepper */}
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[
                  { num: 1, label: 'Countdown', desc: 'Day 0 SLA' },
                  { num: 2, label: 'Reminder', desc: 'SLA Overdue' },
                  { num: 3, label: 'Escalation', desc: 'Commissioner' },
                  { num: 4, label: 'Social Tag', desc: 'Day 14+' },
                  { num: 5, label: 'RTI Act', desc: 'Day 21+' },
                  { num: 6, label: 'Legal Recourse', desc: 'RTI + 30d' },
                ].map((st) => {
                  const isActive =
                    !evaluation.isResolved && evaluation.highestEligibleStage === st.num;
                  const isDone =
                    evaluation.isResolved ||
                    (typeof evaluation.highestEligibleStage === 'number' &&
                      evaluation.highestEligibleStage > st.num);
                  return (
                    <div key={st.num} className="text-center">
                      <div
                        className={`h-1.5 rounded-full mb-1 transition-all ${
                          isActive
                            ? 'bg-emerald-500 ring-2 ring-emerald-400/40'
                            : isDone
                            ? 'bg-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                      <span
                        className={`text-[9px] block font-bold leading-tight line-clamp-1 ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : isDone
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {st.num}. {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Escalation Rule Guidance Note */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
                {evaluation.isResolved ? (
                  <span>
                    ✅ <b>Resolved:</b> Work successfully completed on site. Escalation ladder is halted, and audit history is preserved.
                  </span>
                ) : evaluation.highestEligibleStage === 1 ? (
                  <span>
                    ⏱️ <b>Stage 1 (Public Countdown):</b> Department is within statutory {report.sla_hours}h Charter SLA ({evaluation.slaRemainingHours}h remaining). Gather community upvotes to boost priority.
                  </span>
                ) : evaluation.highestEligibleStage === 2 ? (
                  <span>
                    ✉️ <b>Stage 2 (Automated Reminder Unlocked):</b> Initial {report.sla_hours}h deadline missed ({evaluation.elapsedLabel}). Dispatch a formal, courteous reminder email directly to {report.department}.
                  </span>
                ) : evaluation.highestEligibleStage === 3 ? (
                  <span>
                    🚨 <b>Stage 3 (Senior Officer Escalation):</b> Department delay exceeds escalation threshold. Escalate directly to the Ward Officer or Municipal Commissioner.
                  </span>
                ) : evaluation.highestEligibleStage === 4 ? (
                  <span>
                    📢 <b>Stage 4 (Public Social Tagging):</b> 14 continuous days without resolution ({evaluation.elapsedDays} days). Prepare a factual public awareness post tagging verified municipal handles.
                  </span>
                ) : evaluation.highestEligibleStage === 5 ? (
                  <span>
                    📜 <b>Stage 5 (RTI Application Engine):</b> Unresolved for 21+ days. Prepare a statutory Section 6(1) RTI inquiry for contractor tenders, DLP, and repair budgets.
                  </span>
                ) : (
                  <span>
                    ⚖️ <b>Stage 6 (Legal Notice via Partners):</b> RTI submission recorded and 30-day statutory response window elapsed. Eligible for pro bono advocate review under Section 80 CPC.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Photo Evidence Gallery & Verified Remediated Proof */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Citizen Photographic Evidence ({allEvidencePhotos.length} photo{allEvidencePhotos.length > 1 ? 's' : ''})
                </span>
              </span>
              {allEvidencePhotos.length > 1 && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Showing Photo {activePhotoIdx + 1} of {allEvidencePhotos.length} &bull; Click to inspect
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Active Evidence Photo Container */}
              {currentPhoto ? (
                <div className="space-y-2">
                  <div
                    className="h-60 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-sm"
                    onClick={() => setZoomedPhotoUrl(currentPhoto)}
                  >
                    {!photoErrors[activePhotoIdx] ? (
                      <img
                        src={currentPhoto}
                        alt={`Civic evidence photo ${activePhotoIdx + 1} for ${report.title}`}
                        onError={() => setPhotoErrors((prev) => ({ ...prev, [activePhotoIdx]: true }))}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-semibold">Photo currently unavailable</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Geotag badge */}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>
                        {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
                      </span>
                    </div>

                    {/* Maximize Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedPhotoUrl(currentPhoto);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer"
                      title="Inspect full resolution"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Multi-Photo Thumbnail Bar */}
                  {allEvidencePhotos.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {allEvidencePhotos.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePhotoIdx(i)}
                          className={`relative h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                            activePhotoIdx === i
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                            Photo #{i + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-60 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-sm">
                  No photographic evidence attached
                </div>
              )}

              {/* Resolved Photo (if resolved) or AI Authenticity Badge */}
              {report.status === 'Resolved' && report.resolved_proof_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Municipal Remediated Proof</span>
                    </span>
                  </div>
                  <div
                    className="h-60 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 border border-emerald-300 dark:border-emerald-800 relative group cursor-pointer shadow-sm"
                    onClick={() => setZoomedPhotoUrl(report.resolved_proof_url || null)}
                  >
                    <img
                      src={report.resolved_proof_url}
                      alt="Verified Municipal Remediated Proof"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                      ✓ Remediated on Site
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Multi-Photo Storage & Audit Status</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      All {allEvidencePhotos.length} attached photo evidence files are securely stored in Firebase Storage and synchronized with Cloud Firestore.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>Citizen Charter SLA:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{report.sla_hours}h</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>Authority Desk:</span>
                      <span className="truncate max-w-[170px]">{report.department}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>Photo Evidence:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{allEvidencePhotos.length} JPGs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & AI Triage Analysis (Priority 1, 2, 3) */}
          <div className="space-y-4">
            {/* Priority 1: Polished English Description & Citizen Original Input */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Grievance Report (Polished English)</span>
                  </h4>
                  {report.polished_description_en && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Standardized for Authorities
                    </span>
                  )}
                  {(report.gemmaModelUsed || report.englishTranslation) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-indigo-500/40 text-white shadow-xs">
                      <img src="/gemma-logo.svg" alt="Gemma 4" className="w-3 h-3 object-contain" />
                      <span className="text-indigo-300">Powered by Gemma 4</span>
                    </span>
                  )}
                </div>

                {report.original_description && report.original_description !== (report.polished_description_en || report.description) && (
                  <button
                    type="button"
                    onClick={() => setShowOriginalDesc(!showOriginalDesc)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showOriginalDesc ? 'Hide Citizen Raw Text' : 'View Citizen Raw Text'}</span>
                    {showOriginalDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Polished English description body */}
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {report.polished_description_en || report.description}
              </p>

              {/* Citizen Original Submission Expander */}
              {showOriginalDesc && report.original_description && (
                <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Original Citizen Submission (Pristine Audit Copy)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Preserved verbatim</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                    &ldquo;{report.original_description}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    Preserved for municipal audit, legal RTI accuracy, and citizen dispute resolution.
                  </p>
                </div>
              )}
            </div>

            {/* Priority 2: 0–100 Severity Assessment Card */}
            {(() => {
              const sevIndex = typeof report.severity_index === 'number'
                ? report.severity_index
                : Math.min(100, Math.round((report.severity_score || 5) * 10));
              const isCritical = sevIndex >= 75;
              const isHigh = sevIndex >= 50 && sevIndex < 75;
              const isModerate = sevIndex >= 25 && sevIndex < 50;

              const badgeColor = isCritical
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : isHigh
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : isModerate
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';

              const barFillColor = isCritical
                ? 'bg-rose-500'
                : isHigh
                ? 'bg-orange-500'
                : isModerate
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Public Impact &amp; Severity Assessment</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.severity_confidence !== undefined && (
                        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {Math.round(report.severity_confidence * 100)}% Confidence
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeColor}`}>
                        {report.severity_label || (isCritical ? 'Critical' : isHigh ? 'High' : isModerate ? 'Moderate' : 'Low')} ({sevIndex}/100)
                      </span>
                    </div>
                  </div>

                  {/* 0-100 Gauge Bar */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                        style={{ width: `${Math.max(4, Math.min(100, sevIndex))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0 Low</span>
                      <span>25 Moderate</span>
                      <span>50 High</span>
                      <span>75 Critical</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Severity Factor Explanation */}
                  {report.severity_explanation && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
                      💡 <b>Factor Analysis:</b> {report.severity_explanation}
                    </p>
                  )}

                  {report.is_insufficient_info && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Description contained limited detail; severity treated as preliminary triage estimate.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Priority 3: Category Decision & Routing Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category &amp; Precedence</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span>{cat.icon}</span>
                  <span>{getCategoryLabel(report.category, cat.label)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                    Authoritative
                  </span>
                </div>
                {report.manual_category && report.ai_detected_category && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    Citizen manual selection (<span className="font-semibold text-slate-700 dark:text-slate-300">{report.manual_category}</span>)
                    {report.manual_category !== report.ai_detected_category
                      ? ` prioritized over AI (${report.ai_detected_category}).`
                      : ' confirmed by AI assessment.'}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Assigned Authority Desk
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  🏢 {report.department}
                </span>
                <span className="text-slate-500 text-[11px] block">
                  Location: 📍 {report.address || report.location_name} (Ward: {report.ward || 'Central'})
                </span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Permanent Audit Timeline
            </h4>
            <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
              {report.timeline.map((event, idx) => (
                <div key={idx} className="relative text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {event.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(event.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{event.note}</p>
                  {event.officer && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                      Officer: {event.officer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer with Stage Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Upvote button & Retract */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpvote(report.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                report.hasUpvoted
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${report.hasUpvoted ? 'fill-white' : ''}`} />
              <span>{report.hasUpvoted ? 'Upvoted' : 'Support Issue'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-xs">
                {report.upvotes}
              </span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-xs"
                title="Permanently Retract Grievance and Delete Stored Evidence"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Report</span>
              </button>
            )}
          </div>

          {/* Right: Stage-Eligible CTAs following the Six-Stage Escalation Ladder */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage 2 Reminder Button */}
            {evaluation.isReminderEligible && onOpenReminder && (
              <button
                type="button"
                onClick={() => onOpenReminder(report)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer"
                title="Stage 2: Dispatch polite formal reminder to department"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reminder</span>
              </button>
            )}

            {/* Stage 3 Escalation Button */}
            {evaluation.isEscalationEligible && onOpenEscalation && (
              <button
                type="button"
                onClick={() => onOpenEscalation(report)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
                title="Stage 3: Executive memorandum to Ward Officer or Commissioner"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>
            )}

            {/* Stage 4 Social Tagging Button (Day 14+) */}
            {evaluation.isSocialTaggingEligible && onOpenSocialTagging && (
              <button
                type="button"
                onClick={() => onOpenSocialTagging(report)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all cursor-pointer"
                title="Stage 4: Factual public awareness post on civic channels"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Tag</span>
              </button>
            )}

            {/* Stage 5 RTI Engine Button (Day 21+) */}
            {evaluation.isRtiEligible && onOpenRti && (
              <button
                type="button"
                onClick={() => onOpenRti(report)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                title="Stage 5: Statutory Section 6(1) RTI inquiry draft"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Draft RTI</span>
              </button>
            )}

            {/* Stage 6 Legal Notice Button */}
            {onOpenLegalCounsel && (
              <button
                type="button"
                onClick={() => onOpenLegalCounsel(report)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  evaluation.isLegalNoticeEligible
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white ring-2 ring-purple-400/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
                title={
                  evaluation.isLegalNoticeEligible
                    ? 'Stage 6: Engage pro bono legal counsel'
                    : `Stage 6 Locked: ${evaluation.legalNoticeLockReasons[0] || 'Requires RTI submission + 30 days'}`
                }
              >
                {evaluation.isLegalNoticeEligible ? (
                  <Scale className="w-3.5 h-3.5 text-purple-200" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{evaluation.isLegalNoticeEligible ? 'Legal Panel' : 'Legal (Locked)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Fullscreen Lightbox Zoom Modal */}
        {zoomedPhotoUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setZoomedPhotoUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3.5 bg-black/50 flex items-center justify-between text-white text-xs border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>High-Resolution Photographic Evidence &bull; Ticket #{report.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedPhotoUrl(null)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center overflow-auto max-h-[80vh]">
                <img
                  src={zoomedPhotoUrl}
                  alt="High-resolution evidence"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            report={report}
            onClose={() => setShowDeleteModal(false)}
            onConfirmDelete={async (rep) => {
              await onDeleteReport(rep.id);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
