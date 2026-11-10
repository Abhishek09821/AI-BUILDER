import React from 'react';
import ModernAtsTemplate from './ModernAtsTemplate';
import CleanProfessionalTemplate from './CleanProfessionalTemplate';

export default function DocumentRenderer({ documentJson, templateId = 'modern-ats', scale = 1 }) {
  if (!documentJson) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-content-secondary bg-white rounded-xl border border-dashed border-app-border">
        <p className="text-sm">No document content available to preview.</p>
      </div>
    );
  }

  const TemplateComponent = templateId === 'clean-professional' ? CleanProfessionalTemplate : ModernAtsTemplate;

  return (
    <div
      className="w-full transition-transform origin-top"
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}
    >
      <TemplateComponent documentJson={documentJson} />
    </div>
  );
}

