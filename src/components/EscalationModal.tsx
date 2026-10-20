import React, { useState, useEffect } from 'react';
import { CivicReport } from '../types';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  ShieldAlert,
  Send,
  Building,
  UserCheck,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { evaluateReportEscalation } from '../utils/escalationLadder';

interface EscalationModalProps {
  report: CivicReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEscalationRecorded?: (reportId: string, details: { officerType: string; date: string }) => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  report,
  isOpen,
  onClose,
  onEscalationRecorded,
}) => {
  const [officerType, setOfficerType] = useState<'ward_officer' | 'commissioner'>('ward_officer');
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isFiledRecorded, setIsFiledRecorded] = useState(false);

  useEffect(() => {
    if (report && isOpen) {
      fetchEscalation();
    }
  }, [report, isOpen, officerType]);

  if (!isOpen || !report) return null;

  const evaluation = evaluateReportEscalation(report);

  const fetchEscalation = async () => {
    if (!report) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, officerType }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
      } else {
        // Fallback draft template
        setLetter(generateFallbackEscalation(report, officerType, evaluation.elapsedLabel));
      }
    } catch {
      setLetter(generateFallbackEscalation(report, officerType, evaluation.elapsedLabel));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([letter], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Escalation-Memorandum-${report.id}-${officerType}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordDispatch = () => {
    setIsFiledRecorded(true);
    if (onEscalationRecorded) {
      onEscalationRecorded(report.id, {
        officerType,
        date: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Senior Officer Escalation
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  Stage 3 of 6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formal administrative escalation memorandum for Complaint #{report.id}
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

        {/* Recipient Hierarchy Selector Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">
            Escalation Level:
          </span>
          <button
            onClick={() => setOfficerType('ward_officer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              officerType === 'ward_officer'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. Ward Officer / Zonal Executive Engineer</span>
          </button>
          <button
            onClick={() => setOfficerType('commissioner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              officerType === 'commissioner'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Municipal Commissioner / District Magistrate</span>
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Alert Note */}
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
            <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Escalation Threshold Reached:</span> Grievance has been
              pending for <b>{evaluation.elapsedLabel}</b>. Under Stage 3 of Nagrik One, citizens can
              generate an executive memorandum holding senior administrative officers directly accountable.
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Generating Executive Escalation Memorandum...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Drafting statutory citations and site defect audit points.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all shadow-inner">
              {letter}
            </div>
          )}

          {isFiledRecorded && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 border border-emerald-200 dark:border-emerald-900 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Escalation dispatch recorded in local audit log for {officerType.replace('_', ' ')}.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Official citizen draft &bull; Citizen must dispatch via Speed Post or official portal
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Draft'}</span>
            </button>
            <button
              onClick={handleRecordDispatch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Record Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateFallbackEscalation(
  report: CivicReport,
  officerType: 'ward_officer' | 'commissioner',
  elapsedLabel: string
): string {
  const addressee =
    officerType === 'ward_officer'
      ? `The Ward Officer / Executive Engineer\nWard ${report.ward || 'Central'}, ${report.department}\nGovernment of NCT of Delhi / Municipal Corporation`
      : `The Municipal Commissioner / District Magistrate\nMunicipal Corporation of Delhi / DM Office\nCivic Centre, New Delhi`;

  return `FORMAL ADMINISTRATIVE ESCALATION MEMORANDUM
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

TO:
${addressee}

SUBJECT: URGENT CITIZEN ESCALATION — UNRESOLVED CIVIC DEFECT #${report.id} (${report.category.toUpperCase()})
Citizen Charter Turnaround Exceeded: ${elapsedLabel}

Respected Sir/Madam,

This memorandum is served to invoke administrative accountability regarding persistent unresolved civic defect #${report.id}.

1. INCIDENT & SUBMISSION DETAILS:
- Grievance ID: #${report.id}
- Category: ${report.category.replace('_', ' ').toUpperCase()}
- Location: ${report.address || report.location_name} (GPS: ${report.latitude.toFixed(5)}°N, ${report.longitude.toFixed(5)}°E)
- Assigned Department: ${report.department}
- Statutory SLA: ${report.sla_hours} Hours
- Current Delay: ${elapsedLabel} past initial filing

2. DEFECT SUMMARY:
"${report.description}"

3. ADMINISTRATIVE GROUNDS FOR ESCALATION:
Despite the initial complaint and formal notification, the field maintenance crew has failed to rectify this hazard within statutory Citizen Charter timelines. The defect continues to pose tangible safety hazards to pedestrians, commuters, and local residents.

4. DEMAND FOR IMMEDIATE ACTION:
The competent administrative authority is hereby requested to:
a) Conduct an immediate physical on-site inspection within 48 hours.
b) Sanction an emergency work order or deploy the contractor bound by the Defect Liability Period (DLP).
c) Provide written confirmation and photographic remediation proof on the public portal.

Failing timely action, this matter will be escalated to statutory inquiry under Section 6(1) of the Right to Information Act 2005.

Yours sincerely,
Citizen Representative
Nagrik One Accountability & Citizen Grievance Portal
Complaint Reference: #${report.id}`;
}
