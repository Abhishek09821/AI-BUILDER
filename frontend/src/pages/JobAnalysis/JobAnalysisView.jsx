import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Mail,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Briefcase,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function JobAnalysisView({ jobId, onNavigate, onSelectResume, onSelectCoverLetter }) {
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [generatingCL, setGeneratingCL] = useState(false);

  const loadJobAnalysis = async () => {
    try {
      setLoading(true);
      const jData = await api.getJob(jobId);
      setJob(jData);

      const mData = await api.getJobMatches(jobId);
      setMatchData(mData);
    } catch (err) {
      toast.error('Failed to load job analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadJobAnalysis();
    }
  }, [jobId]);

  const handleGenerateTailoredResume = async () => {
    setGeneratingResume(true);
    try {
      const res = await api.generateResumeDraft(jobId);
      toast.success('Tailored resume draft generated! Review suggestions in the editor.');
      onSelectResume(res.resume_id);
    } catch (err) {
      toast.error(err.message || 'Failed to generate tailored resume');
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingCL(true);
    try {
      const res = await api.generateCoverLetterDraft(jobId, { tone: 'Professional', length: 'Standard' });
      toast.success('Cover letter draft generated!');
      onSelectCoverLetter(res.id);
    } catch (err) {
      toast.error(err.message || 'Failed to generate cover letter');
    } finally {
      setGeneratingCL(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-app-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-app-border" />
          <div className="md:col-span-2 h-64 bg-white rounded-2xl border border-app-border" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-content-secondary">Job not found.</p>
        <button onClick={() => onNavigate('dashboard')} className="mt-2 text-brand-600 font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const matches = matchData?.matches || [];
  const scoreData = matchData?.score_data || { score: 0 };
  const strongMatches = matches.filter((m) => m.match_status === 'strong');
  const partialMatches = matches.filter((m) => m.match_status === 'partial');
  const notFoundMatches = matches.filter((m) => m.match_status === 'not_found');

  return (
    <div className="space-y-6 pb-12">
      {/* Role Banner */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lavender-surface text-brand-600 uppercase tracking-wider">
              {matchData?.seniority_level || 'Role Analysis'}
            </span>
            {job.location && <span className="text-xs text-content-secondary">• {job.location}</span>}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary">
            {job.title} <span className="text-content-secondary font-normal">at</span> {job.company}
          </h1>
          <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
            {matchData?.role_summary || job.description_text?.slice(0, 200)}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleGenerateCoverLetter}
            disabled={generatingCL}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:bg-lavender-surface text-xs font-semibold shadow-sm transition-all"
          >
            {generatingCL ? (
              <span>Drafting Cover Letter...</span>
            ) : (
              <>
                <Mail className="w-4 h-4 text-brand-500" />
                <span>Draft Cover Letter</span>
              </>
            )}
          </button>

          <button
            onClick={handleGenerateTailoredResume}
            disabled={generatingResume}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-soft transition-all disabled:opacity-50"
          >
            {generatingResume ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Tailoring Resume...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Tailored Resume</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Score & Requirements Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alignment Score Card (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <span>Estimated Alignment</span>
              </span>
              <span className="text-[10px] text-content-secondary font-medium">Profile vs Role</span>
            </div>

            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-brand-500 to-pinkaccent p-1 shadow-soft">
                <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-brand-600">{scoreData.score}%</span>
                  <span className="text-[10px] text-content-secondary font-semibold uppercase">Alignment</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5 text-center text-xs">
                <div className="p-2 rounded-xl bg-green-50 border border-green-200">
                  <div className="font-extrabold text-green-700">{scoreData.strong_count || 0}</div>
                  <div className="text-[10px] text-green-800">Strong</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="font-extrabold text-amber-700">{scoreData.partial_count || 0}</div>
                  <div className="text-[10px] text-amber-800">Partial</div>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="font-extrabold text-gray-700">{scoreData.not_found_count || 0}</div>
                  <div className="text-[10px] text-gray-800">Not in Profile</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-app-border text-[11px] text-content-secondary leading-relaxed bg-app-bg p-3 rounded-xl">
              <p>
                <b>Transparent Heuristic:</b> Calculated strictly from your verified profile facts. We never promise guaranteed ATS scores or interview selection.
              </p>
            </div>
          </div>

          {/* Keywords & Clues */}
          <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-3">
              Recurring Role Keywords
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {matchData?.keywords?.map((kw, idx) => (
                <span
                  key={idx}
                  className="bg-lavender-surface text-brand-700 border border-lavender-border px-2.5 py-1 rounded-md text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Evidence-Based Requirements Matching (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-app-border shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-app-border">
            <div>
              <h2 className="text-base font-bold text-content-primary">Requirement-to-Profile Evidence</h2>
              <p className="text-xs text-content-secondary">
                Transparent mapping showing which verified facts in your profile support each requirement.
              </p>
            </div>
          </div>

          {/* Strong Evidence Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Strong Profile Evidence ({strongMatches.length})
              </h3>
            </div>
            <div className="space-y-2">
              {strongMatches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-green-200 bg-green-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                      <span>{m.requirement_key}</span>
                    </div>
                    <p className="text-[11px] text-green-900 mt-0.5">{m.explanation}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                    Verified Match
                  </span>
                </div>
              ))}
              {strongMatches.length === 0 && (
                <p className="text-xs text-content-secondary italic">No direct strong skill matches found.</p>
              )}
            </div>
          </div>

          {/* Partial Evidence Section */}
          {partialMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Partial Evidence ({partialMatches.length})
                </h3>
              </div>
              <div className="space-y-2">
                {partialMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
                        <span>{m.requirement_key}</span>
                      </div>
                      <p className="text-[11px] text-amber-900 mt-0.5">{m.recommendation}</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                      Mentioned in context
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Not in Profile Section */}
          {notFoundMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Not Present in Your Profile ({notFoundMatches.length})
                </h3>
              </div>
              <div className="space-y-2">
                {notFoundMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{m.requirement_key}</div>
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        {m.recommendation}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('profile')}
                      className="text-[11px] font-semibold text-brand-600 hover:underline shrink-0"
                    >
                      + Add to Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

