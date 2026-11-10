import React from 'react';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  LayoutTemplate,
  Settings,
  PlusCircle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ currentTab, onNavigate, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'resumes', label: 'Resume Library', icon: FileText },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (tabId) => {
    onNavigate(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-app-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-app-border">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-content-primary tracking-tight">ApplyMate</span>
                <span className="text-[10px] font-semibold bg-pinkaccent-surface text-pinkaccent-dark px-1.5 py-0.5 rounded-full border border-pinkaccent-border">
                  AI MVP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="p-4">
          <button
            onClick={() => handleNav('new-application')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-medium text-sm shadow-soft transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-lavender-surface text-brand-600 font-semibold'
                    : 'text-content-secondary hover:text-content-primary hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-content-secondary'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-app-border">
          <div className="flex items-center justify-between p-2 rounded-xl bg-app-bg border border-app-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content-primary truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-content-secondary truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="text-content-secondary hover:text-status-danger p-1 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

