import React, { useState, useEffect } from 'react';
import {
  Mail,
  Download,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  FileDown,
  History,
  ChevronLeft,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CoverLetterEditor({ clId, onNavigate }) {
  const toast = useToast();

  const [coverLetter, setCoverLetter] = useState(null);
  const [content, setContent] = useState(null);
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Standard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [versions, setVersions] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const loadCoverLetter = async () => {
    try {
      setLoading(true);
      const data = await api.getCoverLetter(clId);
      setCoverLetter(data);
      setContent(data.content_json);
      setTone(data.tone || 'Professional');
      setLength(data.length || 'Standard');
    } catch (err) {
      toast.error('Failed to load cover letter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clId) {
      loadCoverLetter();
    }
  }, [clId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCoverLetter(clId, {
        tone,
        length,
        content_json: content,
        create_version_snapshot: true
      });
      toast.success('Cover letter saved and new revision created!');
    } catch (err) {
      toast.error('Failed to save cover letter');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await api.createExport({
        document_type: 'cover_letter',
        document_id: clId,
        format
      });
      toast.success(`Cover Letter ${format.toUpperCase()} export generated!`);
      window.open(api.getDownloadUrl(res.export.id), '_blank');
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenVersions = async () => {
    try {
      const vList = await api.getCoverLetterVersions(clId);
      setVersions(vList);
      setHistoryModalOpen(true);
    } catch (err) {
      toast.error('Failed to fetch versions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coverLetter || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-content-secondary">Cover letter not found.</p>
        <button onClick={() => onNavigate('dashboard')} className="mt-2 text-brand-600 font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-app-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('applications')}
            className="p-1.5 rounded-lg border border-app-border hover:bg-slate-50 text-content-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-content-primary">{coverLetter.title}</h1>
            <p className="text-xs text-content-secondary">
              Role: {content.job_title} at {content.company_name}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenVersions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-content-secondary hover:text-content-primary text-xs font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-brand-200 text-brand-600 hover:bg-lavender-surface text-xs font-semibold shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-brand-500" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 text-brand-600 hover:bg-lavender-surface text-xs font-semibold"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>DOCX</span>
          </button>
        </div>
      </div>

      {/* Two Column Workspace: Editor (left) & Live Document Preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls & Paragraph Editors (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-5">
            {/* Tone and Length Selector */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-app-border text-xs">
              <div>
                <label className="font-semibold text-content-primary block mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-app-border bg-white focus:ring-1 focus:ring-brand-500 text-xs"
                >
                  <option value="Professional">Professional</option>
                  <option value="Confident">Confident</option>
                  <option value="Concise">Concise</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-content-primary block mb-1">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-2 rounded-xl border border-app-border bg-white focus:ring-1 focus:ring-brand-500 text-xs"
                >
                  <option value="Standard">Standard (4 paragraphs)</option>
                  <option value="Short">Short (Concise)</option>
                </select>
              </div>
            </div>

            {/* Salutation */}
            <div>
              <label className="text-xs font-semibold text-content-primary block mb-1">Salutation</label>
              <input
                type="text"
                value={content.salutation || ''}
                onChange={(e) => setContent({ ...content, salutation: e.target.value })}
                className="w-full p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Opening Paragraph */}
            <div>
              <label className="text-xs font-semibold text-content-primary block mb-1">
                Opening Paragraph
              </label>
              <textarea
                rows={3}
                value={content.opening_paragraph || ''}
                onChange={(e) => setContent({ ...content, opening_paragraph: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
            </div>

            {/* Evidence Paragraph 1 */}
            <div>
              <label className="text-xs font-semibold text-content-primary block mb-1">
                Evidence Paragraph 1 (Role alignment)
              </label>
              <textarea
                rows={4}
                value={content.evidence_paragraph_1 || ''}
                onChange={(e) => setContent({ ...content, evidence_paragraph_1: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
            </div>

            {/* Evidence Paragraph 2 (if standard) */}
            {length !== 'Short' && (
              <div>
                <label className="text-xs font-semibold text-content-primary block mb-1">
                  Evidence Paragraph 2 (Project/technical execution)
                </label>
                <textarea
                  rows={4}
                  value={content.evidence_paragraph_2 || ''}
                  onChange={(e) => setContent({ ...content, evidence_paragraph_2: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
                />
              </div>
            )}

            {/* Company Hook Paragraph */}
            <div>
              <label className="text-xs font-semibold text-content-primary block mb-1">
                Company Connection & Culture Hook
              </label>
              <textarea
                rows={3}
                value={content.company_hook_paragraph || ''}
                onChange={(e) => setContent({ ...content, company_hook_paragraph: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
            </div>

            {/* Closing Paragraph */}
            <div>
              <label className="text-xs font-semibold text-content-primary block mb-1">
                Closing Paragraph & Call to Action
              </label>
              <textarea
                rows={3}
                value={content.closing_paragraph || ''}
                onChange={(e) => setContent({ ...content, closing_paragraph: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Formal Preview (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-app-border p-8 sm:p-12 shadow-card space-y-5 text-content-primary font-sans text-xs sm:text-[13px] leading-relaxed">
          <div className="pb-4 border-b border-app-border">
            <h2 className="text-xl font-bold text-brand-600">{content.applicant_name}</h2>
            <p className="text-xs text-content-secondary mt-0.5">
              {content.applicant_email} &nbsp;|&nbsp; {content.applicant_phone}
            </p>
          </div>

          <div className="text-xs space-y-0.5 text-content-secondary">
            <div><b>To:</b> Hiring Team</div>
            <div><b>Company:</b> {content.company_name}</div>
            <div><b>Role:</b> {content.job_title}</div>
          </div>

          <div className="pt-2 font-medium">{content.salutation}</div>

          <p className="leading-relaxed text-justify">{content.opening_paragraph}</p>
          <p className="leading-relaxed text-justify">{content.evidence_paragraph_1}</p>
          {length !== 'Short' && content.evidence_paragraph_2 && (
            <p className="leading-relaxed text-justify">{content.evidence_paragraph_2}</p>
          )}
          <p className="leading-relaxed text-justify">{content.company_hook_paragraph}</p>
          <p className="leading-relaxed text-justify">{content.closing_paragraph}</p>

          <div className="pt-6">
            <p>Sincerely,</p>
            <p className="font-bold text-content-primary mt-3">{content.applicant_name}</p>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 border border-app-border">
            <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
              <h3 className="text-base font-bold text-content-primary">Cover Letter Revisions</h3>
              <button onClick={() => setHistoryModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
              {versions.map((v) => (
                <div key={v.id} className="p-3 rounded-xl border border-app-border bg-app-bg flex justify-between items-center">
                  <div>
                    <div className="font-bold">Version {v.version_number}</div>
                    <div className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setContent(v.content_json);
                      setHistoryModalOpen(false);
                      toast.success(`Loaded version ${v.version_number}`);
                    }}
                    className="px-3 py-1 rounded-lg bg-brand-500 text-white font-semibold text-xs"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

