import React, { useState } from 'react';
import { Check, X, Edit3, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SuggestionDiffViewer({
  suggestion,
  onAccept,
  onReject,
  onEdit,
  loading = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState(suggestion.suggested_text || '');

  const handleSaveEdit = () => {
    onEdit(customText);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-app-border shadow-xs p-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-app-border">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-content-primary">
            {suggestion.type === 'summary' ? 'Summary Tailoring' : `${suggestion.section || 'Bullet'} Improvement`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-content-secondary font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Verified Fact Evidence</span>
        </div>
      </div>

      {/* Diff comparison */}
      <div className="space-y-3 mb-4">
        {suggestion.original_text && (
          <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-100 text-xs">
            <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Current Version</div>
            <p className="text-gray-700 line-through opacity-80 leading-relaxed">
              {suggestion.original_text}
            </p>
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-green-50/70 border border-green-200 text-xs">
          <div className="text-[10px] font-bold text-green-700 uppercase mb-1 flex items-center justify-between">
            <span>Tailored Suggestion</span>
            {suggestion.change_type && (
              <span className="font-normal lowercase opacity-75">({suggestion.change_type})</span>
            )}
          </div>
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                className="w-full text-xs p-2 rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 text-[11px] rounded bg-brand-500 text-white font-medium hover:bg-brand-600"
                >
                  Save & Accept
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-900 font-medium leading-relaxed">
              {suggestion.suggested_text}
            </p>
          )}
        </div>
      </div>

      {/* Warnings if any */}
      {suggestion.warnings && suggestion.warnings.length > 0 && (
        <div className="mb-3 p-2 rounded bg-amber-50 border border-amber-200 flex items-start gap-1.5 text-[11px] text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{suggestion.warnings.join(', ')}</span>
        </div>
      )}

      {/* Action controls */}
      {!isEditing && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-content-secondary hover:text-status-danger hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-lavender-surface transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={onAccept}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Suggestion</span>
          </button>
        </div>
      )}
    </div>
  );
}

