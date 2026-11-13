import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ pageTitle, onToggleMobile, onNavigate }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-app-border sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-content-secondary hover:text-content-primary rounded-lg hover:bg-slate-50 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-content-primary tracking-tight">
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('new-application')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Application</span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-app-border">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 font-semibold text-xs flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-content-secondary">
            {user?.name || user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
