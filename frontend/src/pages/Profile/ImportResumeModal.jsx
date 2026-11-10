import React, { useState } from 'react';
import { UploadCloud, FileText, Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function ImportResumeModal({ isOpen, onClose, onImportSuccess }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stagedImport, setStagedImport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [committing, setCommitting] = useState(false);

  // Editable staging fields
  const [editedPayload, setEditedPayload] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['docx', 'pdf'].includes(ext)) {
        setErrorMsg('Please select a .docx or .pdf file.');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadResumeImport(formData);
      setStagedImport(res.import);
      setEditedPayload(res.import.extracted_payload || {});
      toast.success('Resume parsed successfully! Review the extracted facts below before saving.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload and parse resume.');
      toast.error('Could not parse resume file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!stagedImport) return;
    setCommitting(true);
    try {
      await api.confirmImport(stagedImport.id, { approved_payload: editedPayload });
      toast.success('Imported career facts successfully added to your Master Profile!');
      onImportSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to commit import to profile.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full max-h-[90vh] flex flex-col border border-app-border">
        {/* Header */}
        <div className="p-5 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lavender-surface text-brand-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Import Existing Resume</h2>
              <p className="text-xs text-content-secondary">
                Upload your DOCX (recommended) or PDF resume to seed your Master Profile.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-content-secondary hover:text-content-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-status-danger flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!stagedImport ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-lavender-surface/30 rounded-2xl p-8 text-center cursor-pointer transition-all"
                onClick={() => document.getElementById('resume-file-input').click()}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText className="w-10 h-10 text-brand-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-content-primary">
                  {file ? file.name : 'Click to select or drag and drop your resume'}
                </p>
                <p className="text-xs text-content-secondary mt-1">
                  Supported formats: Microsoft Word (.docx) & PDF (.pdf)
                </p>
                {file && (
                  <span className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                    {(file.size / 1024).toFixed(1)} KB selected
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-app-border text-[11px] text-content-secondary flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>
                  ApplyMate performs structured section parsing. You will have full opportunity to review, correct, and verify all extracted fields before anything is saved.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-app-border text-content-secondary hover:text-content-primary font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadAndParse}
                  disabled={!file || uploading}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-soft disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Parsing Document...</span>
                    </>
                  ) : (
                    <span>Upload & Review</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review Extracted Data Screen */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-900 text-xs">
                <b>Review Extracted Facts:</b> Check the detected values below. You can edit any field before confirming.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-content-primary">Full Name</label>
                  <input
                    type="text"
                    value={editedPayload?.name || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, name: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-content-primary">Headline</label>
                  <input
                    type="text"
                    value={editedPayload?.headline || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, headline: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-content-primary">Email</label>
                  <input
                    type="text"
                    value={editedPayload?.email || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, email: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-content-primary">Phone</label>
                  <input
                    type="text"
                    value={editedPayload?.phone || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, phone: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-content-primary">Professional Summary</label>
                <textarea
                  value={editedPayload?.summary || ''}
                  onChange={(e) => setEditedPayload({ ...editedPayload, summary: e.target.value })}
                  rows={3}
                  className="w-full mt-1 p-2 rounded-lg border border-app-border text-xs focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-content-primary">Detected Skills ({editedPayload?.skills?.length || 0})</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-app-border">
                  {editedPayload?.skills?.map((s, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] font-medium text-gray-800">
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                  {(!editedPayload?.skills || editedPayload.skills.length === 0) && (
                    <span className="text-gray-400 italic">No skills automatically classified</span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-content-primary">
                  Detected Experience Entries ({editedPayload?.experiences?.length || 0})
                </label>
                <div className="space-y-1.5 mt-1 max-h-32 overflow-y-auto">
                  {editedPayload?.experiences?.map((exp, idx) => (
                    <div key={idx} className="p-2 rounded bg-gray-50 border border-app-border">
                      <span className="font-bold">{exp.title}</span> at <span className="font-medium">{exp.company}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setStagedImport(null)}
                  className="text-xs text-content-secondary hover:underline"
                >
                  Choose different file
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-app-border text-content-secondary hover:text-content-primary font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={committing}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-soft flex items-center gap-1.5"
                  >
                    {committing ? 'Committing...' : 'Confirm & Commit to Master Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

