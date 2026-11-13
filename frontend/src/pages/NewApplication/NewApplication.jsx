import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Globe,
  MapPin,
  FileText,
  AlertCircle,
  ArrowRight,
  DownloadCloud,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function NewApplication({ onJobCreated, onNavigate }) {
  const toast = useToast();

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [source, setSource] = useState('LinkedIn');

  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim()) {
      toast.warning('Please enter a job posting URL.');
      return;
    }
    setFetchingUrl(true);
    setErrorMsg('');
    try {
      const res = await api.importJobUrl(sourceUrl.trim());
      if (res.extracted_text) {
        setDescriptionText(res.extracted_text);
        if (res.detected_title && !title) {
          setTitle(res.detected_title);
        }
        toast.success('Job description text successfully extracted from URL!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'URL import failed. Please paste the job description text directly.');
      toast.error('URL extraction unavailable. Please paste description.');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim()) {
      setErrorMsg('Company name is required.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Job title is required.');
      return;
    }
    if (!descriptionText.trim() || descriptionText.trim().length < 40) {
      setErrorMsg('Please paste a full job description (at least a paragraph).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const createdJob = await api.createJob({
        company: company.trim(),
        title: title.trim(),
        description_text: descriptionText.trim(),
        source_url: sourceUrl.trim(),
        location: location.trim(),
        employment_type: employmentType,
        source
      });
      toast.success(`Application created for ${createdJob.company}! Analyzing requirements...`);
      onJobCreated(createdJob.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create job application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-lavender-surface text-brand-600 border border-lavender-border">
            Step 1 of 3: Role Input
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-content-primary tracking-tight">
          Create Tailored Application
        </h1>
        <p className="text-xs text-content-secondary mt-1">
          Provide the target role details. ApplyMate will analyze required skills, map them against your verified profile facts, and prepare tailored resume suggestions.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-app-border shadow-card p-6 sm:p-8 space-y-5">
        {/* Company & Role Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Company Name <span className="text-status-danger">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-content-secondary absolute left-3 top-3" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Airbnb, Google"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Job Title <span className="text-status-danger">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-content-secondary absolute left-3 top-3" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Optional Public URL Import */}
        <div className="p-4 rounded-xl bg-lavender-surface/50 border border-lavender-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>Job Posting URL (Optional Best-Effort Import)</span>
            </label>
            <span className="text-[10px] text-content-secondary">Public URLs only</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://company.com/careers/role..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500 bg-white"
            />
            <button
              type="button"
              onClick={handleFetchUrl}
              disabled={fetchingUrl || !sourceUrl.trim()}
              className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs shadow-soft transition-all flex items-center gap-1.5 shrink-0"
            >
              {fetchingUrl ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Fetch Text</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-content-secondary">
            Note: If the target site requires login or blocks scrapers, simply copy and paste the text below. Pasting text is always 100% reliable.
          </p>
        </div>

        {/* Paste Job Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-content-primary">
              Job Description Text <span className="text-status-danger">*</span>
            </label>
            <span className="text-[11px] text-content-secondary">
              {descriptionText.length} characters
            </span>
          </div>
          <textarea
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            rows={9}
            placeholder="Paste the full job description here, including requirements, responsibilities, and preferred qualifications..."
            required
            className="w-full p-3 text-xs rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500 leading-relaxed font-mono"
          />
        </div>

        {/* Location & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-content-primary mb-1 block">Location</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-content-secondary absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / San Francisco, CA"
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500 bg-white"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Co-op">Co-op</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-content-primary mb-1 block">Source Platform</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-app-border focus:ring-1 focus:ring-brand-500 bg-white"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Company Website">Company Website</option>
              <option value="Referral">Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-app-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="text-xs text-content-secondary hover:text-content-primary font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Role Requirements...</span>
              </>
            ) : (
              <>
                <span>Analyze & Match Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

