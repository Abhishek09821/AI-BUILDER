import React, { useState } from 'react';
import { LayoutTemplate, CheckCircle2, Sparkles, ZoomIn } from 'lucide-react';
import DocumentRenderer from '../../components/resume-preview/DocumentRenderer';

const SAMPLE_DOCUMENT = {
  contact: {
    name: 'Siddharth Patel',
    headline: 'Senior Full Stack Engineer & Cloud Architect',
    email: 'siddharth@example.com',
    phone: '+1 (555) 321-7654',
    city_country: 'San Francisco, CA'
  },
  links: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/siddharth' },
    { label: 'GitHub', url: 'https://github.com/siddharth' },
    { label: 'Portfolio', url: 'https://siddharth.dev' }
  ],
  summary:
    'Senior Full Stack Engineer with 7+ years of experience designing high-throughput cloud architectures and resilient React interfaces. Proven track record of reducing latency by 40% and mentoring 12+ junior engineers.',
  skills: [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Languages' },
    { name: 'Python', category: 'Backend' },
    { name: 'Flask', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' }
  ],
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'CloudScale Global Inc.',
      dates: '2021 - Present',
      location: 'San Francisco, CA',
      bullets: [
        'Architected real-time analytics pipeline processing 25M daily transactions with 99.99% service availability.',
        'Led migration to modern React/Tailwind frontend, cutting initial bundle load time by 38%.'
      ]
    },
    {
      title: 'Full Stack Engineer',
      company: 'TechFlow Systems',
      dates: '2018 - 2021',
      location: 'Austin, TX',
      bullets: [
        'Built automated reporting microservices with Python and PostgreSQL, serving 120k active enterprise users.'
      ]
    }
  ],
  projects: [
    {
      name: 'Distributed Task Orchestrator',
      technologies: 'React, Python, Redis, WebSockets',
      repo_or_demo_url: 'https://github.com/siddharth/task-orchestrator',
      bullets: [
        'Engineered distributed task worker pool handling asynchronous job queues across 8 container instances.'
      ]
    }
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of California, Berkeley',
      dates: '2014 - 2018',
      grade: 'GPA 3.85'
    }
  ],
  section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
  section_visibility: {
    summary: true,
    skills: true,
    experience: true,
    projects: true,
    education: true
  }
};

export default function TemplatesGallery({ onNavigate }) {
  const [selectedTemplate, setSelectedTemplate] = useState('modern-ats');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span className="text-[11px] font-semibold bg-lavender-surface text-brand-600 px-2 py-0.5 rounded-full border border-lavender-border">
            Deterministic Controlled Layouts
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
          Template Showcase
        </h1>
        <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
          ApplyMate separates your career facts from document presentation. Changing templates updates typography and spacing without damaging your bullets or dropping hyperlinks.
        </p>
      </div>

      {/* Template Chooser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template 1: Modern ATS */}
        <div
          onClick={() => setSelectedTemplate('modern-ats')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedTemplate === 'modern-ats'
              ? 'border-brand-500 bg-lavender-surface/30 shadow-card'
              : 'border-app-border bg-white hover:border-brand-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-content-primary">Modern ATS</h3>
            {selectedTemplate === 'modern-ats' && (
              <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected</span>
              </span>
            )}
          </div>
          <p className="text-xs text-content-secondary leading-relaxed mb-3">
            Single-column, high parsability format designed specifically for automated applicant tracking systems (Greenhouse, Lever, Workday).
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-content-secondary">
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Single Column</span>
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Optimal Spacing</span>
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Standard Headings</span>
          </div>
        </div>

        {/* Template 2: Clean Professional */}
        <div
          onClick={() => setSelectedTemplate('clean-professional')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedTemplate === 'clean-professional'
              ? 'border-brand-500 bg-lavender-surface/30 shadow-card'
              : 'border-app-border bg-white hover:border-brand-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-content-primary">Clean Professional</h3>
            {selectedTemplate === 'clean-professional' && (
              <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected</span>
              </span>
            )}
          </div>
          <p className="text-xs text-content-secondary leading-relaxed mb-3">
            Subtle visual hierarchy with elegant brand purple dividers, highlighted candidate metadata, and clean modern styling.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-content-secondary">
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Executive Readability</span>
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Brand Accents</span>
            <span className="bg-white border border-app-border px-2 py-0.5 rounded">Polished Typography</span>
          </div>
        </div>
      </div>

      {/* Live Template Interactive Preview */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <div>
            <h2 className="text-sm font-bold text-content-primary">
              Live Rendering: <span className="capitalize text-brand-600">{selectedTemplate.replace('-', ' ')}</span>
            </h2>
            <p className="text-xs text-content-secondary">
              Shown below with sample engineer profile data.
            </p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft"
          >
            Use with My Profile
          </button>
        </div>

        <div className="bg-gray-100 p-4 sm:p-8 rounded-xl border border-gray-200 overflow-x-auto">
          <DocumentRenderer
            documentJson={SAMPLE_DOCUMENT}
            templateId={selectedTemplate}
            scale={0.9}
          />
        </div>
      </div>
    </div>
  );
}

