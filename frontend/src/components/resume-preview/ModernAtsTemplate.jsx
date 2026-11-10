import React from 'react';
import { ExternalLink, Mail, Phone, MapPin } from 'lucide-react';

export default function ModernAtsTemplate({ documentJson }) {
  if (!documentJson) return null;

  const contact = documentJson.contact || {};
  const links = documentJson.links || [];
  const sectionOrder = documentJson.section_order || ['summary', 'skills', 'experience', 'projects', 'education'];
  const visibility = documentJson.section_visibility || {};

  const isVisible = (sec) => visibility[sec] !== false;

  return (
    <div className="bg-white text-content-primary font-sans p-8 sm:p-12 shadow-sm rounded-lg max-w-[850px] mx-auto text-[13px] leading-relaxed select-text border border-app-border">
      {/* Header */}
      <header className="text-center pb-4 border-b border-gray-200 mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
          {contact.name || 'Your Full Name'}
        </h1>
        {contact.headline && (
          <p className="text-sm font-medium text-gray-600 mb-2">
            {contact.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="hover:underline flex items-center gap-1">
              <Mail className="w-3 h-3 text-gray-400" />
              <span>{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span>{contact.phone}</span>
            </span>
          )}
          {contact.city_country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>{contact.city_country}</span>
            </span>
          )}
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 hover:underline flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{link.label || link.url}</span>
            </a>
          ))}
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-5">
        {sectionOrder.map((sectionKey) => {
          if (!isVisible(sectionKey)) return null;

          // 1. Summary
          if (sectionKey === 'summary' && documentJson.summary) {
            return (
              <section key="summary">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-gray-700 leading-normal text-justify">
                  {documentJson.summary}
                </p>
              </section>
            );
          }

          // 2. Skills
          if (sectionKey === 'skills' && documentJson.skills?.length > 0) {
            return (
              <section key="skills">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2">
                  Core Skills & Technologies
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {documentJson.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium"
                    >
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                </div>
              </section>
            );
          }

          // 3. Experience
          if (sectionKey === 'experience' && documentJson.experience?.length > 0) {
            return (
              <section key="experience">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {documentJson.experience.map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-gray-900">
                          {exp.title} &nbsp;<span className="font-normal text-gray-600">| {exp.company}</span>
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {exp.location ? `${exp.location} • ` : ''}{exp.dates}
                        </span>
                      </div>
                      {exp.bullets && exp.bullets.length > 0 ? (
                        <ul className="list-disc list-outside pl-4 space-y-1 text-gray-700 text-xs">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : exp.description ? (
                        <p className="text-xs text-gray-700">{exp.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 4. Projects
          if (sectionKey === 'projects' && documentJson.projects?.length > 0) {
            return (
              <section key="projects">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Featured Projects
                </h2>
                <div className="space-y-3.5">
                  {documentJson.projects.map((proj, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          {proj.technologies && (
                            <span className="font-normal text-xs text-gray-500">
                              ({proj.technologies})
                            </span>
                          )}
                        </div>
                        {proj.repo_or_demo_url && (
                          <a
                            href={proj.repo_or_demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Link</span>
                          </a>
                        )}
                      </div>
                      {proj.bullets && proj.bullets.length > 0 ? (
                        <ul className="list-disc list-outside pl-4 space-y-1 text-gray-700 text-xs">
                          {proj.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : proj.description ? (
                        <p className="text-xs text-gray-700">{proj.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 5. Education
          if (sectionKey === 'education' && documentJson.education?.length > 0) {
            return (
              <section key="education">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Education
                </h2>
                <div className="space-y-2">
                  {documentJson.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-gray-900">{edu.degree}</span>
                        <span className="text-gray-600"> — {edu.institution}</span>
                        {edu.grade && <span className="text-xs text-gray-500"> ({edu.grade})</span>}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{edu.dates}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // 6. Certifications
          if (sectionKey === 'certifications' && documentJson.certifications?.length > 0) {
            return (
              <section key="certifications">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2">
                  Certifications
                </h2>
                <div className="space-y-1 text-xs text-gray-700">
                  {documentJson.certifications.map((c, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-semibold text-gray-800">{c.name} {c.issuer ? `• ${c.issuer}` : ''}</span>
                      <span className="text-gray-500">{c.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

