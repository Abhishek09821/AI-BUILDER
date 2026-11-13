import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Cpu,
  Award,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  UploadCloud,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ImportResumeModal from './ImportResumeModal';

export default function MasterProfile({ onNavigate, onSelectResume }) {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [facts, setFacts] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSavingBasics, setIsSavingBasics] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Basic Profile Form State
  const [basicForm, setBasicForm] = useState({
    name: '',
    headline: '',
    email: '',
    phone: '',
    city_country: '',
    portfolio_url: '',
    summary: '',
    default_template_id: 'modern-ats'
  });

  // Modal / Form state for adding items
  const [activeModal, setActiveModal] = useState(null); // 'skill' | 'experience' | 'project' | 'education' | 'link'
  const [itemForm, setItemForm] = useState({});

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setFacts(data.facts || []);
      setLinks(data.links || []);
      setBasicForm({
        name: data.name || '',
        headline: data.headline || '',
        email: data.email || '',
        phone: data.phone || '',
        city_country: data.city_country || '',
        portfolio_url: data.portfolio_url || '',
        summary: data.summary || '',
        default_template_id: data.default_template_id || 'modern-ats'
      });
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSaveBasics = async (e) => {
    e.preventDefault();
    setIsSavingBasics(true);
    try {
      const updated = await api.updateProfile(basicForm);
      setProfile(updated);
      toast.success('Basic profile details updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile basics');
    } finally {
      setIsSavingBasics(false);
    }
  };

  const handleCreateFact = async (type, payload) => {
    try {
      const newFact = await api.createFact({
        type,
        data: payload,
        is_verified: true,
        source: 'manual'
      });
      setFacts([...facts, newFact]);
      toast.success(`New ${type} record added.`);
      setActiveModal(null);
      setItemForm({});
    } catch (err) {
      toast.error('Failed to add record');
    }
  };

  const handleDeleteFact = async (factId) => {
    if (!window.confirm('Are you sure you want to delete this fact from your profile?')) return;
    try {
      await api.deleteFact(factId);
      setFacts(facts.filter((f) => f.id !== factId));
      toast.success('Record removed.');
    } catch (err) {
      toast.error('Failed to delete fact');
    }
  };

  const handleCreateLink = async () => {
    if (!itemForm.label || !itemForm.url) {
      toast.error('Label and URL are required');
      return;
    }
    try {
      const link = await api.createLink({
        label: itemForm.label,
        url: itemForm.url,
        link_type: itemForm.link_type || 'other'
      });
      setLinks([...links, link]);
      toast.success('Link added.');
      setActiveModal(null);
      setItemForm({});
    } catch (err) {
      toast.error('Failed to add link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await api.deleteLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
      toast.success('Link deleted');
    } catch (err) {
      toast.error('Failed to delete link');
    }
  };

  const handleGenerateMasterResume = async () => {
    try {
      const res = await api.createMasterResume();
      toast.success('Master Resume document updated from profile!');
      onSelectResume(res.id);
    } catch (err) {
      toast.error('Failed to generate master resume');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-white rounded-2xl border border-app-border" />
        <div className="h-80 bg-white rounded-2xl border border-app-border" />
      </div>
    );
  }

  // Filter facts by type
  const skillsFacts = facts.filter((f) => f.type === 'skill');
  const expFacts = facts.filter((f) => f.type === 'experience');
  const projFacts = facts.filter((f) => f.type === 'project');
  const eduFacts = facts.filter((f) => f.type === 'education');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-content-primary">Master Career Profile</h1>
            <span className="text-[11px] font-semibold bg-lavender-surface text-brand-600 px-2 py-0.5 rounded-full border border-lavender-border">
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-content-secondary max-w-xl">
            Store your verified experience and skills once. Tailored resumes for each job application will reference these facts without changing your master data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-brand-200 text-brand-600 font-semibold text-xs hover:bg-lavender-surface transition-all"
          >
            <UploadCloud className="w-4 h-4 text-brand-500" />
            <span>Import Resume (DOCX/PDF)</span>
          </button>

          <button
            onClick={handleGenerateMasterResume}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Sync Master Resume</span>
          </button>
        </div>
      </div>

      {/* 1. Contact Details & Professional Summary */}
      <form onSubmit={handleSaveBasics} className="bg-white rounded-2xl border border-app-border shadow-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Contact & Professional Summary</h2>
          </div>
          <button
            type="submit"
            disabled={isSavingBasics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingBasics ? 'Saving...' : 'Save Basics'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-content-primary mb-1 block">Full Name</label>
            <input
              type="text"
              value={basicForm.name}
              onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
              placeholder="e.g. Jane Doe"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Professional Headline</label>
            <input
              type="text"
              value={basicForm.headline}
              onChange={(e) => setBasicForm({ ...basicForm, headline: e.target.value })}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Email</label>
            <input
              type="email"
              value={basicForm.email}
              onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
              placeholder="jane@example.com"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Phone</label>
            <input
              type="text"
              value={basicForm.phone}
              onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">City / Country</label>
            <input
              type="text"
              value={basicForm.city_country}
              onChange={(e) => setBasicForm({ ...basicForm, city_country: e.target.value })}
              placeholder="San Francisco, CA, USA"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Portfolio / Personal Website</label>
            <input
              type="url"
              value={basicForm.portfolio_url}
              onChange={(e) => setBasicForm({ ...basicForm, portfolio_url: e.target.value })}
              placeholder="https://janedoe.dev"
              className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-content-primary mb-1 block text-xs">
            Professional Summary (Master Source)
          </label>
          <textarea
            value={basicForm.summary}
            onChange={(e) => setBasicForm({ ...basicForm, summary: e.target.value })}
            rows={3}
            placeholder="Brief overview of your background, core areas of expertise, and technical philosophy..."
            className="w-full p-2.5 rounded-xl border border-app-border text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
          />
        </div>
      </form>

      {/* 2. Professional Links */}
      <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Professional Links ({links.length})</h2>
          </div>
          <button
            onClick={() => {
              setItemForm({ label: '', url: '', link_type: 'linkedin' });
              setActiveModal('link');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 hover:bg-brand-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-border bg-app-bg text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-500" />
              <a href={l.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
                {l.label}
              </a>
              <span className="text-[10px] text-content-secondary truncate max-w-[150px]">({l.url})</span>
              <button
                onClick={() => handleDeleteLink(l.id)}
                className="text-content-secondary hover:text-status-danger ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-xs text-content-secondary italic">No links added yet (e.g. LinkedIn, GitHub, Portfolio).</p>
          )}
        </div>
      </div>

      {/* 3. Verified Skills */}
      <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Verified Skills & Tools ({skillsFacts.length})</h2>
          </div>
          <button
            onClick={() => {
              setItemForm({ name: '', category: 'Programming Languages' });
              setActiveModal('skill');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 hover:bg-brand-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {skillsFacts.map((sf) => (
            <div
              key={sf.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-700 border border-lavender-border text-xs font-medium"
            >
              <CheckCircle className="w-3 h-3 text-status-success shrink-0" />
              <span>{sf.data?.name}</span>
              {sf.data?.category && (
                <span className="text-[10px] text-content-secondary opacity-75">({sf.data.category})</span>
              )}
              <button
                onClick={() => handleDeleteFact(sf.id)}
                className="text-brand-400 hover:text-status-danger ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {skillsFacts.length === 0 && (
            <p className="text-xs text-content-secondary italic">No skills added yet. Click "+ Add Skill" or import a resume.</p>
          )}
        </div>
      </div>

      {/* 4. Work Experience */}
      <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Work Experience & Internships ({expFacts.length})</h2>
          </div>
          <button
            onClick={() => {
              setItemForm({ company: '', title: '', dates: '', location: '', description: '', bullets: [''] });
              setActiveModal('experience');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 hover:bg-brand-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        </div>

        <div className="space-y-4">
          {expFacts.map((ef) => (
            <div key={ef.id} className="p-4 rounded-xl border border-app-border bg-app-bg text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-content-primary">{ef.data?.title}</h3>
                  <div className="text-content-secondary font-medium">
                    {ef.data?.company} {ef.data?.location ? `• ${ef.data.location}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-content-secondary">{ef.data?.dates}</span>
                  <button
                    onClick={() => handleDeleteFact(ef.id)}
                    className="text-content-secondary hover:text-status-danger p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {ef.data?.bullets && ef.data.bullets.length > 0 && (
                <ul className="list-disc list-outside pl-4 space-y-1 text-content-primary text-xs">
                  {ef.data.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {expFacts.length === 0 && (
            <p className="text-xs text-content-secondary italic">No work experience entries yet.</p>
          )}
        </div>
      </div>

      {/* 5. Featured Projects */}
      <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Featured Projects ({projFacts.length})</h2>
          </div>
          <button
            onClick={() => {
              setItemForm({ name: '', technologies: '', repo_or_demo_url: '', description: '', bullets: [''] });
              setActiveModal('project');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 hover:bg-brand-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        <div className="space-y-4">
          {projFacts.map((pf) => (
            <div key={pf.id} className="p-4 rounded-xl border border-app-border bg-app-bg text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-content-primary">{pf.data?.name}</h3>
                  {pf.data?.technologies && (
                    <div className="text-[11px] text-brand-600 font-medium">Stack: {pf.data.technologies}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pf.data?.repo_or_demo_url && (
                    <a
                      href={pf.data.repo_or_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-0.5 text-xs font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteFact(pf.id)}
                    className="text-content-secondary hover:text-status-danger p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {pf.data?.bullets && pf.data.bullets.length > 0 && (
                <ul className="list-disc list-outside pl-4 space-y-1 text-content-primary text-xs">
                  {pf.data.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {projFacts.length === 0 && (
            <p className="text-xs text-content-secondary italic">No projects added yet.</p>
          )}
        </div>
      </div>

      {/* 6. Education */}
      <div className="bg-white rounded-2xl border border-app-border shadow-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-app-border mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-content-primary">Education ({eduFacts.length})</h2>
          </div>
          <button
            onClick={() => {
              setItemForm({ institution: '', degree: '', dates: '', grade: '' });
              setActiveModal('education');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender-surface text-brand-600 hover:bg-brand-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        <div className="space-y-3">
          {eduFacts.map((ed) => (
            <div key={ed.id} className="p-3 rounded-xl border border-app-border bg-app-bg text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-content-primary">{ed.data?.degree}</span>
                <span className="text-content-secondary"> &nbsp;•&nbsp; {ed.data?.institution}</span>
                {ed.data?.grade && <span className="text-content-secondary italic"> ({ed.data.grade})</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-content-secondary font-medium">{ed.data?.dates}</span>
                <button
                  onClick={() => handleDeleteFact(ed.id)}
                  className="text-content-secondary hover:text-status-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {eduFacts.length === 0 && (
            <p className="text-xs text-content-secondary italic">No education entries yet.</p>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 border border-app-border">
            <h3 className="text-base font-bold text-content-primary mb-4 capitalize">
              Add {activeModal}
            </h3>

            {activeModal === 'skill' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. React, PostgreSQL, Docker"
                    value={itemForm.name || ''}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={itemForm.category || 'General'}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500 bg-white"
                  >
                    <option value="Programming Languages">Programming Languages</option>
                    <option value="Frameworks & Libraries">Frameworks & Libraries</option>
                    <option value="Databases & Cloud">Databases & Cloud</option>
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 rounded-xl border text-content-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateFact('skill', { name: itemForm.name, category: itemForm.category })}
                    className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'experience' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={itemForm.title || ''}
                      onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Startup"
                      value={itemForm.company || ''}
                      onChange={(e) => setItemForm({ ...itemForm, company: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Dates</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022 - Present"
                      value={itemForm.dates || ''}
                      onChange={(e) => setItemForm({ ...itemForm, dates: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / New York"
                      value={itemForm.location || ''}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Bullet Point / Achievement</label>
                  <textarea
                    rows={2}
                    placeholder="Describe technical impact, metrics, or technologies used..."
                    value={itemForm.bullet || ''}
                    onChange={(e) => setItemForm({ ...itemForm, bullet: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 rounded-xl border text-content-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleCreateFact('experience', {
                        title: itemForm.title,
                        company: itemForm.company,
                        dates: itemForm.dates,
                        location: itemForm.location,
                        bullets: itemForm.bullet ? [itemForm.bullet] : []
                      })
                    }
                    className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold"
                  >
                    Add Experience
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'project' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Workflow Orchestrator"
                    value={itemForm.name || ''}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Tech Stack</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Python, PostgreSQL"
                      value={itemForm.technologies || ''}
                      onChange={(e) => setItemForm({ ...itemForm, technologies: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Repo / Demo URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={itemForm.repo_or_demo_url || ''}
                      onChange={(e) => setItemForm({ ...itemForm, repo_or_demo_url: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Key Outcome / Bullet</label>
                  <textarea
                    rows={2}
                    placeholder="Engineered high throughput event pipeline handling 10k req/sec..."
                    value={itemForm.bullet || ''}
                    onChange={(e) => setItemForm({ ...itemForm, bullet: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 rounded-xl border text-content-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleCreateFact('project', {
                        name: itemForm.name,
                        technologies: itemForm.technologies,
                        repo_or_demo_url: itemForm.repo_or_demo_url,
                        bullets: itemForm.bullet ? [itemForm.bullet] : []
                      })
                    }
                    className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'education' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.S. in Computer Science"
                    value={itemForm.degree || ''}
                    onChange={(e) => setItemForm({ ...itemForm, degree: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. University of California, Berkeley"
                    value={itemForm.institution || ''}
                    onChange={(e) => setItemForm({ ...itemForm, institution: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Dates</label>
                    <input
                      type="text"
                      placeholder="e.g. 2020 - 2024"
                      value={itemForm.dates || ''}
                      onChange={(e) => setItemForm({ ...itemForm, dates: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Grade (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. GPA 3.9"
                      value={itemForm.grade || ''}
                      onChange={(e) => setItemForm({ ...itemForm, grade: e.target.value })}
                      className="w-full p-2 rounded-lg border border-app-border"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 rounded-xl border text-content-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleCreateFact('education', {
                        degree: itemForm.degree,
                        institution: itemForm.institution,
                        dates: itemForm.dates,
                        grade: itemForm.grade
                      })
                    }
                    className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold"
                  >
                    Add Education
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'link' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Label</label>
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn, GitHub, Tech Blog"
                    value={itemForm.label || ''}
                    onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={itemForm.url || ''}
                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                    className="w-full p-2 rounded-lg border border-app-border"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 rounded-xl border text-content-secondary">
                    Cancel
                  </button>
                  <button onClick={handleCreateLink} className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-semibold">
                    Add Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Resume Modal */}
      <ImportResumeModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => loadProfileData()}
      />
    </div>
  );
}

