import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ currentTab, onNavigate, pageTitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg flex">
      <Sidebar
        currentTab={currentTab}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          pageTitle={pageTitle}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onNavigate={onNavigate}
        />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

