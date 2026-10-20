import React, { useState } from 'react';
import { CivicReport } from '../types';
import { getCategoryById } from '../data/categories';
import { Trash2, AlertTriangle, RefreshCw, X, ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  report: CivicReport | null;
  onClose: () => void;
  onConfirmDelete: (report: CivicReport) => Promise<void>;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  report,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const cat = getCategoryById(report.category);
  const photoCount =
    report.storagePaths?.length ||
    (report.images && report.images.length) ||
    (report.imageUrl ? 1 : 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirmDelete(report);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMessage(
        err?.message || 'Failed to delete report from Cloud Firestore. Please check your permissions and connection.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Retract Civic Grievance
              </h3>
              <p className="text-xs text-slate-500 font-mono">Ticket #{report.id}</p>
            </div>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {cat.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {report.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {report.department} &bull; {report.address || report.location_name}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Are you sure you want to permanently retract and delete grievance{' '}
              <strong className="text-slate-900 dark:text-white font-mono">#{report.id}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-amber-800 dark:text-amber-200 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Permanent Actions on Confirmation:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300">
                <li>Permanently removes this record from Cloud Firestore</li>
                {photoCount > 0 ? (
                  <li>
                    Deletes all <strong>{photoCount} attached evidence photo(s)</strong> from Firebase Storage
                  </li>
                ) : (
                  <li>Cleans up any related storage pointers</li>
                )}
                <li>Halts all 6-stage municipal escalation & reminder audits</li>
              </ul>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Deletion Error</p>
                <p className="text-[11px] mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {isDeleting && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <RefreshCw className="w-4 h-4 text-rose-600 animate-spin shrink-0" />
              <span>Deleting evidence files from Firebase Storage & Firestore document...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isDeleting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
