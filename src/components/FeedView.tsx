import React, { useState } from 'react';
import { CivicCategoryType, CivicReport, ReportStatus } from '../types';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
}> = ({ imageUrl, title, categoryIcon }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 p-4 select-none">
        <span className="text-4xl mb-1">{categoryIcon}</span>
        {imageError && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Photo unavailable
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <span className="text-3xl opacity-30 select-none">{categoryIcon}</span>
        </div>
      )}
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
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
  const [deleteTargetReport, setDeleteTargetReport] = useState<CivicReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'upvotes' | 'severity' | 'newest'>('newest');

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

  return (
    <div className="space-y-6">
      {/* Hero Governance Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white overflow-hidden shadow-2xl border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Citizen Sentinel Desk &bull; Ward Central
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Report Civic Hazards. Track Municipal Action.
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              NagrikOne AI bridges citizens with PWD, Municipal Corporations, Jal Boards, and
              Electricity Departments. Geotag potholes, broken pipes, and overflowing waste with AI
              triage, RTI drafting, and community upvotes.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenReportModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Report Issue Now</span>
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Map className="w-4 h-4 text-emerald-300" />
              <span>Explore Live Map</span>
            </button>
            <button
              onClick={() => onSelectTab('procedure')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-2xl border border-emerald-500/30 transition-all text-xs cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Our Procedure & RTI</span>
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
          ✨ All Categories ({reports.length})
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
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search, Status Tabs & Sorting Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by issue title, landmark, ward, or complaint ID..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Tabs & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('open')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedStatus === 'open'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setSelectedStatus('In Progress')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedStatus === 'In Progress'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setSelectedStatus('Resolved')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedStatus === 'Resolved'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="severity">Most Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {isLoading && reports.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse flex flex-col"
            >
              <div className="h-44 w-full bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error && reports.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-xl mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-rose-900 dark:text-rose-200 mb-1">
            Could not synchronize reports
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-400 max-w-md mx-auto mb-4">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry Sync
            </button>
          )}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-xl mb-3">
            🔍
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
            No civic reports match your filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Try adjusting your search query, selecting another category, or report a new issue in this ward.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const cat = getCategoryById(report.category);
            const isResolved = report.status === 'Resolved';
            const isCritical = report.priority === 'critical';

            const statusColor = isResolved
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : report.status === 'In Progress'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : report.status === 'In Review'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

            const isOwner = canUserDeleteReport(report, user?.uid, user?.email);
            const photoCount = (report.images && report.images.length) || (report.imageUrl ? 1 : 0);

            return (
              <div
                key={report.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Photo Thumbnail */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <ReportCardImage
                    imageUrl={report.imageUrl}
                    title={report.title}
                    categoryIcon={cat.icon}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Category Pill (Top Left) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm text-[11px] font-bold text-slate-800 dark:text-white">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>

                  {/* Status Badge (Top Right) */}
                  <div
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${statusColor}`}
                  >
                    {report.status}
                  </div>

                  {/* Ticket ID & Severity (Bottom Left) */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-white">
                    <span className="font-mono text-xs font-bold bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      #{report.id}
                    </span>
                    {isCritical && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600/90 text-white animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        CRITICAL
                      </span>
                    )}
                  </div>

                  {/* Multi-Photo Count Badge (Bottom Right) */}
                  {photoCount > 1 && (
                    <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span>{photoCount} photos</span>
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => onOpenReportDetail(report)}
                      className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {report.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {/* Municipal Department & Location info */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 font-semibold truncate text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{report.department}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{report.address || report.location_name}</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-400 shrink-0">
                        SLA: {report.sla_hours}h
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Actions: Upvote & Inspect Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onUpvoteReport(report.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        report.hasUpvoted
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${report.hasUpvoted ? 'fill-white' : ''}`} />
                      <span>{report.upvotes}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isOwner && onDeleteReport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetReport(report);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Retract and delete this grievance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOnMap(report.id)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Locate on map"
                      >
                        <Map className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenReportDetail(report)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal for Feed Cards */}
      {deleteTargetReport && onDeleteReport && (
        <DeleteConfirmationModal
          isOpen={!!deleteTargetReport}
          report={deleteTargetReport}
          onClose={() => setDeleteTargetReport(null)}
          onConfirmDelete={async (rep) => {
            await onDeleteReport(rep.id);
            setDeleteTargetReport(null);
          }}
        />
      )}
    </div>
  );
};
