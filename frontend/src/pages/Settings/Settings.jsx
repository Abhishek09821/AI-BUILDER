import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const toast = useToast();

  const [defaultTemplate, setDefaultTemplate] = useState(profile?.default_template_id || 'modern-ats');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveDefaultTemplate = async () => {
    setSavingTemplate(true);
    try {
      await api.updateProfile({ default_template_id: defaultTemplate });
      toast.success('Default template preference saved!');
    } catch (err) {
      toast.error('Failed to update template preference');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applymate-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('User data archive downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export account data');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. Type "DELETE" to confirm:'
    );
    if (confirmation !== 'DELETE') {
      toast.info('Account deletion cancelled.');
      return;
    }

    setDeleting(true);
    try {
      await api.deleteAccount();
      toast.success('Your account and all associated data have been permanently deleted.');
      logout();
    } catch (err) {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs text-content-secondary mt-1">
          Manage your account preferences, document templates, and data privacy controls.
        </p>
      </div>

      {/* 1. Account Details */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-app-border">
          <User className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-bold text-content-primary">Account Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-content-secondary block mb-1">Email Address</label>
            <div className="font-semibold text-content-primary p-2.5 bg-app-bg rounded-xl border border-app-border">
              {user?.email}
            </div>
          </div>
          <div>
            <label className="text-content-secondary block mb-1">Name</label>
            <div className="font-semibold text-content-primary p-2.5 bg-app-bg rounded-xl border border-app-border">
              {user?.name || 'Not provided'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Document Preferences */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-app-border">
          <SettingsIcon className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-bold text-content-primary">Document Preferences</h2>
        </div>

        <div className="text-xs space-y-3">
          <label className="font-semibold text-content-primary block">Default Resume Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <label
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between ${
                defaultTemplate === 'modern-ats' ? 'border-brand-500 bg-lavender-surface' : 'border-app-border bg-white'
              }`}
            >
              <div>
                <div className="font-bold text-content-primary">Modern ATS</div>
                <div className="text-[11px] text-content-secondary">Single-column high parsability</div>
              </div>
              <input
                type="radio"
                name="defaultTemplate"
                value="modern-ats"
                checked={defaultTemplate === 'modern-ats'}
                onChange={() => setDefaultTemplate('modern-ats')}
                className="text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between ${
                defaultTemplate === 'clean-professional' ? 'border-brand-500 bg-lavender-surface' : 'border-app-border bg-white'
              }`}
            >
              <div>
                <div className="font-bold text-content-primary">Clean Professional</div>
                <div className="text-[11px] text-content-secondary">Subtle visual accents & hierarchy</div>
              </div>
              <input
                type="radio"
                name="defaultTemplate"
                value="clean-professional"
                checked={defaultTemplate === 'clean-professional'}
                onChange={() => setDefaultTemplate('clean-professional')}
                className="text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>

          <button
            onClick={handleSaveDefaultTemplate}
            disabled={savingTemplate}
            className="mt-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition-all"
          >
            {savingTemplate ? 'Saving...' : 'Save Preference'}
          </button>
        </div>
      </div>

      {/* 3. AI Safety & Privacy Disclosure */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-app-border">
          <Shield className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-bold text-content-primary">AI Safety & Privacy Architecture</h2>
        </div>

        <div className="text-xs text-content-secondary space-y-3 leading-relaxed">
          <p>
            <b>Evidence Provenance:</b> ApplyMate enforces server-side validation on every AI generation. Content suggestions strictly reference verified fact IDs from your Master Career Profile.
          </p>
          <p>
            <b>No Autonomous External Actions:</b> ApplyMate never submits job applications, contacts recruiters, or applies to portals without your explicit direct action. You remain 100% in control of all documents and submissions.
          </p>
          <p>
            <b>Private Storage:</b> Your uploaded DOCX/PDF resumes and exported files are stored in private isolated storage with user ownership checks enforced on every read/write.
          </p>
        </div>
      </div>

      {/* 4. Data Export & Deletion (GDPR) */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-app-border">
          <Download className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-bold text-content-primary">Data Export & Account Deletion</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h3 className="text-xs font-bold text-content-primary">Export All Account Data</h3>
            <p className="text-[11px] text-content-secondary">
              Download your complete Master Profile facts, jobs, tailored resumes, and versions as a structured JSON archive.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={exportingData}
            className="px-3.5 py-2 rounded-xl border border-brand-200 text-brand-600 hover:bg-lavender-surface text-xs font-semibold shrink-0"
          >
            {exportingData ? 'Generating Archive...' : 'Download JSON Export'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-app-border">
          <div>
            <h3 className="text-xs font-bold text-status-danger">Delete Account & Data</h3>
            <p className="text-[11px] text-content-secondary">
              Permanently erase your account, career facts, and all document versions. This cannot be undone.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-status-danger hover:bg-red-100 text-xs font-semibold shrink-0"
          >
            {deleting ? 'Deleting...' : 'Permanently Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

