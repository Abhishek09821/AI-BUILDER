import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MasterProfile from './pages/Profile/MasterProfile';
import ResumeLibrary from './pages/ResumeLibrary/ResumeLibrary';
import NewApplication from './pages/NewApplication/NewApplication';
import JobAnalysisView from './pages/JobAnalysis/JobAnalysisView';
import ResumeEditor from './pages/ResumeEditor/ResumeEditor';
import CoverLetterEditor from './pages/CoverLetterEditor/CoverLetterEditor';
import ApplicationTracker from './pages/Applications/ApplicationTracker';
import TemplatesGallery from './pages/Templates/TemplatesGallery';
import Settings from './pages/Settings/Settings';

export default function App() {
  const { user, loading } = useAuth();

  // Auth screen toggle: 'login' | 'register'
  const [authScreen, setAuthScreen] = useState('login');

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Contextual IDs for detailed editors
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedClId, setSelectedClId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-content-secondary">Initializing ApplyMate...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated user view
  if (!user) {
    if (authScreen === 'register') {
      return <Register onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthScreen('register')} />;
  }

  // Navigation handlers
  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobCreated = (jobId) => {
    setSelectedJobId(jobId);
    setCurrentTab('job-analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId);
    setCurrentTab('job-analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectResume = (resumeId) => {
    setSelectedResumeId(resumeId);
    setCurrentTab('resume-editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCoverLetter = (clId) => {
    setSelectedClId(clId);
    setCurrentTab('cover-letter-editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine Page Title for Top Bar
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'profile':
        return 'Master Career Profile';
      case 'resumes':
        return 'Resume Library';
      case 'applications':
        return 'Application Tracker';
      case 'templates':
        return 'Templates Gallery';
      case 'settings':
        return 'Settings & Privacy';
      case 'new-application':
        return 'New Role Application';
      case 'job-analysis':
        return 'Job Analysis & Evidence Matching';
      case 'resume-editor':
        return '3-Panel Resume Editor';
      case 'cover-letter-editor':
        return 'Cover Letter Generator';
      default:
        return 'ApplyMate';
    }
  };

  return (
    <Layout currentTab={currentTab} onNavigate={handleNavigate} pageTitle={getPageTitle()}>
      {currentTab === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onSelectJob={handleSelectJob}
          onSelectResume={handleSelectResume}
        />
      )}

      {currentTab === 'profile' && (
        <MasterProfile
          onNavigate={handleNavigate}
          onSelectResume={handleSelectResume}
        />
      )}

      {currentTab === 'resumes' && (
        <ResumeLibrary
          onNavigate={handleNavigate}
          onSelectResume={handleSelectResume}
        />
      )}

      {currentTab === 'new-application' && (
        <NewApplication
          onJobCreated={handleJobCreated}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'job-analysis' && (
        <JobAnalysisView
          jobId={selectedJobId}
          onNavigate={handleNavigate}
          onSelectResume={handleSelectResume}
          onSelectCoverLetter={handleSelectCoverLetter}
        />
      )}

      {currentTab === 'resume-editor' && (
        <ResumeEditor
          resumeId={selectedResumeId}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'cover-letter-editor' && (
        <CoverLetterEditor
          clId={selectedClId}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'applications' && (
        <ApplicationTracker
          onSelectResume={handleSelectResume}
          onSelectCoverLetter={handleSelectCoverLetter}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'templates' && (
        <TemplatesGallery onNavigate={handleNavigate} />
      )}

      {currentTab === 'settings' && (
        <Settings />
      )}
    </Layout>
  );
}

