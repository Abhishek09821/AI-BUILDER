import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Edit3,
  FileDown,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function ResumeLibrary({ onSelectResume, onNavigate }) {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await api.getResumes();
      setResumes(data);
    } catch (err) {
      toast.error('Failed to load resume documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume document?')) return;
    try {
      await api.deleteResume(id);
      setResumes(resumes.filter((r) => r.id !== id));
      toast.success('Resume deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete resume');
    }
  };

  const handleExport = async (resumeId, format, e) => {
    e.stopPropagation();
    try {
      const res = await api.createExport({
        document_type: 'resume',
        document_id: resumeId,
        format
      });
      toast.success(`${format.toUpperCase()} export generated!`);
      window.open(api.getDownloadUrl(res.export.id), '_blank');
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-white rounded-2xl border border-app-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-app-border" />
          ))}
        </div>
      </div>
    );
  }

  const masterResume = resumes.find((r) => r.is_master);
  const tailoredResumes = resumes.filter((r) => !r.is_master);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
            Resume Library
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Manage your Master Career Resume and tailored, role-specific versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-application')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tailor for Role</span>
          </button>
        </div>
      </div>

      {/* 1. Master Career Resume */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Master Career Resume
          </h2>
        </div>

        {masterResume ? (
          <div
            onClick={() => onSelectResume(masterResume.id)}
            className="bg-white rounded-2xl border-2 border-brand-300 hover:border-brand-500 p-6 shadow-card cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-content-primary">{masterResume.title}</span>
                <span className="text-[10px] font-bold bg-lavender-surface text-brand-700 px-2 py-0.5 rounded-full border border-lavender-border">
                  Master Source
                </span>
              </div>
              <p className="text-xs text-content-secondary">
                Template: <span className="capitalize font-semibold">{masterResume.template_id}</span> • Last updated{' '}
                {new Date(masterResume.updated_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleExport(masterResume.id, 'pdf', e)}
                className="px-3 py-1.5 rounded-lg border border-app-border text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-slate-50 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={(e) => handleExport(masterResume.id, 'docx', e)}
                className="px-3 py-1.5 rounded-lg border border-app-border text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-slate-50 flex items-center gap-1"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>DOCX</span>
              </button>
              <button
                onClick={() => onSelectResume(masterResume.id)}
                className="px-3.5 py-1.5 rounded-lg bg-brand-500 text-white font-semibold text-xs shadow-soft hover:bg-brand-600 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Open in 3-Panel Editor</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-app-border p-6 text-center">
            <FileText className="w-8 h-8 text-brand-300 mx-auto mb-2" />
            <p className="text-xs text-content-secondary mb-3">No master resume created yet.</p>
            <button
              onClick={() => onNavigate('profile')}
              className="px-3.5 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-soft hover:bg-brand-600"
            >
              Sync from Master Profile
            </button>
          </div>
        )}
      </div>

      {/* 2. Tailored Job-Specific Resumes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">
              Tailored Job-Specific Resumes ({tailoredResumes.length})
            </h2>
          </div>
        </div>

        {tailoredResumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-app-border p-8 text-center">
            <Building2 className="w-8 h-8 text-brand-300 mx-auto mb-2" />
            <p className="text-xs text-content-secondary mb-3">
              No job-specific tailored resumes generated yet.
            </p>
            <button
              onClick={() => onNavigate('new-application')}
              className="px-3.5 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-soft hover:bg-brand-600"
            >
              Tailor Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tailoredResumes.map((res) => (
              <div
                key={res.id}
                onClick={() => onSelectResume(res.id)}
                className="bg-white rounded-2xl border border-app-border hover:border-brand-300 hover:shadow-soft p-5 shadow-card cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-content-primary line-clamp-1">{res.title}</h3>
                    <button
                      onClick={(e) => handleDelete(res.id, e)}
                      title="Delete resume"
                      className="text-content-secondary hover:text-status-danger p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {res.job_info && (
                    <div className="text-xs text-brand-600 font-semibold mb-2 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{res.job_info.company}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-content-secondary space-y-1">
                    <div>Template: <span className="capitalize font-medium">{res.template_id}</span></div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(res.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-app-border flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => handleExport(res.id, 'pdf', e)}
                      className="p-1.5 rounded-lg border border-app-border text-[11px] font-semibold text-content-secondary hover:text-content-primary"
                    >
                      PDF
                    </button>
                    <button
                      onClick={(e) => handleExport(res.id, 'docx', e)}
                      className="p-1.5 rounded-lg border border-app-border text-[11px] font-semibold text-content-secondary hover:text-content-primary"
                    >
                      DOCX
                    </button>
                  </div>

                  <span className="text-xs font-semibold text-brand-600 hover:underline">
                    Edit Document &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

