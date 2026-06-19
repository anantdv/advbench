import type { ActivityItem, Metric, Project, Sprint, Task, TeamMember, TimeEntry } from './types';

export const navSections = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'collaboration', label: 'Collaboration' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'resources', label: 'Resources' },
  { key: 'time-tracking', label: 'Time Tracking' },
  { key: 'clients', label: 'Clients' },
  { key: 'reports', label: 'Reports' },
  { key: 'administration', label: 'Administration' },
] as const;

export const sidebarGroups = [
  {
    title: 'Projects',
    items: ['Active Projects', 'Milestones', 'Risks', 'Deliverables'],
  },
  {
    title: 'Tasks',
    items: ['My Tasks', 'Team Tasks', 'Backlog', 'Kanban Board'],
  },
  {
    title: 'Collaboration',
    items: ['Discussions', 'Activity Feed', 'Announcements'],
  },
  {
    title: 'Sprints',
    items: ['Sprint Board', 'Velocity', 'Burndown'],
  },
] as const;

export const metrics: Metric[] = [
  { label: 'Active Projects', value: '18', delta: '+3 this month', tone: 'teal' },
  { label: 'Delayed Projects', value: '4', delta: '-2 vs last week', tone: 'rose' },
  { label: 'Team Utilization', value: '84%', delta: 'Healthy overall', tone: 'amber' },
  { label: 'Tasks Completed', value: '1,284', delta: '+14% momentum', tone: 'cyan' },
];

export const projectHealth = [
  { label: 'On Track', value: 12, tone: 'good' },
  { label: 'At Risk', value: 4, tone: 'warn' },
  { label: 'Delayed', value: 2, tone: 'bad' },
] as const;

export const projects: Project[] = [
  {
    code: 'ADV-248',
    name: 'Retail ERPNext Revamp',
    client: 'Northstar Commerce',
    manager: 'Aarav Mehta',
    status: 'Development',
    priority: 'Critical',
    health: 'on-track',
    budget: 42000,
    progress: 68,
    dueDate: '2026-07-08',
  },
  {
    code: 'ADV-261',
    name: 'Manufacturing Portal',
    client: 'Kinetic Works',
    manager: 'Sara Khan',
    status: 'UAT',
    priority: 'High',
    health: 'risk',
    budget: 31000,
    progress: 82,
    dueDate: '2026-06-29',
  },
  {
    code: 'ADV-273',
    name: 'Internal Workflow Suite',
    client: 'ADVBench Internal',
    manager: 'Neha Iyer',
    status: 'Planning',
    priority: 'Medium',
    health: 'delayed',
    budget: 18000,
    progress: 34,
    dueDate: '2026-07-19',
  },
];

export const tasks: Task[] = [
  {
    id: 'TSK-4101',
    title: 'Finalize ERPNext API contract',
    project: 'Retail ERPNext Revamp',
    assignee: 'Aarav Mehta',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2026-06-21',
    estimate: 12,
    actual: 8,
  },
  {
    id: 'TSK-4102',
    title: 'QA regression for order flow',
    project: 'Manufacturing Portal',
    assignee: 'Priya Shah',
    priority: 'High',
    status: 'Testing',
    dueDate: '2026-06-22',
    estimate: 10,
    actual: 11,
  },
  {
    id: 'TSK-4103',
    title: 'Design mobile task cards',
    project: 'Internal Workflow Suite',
    assignee: 'Maya Rao',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '2026-06-24',
    estimate: 6,
    actual: 0,
  },
  {
    id: 'TSK-4104',
    title: 'Prepare sprint review notes',
    project: 'Retail ERPNext Revamp',
    assignee: 'Nikhil Verma',
    priority: 'Low',
    status: 'Backlog',
    dueDate: '2026-06-25',
    estimate: 4,
    actual: 0,
  },
];

export const sprints: Sprint[] = [
  {
    id: 'SPR-2201',
    name: 'Delivery Sprint 22',
    project: 'Retail ERPNext Revamp',
    status: 'Active',
    startDate: '2026-06-17',
    endDate: '2026-06-30',
    goal: 'Close UAT blockers and stabilize the API contract',
    plannedPoints: 38,
    completedPoints: 24,
    velocity: 31,
  },
  {
    id: 'SPR-2202',
    name: 'Delivery Sprint 23',
    project: 'Manufacturing Portal',
    status: 'Planning',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    goal: 'Prepare the next release branch and regression scope',
    plannedPoints: 34,
    completedPoints: 0,
    velocity: 0,
  },
  {
    id: 'SPR-2203',
    name: 'Discovery Sprint 9',
    project: 'Internal Workflow Suite',
    status: 'Completed',
    startDate: '2026-06-03',
    endDate: '2026-06-16',
    goal: 'Validate the expanded workflow and reporting scope',
    plannedPoints: 28,
    completedPoints: 28,
    velocity: 29,
  },
];

