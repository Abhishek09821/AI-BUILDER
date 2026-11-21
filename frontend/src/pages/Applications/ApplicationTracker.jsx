import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Calendar,
  FileText,
  Mail,
  ChevronRight,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  XCircle,
  Kanban,
  List
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const STATUS_COLUMNS = [
  { id: 'Draft', label: 'Draft', color: 'border-gray-300 bg-gray-50 text-gray-700' },
  { id: 'Ready to Apply', label: 'Ready to Apply', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'Applied', label: 'Already Applied', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'Assessment', label: 'Assessment', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { id: 'Interview', label: 'Interview', color: 'border-purple-200 bg-purple-50 text-purple-700' },
  { id: 'Offer', label: 'Offer', color: 'border-green-300 bg-green-50 text-green-700' },
  { id: 'Rejected', label: 'Application Rejected', color: 'border-red-300 bg-red-50 text-red-700' },
  { id: 'Withdrawn', label: 'Withdrawn Application', color: 'border-slate-300 bg-slate-50 text-slate-700' }
];

export default function ApplicationTracker({ onSelectResume, onSelectCoverLetter, onNavigate }) {
  const toast = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Edit notes modal
  const [activeNoteApp, setActiveNoteApp] = useState(null);
  const [notesText, setNotesText] = useState('');

  const loadApplications = async () => {
    try {
      setLoading(true);
      let queryParam = '';
      if (selectedStatus) queryParam = `?status=${selectedStatus}`;
      const data = await api.getApplications(queryParam);
      setApplications(data);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const updated = await api.updateApplication(appId, { status: newStatus });
      setApplications(applications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
      toast.success(`Moved application to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update application status');
    }
  };

  const handleDelete = async (appId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this tracked application?')) return;
    try {
      await api.deleteApplication(appId);
      setApplications(applications.filter((a) => a.id !== appId));
      toast.success('Application removed from tracker.');
    } catch (err) {
      toast.error('Failed to delete application');
    }
  };

  const handleSaveNotes = async () => {
    if (!activeNoteApp) return;
    try {
      await api.updateApplication(activeNoteApp.id, { notes: notesText });
      setApplications(applications.map((a) => (a.id === activeNoteApp.id ? { ...a, notes: notesText } : a)));
      toast.success('Notes saved.');
      setActiveNoteApp(null);
    } catch (err) {
      toast.error('Failed to update notes');
    }
  };

  const filtered = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.company || '').toLowerCase().includes(q) ||
      (app.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
            Application Tracker
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Organize your job search pipeline, interview stages, and linked resumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center border border-app-border rounded-xl p-0.5 bg-white">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-lavender-surface text-brand-600' : 'text-content-secondary'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-lavender-surface text-brand-600' : 'text-content-secondary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate('new-application')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New-Application</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-app-border p-4 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-content-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-content-secondary" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 rounded-xl border border-app-border bg-white text-xs font-medium focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses ({applications.length})</option>
            {STATUS_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[500px]">
          {STATUS_COLUMNS.map((col) => {
            const colApps = filtered.filter((a) => a.status === col.id);
            return (
              <div
                key={col.id}
                className="w-72 shrink-0 bg-slate-50/70 rounded-2xl border border-app-border p-3 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-app-border px-1">
                  <span className="font-bold text-xs text-content-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <span>{col.label}</span>
                  </span>
                  <span className="text-[10px] font-bold bg-white text-content-secondary px-2 py-0.5 rounded-full border border-app-border">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards in column */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl border border-app-border p-3.5 shadow-sm hover:border-brand-300 transition-all text-xs space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-content-primary line-clamp-1">{app.company}</div>
                          <div className="text-content-secondary text-[11px] line-clamp-1">{app.title}</div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(app.id, e)}
                          className="text-gray-400 hover:text-status-danger p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status Selector dropdown */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="w-full text-[11px] p-1 rounded-lg border border-app-border bg-app-bg text-content-primary"
                      >
                        {STATUS_COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>

                      {/* Linked documents buttons */}
                      <div className="pt-2 border-t border-app-border flex items-center justify-between text-[11px]">
                        {app.resume_document_id ? (
                          <button
                            onClick={() => onSelectResume(app.resume_document_id)}
                            className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">No resume</span>
                        )}

                        {app.cover_letter_id ? (
                          <button
                            onClick={() => onSelectCoverLetter(app.cover_letter_id)}
                            className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Cover Letter</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            setActiveNoteApp(app);
                            setNotesText(app.notes || '');
                          }}
                          className="text-content-secondary hover:text-content-primary"
                          title="Notes"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="text-center py-8 text-content-secondary text-[11px] border border-dashed border-app-border rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-app-border shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-app-bg border-b border-app-border text-content-secondary font-semibold">
              <tr>
                <th className="p-3.5">Company</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Linked Documents</th>
                <th className="p-3.5">Updated</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-content-primary">{app.company}</td>
                  <td className="p-3.5 text-content-secondary">{app.title}</td>
                  <td className="p-3.5">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="text-xs p-1 rounded-lg border border-app-border bg-white"
                    >
                      {STATUS_COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      {app.resume_document_id && (
                        <button
                          onClick={() => onSelectResume(app.resume_document_id)}
                          className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Resume</span>
                        </button>
                      )}
                      {app.cover_letter_id && (
                        <button
                          onClick={() => onSelectCoverLetter(app.cover_letter_id)}
                          className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Cover Letter</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-content-secondary">
                    {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={(e) => handleDelete(app.id, e)}
                      className="text-content-secondary hover:text-status-danger p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-content-secondary">
                    No matching applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Modal */}
      {activeNoteApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6 border border-app-border">
            <h3 className="text-base font-bold text-content-primary mb-1">
              Application Notes: {activeNoteApp.company}
            </h3>
            <p className="text-xs text-content-secondary mb-3">
              Add interviewer names, interview dates, questions asked, or referral contacts.
            </p>
            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Spoke with recruiter Jane, technical round scheduled for Thursday 2pm..."
              className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setActiveNoteApp(null)}
                className="px-3.5 py-1.5 rounded-xl border border-app-border text-xs text-content-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold text-xs shadow-soft"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

