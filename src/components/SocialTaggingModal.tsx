import React, { useState } from 'react';
import { CivicReport } from '../types';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building,
  AlertTriangle,
  Send,
  Eye,
  Info,
} from 'lucide-react';
import { evaluateReportEscalation } from '../utils/escalationLadder';

interface SocialTaggingModalProps {
  report: CivicReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSocialPostRecorded?: (reportId: string, details: { content: string; date: string }) => void;
}

export const SocialTaggingModal: React.FC<SocialTaggingModalProps> = ({
  report,
  isOpen,
  onClose,
  onSocialPostRecorded,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const evaluation = evaluateReportEscalation(report);

  // Verified department official handles for Delhi / Municipal governance
  const departmentHandle = (() => {
    const dept = (report.department || '').toLowerCase();
    if (dept.includes('pwd') || dept.includes('public works')) return '@PWD_Delhi';
    if (dept.includes('jal') || dept.includes('water')) return '@DelhiJalBoard';
    if (dept.includes('traffic') || dept.includes('police')) return '@DelhiTrafficPol';
    if (dept.includes('discom') || dept.includes('power')) return '@BSESDelhi';
    return '@MCD_Delhi';
  })();

  // Default factual public awareness post text (privacy safe - no phone numbers or personal names)
  const defaultText = `⚠️ Public Civic Hazard Alert (#${report.id})
Category: ${report.category.replace('_', ' ').toUpperCase()}
Location: ${report.location_name || report.address} (${report.ward || 'Central Ward'})
Status: Unresolved (${evaluation.elapsedDays} days since report on ${new Date(report.createdAt).toLocaleDateString()})

Grievance details: "${report.title.slice(0, 100)}${report.title.length > 100 ? '...' : ''}"
Charter SLA of ${report.sla_hours}h has been exceeded. Requesting urgent on-site remediation.

cc: ${departmentHandle} @LtGovDelhi #NagrikOne #DelhiCivic #CitizenAccountability`;

  const [postText, setPostText] = useState(defaultText);

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    if (onSocialPostRecorded) {
      onSocialPostRecorded(report.id, {
        content: postText,
        date: new Date().toISOString(),
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    if (onSocialPostRecorded) {
      onSocialPostRecorded(report.id, {
        content: postText,
        date: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Public Social Tagging
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                  Stage 4 of 6 &bull; Day 14+
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Factual public awareness for unresolved Complaint #{report.id} ({evaluation.elapsedDays} days pending)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Eligibility Information Banner */}
          <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/50 flex items-start gap-3 text-xs text-cyan-900 dark:text-cyan-200">
            <Calendar className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                Stage 4 Eligibility: {evaluation.elapsedDays} Days Since Original Submission
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                When an issue remains unaddressed for more than 14 days, public visibility drives accountability. You can review, customize, and share this factual notice tagging the verified department handle.
              </p>
            </div>
          </div>

          {/* Privacy & Safeguard Policy Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Ethical Safeguards & Privacy:
              </span>
              <p className="text-[11px] leading-relaxed">
                This post contains only public geotagged facts. No personal phone numbers, emails, or defamatory language are included. You remain in complete control and must manually review before sharing.
              </p>
            </div>
          </div>

          {/* Verified Department Handles */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Verified Public Authority:
            </span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              {departmentHandle} ({report.department})
            </span>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Public Awareness Post Content (Editable)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {postText.length} characters
              </span>
            </div>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={7}
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Never auto-published. Always requires citizen action.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleShareToTwitter}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Share to X (Twitter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
