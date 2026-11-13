import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  UploadCloud,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onNavigate, onSelectJob, onSelectResume }) {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummaryData(data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-app-border p-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-app-border" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-app-border" />
      </div>
    );
  }

  const completeness = summaryData?.profile_completeness?.score || 0;
  const missing = summaryData?.profile_completeness?.missing_sections || [];
  const stats = summaryData?.stats || {};
  const recentApps = summaryData?.recent_applications || [];
  const recentResumes = summaryData?.recent_resumes || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interview':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Offer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Ready to apply':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Welcome Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-app-border shadow-[0_2px_12px_rgba(39,35,58,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-brand-600 bg-lavender-surface px-2.5 py-0.5 rounded-md">
              Career Workspace
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
          </h1>
          <p className="text-xs text-content-secondary mt-1 leading-relaxed">
            Your Master Career Profile provides the factual ground truth for all applications. Tailor targeted resumes and cover letters with strict evidence provenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('new-application')}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tailor Application</span>
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="px-3.5 py-2 rounded-xl bg-white border border-app-border hover:bg-slate-50 text-content-primary font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Master Profile</span>
            <ChevronRight className="w-3.5 h-3.5 text-content-muted" />
          </button>
        </div>
      </div>

      {/* Profile Completeness Card */}
      <div className="bg-white rounded-2xl border border-app-border p-5 shadow-[0_2px_12px_rgba(39,35,58,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-500" />
                <span>Master Profile Completeness</span>
              </span>
              <span className="text-xs font-bold text-brand-600">{completeness}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-50 border border-app-border text-content-primary text-xs font-medium hover:bg-slate-100 transition-colors"
          >
            {completeness === 100 ? 'View Profile' : 'Complete Profile'}
          </button>
        </div>

        {missing.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-app-border flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-content-secondary">Recommended additions:</span>
            {missing.map((item, idx) => (
              <span
                key={idx}
                onClick={() => onNavigate('profile')}
                className="cursor-pointer text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
              >
                + {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-[0_2px_8px_rgba(39,35,58,0.03)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary">{stats.total_applications || 0}</div>
            <div className="text-[11px] text-content-secondary font-medium">Tracked Roles</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-[0_2px_8px_rgba(39,35,58,0.03)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary">{stats.applied || 0}</div>
            <div className="text-[11px] text-content-secondary font-medium">Submitted</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-[0_2px_8px_rgba(39,35,58,0.03)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary">{stats.interview || 0}</div>
            <div className="text-[11px] text-content-secondary font-medium">Interviews</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-[0_2px_8px_rgba(39,35,58,0.03)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary">{stats.offer || 0}</div>
            <div className="text-[11px] text-content-secondary font-medium">Job Offers</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Applications & Recent Resumes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-app-border shadow-[0_2px_12px_rgba(39,35,58,0.04)] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-app-border mb-4">
            <div>
              <h2 className="text-sm font-bold text-content-primary">Active Applications</h2>
              <p className="text-[11px] text-content-secondary">Your target roles and submission stages</p>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-app-border rounded-xl">
              <Briefcase className="w-8 h-8 text-content-muted mx-auto mb-2" />
              <h3 className="text-xs font-bold text-content-primary">No applications tracked yet</h3>
              <p className="text-[11px] text-content-secondary max-w-sm mx-auto mt-1 mb-3">
                Paste a job description to tailor an evidence-based resume and track your application pipeline.
              </p>
              <button
                onClick={() => onNavigate('new-application')}
                className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-medium text-xs hover:bg-brand-600 cursor-pointer"
              >
                Create First Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-content-secondary border-b border-app-border font-medium">
                    <th className="pb-2">Company & Role</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Updated</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <div className="font-semibold text-content-primary">{app.company}</div>
                        <div className="text-[11px] text-content-secondary">{app.title}</div>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-content-muted text-[11px]">
                        {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onSelectJob(app.job_id)}
                          className="px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 bg-lavender-surface hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Open Job
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Resumes (1 col) */}
        <div className="bg-white rounded-2xl border border-app-border shadow-[0_2px_12px_rgba(39,35,58,0.04)] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-app-border mb-4">
            <div>
              <h2 className="text-sm font-bold text-content-primary">Resume Library</h2>
              <p className="text-[11px] text-content-secondary">Tailored document snapshots</p>
            </div>
            <button
              onClick={() => onNavigate('resumes')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {recentResumes.length === 0 ? (
              <div className="text-center py-8 px-2 border border-dashed border-app-border rounded-xl">
                <FileText className="w-8 h-8 text-content-muted mx-auto mb-2" />
                <p className="text-xs text-content-secondary">No tailored resumes created yet.</p>
              </div>
            ) : (
              recentResumes.map((res) => (
                <div
                  key={res.id}
                  onClick={() => onSelectResume(res.id)}
                  className="p-3 rounded-xl border border-app-border hover:border-brand-200 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-content-primary group-hover:text-brand-600 transition-colors truncate">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-content-muted mt-0.5">
                        Template: {res.template_id} • v{res.version_number || 1}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
