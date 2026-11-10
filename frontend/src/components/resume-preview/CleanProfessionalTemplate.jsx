import React from 'react';
import { ExternalLink, Mail, Phone, MapPin } from 'lucide-react';

export default function CleanProfessionalTemplate({ documentJson }) {
  if (!documentJson) return null;

  const contact = documentJson.contact || {};
  const links = documentJson.links || [];
  const sectionOrder = documentJson.section_order || ['summary', 'skills', 'experience', 'projects', 'education'];
  const visibility = documentJson.section_visibility || {};

  const isVisible = (sec) => visibility[sec] !== false;

  return (
    <div className="bg-white text-content-primary font-sans p-8 sm:p-12 shadow-sm rounded-lg max-w-[850px] mx-auto text-[13px] leading-relaxed select-text border border-lavender-border">
      {/* Header with Brand Styling */}
      <header className="pb-5 border-b-2 border-brand-500 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-600">
              {contact.name || 'Your Full Name'}
            </h1>
            {contact.headline && (
              <p className="text-sm font-semibold text-content-secondary mt-0.5">
                {contact.headline}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-content-secondary space-y-1">
            {contact.email && (
              <div>
                <a href={`mailto:${contact.email}`} className="hover:text-brand-600 transition-colors">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && <div>{contact.phone}</div>}
            {contact.city_country && <div>{contact.city_country}</div>}
          </div>
        </div>

        {/* Links row */}
        {links.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-medium">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{link.label || link.url}</span>
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-6">
        {sectionOrder.map((sectionKey) => {
          if (!isVisible(sectionKey)) return null;

          // 1. Summary
          if (sectionKey === 'summary' && documentJson.summary) {
            return (
              <section key="summary">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Professional Summary
                  </h2>
                  <div className="flex-1 h-px bg-lavender-border" />
                </div>
                <p className="text-content-primary leading-relaxed text-justify text-xs sm:text-[13px]">
                  {documentJson.summary}
                </p>
              </section>
            );
          }

          // 2. Skills
          if (sectionKey === 'skills' && documentJson.skills?.length > 0) {
            return (
              <section key="skills">
                <div className="flex items-center gap-3 mb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Key Competencies
                  </h2>
                  <div className="flex-1 h-px bg-lavender-border" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {documentJson.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="bg-lavender-surface text-brand-700 border border-lavender-border text-xs px-2.5 py-1 rounded-md font-medium"
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
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Professional Experience
                  </h2>
                  <div className="flex-1 h-px bg-lavender-border" />
                </div>
                <div className="space-y-4">
                  {documentJson.experience.map((exp, idx) => (
                    <div key={idx} className="relative pl-3 border-l-2 border-brand-200">
                      <div className="flex justify-between items-baseline mb-1">
                        <div>
                          <span className="font-bold text-content-primary">{exp.title}</span>
                          <span className="text-content-secondary font-medium"> &nbsp;•&nbsp; {exp.company}</span>
                        </div>
                        <span className="text-xs text-content-secondary font-semibold italic">
                          {exp.location ? `${exp.location} | ` : ''}{exp.dates}
                        </span>
                      </div>
                      {exp.bullets && exp.bullets.length > 0 ? (
                        <ul className="list-disc list-outside pl-4 space-y-1.5 text-content-primary text-xs">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : exp.description ? (
                        <p className="text-xs text-content-primary">{exp.description}</p>
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
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Featured Projects
                  </h2>
                  <div className="flex-1 h-px bg-lavender-border" />
                </div>
                <div className="space-y-3.5">
                  {documentJson.projects.map((proj, idx) => (
                    <div key={idx} className="relative pl-3 border-l-2 border-brand-200">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="font-bold text-content-primary flex items-center gap-2">
                          <span>{proj.name}</span>
                          {proj.technologies && (
                            <span className="font-normal text-xs text-brand-600 bg-lavender-surface px-1.5 py-0.5 rounded">
                              {proj.technologies}
                            </span>
                          )}
                        </div>
                        {proj.repo_or_demo_url && (
                          <a
                            href={proj.repo_or_demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-500 hover:text-brand-700 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>View</span>
                          </a>
                        )}
                      </div>
                      {proj.bullets && proj.bullets.length > 0 ? (
                        <ul className="list-disc list-outside pl-4 space-y-1.5 text-content-primary text-xs">
                          {proj.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : proj.description ? (
                        <p className="text-xs text-content-primary">{proj.description}</p>
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
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Education
                  </h2>
                  <div className="flex-1 h-px bg-lavender-border" />
                </div>
                <div className="space-y-2.5">
                  {documentJson.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-content-primary">{edu.degree}</span>
                        <span className="text-content-secondary"> — {edu.institution}</span>
                        {edu.grade && <span className="text-xs text-content-secondary font-medium"> ({edu.grade})</span>}
                      </div>
                      <span className="text-xs text-content-secondary font-medium">{edu.dates}</span>
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

