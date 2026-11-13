import React from 'react';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  LayoutTemplate,
  Settings,
  Plus,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ currentTab, onNavigate, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Master Profile', icon: User },
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
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-app-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-app-border">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-content-primary tracking-tight">ApplyMate</span>
              <span className="text-[10px] font-medium text-content-muted bg-slate-100 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4">
          <button
            onClick={() => handleNav('new-application')}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
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
        <div className="p-3 border-t border-app-border">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-app-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-600 font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content-primary truncate">
                  {user?.name || 'Candidate'}
                </p>
                <p className="text-[10px] text-content-muted truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1 text-content-muted hover:text-status-danger rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
