import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Download,
  History,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  FileDown,
  LayoutTemplate,
  CheckCircle,
  AlertCircle,
  Layers,
  Edit,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import DocumentRenderer from '../../components/resume-preview/DocumentRenderer';
import SuggestionDiffViewer from '../../components/diff/SuggestionDiffViewer';

export default function ResumeEditor({ resumeId, onNavigate }) {
  const toast = useToast();

  const [resume, setResume] = useState(null);
  const [docJson, setDocJson] = useState(null);
  const [templateId, setTemplateId] = useState('modern-ats');
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [versions, setVersions] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Undo/Redo stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const debounceTimer = useRef(null);

  const loadResumeData = async () => {
    try {
      const data = await api.getResume(resumeId);
      setResume(data);
      setDocJson(data.document_json);
      setTemplateId(data.template_id || 'modern-ats');

      // Extract pending suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        const first = data.suggestions[0];
        const sJson = first.suggestion_json || {};
        const flattened = [];

        if (sJson.summary_suggestion) {
          flattened.push({
            id: first.id,
            type: 'summary',
            section: 'summary',
            original_text: data.document_json?.summary || '',
            suggested_text: sJson.summary_suggestion.text,
            change_type: sJson.summary_suggestion.change_type,
            warnings: sJson.summary_suggestion.warnings
          });
        }

        if (sJson.bullet_suggestions) {
          sJson.bullet_suggestions.forEach((b, idx) => {
            flattened.push({
              id: first.id,
              type: 'bullet',
              index: idx,
              section: b.section,
              original_text: b.original_text,
              suggested_text: b.suggested_text,
              change_type: b.change_type,
              warnings: b.warnings
            });
          });
        }
        setPendingSuggestions(flattened);
      }
    } catch (err) {
      toast.error('Failed to load resume document');
    }
  };

  useEffect(() => {
    if (resumeId) {
      loadResumeData();
    }
  }, [resumeId]);

  // Autosave handler with debounce
  const triggerAutosave = (newDoc, newTemplate) => {
    setSaveStatus('saving');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        await api.updateResume(resumeId, {
          document_json: newDoc,
          template_id: newTemplate || templateId
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        toast.error('Autosave failed. Check your network connection.');
      }
    }, 1200);
  };

  const updateDocumentModel = (updater) => {
    setDocJson((prev) => {
      // Push previous state to undo stack
      undoStack.current.push(JSON.parse(JSON.stringify(prev)));
      redoStack.current = []; // Clear redo stack on new edit

      const updated = typeof updater === 'function' ? updater(prev) : updater;
      triggerAutosave(updated, templateId);
      return updated;
    });
  };

  const handleUndo = () => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    redoStack.current.push(JSON.parse(JSON.stringify(docJson)));
    setDocJson(prev);
    triggerAutosave(prev, templateId);
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(JSON.parse(JSON.stringify(docJson)));
    setDocJson(next);
    triggerAutosave(next, templateId);
  };

  const handleTemplateChange = async (newTpl) => {
    setTemplateId(newTpl);
    triggerAutosave(docJson, newTpl);
  };

  // Section visibility toggle
  const toggleSectionVisibility = (secKey) => {
    updateDocumentModel((prev) => ({
      ...prev,
      section_visibility: {
        ...prev.section_visibility,
        [secKey]: prev.section_visibility?.[secKey] === false ? true : false
      }
    }));
  };

  // Move section up/down
  const moveSection = (idx, direction) => {
    updateDocumentModel((prev) => {
      const order = [...(prev.section_order || ['summary', 'skills', 'experience', 'projects', 'education'])];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= order.length) return prev;
      const temp = order[idx];
      order[idx] = order[targetIdx];
      order[targetIdx] = temp;
      return { ...prev, section_order: order };
    });
  };

  // Suggestion review
  const handleReviewSuggestion = async (sugg, action, editedText) => {
    try {
      const res = await api.reviewSuggestion(resumeId, sugg.id, {
        action,
        item_type: sugg.type,
        item_index: sugg.index || 0,
        edited_text: editedText
      });

      if (action === 'accept' || action === 'edit') {
        if (res?.resume?.document_json) {
          setDocJson(res.resume.document_json);
          setResume(res.resume);
        } else {
          const textToApply = action === 'edit' ? editedText : sugg.suggested_text;
          updateDocumentModel((prev) => {
            const next = { ...prev };
            if (sugg.type === 'summary') {
              next.summary = textToApply;
            } else if (sugg.type === 'bullet') {
              const sec = sugg.section;
              if (next[sec]) {
                for (const item of next[sec]) {
                  if (item.bullets?.includes(sugg.original_text)) {
                    const bIdx = item.bullets.indexOf(sugg.original_text);
                    item.bullets[bIdx] = textToApply;
                    break;
                  }
                }
              }
            }
            return next;
          });
        }
        toast.success(`Suggestion applied to ${sugg.section || 'summary'}!`);
      } else {
        toast.info('Suggestion rejected.');
      }

      // Remove from pending suggestions list
      setPendingSuggestions((prev) => prev.filter((p) => p !== sugg));
    } catch (err) {
      toast.error('Failed to review suggestion');
    }
  };

  // Export handlers
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await api.createExport({
        document_type: 'resume',
        document_id: resumeId,
        format
      });
      toast.success(`${format.toUpperCase()} export generated!`);
      // Trigger authenticated download directly
      await api.downloadExport(res.export.id, res.export.file_name);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Version history
  const handleOpenVersions = async () => {
    try {
      const vList = await api.getResumeVersions(resumeId);
      setVersions(vList);
      setHistoryModalOpen(true);
    } catch (err) {
      toast.error('Failed to fetch versions');
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      const res = await api.restoreResumeVersion(resumeId, versionId);
      setDocJson(res.resume.document_json);
      setHistoryModalOpen(false);
      toast.success('Restored version successfully as a new current version!');
    } catch (err) {
      toast.error('Failed to restore version');
    }
  };

  if (!resume || !docJson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-content-secondary">Loading Document Editor...</p>
        </div>
      </div>
    );
  }

  const sectionOrder = docJson.section_order || ['summary', 'skills', 'experience', 'projects', 'education'];
  const visibility = docJson.section_visibility || {};

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-app-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('resumes')}
            className="p-1.5 rounded-lg border border-app-border hover:bg-slate-50 text-content-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-content-primary truncate max-w-sm">
                {resume.title}
              </h1>
              {resume.job_info && (
                <span className="text-[10px] font-semibold bg-lavender-surface text-brand-600 px-2 py-0.5 rounded-full border border-lavender-border">
                  {resume.job_info.company}
                </span>
              )}
            </div>
            {/* Autosave status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-content-secondary mt-0.5">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-brand-500">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  Saving changes...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-status-success font-medium">
                  <CheckCircle className="w-3 h-3 text-status-success" />
                  All edits autosaved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-status-danger font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Autosave error
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Undo / Redo & Version History & Exports */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-app-border rounded-xl p-0.5 bg-app-bg">
            <button
              onClick={handleUndo}
              disabled={undoStack.current.length === 0}
              title="Undo"
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary disabled:opacity-30"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.current.length === 0}
              title="Redo"
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary disabled:opacity-30"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenVersions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-content-secondary hover:text-content-primary text-xs font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
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
      </div>

      {/* 3-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL 1: Left Navigation & Controls (2.5 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Template Switcher */}
          <div className="bg-white rounded-2xl border border-app-border p-4 shadow-card">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content-primary uppercase tracking-wider mb-2.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-brand-500" />
              <span>Resume Template</span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => handleTemplateChange('modern-ats')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  templateId === 'modern-ats'
                    ? 'border-brand-500 bg-lavender-surface text-brand-700 font-bold shadow-sm'
                    : 'border-app-border text-content-secondary hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-content-primary">Modern ATS</div>
                <div className="text-[11px] text-content-secondary">Single-column, high parsability</div>
              </button>

              <button
                onClick={() => handleTemplateChange('clean-professional')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  templateId === 'clean-professional'
                    ? 'border-brand-500 bg-lavender-surface text-brand-700 font-bold shadow-sm'
                    : 'border-app-border text-content-secondary hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-content-primary">Clean Professional</div>
                <div className="text-[11px] text-content-secondary">Subtle visual hierarchy & accents</div>
              </button>
            </div>
          </div>

          {/* Section Ordering & Visibility */}
          <div className="bg-white rounded-2xl border border-app-border p-4 shadow-card">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content-primary uppercase tracking-wider mb-2.5">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>Section Controls</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {sectionOrder.map((sec, idx) => {
                const visible = visibility[sec] !== false;
                return (
                  <div
                    key={sec}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      visible ? 'bg-white border-app-border' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <span className="font-semibold capitalize">{sec}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleSectionVisibility(sec)}
                        title={visible ? 'Hide section' : 'Show section'}
                        className="p-1 rounded text-content-secondary hover:text-content-primary"
                      >
                        {visible ? <Eye className="w-3.5 h-3.5 text-brand-600" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        title="Move up"
                        className="p-1 rounded text-content-secondary hover:text-content-primary disabled:opacity-20"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sectionOrder.length - 1}
                        title="Move down"
                        className="p-1 rounded text-content-secondary hover:text-content-primary disabled:opacity-20"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL 2: Centre Content Editor (4.5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-app-border p-5 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 text-brand-500" />
                <span>Document Content Editor</span>
              </span>
              <span className="text-[10px] text-content-secondary">Semantic Model</span>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-content-primary uppercase text-brand-600">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-content-secondary block mb-0.5">Name</label>
                  <input
                    type="text"
                    value={docJson.contact?.name || ''}
                    onChange={(e) =>
                      updateDocumentModel((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, name: e.target.value }
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-content-secondary block mb-0.5">Headline</label>
                  <input
                    type="text"
                    value={docJson.contact?.headline || ''}
                    onChange={(e) =>
                      updateDocumentModel((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, headline: e.target.value }
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-content-secondary block mb-0.5">Email</label>
                  <input
                    type="text"
                    value={docJson.contact?.email || ''}
                    onChange={(e) =>
                      updateDocumentModel((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-content-secondary block mb-0.5">Phone</label>
                  <input
                    type="text"
                    value={docJson.contact?.phone || ''}
                    onChange={(e) =>
                      updateDocumentModel((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-content-primary uppercase text-brand-600">
                Professional Summary
              </h3>
              <textarea
                value={docJson.summary || ''}
                onChange={(e) =>
                  updateDocumentModel((prev) => ({
                    ...prev,
                    summary: e.target.value
                  }))
                }
                rows={4}
                className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-content-primary uppercase text-brand-600">
                Skills List
              </h3>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-app-bg border border-app-border">
                {docJson.skills?.map((s, sIdx) => {
                  const sName = typeof s === 'string' ? s : s.name;
                  return (
                    <span
                      key={sIdx}
                      className="bg-white border border-app-border px-2 py-0.5 rounded text-xs flex items-center gap-1 font-medium"
                    >
                      <span>{sName}</span>
                      <button
                        onClick={() =>
                          updateDocumentModel((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, i) => i !== sIdx)
                          }))
                        }
                        className="text-gray-400 hover:text-status-danger"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Experience Bullets Editor */}
            {docJson.experience?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-content-primary uppercase text-brand-600">
                  Experience Bullets
                </h3>
                {docJson.experience.map((exp, eIdx) => (
                  <div key={eIdx} className="p-3 rounded-xl border border-app-border bg-app-bg space-y-2">
                    <div className="font-bold text-xs">
                      {exp.title} &nbsp;<span className="text-content-secondary font-normal">| {exp.company}</span>
                    </div>
                    <div className="space-y-1.5">
                      {exp.bullets?.map((b, bIdx) => (
                        <div key={bIdx} className="flex gap-1.5 items-start">
                          <span className="text-brand-500 mt-1">•</span>
                          <textarea
                            value={b}
                            onChange={(e) =>
                              updateDocumentModel((prev) => {
                                const next = { ...prev };
                                next.experience[eIdx].bullets[bIdx] = e.target.value;
                                return next;
                              })
                            }
                            rows={2}
                            className="flex-1 p-1.5 rounded border border-app-border text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects Bullets Editor */}
            {docJson.projects?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-content-primary uppercase text-brand-600">
                  Project Bullets
                </h3>
                {docJson.projects.map((proj, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-xl border border-app-border bg-app-bg space-y-2">
                    <div className="font-bold text-xs">{proj.name}</div>
                    <div className="space-y-1.5">
                      {proj.bullets?.map((b, bIdx) => (
                        <div key={bIdx} className="flex gap-1.5 items-start">
                          <span className="text-brand-500 mt-1">•</span>
                          <textarea
                            value={b}
                            onChange={(e) =>
                              updateDocumentModel((prev) => {
                                const next = { ...prev };
                                next.projects[pIdx].bullets[bIdx] = e.target.value;
                                return next;
                              })
                            }
                            rows={2}
                            className="flex-1 p-1.5 rounded border border-app-border text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: Right Live Preview + Collapsible Suggestions (4.5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recommendations Accordion / Cards */}
          {pendingSuggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-app-border p-4 shadow-xs">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSuggestionsOpen(!suggestionsOpen)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-semibold text-content-primary">
                    Tailoring Recommendations ({pendingSuggestions.length})
                  </span>
                </div>
                <span className="text-xs text-brand-600 font-medium">
                  {suggestionsOpen ? 'Collapse' : 'Expand'}
                </span>
              </div>

              {suggestionsOpen && (
                <div className="space-y-3 mt-3">
                  {pendingSuggestions.map((sugg, idx) => (
                    <SuggestionDiffViewer
                      key={idx}
                      suggestion={sugg}
                      onAccept={() => handleReviewSuggestion(sugg, 'accept')}
                      onReject={() => handleReviewSuggestion(sugg, 'reject')}
                      onEdit={(text) => handleReviewSuggestion(sugg, 'edit', text)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Document Preview Card */}
          <div className="bg-white rounded-2xl border border-app-border shadow-card p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-app-border">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Live Document Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewScale((s) => Math.max(0.6, s - 0.1))}
                  className="p-1 rounded text-content-secondary hover:text-content-primary"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-content-secondary font-mono w-8 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() => setPreviewScale((s) => Math.min(1.2, s + 0.1))}
                  className="p-1 rounded text-content-secondary hover:text-content-primary"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Render Container */}
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto p-2 bg-gray-100 rounded-xl border border-gray-200">
              <DocumentRenderer
                documentJson={docJson}
                templateId={templateId}
                scale={previewScale}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 border border-app-border">
            <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-500" />
                <h3 className="text-base font-bold text-content-primary">Version History</h3>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-content-secondary hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto text-xs">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-app-border bg-app-bg flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-content-primary">
                      Version {v.version_number}
                    </div>
                    <div className="text-[11px] text-content-secondary">{v.change_summary}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(v.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreVersion(v.id)}
                    className="px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft"
                  >
                    Restore
                  </button>
                </div>
              ))}
              {versions.length === 0 && (
                <p className="text-content-secondary text-center py-4">No revisions recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

