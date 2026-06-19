import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { useUiStore } from '../../store/uiStore';
import type { SectionKey } from '../../types';

const routeToSection: Record<string, SectionKey> = {
  '/': 'dashboard',
  '/projects': 'projects',
  '/tasks': 'tasks',
  '/collaboration': 'collaboration',
  '/sprints': 'sprints',
  '/resources': 'resources',
  '/time-tracking': 'time-tracking',
  '/clients': 'clients',
  '/reports': 'reports',
  '/administration': 'administration',
};

export function AppShell() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setActiveSection = useUiStore((state) => state.setActiveSection);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const location = useLocation();

  useEffect(() => {
    setActiveSection(routeToSection[location.pathname] ?? 'dashboard');
  }, [location.pathname, setActiveSection]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      {sidebarOpen ? <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} /> : null}
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}
