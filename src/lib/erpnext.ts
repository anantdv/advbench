import cache from '../generated/erpnext-cache.json';
import { activity as sampleActivity, deadlines as sampleDeadlines, sprints as sampleSprints, team as sampleTeam } from '../data';
import type { ActivityItem, Metric, Project, Sprint, Task, TeamMember } from '../types';

type LiveCache = {
  connected: boolean;
  syncedAt: string | null;
  summary: Metric[];
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
};

const emptySummary: Metric[] = [
  { label: 'Total Projects', value: '0', delta: 'No ERPNext data yet', tone: 'teal' },
  { label: 'Active Projects', value: '0', delta: 'Run sync to load live data', tone: 'violet' },
  { label: 'Completed Projects', value: '0', delta: 'Waiting for ERPNext', tone: 'amber' },
  { label: 'Delayed Projects', value: '0', delta: 'Waiting for ERPNext', tone: 'rose' },
  { label: 'Tasks Completed', value: '0', delta: 'Waiting for ERPNext', tone: 'cyan' },
];

const liveCache = cache as LiveCache;

function getPayload() {
  if (liveCache.connected && liveCache.projects.length > 0 && liveCache.tasks.length > 0) {
    return {
      connected: true,
      syncedAt: liveCache.syncedAt,
      summary: liveCache.summary.length > 0 ? liveCache.summary : emptySummary,
      projects: liveCache.projects,
      tasks: liveCache.tasks,
      sprints: liveCache.sprints ?? [],
      message: `ERPNext data synced at ${liveCache.syncedAt ?? 'unknown time'}.`,
    };
  }

  return {
    connected: false,
    syncedAt: null,
    summary: emptySummary,
    projects: [] as Project[],
    tasks: [] as Task[],
    sprints: [] as Sprint[],
    message: 'No ERPNext snapshot is available yet. Run `npm run sync:erpnext` after configuring the server.',
  };
}

export type DashboardPayload = ReturnType<typeof getPayload> & {
  team: TeamMember[];
  activity: ActivityItem[];
  deadlines: typeof sampleDeadlines;
};

export async function fetchDashboard(): Promise<DashboardPayload> {
  const payload = getPayload();
  return {
    ...payload,
    team: sampleTeam,
    activity: sampleActivity,
    deadlines: sampleDeadlines,
  };
}

export async function fetchTasks() {
  return getPayload().tasks;
}

export async function fetchProjects() {
  return getPayload().projects;
}

export async function fetchSprints() {
  const payload = getPayload();
  return payload.sprints.length > 0 ? payload.sprints : sampleSprints;
}

export async function fetchIntegrationStatus() {
  const payload = getPayload();
  return {
    connected: payload.connected,
    message: payload.connected ? '' : payload.message,
    syncedAt: payload.syncedAt,
  };
}
