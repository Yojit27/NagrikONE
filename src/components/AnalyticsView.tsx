import React from 'react';
import { CivicReport } from '../types';
import { CIVIC_CATEGORIES } from '../data/categories';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';

interface AnalyticsViewProps {
  reports: CivicReport[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ reports }) => {
  const totalReports = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const openCount = reports.filter((r) => r.status === 'Reported' || r.status === 'In Review').length;

  const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;
  const avgSla = Math.round(
    reports.reduce((acc, r) => acc + r.sla_hours, 0) / (totalReports || 1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Civic Governance & Municipal Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time accountability metrics, departmental SLA adherence, and ward resolution statistics.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalReports}
          </div>
          <div className="text-xs text-slate-500 mt-1">Logged across municipal zones</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {resolutionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">{resolvedCount} grievances resolved</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average SLA</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {avgSla}h
          </div>
          <div className="text-xs text-slate-500 mt-1">Citizen charter turnaround</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Crews</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {inProgressCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Grievances undergoing repair</div>
        </div>
      </div>

      {/* Category Breakdown & Department SLA Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Issue Distribution by Category
          </h3>
          <div className="space-y-3.5">
            {CIVIC_CATEGORIES.map((cat) => {
              const count = reports.filter((r) => r.category === cat.id).length;
              const percent = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Response Performance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            Departmental Scorecard
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Public Works Department (PWD)
                </div>
                <div className="text-slate-500 text-[11px]">Roads, Flyovers & Potholes</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">92% On-Time</div>
                <div className="text-[10px] text-slate-400">Avg SLA: 72 hrs</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Municipal Solid Waste Dept
                </div>
                <div className="text-slate-500 text-[11px]">Dumpsters & Collection Trucks</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">88% On-Time</div>
                <div className="text-[10px] text-slate-400">Avg SLA: 48 hrs</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Delhi Jal Board / Water Works
                </div>
                <div className="text-slate-500 text-[11px]">Water Mains & Drainage Lines</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-amber-600 dark:text-amber-400">76% On-Time</div>
                <div className="text-[10px] text-slate-400">Avg SLA: 24 hrs</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Electricity Distribution (DISCOM)
                </div>
                <div className="text-slate-500 text-[11px]">Streetlights & High Tension Cables</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">95% On-Time</div>
                <div className="text-[10px] text-slate-400">Avg SLA: 48 hrs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