export const team: TeamMember[] = [
  {
    name: 'Aarav Mehta',
    designation: 'Project Manager',
    department: 'Delivery',
    skills: ['ERPNext', 'Planning', 'Stakeholder Management'],
    utilization: 76,
    currentProject: 'Retail ERPNext Revamp',
    currentTask: 'API contract',
  },
  {
    name: 'Maya Rao',
    designation: 'UI/UX Designer',
    department: 'Design',
    skills: ['UI/UX', 'Figma', 'Mobile Design'],
    utilization: 58,
    currentProject: 'Internal Workflow Suite',
    currentTask: 'Task cards',
  },
  {
    name: 'Priya Shah',
    designation: 'QA Engineer',
    department: 'Quality',
    skills: ['QA', 'Automation', 'Regression Testing'],
    utilization: 91,
    currentProject: 'Manufacturing Portal',
    currentTask: 'Regression suite',
  },
  {
    name: 'Nikhil Verma',
    designation: 'Developer',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'Frappe'],
    utilization: 83,
    currentProject: 'Retail ERPNext Revamp',
    currentTask: 'Sprint review notes',
  },
];

export const timeEntries: TimeEntry[] = [
  {
    date: '2026-06-19',
    employee: 'Aarav Mehta',
    project: 'Retail ERPNext Revamp',
    task: 'API contract review',
    hours: 5.5,
    billable: true,
    note: 'Reviewed payload mapping and client feedback.',
  },
  {
    date: '2026-06-19',
    employee: 'Priya Shah',
    project: 'Manufacturing Portal',
    task: 'Regression sweep',
    hours: 6,
    billable: true,
    note: 'Re-ran critical order flow scenarios.',
  },
  {
    date: '2026-06-18',
    employee: 'Maya Rao',
    project: 'Internal Workflow Suite',
    task: 'Design iteration',
    hours: 4,
    billable: false,
    note: 'Refined mobile task card states.',
  },
  {
    date: '2026-06-18',
    employee: 'Nikhil Verma',
    project: 'Retail ERPNext Revamp',
    task: 'Sprint review prep',
    hours: 3.5,
    billable: true,
    note: 'Packaged notes for the executive review.',
  },
];

export const activity: ActivityItem[] = [
  {
    title: 'Aarav assigned a task to Nikhil',
    time: '8 min ago',
    detail: 'API contract update moved to In Progress.',
  },
  {
    title: 'Priya marked QA regression as Testing',
    time: '24 min ago',
    detail: 'Blockers on order flow were logged for review.',
  },
  {
    title: 'Maya uploaded design revisions',
    time: '1 hr ago',
    detail: 'New mobile task card layouts are ready for feedback.',
  },
  {
    title: 'System flagged a delayed milestone',
    time: '2 hr ago',
    detail: 'Internal Workflow Suite needs schedule attention.',
  },
];

export const deadlines = [
  { title: 'Retail ERPNext Revamp UAT signoff', date: 'Jun 21' },
  { title: 'Manufacturing Portal sprint review', date: 'Jun 22' },
  { title: 'Internal Workflow Suite design freeze', date: 'Jun 24' },
  { title: 'Executive delivery review', date: 'Jun 26' },
];

export const projectRisks = [
  {
    project: 'Manufacturing Portal',
    risk: 'UAT feedback is still pending from the client team.',
    owner: 'Sara Khan',
    severity: 'High',
  },
  {
    project: 'Internal Workflow Suite',
    risk: 'Design freeze slipped by one sprint due to scope expansion.',
    owner: 'Neha Iyer',
    severity: 'Medium',
  },
  {
    project: 'Retail ERPNext Revamp',
    risk: 'API approvals are delayed on one legacy integration.',
    owner: 'Aarav Mehta',
    severity: 'High',
  },
] as const;

export const projectMilestones = [
  { title: 'Discovery signoff', owner: 'Aarav Mehta', due: 'Jun 20', status: 'Done' },
  { title: 'Build phase', owner: 'Nikhil Verma', due: 'Jun 28', status: 'In Progress' },
  { title: 'UAT readiness', owner: 'Priya Shah', due: 'Jul 03', status: 'At Risk' },
  { title: 'Go-live', owner: 'Sara Khan', due: 'Jul 08', status: 'Planned' },
] as const;

export const reportCards = [
  { title: 'Delivery Health', value: '87%', detail: 'Portfolio on-track ratio', tone: 'teal' },
  { title: 'Revenue at Risk', value: '$14.2k', detail: 'Projects with open blockers', tone: 'rose' },
  { title: 'Utilization', value: '84%', detail: 'Team-wide weighted capacity', tone: 'amber' },
  { title: 'On-Time Tasks', value: '92%', detail: 'Tasks completed by due date', tone: 'cyan' },
] as const;

export const adminUsers = [
  { name: 'Aarav Mehta', role: 'Project Manager', status: 'Active' },
  { name: 'Sara Khan', role: 'Team Lead', status: 'Active' },
  { name: 'Priya Shah', role: 'QA Engineer', status: 'Active' },
  { name: 'Maya Rao', role: 'UI/UX Designer', status: 'Invited' },
] as const;

export const integrationStatus = [
  { name: 'ERPNext API', state: 'Proxy ready', detail: 'Awaiting live endpoint verification' },
  { name: 'Notifications', state: 'Configured', detail: 'In-app notifications enabled' },
  { name: 'Audit Log', state: 'Configured', detail: 'Sensitive actions are tracked' },
] as const;
