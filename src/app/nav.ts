import type { SectionKey } from '../types';

export type NavItem = {
  key: SectionKey;
  label: string;
  path: string;
};

export type NavGroup = {
  title: string;
  items: string[];
  path?: string;
};

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'projects', label: 'Projects', path: '/projects' },
  { key: 'tasks', label: 'Tasks', path: '/tasks' },
  { key: 'collaboration', label: 'Collaboration', path: '/collaboration' },
  { key: 'sprints', label: 'Sprints', path: '/sprints' },
  { key: 'resources', label: 'Resources', path: '/resources' },
  { key: 'time-tracking', label: 'Time Tracking', path: '/time-tracking' },
  { key: 'clients', label: 'Clients', path: '/clients' },
  { key: 'reports', label: 'Reports', path: '/reports' },
  { key: 'administration', label: 'Administration', path: '/administration' },
];

export const navGroups: NavGroup[] = [
  { title: 'Projects', path: '/projects', items: ['Active Projects', 'Milestones', 'Risks', 'Deliverables'] },
  { title: 'Tasks', path: '/tasks', items: ['My Tasks', 'Team Tasks', 'Backlog', 'Kanban Board'] },
  { title: 'Collaboration', path: '/collaboration', items: ['Discussions', 'Activity Feed', 'Announcements'] },
  { title: 'Sprints', path: '/sprints', items: ['Sprint Board', 'Velocity', 'Burndown'] },
];
