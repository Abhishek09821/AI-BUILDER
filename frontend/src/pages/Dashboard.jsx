import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PlusCircle,
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Ready to apply':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-sm text-white">
              AI Job Application Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Applicant'}!
          </h1>
          <p className="text-sm text-brand-100 mt-2 leading-relaxed">
            Ready to apply for your next opportunity? Your Master Career Profile keeps your verified history safe while generating evidence-backed resumes tailored to each job.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('new-application')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-brand-600 font-bold text-xs shadow-soft transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-brand-600" />
              <span>Tailor New Application</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <span>Manage Master Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completeness Card */}
      <div className="bg-white rounded-2xl border border-app-border p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-500" />
                <span>Master Profile Completeness</span>
              </span>
              <span className="text-xs font-extrabold text-brand-600">{completeness}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-lavender-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-pinkaccent rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-lavender-surface text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors"
          >
            {completeness === 100 ? 'View Profile' : 'Complete Profile'}
          </button>
        </div>

        {missing.length > 0 && (
          <div className="mt-4 pt-3 border-t border-app-border flex flex-wrap items-center gap-2">
            <span className="text-xs text-content-secondary font-medium">To improve tailoring accuracy:</span>
            {missing.map((item, idx) => (
              <span
                key={idx}
                onClick={() => onNavigate('profile')}
                className="cursor-pointer text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
              >
                + {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-content-primary">{stats.total_applications || 0}</div>
            <div className="text-xs text-content-secondary font-medium">Tracked Roles</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-content-primary">{stats.applied || 0}</div>
            <div className="text-xs text-content-secondary font-medium">Submitted</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pinkaccent-surface text-pinkaccent-dark flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-content-primary">{stats.interview || 0}</div>
            <div className="text-xs text-content-secondary font-medium">Interviews</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-app-border shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-content-primary">{stats.offer || 0}</div>
            <div className="text-xs text-content-secondary font-medium">Job Offers</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Applications & Recent Resumes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-app-border shadow-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-app-border mb-4">
            <div>
              <h2 className="text-base font-bold text-content-primary">Recent Applications</h2>
              <p className="text-xs text-content-secondary">Your active pipeline and document snapshots</p>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-app-border rounded-xl">
              <Briefcase className="w-10 h-10 text-brand-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-content-primary">No applications tracked yet</h3>
              <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1 mb-4">
                Paste a job description to tailor an evidence-based resume and track your application progress.
              </p>
              <button
                onClick={() => onNavigate('new-application')}
                className="px-3.5 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-soft hover:bg-brand-600"
              >
                Create First Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-content-secondary border-b border-app-border font-semibold">
                    <th className="pb-2.5">Company & Role</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Updated</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-content-primary">{app.company}</div>
                        <div className="text-content-secondary">{app.title}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-content-secondary">
                        {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3 text-right">
                        {app.resume_document_id ? (
                          <button
                            onClick={() => onSelectResume(app.resume_document_id)}
                            className="text-brand-600 hover:underline font-semibold"
                          >
                            Open Resume
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectJob(app.job_id)}
                            className="text-brand-600 hover:underline font-semibold"
                          >
                            View Job
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Resumes & Quick Actions (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
              <h2 className="text-base font-bold text-content-primary">Resume Library</h2>
              <button
                onClick={() => onNavigate('resumes')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View all
              </button>
            </div>

            {recentResumes.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-brand-300 mx-auto mb-2" />
                <p className="text-xs text-content-secondary mb-3">No resume drafts yet.</p>
                <button
                  onClick={() => onNavigate('profile')}
                  className="px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 text-xs font-semibold hover:bg-brand-100"
                >
                  Generate Master Resume
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentResumes.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectResume(res.id)}
                    className="p-3 rounded-xl border border-app-border hover:border-brand-300 hover:bg-lavender-surface/30 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-content-primary truncate">{res.title}</div>
                      <div className="text-[11px] text-content-secondary">
                        Template: <span className="capitalize">{res.template_id}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-secondary shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Onboarding Guide */}
          <div className="bg-gradient-to-br from-lavender-surface to-pinkaccent-surface/30 rounded-2xl border border-lavender-border p-5">
            <h3 className="text-xs font-extrabold text-brand-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>How ApplyMate Works</span>
            </h3>
            <ol className="text-xs text-content-primary space-y-2 list-decimal list-inside leading-relaxed font-medium">
              <li>Keep verified career facts in your <b className="text-brand-700">Master Profile</b>.</li>
              <li>Paste any target <b className="text-brand-700">Job Description</b>.</li>
              <li>Review honest <b className="text-brand-700">Evidence Matching</b>.</li>
              <li>Accept, reject, or edit suggestions in the <b className="text-brand-700">3-Panel Editor</b>.</li>
              <li>Export clean, selectable <b className="text-brand-700">PDF & DOCX</b>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

