import React from 'react';
import { CitizenProfile, CivicReport } from '../types';
import { X } from 'lucide-react';
import { ProfileView } from './ProfileView';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CitizenProfile;
  reports: CivicReport[];
  onResetData: () => void;
  onSelectReport: (reportId: string) => void;
  onVerifyCitizen?: (citizenId: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onUpdateProfile?: (updated: Partial<CitizenProfile>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  reports,
  onResetData,
  onSelectReport,
  onVerifyCitizen,
  onOpenAuth,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-20 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/95 dark:bg-[#0f131c]/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">account_circle</span>
            </div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Civic Profile &amp; Sentinel Settings
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#262a34] hover:bg-slate-200 dark:hover:bg-[#31353f] flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Profile Content */}
        <div className="overflow-y-auto flex-1 pt-4">
          <ProfileView
            profile={profile}
            reports={reports}
            onOpenReportDetail={(rep) => {
              onClose();
              onSelectReport(rep.id);
            }}
            onOpenAuth={onOpenAuth}
            onUpdateProfile={onUpdateProfile}
          />
        </div>
      </div>
    </div>
  );
};
