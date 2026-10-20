import React, { useState, useEffect } from 'react';
import { CivicReport } from '../types';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  Scale,
  RefreshCw,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { evaluateReportEscalation } from '../utils/escalationLadder';

interface RtiGeneratorModalProps {
  report: CivicReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRtiDrafted?: () => void;
  onRtiSubmissionRecorded?: (
    reportId: string,
    submissionData: {
      submittedAt: string;
      referenceNumber: string;
      submissionType: 'citizen_confirmed' | 'independently_verified';
      evidenceNotes: string;
    }
  ) => void;
  onRtiResponseRecorded?: (
    reportId: string,
    responseData: {
      responseReceived: boolean;
      responseReceivedAt?: string;
      responseStatus: 'no_response' | 'adequate' | 'inadequate';
      notes?: string;
    }
  ) => void;
}

export const RtiGeneratorModal: React.FC<RtiGeneratorModalProps> = ({
  report,
  isOpen,
  onClose,
  onRtiDrafted,
  onRtiSubmissionRecorded,
  onRtiResponseRecorded,
}) => {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'draft' | 'record_submission' | 'record_response'>('draft');

  // Submission Form State
  const [subDate, setSubDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [ackNumber, setAckNumber] = useState<string>('');
  const [submissionEvidence, setSubmissionEvidence] = useState<string>('');
  const [confirmCertified, setConfirmCertified] = useState<boolean>(false);
  const [submittedSaved, setSubmittedSaved] = useState<boolean>(false);

  // Response Form State
  const [responseStatus, setResponseStatus] = useState<'no_response' | 'adequate' | 'inadequate'>(
    'no_response'
  );
  const [responseDate, setResponseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [responseNotes, setResponseNotes] = useState<string>('');
  const [responseSaved, setResponseSaved] = useState<boolean>(false);

  useEffect(() => {
    if (report && isOpen) {
      fetchRtiDraft();
      if (report.escalationLadder?.rtiSubmitted) {
        setSubmittedSaved(true);
        if (report.escalationLadder.rtiSubmittedAt) {
          setSubDate(report.escalationLadder.rtiSubmittedAt.split('T')[0]);
        }
        if (report.escalationLadder.rtiReferenceNumber) {
          setAckNumber(report.escalationLadder.rtiReferenceNumber);
        }
      }
      if (report.escalationLadder?.rtiResponseStatus) {
        setResponseStatus(report.escalationLadder.rtiResponseStatus);
      }
    }
  }, [report, isOpen]);

  if (!isOpen || !report) return null;

  const evaluation = evaluateReportEscalation(report);

  const fetchRtiDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/rti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraft(data.draft);
        if (onRtiDrafted) {
          onRtiDrafted();
        }
      } else {
        setDraft(generateFallbackRti(report, evaluation.elapsedDays));
      }
    } catch {
      setDraft(generateFallbackRti(report, evaluation.elapsedDays));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const element = document.createElement('a');
    const file = new Blob([draft], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `RTI-Draft-${report.id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackNumber.trim()) {
      alert('Please enter your RTI registration / acknowledgement reference number.');
      return;
    }
    if (!confirmCertified) {
      alert('Please confirm that this application has been submitted on the official RTI portal or via Speed Post.');
      return;
    }

    if (onRtiSubmissionRecorded) {
      onRtiSubmissionRecorded(report.id, {
        submittedAt: new Date(subDate).toISOString(),
        referenceNumber: ackNumber.trim(),
        submissionType: 'citizen_confirmed',
        evidenceNotes: submissionEvidence,
      });
    }
    setSubmittedSaved(true);
    setActiveTab('draft');
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRtiResponseRecorded) {
      onRtiResponseRecorded(report.id, {
        responseReceived: responseStatus !== 'no_response',
        responseReceivedAt: responseStatus !== 'no_response' ? new Date(responseDate).toISOString() : undefined,
        responseStatus,
        notes: responseNotes,
      });
    }
    setResponseSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Right to Information (RTI) Application Engine
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Stage 5 of 6 &bull; Day 21+
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory Section 6(1) inquiry draft for Complaint #{report.id} ({evaluation.elapsedDays} days unresolved)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRtiDraft}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Regenerate Draft"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'draft'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            1. RTI Questionnaire Draft
          </button>
          <button
            onClick={() => setActiveTab('record_submission')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'record_submission'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>2. Record Actual Submission</span>
            {evaluation.isRtiSubmitted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('record_response')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'record_response'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>3. Log RTI Response</span>
            {evaluation.rtiResponseStatus !== 'no_response' && (
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'draft' && (
            <>
              {/* Prominent Legal Disclaimer Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    Important Notice: This Document is an RTI Draft, Not a Submitted Application
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Under the Right to Information Act 2005, RTIs are framed as a <b>statutory request for information and records</b> (contractor tenders, repair budgets, and cause of delay) from the Public Information Officer (PIO). The RTI authority does not directly execute repairs. You must submit this draft on the official state/central RTI portal (fee: ₹10) or via Registered Speed Post.
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Submission Status:</span>
                  <span className={`font-bold ${evaluation.isRtiSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {evaluation.isRtiSubmitted
                      ? `Submitted on ${new Date(evaluation.rtiSubmittedAt || '').toLocaleDateString()} (${evaluation.rtiSubmissionType === 'citizen_confirmed' ? 'Citizen-Reported' : 'Independently Verified'})`
                      : 'Draft Only (Not Yet Submitted)'}
                  </span>
                </div>
                <a
                  href="https://rtionline.delhi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>Official RTI Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Formulating Section 6(1) RTI Questionnaire...
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Extracting contractor tender clauses, Defect Liability Periods, and budgetary questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Draft Document (Review &amp; Edit)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Section 6(1) Form</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all shadow-inner max-h-72 overflow-y-auto">
                    {draft}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'record_submission' && (
            <form onSubmit={handleSaveSubmission} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1.5 text-xs text-blue-950 dark:text-blue-200">
                <h4 className="font-bold text-sm">Record Official RTI Submission</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Entering your submission details initiates the <b>30-day statutory response clock</b> under Section 7(1) of the RTI Act 2005. Stage 6 (Legal notice via partners) unlocks only after this 30-day window elapses without adequate response.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Actual Date of Submission *
                  </label>
                  <input
                    type="date"
                    required
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Portal Registration / ACK Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCDEL/R/2026/00192 or Speed Post #ED...IN"
                    value={ackNumber}
                    onChange={(e) => setAckNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Submission Notes / Portal Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Submitted online via Delhi RTI Portal to PIO, PWD Maintenance Division II with statutory fee receipt #..."
                  value={submissionEvidence}
                  onChange={(e) => setSubmissionEvidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={confirmCertified}
                  onChange={(e) => setConfirmCertified(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I confirm that I have genuinely filed this application on the official RTI portal or via Speed Post and have entered my genuine acknowledgement receipt. This record will be labelled as <b>Citizen Confirmed</b>.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save RTI Submission Record</span>
              </button>
            </form>
          )}

          {activeTab === 'record_response' && (
            <form onSubmit={handleSaveResponse} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 space-y-1.5 text-xs text-purple-950 dark:text-purple-200">
                <h4 className="font-bold text-sm">Record RTI Response from Authority</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  If the department sends a response, log it here. If the response is inadequate or false, you can proceed to Stage 6 for legal guidance or an RTI First Appeal. If the response remediates the grievance, escalation pauses.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Response Outcome:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResponseStatus('no_response')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      responseStatus === 'no_response'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/40'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    1. No Response Received
                    <span className="block font-normal text-[10px] text-slate-500 mt-0.5">
                      30-day statutory timeline expired
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseStatus('inadequate')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      responseStatus === 'inadequate'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/40'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    2. Inadequate / Misleading
                    <span className="block font-normal text-[10px] text-slate-500 mt-0.5">
                      Vague response, false completion claim
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseStatus('adequate')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      responseStatus === 'adequate'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/40'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    3. Adequate Response
                    <span className="block font-normal text-[10px] text-slate-500 mt-0.5">
                      Information provided; work scheduled
                    </span>
                  </button>
                </div>
              </div>

              {responseStatus !== 'no_response' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Date Response Received
                  </label>
                  <input
                    type="date"
                    value={responseDate}
                    onChange={(e) => setResponseDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Officer Remarks / Letter Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of response letter from PIO, document dispatch numbers, or reasons given..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save RTI Response Status</span>
              </button>

              {responseSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-800 text-center">
                  RTI response record updated successfully.
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Compliant with Section 6(1) &amp; Section 7(1) Right to Information Act 2005
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy RTI Draft'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateFallbackRti(report: CivicReport, elapsedDays: number): string {
  return `FORM 'A'
FORMAT OF APPLICATION FOR OBTAINING INFORMATION UNDER THE RIGHT TO INFORMATION ACT, 2005
[Section 6(1) of the RTI Act 2005]

To,
The Central Public Information Officer (CPIO) / State PIO,
${report.department}
Government of NCT of Delhi / Municipal Corporation
Delhi, India

1. Full Name of the Applicant: Citizen Representative
2. Address for Correspondence: Available on Citizen Profile / Geotagged Ward
3. Particulars of Information Required:
   Subject Matter: Statutory investigation into unresolved civic hazard Complaint #${report.id} (${report.category.toUpperCase()})

4. Specific Information Requested:
   i. Certified copy of the official citizen grievance register entry for Complaint #${report.id} lodged on ${new Date(report.createdAt).toLocaleDateString('en-IN')}.
   ii. Certified copies of all site inspection notes, Junior Engineer (JE) reports, and measurement registers pertaining to location: "${report.address || report.location_name}".
   iii. Names, designations, and official contact numbers of the Junior Engineer (JE) and Executive Engineer (EE) assigned to Ward ${report.ward || 'Central'}.
   iv. Details of the private civil contractor responsible for this road/drainage stretch under the contract's Defect Liability Period (DLP). Please furnish the contract work order number and expiry date of the DLP.
   v. Total municipal maintenance budget allocated, sanctioned, and disbursed for this ward in Financial Year 2025-26, and reasons on record for non-rectification over ${elapsedDays} days.

5. Inspection of Records:
   The applicant reserves the right under Section 2(j)(i) of the RTI Act 2005 to physically inspect relevant Measurement Books (MB) and file movements.

6. Statutory Fee:
   Application fee of Rs. 10/- deposited via RTI Online Portal / Postal Order.

Declaration:
I hereby declare that I am a citizen of India and the information sought falls within the mandate of Section 6(1) of the RTI Act 2005.

Date: ${new Date().toLocaleDateString('en-IN')}
Place: Delhi NCR, India`;
}
