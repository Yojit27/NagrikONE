import React, { useState } from 'react';
import { CivicReport } from '../types';
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  AlertCircle,
  Building,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { evaluateReportEscalation } from '../utils/escalationLadder';

interface ReminderModalProps {
  report: CivicReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReminderRecorded?: (reportId: string, details: { deliveryStatus: 'sent' | 'draft_copied'; date: string }) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  report,
  isOpen,
  onClose,
  onReminderRecorded,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const evaluation = evaluateReportEscalation(report);

  // Department contact routing
  const departmentEmail = (() => {
    const dept = (report.department || '').toLowerCase();
    if (dept.includes('pwd') || dept.includes('public works')) return 'grievance.pwd@delhi.gov.in';
    if (dept.includes('jal') || dept.includes('water')) return 'controlroom.djb@delhi.gov.in';
    if (dept.includes('traffic') || dept.includes('police')) return 'traffic.helpline@delhipolice.gov.in';
    if (dept.includes('discom') || dept.includes('power') || dept.includes('electric')) return 'customercare@bsesdelhi.com';
    return 'commissioner.mcd@mcd.nic.in';
  })();

  const subject = `[Formal Reminder] Unresolved Civic Grievance #${report.id} - Exceeded Citizen Charter SLA`;
  const emailBody = `To,
The Designated Grievance Officer,
${report.department}
Government of NCT of Delhi / Municipal Corporation

Subject: Formal Reminder regarding Civic Grievance #${report.id} (SLA Exceeded)

Respected Sir/Madam,

I am writing to bring your urgent attention to civic grievance #${report.id}, submitted through the Nagrik One Citizen Accountability Portal on ${new Date(
    report.createdAt
  ).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} at ${new Date(report.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.

The statutory Citizen Charter Service Level Agreement (SLA) for this category (${report.sla_hours} hours) has elapsed without resolution. The issue has now been pending for ${evaluation.elapsedLabel}.

Grievance Details:
- Ticket Reference: #${report.id}
- Issue Category: ${report.category.replace('_', ' ').toUpperCase()}
- Priority / Hazard Level: ${report.priority.toUpperCase()} (${report.severity_label})
- Location / Landmark: ${report.address || report.location_name} (Ward: ${report.ward || 'Central'})
- GPS Coordinates: ${report.latitude.toFixed(5)}°N, ${report.longitude.toFixed(5)}°E
- Summary: ${report.description}

As this hazard continues to inconvenience citizens and present public safety concerns, we respectfully request the competent authority to inspect the site and expedite remediation.

Please acknowledge receipt of this reminder and update the complaint status in the public municipal audit trail.

Thank you.

Yours faithfully,
Citizen Representative
Nagrik One Public Redressal & Accountability Platform
Portal Ref: #${report.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${departmentEmail}\nSubject: ${subject}\n\n${emailBody}`);
    setCopied(true);
    if (onReminderRecorded) {
      onReminderRecorded(report.id, {
        deliveryStatus: 'draft_copied',
        date: new Date().toISOString(),
      });
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${departmentEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    if (onReminderRecorded) {
      onReminderRecorded(report.id, {
        deliveryStatus: 'draft_copied',
        date: new Date().toISOString(),
      });
    }
  };

  // Attempt server-side automated dispatch if gateway configured
  const handleAttemptSend = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/reminder/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          recipientEmail: departmentEmail,
          subject,
          body: emailBody,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(true);
        if (onReminderRecorded) {
          onReminderRecorded(report.id, {
            deliveryStatus: 'sent',
            date: new Date().toISOString(),
          });
        }
      } else {
        // Honest messaging: Gateway not configured for direct outbound SMTP
        setSendError(
          data.message ||
            'Direct government gateway dispatch is unavailable in this environment. Please copy the draft or use your email client below to send directly.'
        );
      }
    } catch {
      setSendError(
        'Direct automated mail server is not configured. Please use "Copy Reminder Draft" or "Open in Email App" to dispatch directly.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Automated Reminder to Department
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Stage 2 of 6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Polite formal reminder for Complaint #{report.id} after Citizen Charter SLA deadline
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
          {/* Status Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                Initial Response Deadline Passed: {report.sla_hours}h Charter SLA
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                This grievance has been open for <b>{evaluation.elapsedLabel}</b> without remediation. Under Stage 2, citizens issue a courteous reminder directly to the department to initiate prompt action before senior officer escalation.
              </p>
            </div>
          </div>

          {/* Department Destination Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Recipient:</span>
              <span className="font-bold text-slate-900 dark:text-white">{report.department}</span>
            </div>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              {departmentEmail}
            </span>
          </div>

          {/* Error / Fallback Explanation */}
          {sendError && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{sendError}</span>
              </div>
            </div>
          )}

          {sendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/50 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Reminder email successfully transmitted to {departmentEmail}.</span>
            </div>
          )}

          {/* Email Preview Container */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Formal Reminder Draft</span>
              <span className="text-[10px] text-slate-400 font-normal">Review before sending</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-all max-h-60 overflow-y-auto shadow-inner">
              {emailBody}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {evaluation.isReminderSent ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Recorded as sent on {new Date(evaluation.reminderSentAt || '').toLocaleDateString()}
              </span>
            ) : (
              'Action records reminder timestamp in public audit log'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenMailto}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Email App</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Reminder Draft'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
