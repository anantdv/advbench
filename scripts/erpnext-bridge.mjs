import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const cachePath = path.join(root, 'src', 'generated', 'erpnext-cache.json');

function parseEnv(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    result[key] = value;
  }
  return result;
}

export function loadConfig() {
  const env = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};
  const baseUrl = (env.VITE_ERPNEXT_BASE_URL || process.env.VITE_ERPNEXT_BASE_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (env.VITE_ERPNEXT_API_KEY || process.env.VITE_ERPNEXT_API_KEY || '').trim();
  const apiSecret = (env.VITE_ERPNEXT_API_SECRET || process.env.VITE_ERPNEXT_API_SECRET || '').trim();

  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error('ERPNext credentials are missing.');
  }

  return {
    baseUrl,
    apiKey,
    apiSecret,
  };
}

export function buildUrl(baseUrl, requestPath) {
  const normalizedPath = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function erpnextJson(config, requestPath, init = {}) {
  const response = await fetch(buildUrl(config.baseUrl, requestPath), {
    ...init,
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message =
      payload?.exception ||
      payload?.exc ||
      payload?.message ||
      `ERPNext request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function mapProject(item) {
  return {
    code: String(item.name ?? 'ERP-UNKNOWN'),
    name: String(item.project_name ?? item.name ?? 'Untitled Project'),
    client: String(item.customer ?? 'Unknown Client'),
    manager: String(item.custom_advbench_project_manager ?? item.owner ?? 'Unassigned'),
    status: String(item.status ?? 'Planning'),
    priority: String(item.priority ?? 'Medium'),
    health: String(item.status ?? '').toLowerCase() === 'completed' ? 'on-track' : 'risk',
    budget: Number(item.custom_advbench_budget ?? item.estimated_costing ?? item.budget_amount ?? item.budget ?? 0),
    progress: Number(item.percent_complete ?? item.progress ?? 0),
    dueDate: String(item.custom_advbench_end_date ?? item.expected_end_date ?? item.modified ?? item.creation ?? ''),
    startDate: String(item.custom_advbench_start_date ?? item.expected_start_date ?? ''),
    endDate: String(item.custom_advbench_end_date ?? item.expected_end_date ?? ''),
    projectType: String(item.project_type ?? ''),
    isActive: String(item.is_active ?? ''),
    progressMethod: String(item.percent_complete_method ?? ''),
    expectedStartDate: String(item.expected_start_date ?? ''),
    expectedEndDate: String(item.expected_end_date ?? ''),
    estimatedCost: Number(item.estimated_costing ?? item.custom_advbench_budget ?? 0),
    company: String(item.company ?? ''),
    costCenter: String(item.cost_center ?? ''),
    notes: String(item.notes ?? ''),
  };
}

export function mapTask(item) {
  return {
    id: String(item.name ?? 'TSK-UNKNOWN'),
    title: String(item.subject ?? item.title ?? 'Untitled Task'),
    project: String(item.project ?? 'Unassigned'),
    sprint: String(item.custom_advbench_sprint ?? ''),
    assignee: String(item.custom_advbench_assignee ?? item.owner ?? 'Unassigned'),
    priority: String(item.priority ?? 'Medium'),
    status: String(item.status ?? 'Backlog'),
    dueDate: String(item.custom_advbench_due_date ?? item.modified ?? item.creation ?? ''),
    estimate: Number(item.expected_time ?? 0),
    actual: Number(item.actual_time ?? 0),
    storyPoints: Number(item.custom_advbench_story_points ?? 0),
    description: String(item.description ?? ''),
    expStartDate: String(item.exp_start_date ?? ''),
    expEndDate: String(item.exp_end_date ?? ''),
    progress: Number(item.progress ?? 0),
    parentTask: String(item.parent_task ?? ''),
    reviewDate: String(item.review_date ?? ''),
    closingDate: String(item.closing_date ?? ''),
    company: String(item.company ?? ''),
    department: String(item.department ?? ''),
  };
}

export async function fetchProjects(config) {
  const response = await erpnextJson(
    config,
    '/api/resource/Project?limit_page_length=50&fields=["name","project_name","customer","status","priority","percent_complete","owner","creation","modified","custom_advbench_project_manager","custom_advbench_start_date","custom_advbench_end_date","custom_advbench_budget","project_type","percent_complete_method","is_active","expected_start_date","expected_end_date","estimated_costing","company","cost_center","notes"]',
  );
  return (response.data ?? []).map(mapProject);
}

export async function fetchTasks(config) {
  const response = await erpnextJson(
    config,
    '/api/resource/Task?limit_page_length=50&fields=["name","subject","project","status","priority","owner","creation","modified","expected_time","actual_time","custom_advbench_assignee","custom_advbench_due_date","custom_advbench_story_points","custom_advbench_sprint","description","exp_start_date","exp_end_date","progress","parent_task","review_date","closing_date","company","department"]',
  );
  return (response.data ?? []).map(mapTask);
}

export function mapSprint(item) {
  return {
    id: String(item.name ?? 'SPR-UNKNOWN'),
    name: String(item.sprint_name ?? item.name ?? 'Untitled Sprint'),
    project: String(item.project ?? 'Unassigned'),
    status: String(item.status ?? 'Planning'),
    startDate: String(item.start_date ?? ''),
    endDate: String(item.end_date ?? ''),
    goal: String(item.goal ?? ''),
    plannedPoints: Number(item.planned_points ?? 0),
    completedPoints: Number(item.completed_points ?? 0),
    velocity: Number(item.velocity ?? 0),
  };
}

export async function fetchSprints(config) {
  const response = await erpnextJson(
    config,
    '/api/resource/AdvBench%20Sprint?limit_page_length=50&fields=["name","sprint_name","project","status","start_date","end_date","goal","planned_points","completed_points","velocity","modified","creation"]',
  );
  return (response.data ?? []).map(mapSprint);
}

export function buildSummary(projects, tasks) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => !['Completed', 'Cancelled'].includes(project.status)).length;
  const completedProjects = projects.filter((project) => project.status === 'Completed').length;
  const delayedProjects = projects.filter((project) => project.health === 'delayed').length;
  const tasksCompleted = tasks.filter((task) => task.status === 'Completed').length;
  const tasksInProgress = tasks.filter((task) => ['In Progress', 'Working'].includes(task.status)).length;
  const tasksOverdue = tasks.filter((task) => task.status !== 'Completed' && task.status !== 'Cancelled').length;

  return [
    { label: 'Total Projects', value: String(totalProjects), delta: 'ERPNext live data', tone: 'teal' },
    { label: 'Active Projects', value: String(activeProjects), delta: `${completedProjects} completed`, tone: 'violet' },
    { label: 'Completed Projects', value: String(completedProjects), delta: `${delayedProjects} flagged`, tone: 'amber' },
    { label: 'Delayed Projects', value: String(delayedProjects), delta: `${tasksOverdue} open tasks`, tone: 'rose' },
    { label: 'Tasks Completed', value: String(tasksCompleted), delta: `${tasksInProgress} in progress`, tone: 'cyan' },
  ];
}

export function readCache() {
  if (!fs.existsSync(cachePath)) {
    return { connected: false, syncedAt: null, summary: [], projects: [], tasks: [], sprints: [] };
  }

  const raw = fs.readFileSync(cachePath, 'utf8');
  return JSON.parse(raw);
}

export function writeCache(payload) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export async function syncCache() {
  const config = loadConfig();
  const [projects, tasks, sprints] = await Promise.all([fetchProjects(config), fetchTasks(config), fetchSprints(config)]);
  const payload = {
    connected: true,
    syncedAt: new Date().toISOString(),
    summary: buildSummary(projects, tasks),
    projects,
    tasks,
    sprints,
  };
  writeCache(payload);
  return payload;
}

export async function saveProject(input) {
  const config = loadConfig();
  const isEdit = Boolean(input.docname);
  const payload = {
    project_name: input.project_name,
    customer: input.customer || '',
    status: input.status || 'Open',
    priority: input.priority || 'Medium',
    percent_complete: Number(input.percent_complete || 0),
    project_type: input.project_type || '',
    percent_complete_method: input.percent_complete_method || 'Manual',
    is_active: input.is_active || 'Yes',
    expected_start_date: input.expected_start_date || input.start_date || '',
    expected_end_date: input.expected_end_date || input.end_date || '',
    estimated_costing: Number(input.estimated_costing || input.budget || 0),
    company: input.company || '',
    cost_center: input.cost_center || '',
    notes: input.notes || '',
  };

  const projectManager = input.custom_advbench_project_manager || input.project_manager;
  if (projectManager) {
    payload.custom_advbench_project_manager = projectManager;
  }
  if (input.start_date) {
    payload.custom_advbench_start_date = input.start_date;
  }
  if (input.end_date) {
    payload.custom_advbench_end_date = input.end_date;
  }
  if (input.budget !== undefined && input.budget !== '') {
    payload.custom_advbench_budget = Number(input.budget);
  }

  const response = await erpnextJson(
    config,
    isEdit ? `/api/resource/Project/${encodeURIComponent(input.docname)}` : '/api/resource/Project',
    {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  await syncCache();
  return response;
}

export async function deleteProject(input) {
  const config = loadConfig();
  const response = await erpnextJson(config, `/api/resource/Project/${encodeURIComponent(input.docname)}`, {
    method: 'DELETE',
  });
  await syncCache();
  return response;
}

export async function saveTask(input) {
  const config = loadConfig();
  const isEdit = Boolean(input.docname);
  const payload = {
    subject: input.subject,
    project: input.project || '',
    custom_advbench_sprint: input.sprint || '',
    status: input.status || 'Backlog',
    priority: input.priority || 'Medium',
    expected_time: Number(input.expected_time || 0),
    actual_time: Number(input.actual_time || 0),
    description: input.description || '',
    exp_start_date: input.exp_start_date || '',
    exp_end_date: input.exp_end_date || '',
    progress: Number(input.progress || 0),
    parent_task: input.parent_task || '',
    review_date: input.review_date || '',
    closing_date: input.closing_date || '',
    company: input.company || '',
    department: input.department || '',
  };

  const assignee = input.custom_advbench_assignee || input.assignee;
  if (assignee) {
    payload.custom_advbench_assignee = assignee;
  }
  if (input.due_date) {
    payload.custom_advbench_due_date = input.due_date;
  }
  if (input.story_points !== undefined && input.story_points !== '') {
    payload.custom_advbench_story_points = Number(input.story_points);
  }

  const response = await erpnextJson(
    config,
    isEdit ? `/api/resource/Task/${encodeURIComponent(input.docname)}` : '/api/resource/Task',
    {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  await syncCache();
  return response;
}

export async function deleteTask(input) {
  const config = loadConfig();
  const response = await erpnextJson(config, `/api/resource/Task/${encodeURIComponent(input.docname)}`, {
    method: 'DELETE',
  });
  await syncCache();
  return response;
}

export async function saveSprint(input) {
  const config = loadConfig();
  const isEdit = Boolean(input.docname);
  const payload = {
    sprint_name: input.sprint_name,
    project: input.project || '',
    status: input.status || 'Planning',
    start_date: input.start_date || '',
    end_date: input.end_date || '',
    goal: input.goal || '',
    planned_points: Number(input.planned_points || 0),
    completed_points: Number(input.completed_points || 0),
    velocity: Number(input.velocity || 0),
    remarks: input.remarks || '',
  };

  const response = await erpnextJson(
    config,
    isEdit ? `/api/resource/AdvBench%20Sprint/${encodeURIComponent(input.docname)}` : '/api/resource/AdvBench%20Sprint',
    {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  await syncCache();
  return response;
}

export async function deleteSprint(input) {
  const config = loadConfig();
  const response = await erpnextJson(config, `/api/resource/AdvBench%20Sprint/${encodeURIComponent(input.docname)}`, {
    method: 'DELETE',
  });
  await syncCache();
  return response;
}
