import React from 'react';
import { CivicBadge, CitizenProfile } from '../types';
import {
  ShieldAlert,
  Award,
  Camera,
  ThumbsUp,
  MapPin,
  Trophy,
  FileText,
  Sparkles,
  Lock,
  CheckCircle2,
  TrendingUp,
  Flame,
  Star,
  Scale,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgesViewProps {
  badges: CivicBadge[];
  profile: CitizenProfile;
  onOpenReportModal: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ShieldAlert: <ShieldAlert className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
  ThumbsUp: <ThumbsUp className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  Trophy: <Trophy className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Scale: <Scale className="w-6 h-6" />,
};

export const BadgesView: React.FC<BadgesViewProps> = ({
  badges,
  profile,
  onOpenReportModal,
}) => {
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const progressPercent = Math.round((unlockedCount / badges.length) * 100);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Citizen Karma Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white overflow-hidden shadow-2xl border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Civic Sentinel Status
              </span>
              <span className="text-xs text-slate-400">Ward {profile.ward}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile.levelTitle}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Every verified civic report and community upvote builds transparent local governance.
              Complete missions to level up your municipal sentinel score.
            </p>
          </div>

          {/* Karma Score Card */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                {profile.karmaPoints}
              </div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Karma Points
              </div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                {unlockedCount}/{badges.length}
              </div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Badges Earned
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Level Progression: {progressPercent}% to next Sentinel Tier
            </span>
            <span className="text-emerald-400 font-bold">{unlockedCount} of {badges.length} completed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Civic Achievement Badges
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Honoring citizens who take action to improve neighborhood infrastructure
            </p>
          </div>
          <button
            onClick={triggerConfetti}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Celebrate Badges ✨
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <div
                key={badge.id}
                className={`relative rounded-3xl p-5 border transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-emerald-400/60 dark:border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-85'
                }`}
              >
                {/* Top Icon & Status Pill */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ICON_MAP[badge.icon] || <ShieldAlert className="w-6 h-6" />}
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300/40">
                      <CheckCircle2 className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                      <Lock className="w-3 h-3" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Badge Details */}
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 min-h-[38px]">
                  {badge.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span>Progress</span>
                    <span className="font-mono">
                      {badge.currentValue} / {badge.target} {badge.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, badge.progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Karma Scoring Breakdown */}
      <div className="rounded-3xl p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          How to Earn Civic Karma Points:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-emerald-600 font-extrabold text-lg">+50 pts</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Verified Report
            </div>
            <div className="text-[10px] text-slate-500">File an issue with GPS & photo</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-blue-600 font-extrabold text-lg">+10 pts</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Community Upvote
            </div>
            <div className="text-[10px] text-slate-500">Support nearby neighbors</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-amber-600 font-extrabold text-lg">+150 pts</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              RTI Notice
            </div>
            <div className="text-[10px] text-slate-500">Draft legal query on SLA delay</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-purple-600 font-extrabold text-lg">+100 pts</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Verified Resolution
            </div>
            <div className="text-[10px] text-slate-500">Issue cleared by department</div>
          </div>
        </div>
      </div>
    </div>
  );
};
