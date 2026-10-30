import React, { useState } from 'react';
import { CivicReport } from '../types';
import { CIVIC_CATEGORIES, getCategoryById } from '../data/categories';
import {
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  Clock,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ExternalLink,
  Plus,
  Flame,
  ArrowRight,
  Shield,
  Layers,
  Map,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { canUserDeleteReport } from '../services/reportFirebaseService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface FeedViewProps {
  reports: CivicReport[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenReportModal: () => void;
  onOpenReportDetail: (report: CivicReport) => void;
  onUpvoteReport: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => Promise<void> | void;
  onSelectOnMap: (reportId: string) => void;
  onSelectTab: (tab: string) => void;
}

/**
 * Robust image loader component with skeleton preview and graceful fallback
 */
const ReportCardImage: React.FC<{
  imageUrl?: string;
  title: string;
  categoryIcon: string;
  className?: string;
}> = ({ imageUrl, title, categoryIcon, className = 'w-full h-full' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 p-2 select-none ${className}`}>
        <span className="text-2xl">{categoryIcon}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <span className="text-xl opacity-30 select-none">{categoryIcon}</span>
        </div>
      )}
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const FeedView: React.FC<FeedViewProps> = ({
  reports,
  isLoading = false,
  error = null,
  onRetry,
  onOpenReportModal,
  onOpenReportDetail,
  onUpvoteReport,
  onDeleteReport,
  onSelectOnMap,
  onSelectTab,
}) => {
  const { user } = useAuth();
  const { t } = useLanguageTheme();
  const [deleteTargetReport, setDeleteTargetReport] = useState<CivicReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'upvotes' | 'severity' | 'newest'>('newest');

  const getCategoryLabel = (catId: string, fallback: string) => {
    const map: Record<string, string> = {
      road_pothole: 'catPothole',
      garbage_waste: 'catGarbage',
      streetlight: 'catStreetlight',
      water_drainage: 'catWater',
      traffic_parking: 'catTraffic',
      public_infrastructure: 'catInfrastructure',
      sanitation: 'catSanitation',
    };
    const key = map[catId];
    return key ? t(key, fallback) : fallback;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'Reported') return t('statusReported', 'Reported');
    if (status === 'In Review') return t('statusInReview', 'In Review');
    if (status === 'In Progress') return t('statusInProgress', 'In Progress');
    if (status === 'Resolved') return t('statusResolved', 'Resolved');
    return status;
  };

  // Filter & Sort Logic
  const filteredReports = reports.filter((r) => {
    const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'open'
        ? r.status === 'Reported' || r.status === 'In Review'
        : r.status === selectedStatus;
    const matchSearch =
      searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchStatus && matchSearch;
  });

  filteredReports.sort((a, b) => {
    if (sortBy === 'upvotes') {
      return b.upvotes - a.upvotes;
    } else if (sortBy === 'severity') {
      return b.severity_score - a.severity_score;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const openCount = reports.filter((r) => r.status === 'Reported' || r.status === 'In Review').length;

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return '1h';
    }
  };

  return (
    <div>
      {/* ========================================================
          MOBILE HOMEPAGE (Custom Authoritative Mobile Design)
          Strictly preserves the mobile hero, live status card,
          chips row, and incident feed.
          ======================================================== */}
      <div className="block lg:hidden flex flex-col w-full text-slate-900 dark:text-[#dfe2ef] pb-12">
        {/* 1. Mobile Hero: headline + one short line, no extra badges */}
        <section className="pt-1 pb-4">
          <h1 className="text-[26px] font-extrabold tracking-tight leading-[34px] text-slate-900 dark:text-white">
            Report civic hazards.<br />
            <span className="bg-gradient-to-r from-emerald-400 via-[#00e599] to-teal-400 bg-clip-text text-transparent">
              Track the fix.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#bacbbe] mt-1.5 leading-relaxed">
            Auto-located and routed to the right department.
          </p>

          {/* Main-focus actions: Report + Nearby */}
          <div className="flex flex-col gap-2.5 mt-4">
            <button
              onClick={onOpenReportModal}
              className="w-full h-14 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(0,229,153,0.35)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
              <span>{t('btnReportIssue', 'Report Civic Issue')}</span>
            </button>

            <button
              onClick={() => onSelectTab('map')}
              className="w-full h-12 px-6 rounded-full bg-slate-200 dark:bg-[#262a34] text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-400">explore</span>
              <span>{t('navMap', 'Explore Live Map')}</span>
              <span className="text-[11px] font-bold ml-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#0a0e17] text-emerald-600 dark:text-emerald-400 shadow-sm">
                {reports.length}
              </span>
            </button>
          </div>
        </section>

        {/* 2. One status card: ward stats + latest dispatch */}
        <section className="mt-1">
          <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 pt-3.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#bacbbe]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Ward 42 &bull; Live
              </span>
            </div>

            <div className="grid grid-cols-4 px-2 py-3 text-center border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xl font-extrabold text-rose-500">{openCount}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#bacbbe] mt-0.5">{t('filterOpen', 'Open')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#F59E0B]">{inProgressCount}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#bacbbe] mt-0.5">{t('statusInProgress', 'In progress')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-500">{resolvedCount}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#bacbbe] mt-0.5">{t('statusResolved', 'Resolved')}</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{reports.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#bacbbe] mt-0.5">{t('gridResolvedToday', 'This week')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-600 dark:text-[#bacbbe]">
              <span className="material-symbols-outlined text-[16px] text-emerald-500 flex-shrink-0">campaign</span>
              <span className="truncate">
                <span className="text-slate-900 dark:text-white font-bold">PWD:</span> Crew dispatched to Ring Road Pillar 142
              </span>
            </div>
          </div>
        </section>

        {/* 3. Feed header + chips */}
        <section className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nearby reports</h2>
            <button
              onClick={() => onSelectTab('map')}
              className="text-xs font-bold text-emerald-500 flex items-center hover:underline cursor-pointer"
            >
              <span>Open map</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Category Chips Scroll Row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-bold flex-shrink-0 active:scale-95 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-200 dark:bg-[#262a34] text-slate-700 dark:text-[#bacbbe]'
              }`}
            >
              <span>{t('filterAll', 'All')}</span>
              <span className="opacity-75 font-mono">({reports.length})</span>
            </button>

            {CIVIC_CATEGORIES.map((cat) => {
              const count = reports.filter((r) => r.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold flex-shrink-0 active:scale-95 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'bg-slate-200 dark:bg-[#262a34] text-slate-700 dark:text-[#bacbbe]'
                  }`}
                >
                  <span>{getCategoryLabel(cat.id, cat.label)}</span>
                  <span className="opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Mobile Feed List */}
        <section className="pt-3 pb-6 flex flex-col gap-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inbox</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No reports found</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting a different category or clear search</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const cat = getCategoryById(report.category);
              const isUserAuthor = canUserDeleteReport(report, user?.uid, user?.email);

              return (
                <article
                  key={report.id}
                  className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col gap-2.5 shadow-sm"
                >
                  <div
                    onClick={() => onOpenReportDetail(report)}
                    className="flex gap-3 cursor-pointer"
                  >
                    {/* Image Thumbnail */}
                    <ReportCardImage
                      imageUrl={report.imageUrl}
                      title={report.title}
                      categoryIcon={cat.icon}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-[#262a34]"
                    />

                    {/* Report Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            report.status === 'Resolved'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : report.status === 'In Progress'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                              : 'bg-[#06B6D4]/15 text-[#06B6D4]'
                          }`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatRelativeTime(report.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {report.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-[#bacbbe] line-clamp-1 mt-0.5">
                        {report.address || report.location_name || 'Ward 42 Zone'} &bull;{' '}
                        <span className="font-mono text-emerald-500">#{report.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Incident Card Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#bacbbe] truncate max-w-[170px]">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500 shrink-0">
                        {report.status === 'Resolved' ? 'verified' : 'engineering'}
                      </span>
                      <span className="truncate">{report.department || 'Municipal Action'}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Delete button if user is author */}
                      {isUserAuthor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetReport(report);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete report"
                          aria-label="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvoteReport(report.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                          report.hasUpvoted
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-100 dark:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef] hover:bg-slate-200 dark:hover:bg-[#31353f]'
                        }`}
                        aria-label="Upvote"
                      >
                        <span className="material-symbols-outlined text-[15px] text-emerald-500">thumb_up</span>
                        <span>{report.upvotes}</span>
                      </button>

                      {/* Comments Button */}
                      <button
                        type="button"
                        onClick={() => onOpenReportDetail(report)}
                        className="flex items-center gap-1 px-2.5 h-8 rounded-full text-slate-500 dark:text-[#bacbbe] hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                        aria-label="Comments"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                        <span>{report.commentsCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* ========================================================
          DESKTOP HOMEPAGE (Rich Governance & Command Dashboard)
          Preserves the desktop layout, filter controls, multi-column
          grid, and governance telemetry.
          ======================================================== */}
      <div className="hidden lg:block space-y-6">
        {/* Hero Governance Banner */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white overflow-hidden shadow-2xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Citizen Sentinel Desk &bull; Ward Central
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Report Civic Hazards. Track Municipal Action.
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                NagrikOne AI bridges citizens with PWD, Municipal Corporations, Jal Boards, and
                Electricity Departments. Geotag potholes, broken pipes, and overflowing waste with AI
                triage, RTI drafting, and community upvotes.
              </p>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={onOpenReportModal}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('btnReportIssue', 'Report Issue Now')}</span>
              </button>
              <button
                onClick={() => onSelectTab('map')}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 transition-all text-sm cursor-pointer"
              >
                <Map className="w-4 h-4 text-emerald-300" />
                <span>{t('navMap', 'Explore Live Map')}</span>
              </button>
              <button
                onClick={() => onSelectTab('about')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-2xl border border-emerald-500/30 transition-all text-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('navAbout', 'About NagrikOne & Guidelines')}</span>
              </button>
            </div>
          </div>

          {/* Live Municipal Ticker Bar */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                CIVIC DISPATCH TICKER
              </span>
              <span className="line-clamp-1">
                PWD Hotmix patch crew dispatched to Ring Road Metro Pillar 142 (#NGK-1021)
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-300">
                Open: <b className="text-white">{openCount}</b>
              </span>
              <span className="text-slate-300">
                In Progress: <b className="text-blue-400">{inProgressCount}</b>
              </span>
              <span className="text-slate-300">
                Resolved: <b className="text-emerald-400">{resolvedCount}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            ✨ {t('allCategories', 'All Categories')} ({reports.length})
          </button>
          {CIVIC_CATEGORIES.map((cat) => {
            const count = reports.filter((r) => r.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{getCategoryLabel(cat.id, cat.label)}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search, Status Tabs & Sorting Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', 'Search by issue title, landmark, ward, or complaint ID...')}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {(['all', 'open', 'In Progress', 'Resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'all'
                  ? t('filterAll', 'All Status')
                  : status === 'open'
                  ? t('filterOpen', 'Open')
                  : status === 'In Progress'
                  ? t('statusInProgress', 'In Progress')
                  : t('statusResolved', 'Resolved')}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 py-1.5 px-3 rounded-xl font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest">{t('sortRecent', 'Most Recent')}</option>
              <option value="upvotes">{t('sortUpvotes', 'Highest Upvotes')}</option>
              <option value="severity">{t('sortSeverity', 'Highest Severity')}</option>
            </select>
          </div>
        </div>

        {/* Desktop Grid Feed */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span className="text-4xl mb-2 block">🔍</span>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {t('noReportsFound', 'No civic grievances match your filters')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t('noReportsDesc', 'Try resetting the category or clearing the search query.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const cat = getCategoryById(report.category);
              const isUserAuthor = canUserDeleteReport(report, user?.uid, user?.email);

              return (
                <div
                  key={report.id}
                  onClick={() => onOpenReportDetail(report)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Card Media Header */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    <ReportCardImage
                      imageUrl={report.imageUrl}
                      title={report.title}
                      categoryIcon={cat.icon}
                    />

                    {/* Status Pill Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide backdrop-blur-md shadow-md ${
                          report.status === 'Resolved'
                            ? 'bg-emerald-500/90 text-slate-950'
                            : report.status === 'In Progress'
                            ? 'bg-amber-500/90 text-slate-950'
                            : 'bg-cyan-500/90 text-slate-950'
                        }`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </div>

                    {/* Severity Pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[11px] font-bold border border-white/10 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Sev {report.severity_score}/10
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>#{report.id}</span>
                        <span>{formatRelativeTime(report.createdAt)}</span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {report.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Location & Department */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{report.address || report.location_name || 'Ward Central Area'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span className="truncate">{report.department || 'Public Works Department'}</span>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpvoteReport(report.id);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            report.hasUpvoted
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{report.upvotes}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportDetail(report);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{report.commentsCount || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isUserAuthor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetReport(report);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOnMap(report.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Map</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetReport && (
        <DeleteConfirmationModal
          isOpen={!!deleteTargetReport}
          report={deleteTargetReport}
          onClose={() => setDeleteTargetReport(null)}
          onConfirmDelete={async (report) => {
            if (onDeleteReport) {
              await onDeleteReport(report.id);
            }
            setDeleteTargetReport(null);
          }}
        />
      )}
    </div>
  );
};
