const API_BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('applymate_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token invalid or expired, clear and notify
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
      localStorage.removeItem('applymate_token');
      localStorage.removeItem('applymate_user');
      window.dispatchEvent(new Event('applymate-auth-expired'));
    }
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'An unexpected error occurred');
    }
    return data;
  }

  if (!response.ok) {
    throw new Error('An error occurred during request');
  }

  return response;
}

export const api = {
  // Auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Dashboard summary
  getDashboardSummary: () => request('/me'),
  exportUserData: () => request('/me/export-data'),
  deleteAccount: () => request('/me', { method: 'DELETE' }),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getFacts: () => request('/profile/facts'),
  createFact: (payload) => request('/profile/facts', { method: 'POST', body: JSON.stringify(payload) }),
  updateFact: (id, payload) => request(`/profile/facts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteFact: (id) => request(`/profile/facts/${id}`, { method: 'DELETE' }),
  createLink: (payload) => request('/profile/links', { method: 'POST', body: JSON.stringify(payload) }),
  updateLink: (id, payload) => request(`/profile/links/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteLink: (id) => request(`/profile/links/${id}`, { method: 'DELETE' }),

  // Imports
  uploadResumeImport: (formData) => request('/imports/resume', { method: 'POST', body: formData }),
  getImport: (id) => request(`/imports/${id}`),
  confirmImport: (id, payload) => request(`/imports/${id}/confirm`, { method: 'POST', body: JSON.stringify(payload) }),

  // Jobs
  createJob: (payload) => request('/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  importJobUrl: (url) => request('/jobs/import-url', { method: 'POST', body: JSON.stringify({ url }) }),
  getJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  runJobAnalysis: (id) => request(`/jobs/${id}/analyse`, { method: 'POST' }),
  getJobMatches: (id) => request(`/jobs/${id}/matches`),
  generateResumeDraft: (jobId) => request(`/jobs/${jobId}/resume-draft`, { method: 'POST' }),
  generateCoverLetterDraft: (jobId, payload = {}) => request(`/jobs/${jobId}/cover-letter`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),

  // Resumes
  getResumes: () => request('/resumes'),
  createMasterResume: () => request('/resumes', { method: 'POST' }),
  getResume: (id) => request(`/resumes/${id}`),
  updateResume: (id, payload) => request(`/resumes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  reviewSuggestion: (resumeId, suggestionId, payload) => request(`/resumes/${resumeId}/suggestions/${suggestionId}/review`, { method: 'POST', body: JSON.stringify(payload) }),
  getResumeVersions: (id) => request(`/resumes/${id}/versions`),
  restoreResumeVersion: (resumeId, versionId) => request(`/resumes/${resumeId}/restore/${versionId}`, { method: 'POST' }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),

  // Cover Letters
  getCoverLetters: () => request('/cover-letters'),
  getCoverLetter: (id) => request(`/cover-letters/${id}`),
  updateCoverLetter: (id, payload) => request(`/cover-letters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getCoverLetterVersions: (id) => request(`/cover-letters/${id}/versions`),
  deleteCoverLetter: (id) => request(`/cover-letters/${id}`, { method: 'DELETE' }),

  // Exports
  createExport: (payload) => request('/exports', { method: 'POST', body: JSON.stringify(payload) }),
  getDownloadUrl: (exportId) => `/api/v1/exports/${exportId}`,

  // Applications
  getApplications: (params = '') => request(`/applications${params}`),
  createApplication: (payload) => request('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  updateApplication: (id, payload) => request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () => request('/templates'),
};

