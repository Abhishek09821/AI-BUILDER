import React from 'react';
import { Menu, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ pageTitle, onToggleMobile, onNavigate }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-app-border sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-content-secondary hover:text-content-primary rounded-lg hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-content-primary capitalize tracking-tight">
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('new-application')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Application</span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-app-border">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-semibold text-xs flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-content-primary">
            {user?.name || user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}

