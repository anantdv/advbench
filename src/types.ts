export type SectionKey =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'collaboration'
  | 'sprints'
  | 'resources'
  | 'time-tracking'
  | 'clients'
  | 'reports'
  | 'administration';

export type HealthState = 'on-track' | 'risk' | 'delayed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'In Review'
  | 'Testing'
  | 'Blocked'
  | 'Completed'
  | 'Cancelled';

export interface Project {
  code: string;
  name: string;
  client: string;
  manager: string;
  status: string;
  priority: Priority;
  health: HealthState;
  budget: number;
  progress: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  projectType?: string;
  isActive?: string;
  progressMethod?: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  estimatedCost?: number;
  company?: string;
  costCenter?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  sprint?: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  estimate: number;
  actual: number;
  storyPoints?: number;
  description?: string;
  expStartDate?: string;
  expEndDate?: string;
  progress?: number;
  parentTask?: string;
  reviewDate?: string;
  closingDate?: string;
  company?: string;
  department?: string;
}

export interface TimeEntry {
  date: string;
  employee: string;
  project: string;
  task: string;
  hours: number;
  billable: boolean;
  note: string;
}

export interface Sprint {
  id: string;
  name: string;
  project: string;
  status: string;
  startDate: string;
  endDate: string;
  goal: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
}

export interface TeamMember {
  name: string;
  designation: string;
  department: string;
  skills: string[];
  utilization: number;
  currentProject: string;
  currentTask: string;
}

export interface ActivityItem {
  title: string;
  time: string;
  detail: string;
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
  tone: 'teal' | 'violet' | 'amber' | 'rose' | 'cyan';
}
