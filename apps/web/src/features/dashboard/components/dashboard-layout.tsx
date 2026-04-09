import React from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      <Sidebar />
      <div className="flex flex-col flex-1 relative min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
