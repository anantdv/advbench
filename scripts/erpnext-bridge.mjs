import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const cachePath = path.join(root, 'src', 'generated', 'erpnext-cache.json');
const defaultBaseUrl = 'https://erp.anantdv.com';

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
  const baseUrl = (env.VITE_ERPNEXT_BASE_URL || process.env.VITE_ERPNEXT_BASE_URL || defaultBaseUrl).trim().replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('ERPNext base URL is missing.');
  }

  return {
    baseUrl,
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

export async function loginWithCredentials(input) {
  const config = loadConfig();
  const body = new URLSearchParams({
    usr: input.username || '',
    pwd: input.password || '',
  });

  const response = await fetch(buildUrl(config.baseUrl, '/api/method/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'ERPNext login failed.';
    throw new Error(message);
  }

  return {
    username: input.username,
    displayName: payload?.full_name || input.username,
  };
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

const chatDoctypes = {
  room: 'Chat Room',
  member: 'Chat Room Member',
  message: 'Chat Message',
};

function resourcePath(doctype, name) {
  const base = `/api/resource/${encodeURIComponent(doctype)}`;
  return name ? `${base}/${encodeURIComponent(name)}` : base;
}

function listQuery({
  fields,
  filters,
  orderBy,
  limitPageLength,
  limitStart,
}) {
  const params = new URLSearchParams();
  if (fields?.length) {
    params.set('fields', JSON.stringify(fields));
  }
  if (filters?.length) {
    params.set('filters', JSON.stringify(filters));
  }
  if (orderBy) {
    params.set('order_by', orderBy);
  }
  if (limitPageLength !== undefined) {
    params.set('limit_page_length', String(limitPageLength));
  }
  if (limitStart !== undefined && limitStart > 0) {
    params.set('limit_start', String(limitStart));
  }
  return params.toString();
}

function mapChatUser(item) {
  return {
    user: String(item.name ?? item.user ?? ''),
    fullName: String(item.full_name ?? item.fullName ?? item.name ?? ''),
    email: String(item.email ?? ''),
    designation: String(item.designation ?? ''),
    department: String(item.department ?? ''),
  };
}

function mapChatMember(item) {
  return {
    user: String(item.user ?? ''),
    fullName: String(item.full_name ?? item.fullName ?? item.user ?? ''),
    role: String(item.role ?? 'member'),
    unreadCount: Number(item.unread_count ?? 0),
    lastReadAt: item.last_read_at ? String(item.last_read_at) : null,
    muted: Boolean(item.muted ?? 0),
  };
}

function mapChatRoom(item, members = []) {
  return {
    id: String(item.name ?? item.room_key ?? ''),
    roomType: String(item.room_type ?? 'direct'),
    title: String(item.title ?? ''),
    project: item.project ? String(item.project) : null,
    projectTitle: item.project_title ? String(item.project_title) : item.project ? String(item.project) : null,
    lastMessageAt: item.last_message_at ? String(item.last_message_at) : null,
    lastMessagePreview: item.last_message_preview ? String(item.last_message_preview) : null,
    lastSender: item.last_sender ? String(item.last_sender) : null,
    memberCount: Number(item.member_count ?? members.length ?? 0),
    unreadCount: 0,
    members,
  };
}

function mapChatMessage(item, actor) {
  return {
    id: String(item.name ?? item.message_key ?? ''),
    roomId: String(item.room ?? ''),
    sender: String(item.sender ?? ''),
    senderName: String(item.sender_name ?? item.sender ?? ''),
    content: String(item.content ?? ''),
    messageType: String(item.message_type ?? 'text'),
    clientMessageId: item.client_message_id ? String(item.client_message_id) : null,
    createdAt: String(item.creation ?? item.modified ?? ''),
    mine: actor ? String(item.sender ?? '') === actor : false,
  };
}

async function listChatUsers(config) {
  const response = await erpnextJson(
    config,
    `${resourcePath('User')}?${listQuery({
      fields: ['name', 'full_name', 'email', 'designation', 'department', 'enabled'],
      filters: [['enabled', '=', 1]],
      orderBy: 'full_name asc',
      limitPageLength: 500,
    })}`,
  );
  return (response.data ?? []).map(mapChatUser).filter((item) => item.user && item.user !== 'Guest' && item.user !== 'Administrator');
}

async function getChatRoomDocs(config, roomIds) {
  if (roomIds.length === 0) return [];
  const response = await erpnextJson(
    config,
    `${resourcePath(chatDoctypes.room)}?${listQuery({
      fields: ['name', 'room_key', 'room_type', 'title', 'project', 'project_title', 'last_message_at', 'last_message_preview', 'last_sender', 'member_count', 'created_by'],
      filters: [['name', 'in', roomIds]],
      orderBy: 'last_message_at desc, modified desc',
      limitPageLength: roomIds.length + 20,
    })}`,
  );
  return response.data ?? [];
}

async function getChatMemberDocs(config, filters, limitPageLength = 500) {
  const response = await erpnextJson(
    config,
    `${resourcePath(chatDoctypes.member)}?${listQuery({
      fields: ['name', 'room', 'user', 'full_name', 'role', 'last_read_at', 'unread_count', 'muted'],
      filters,
      orderBy: 'modified desc',
      limitPageLength,
    })}`,
  );
  return response.data ?? [];
}

async function getChatMessageDocs(config, roomId, actor, before, limit = 30) {
  const filters = [['room', '=', roomId]];
  if (before) {
    filters.push(['creation', '<', before]);
  }
  const response = await erpnextJson(
    config,
    `${resourcePath(chatDoctypes.message)}?${listQuery({
      fields: ['name', 'room', 'sender', 'sender_name', 'content', 'message_type', 'client_message_id', 'creation', 'modified'],
      filters,
      orderBy: 'creation desc',
      limitPageLength: limit + 1,
    })}`,
  );
  const rows = (response.data ?? []).map((row) => mapChatMessage(row, actor));
  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).reverse();
  return {
    items,
    hasMore,
    nextCursor: hasMore && items.length > 0 ? items[0].createdAt : null,
  };
}

async function ensureChatMember(config, roomId, user, role = 'member', actor = user) {
  const memberKey = `${roomId}|${user}`;
  const existing = await erpnextJson(
    config,
    `${resourcePath(chatDoctypes.member)}?${listQuery({
      fields: ['name', 'room', 'user', 'full_name', 'role', 'last_read_at', 'unread_count', 'muted'],
      filters: [['name', '=', memberKey]],
      limitPageLength: 1,
    })}`,
  );

  if ((existing.data ?? []).length > 0) {
    return (existing.data ?? [])[0];
  }

  const userDocs = await listChatUsers(config);
  const profile = userDocs.find((item) => item.user === user);
  const payload = {
    member_key: memberKey,
    room: roomId,
    user,
    full_name: profile?.fullName || user,
    role,
    unread_count: 0,
    muted: 0,
  };

  return erpnextJson(config, resourcePath(chatDoctypes.member), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
    body: JSON.stringify(payload),
  });
}

async function updateChatRoom(config, roomId, payload, actor) {
  return erpnextJson(config, resourcePath(chatDoctypes.room, roomId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
    body: JSON.stringify(payload),
  });
}

async function updateChatMember(config, memberId, payload, actor) {
  return erpnextJson(config, resourcePath(chatDoctypes.member, memberId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
    body: JSON.stringify(payload),
  });
}

async function createChatMessage(config, payload, actor) {
  return erpnextJson(config, resourcePath(chatDoctypes.message), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
    body: JSON.stringify(payload),
  });
}

async function getChatRoomByKey(config, roomKey) {
  const response = await erpnextJson(
    config,
    `${resourcePath(chatDoctypes.room)}?${listQuery({
      fields: ['name', 'room_key', 'room_type', 'title', 'project', 'project_title', 'last_message_at', 'last_message_preview', 'last_sender', 'member_count', 'created_by'],
      filters: [['room_key', '=', roomKey]],
      limitPageLength: 1,
    })}`,
  );
  return (response.data ?? [])[0] ?? null;
}

async function getRoomMembersWithProfiles(config, roomId) {
  const members = await getChatMemberDocs(config, [['room', '=', roomId]], 500);
  return members.map(mapChatMember);
}

async function getRoomSummary(config, roomId, actor) {
  const room = await getChatRoomByKey(config, roomId);
  if (!room) return null;
  const members = await getRoomMembersWithProfiles(config, roomId);
  const current = members.find((member) => member.user === actor);
  const mapped = mapChatRoom(room, members);
  mapped.unreadCount = current?.unreadCount ?? 0;
  return mapped;
}

export async function listChatRooms(config, actor, search = '') {
  const memberDocs = await getChatMemberDocs(config, [['user', '=', actor]], 500);
  const roomIds = [...new Set(memberDocs.map((item) => String(item.room ?? '')).filter(Boolean))];
  if (roomIds.length === 0) return [];

  const roomDocs = await getChatRoomDocs(config, roomIds);
  const memberDocsForRooms = await getChatMemberDocs(config, [['room', 'in', roomIds]], 1000);
  const memberByRoom = new Map();
  for (const member of memberDocsForRooms) {
    const key = String(member.room ?? '');
    if (!memberByRoom.has(key)) memberByRoom.set(key, []);
    memberByRoom.get(key).push(mapChatMember(member));
  }

  const currentMemberByRoom = new Map(memberDocs.map((member) => [String(member.room ?? ''), mapChatMember(member)]));
  const term = search.trim().toLowerCase();

  const rooms = roomDocs.map((room) => {
    const members = memberByRoom.get(String(room.name ?? room.room_key ?? '')) ?? [];
    const current = currentMemberByRoom.get(String(room.name ?? room.room_key ?? ''));
    const mapped = mapChatRoom(room, members);
    mapped.unreadCount = current?.unreadCount ?? 0;
    if (!mapped.title) {
      if (mapped.roomType === 'project_group') {
        mapped.title = mapped.projectTitle ? `Project Chat: ${mapped.projectTitle}` : `Project Chat: ${mapped.project ?? 'Project'}`;
      } else {
        const peers = members.filter((member) => member.user !== actor).map((member) => member.fullName || member.user);
        mapped.title = peers.length > 0 ? peers.join(', ') : 'Direct message';
      }
    }
    return mapped;
  });

  const filtered = term
    ? rooms.filter((room) => {
        const memberNames = room.members.map((member) => member.fullName || member.user).join(' ');
        return [room.title, room.project ?? '', room.projectTitle ?? '', room.lastMessagePreview ?? '', memberNames]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
    : rooms;

  return filtered.sort((left, right) => (right.lastMessageAt ?? right.id).localeCompare(left.lastMessageAt ?? left.id));
}

export async function fetchChatUsers(config, search = '') {
  const users = await listChatUsers(config);
  const term = search.trim().toLowerCase();
  if (!term) return users.slice(0, 50);
  return users.filter((user) => [user.user, user.fullName, user.email, user.department, user.designation].join(' ').toLowerCase().includes(term));
}

export async function fetchChatRoom(config, actor, roomId) {
  return getRoomSummary(config, roomId, actor);
}

export async function fetchChatRoomMessages(config, actor, roomId, options = {}) {
  const memberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', actor]], 1);
  if (memberDocs.length === 0) {
    throw new Error('You do not have access to this chat room.');
  }
  const payload = await getChatMessageDocs(config, roomId, actor, options.before ?? null, options.limit ?? 30);
  return {
    room: await getRoomSummary(config, roomId, actor),
    ...payload,
  };
}

export async function createOrOpenChatRoom(config, actor, input) {
  const roomType = input.roomType || 'direct';
  const participantUsers = Array.from(new Set([actor, ...(input.participantUsers ?? []).filter(Boolean)])).filter(Boolean);

  if (roomType === 'direct') {
    if (participantUsers.length < 2) {
      throw new Error('A direct chat needs another participant.');
    }
    const roomKey = `direct:${participantUsers.slice().sort().join('|')}`;
    const existing = await getChatRoomByKey(config, roomKey);
    if (existing) {
      await ensureChatMember(config, String(existing.name), actor, 'owner', actor);
      for (const user of participantUsers) {
        await ensureChatMember(config, String(existing.name), user, user === actor ? 'owner' : 'member', actor);
      }
      await updateChatRoom(config, String(existing.name), { member_count: participantUsers.length }, actor);
      return getRoomSummary(config, String(existing.name), actor);
    }

    await erpnextJson(config, resourcePath(chatDoctypes.room), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
      body: JSON.stringify({
        room_key: roomKey,
        room_type: 'direct',
        title: input.title || participantUsers.filter((user) => user !== actor).join(', ') || 'Direct message',
        project: '',
        project_title: '',
        created_by: actor,
        last_message_at: '',
        last_message_preview: '',
        last_sender: '',
        member_count: participantUsers.length,
      }),
    });

    for (const user of participantUsers) {
      await ensureChatMember(config, roomKey, user, user === actor ? 'owner' : 'member', actor);
    }
    return getRoomSummary(config, roomKey, actor);
  }

  const project = input.project?.trim();
  if (!project) {
    throw new Error('Project group chats require a project.');
  }
  const roomKey = `project:${project}`;
  const existing = await getChatRoomByKey(config, roomKey);
  if (existing) {
    await ensureChatMember(config, String(existing.name), actor, 'owner', actor);
    for (const user of participantUsers) {
      await ensureChatMember(config, String(existing.name), user, user === actor ? 'owner' : 'member', actor);
    }
    const memberCount = (await getChatMemberDocs(config, [['room', '=', String(existing.name)]], 1000)).length;
    await updateChatRoom(config, String(existing.name), { member_count: memberCount }, actor);
    return getRoomSummary(config, String(existing.name), actor);
  }

  await erpnextJson(config, resourcePath(chatDoctypes.room), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-ADVBench-User': actor },
    body: JSON.stringify({
      room_key: roomKey,
      room_type: 'project_group',
      title: input.title || `Project Chat: ${input.projectTitle || project}`,
      project,
      project_title: input.projectTitle || project,
      created_by: actor,
      last_message_at: '',
      last_message_preview: '',
      last_sender: '',
      member_count: 1,
    }),
  });

  await ensureChatMember(config, roomKey, actor, 'owner', actor);
  for (const user of participantUsers.filter((item) => item !== actor)) {
    await ensureChatMember(config, roomKey, user, 'member', actor);
  }
  return getRoomSummary(config, roomKey, actor);
}

export async function sendChatRoomMessage(config, actor, roomId, input) {
  const room = await getChatRoomByKey(config, roomId);
  if (!room) {
    throw new Error('Chat room not found.');
  }

  const memberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', actor]], 1);
  if (memberDocs.length === 0) {
    throw new Error('You do not have access to this chat room.');
  }

  const clientMessageId = input.clientMessageId || '';
  if (clientMessageId) {
    const existing = await erpnextJson(
      config,
      `${resourcePath(chatDoctypes.message)}?${listQuery({
        fields: ['name', 'room', 'sender', 'sender_name', 'content', 'message_type', 'client_message_id', 'creation', 'modified'],
        filters: [['client_message_id', '=', clientMessageId]],
        limitPageLength: 1,
      })}`,
    );
    const existingRow = (existing.data ?? [])[0];
    if (existingRow) {
      return mapChatMessage(existingRow, actor);
    }
  }

  const messageKey = `${roomId}|${clientMessageId || randomUUID()}`;
  const created = await createChatMessage(
    config,
    {
      message_key: messageKey,
      room: roomId,
      sender: actor,
      sender_name: actor,
      content: input.content,
      message_type: 'text',
      client_message_id: clientMessageId || '',
    },
    actor,
  );
  const message = created.data ?? created;

  await updateChatRoom(
    config,
    roomId,
    {
      last_message_at: new Date().toISOString(),
      last_message_preview: input.content.slice(0, 180),
      last_sender: actor,
    },
    actor,
  );

  const roomMembers = await getChatMemberDocs(config, [['room', '=', roomId]], 1000);
  await Promise.all(
    roomMembers
      .filter((member) => String(member.user ?? '') !== actor)
      .map((member) =>
        updateChatMember(
          config,
          String(member.name ?? `${roomId}|${member.user}`),
          {
            unread_count: Number(member.unread_count ?? 0) + 1,
          },
          actor,
        ),
      ),
  );

  return mapChatMessage(message, actor);
}

export async function markChatRoomAsRead(config, actor, roomId) {
  const memberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', actor]], 1);
  if (memberDocs.length === 0) {
    throw new Error('You do not have access to this chat room.');
  }

  const member = memberDocs[0];
  await updateChatMember(
    config,
    String(member.name ?? `${roomId}|${actor}`),
    {
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    },
    actor,
  );
  return { ok: true };
}

export async function addChatRoomParticipant(config, actor, roomId, user, role = 'member') {
  const room = await getChatRoomByKey(config, roomId);
  if (!room) throw new Error('Chat room not found.');
  if (String(room.room_type ?? 'direct') === 'direct' && user !== actor) {
    throw new Error('Direct chats cannot be modified.');
  }
  const currentMemberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', actor]], 1);
  if (currentMemberDocs.length === 0) {
    throw new Error('You do not have access to this chat room.');
  }
  await ensureChatMember(config, roomId, user, role, actor);
  const memberCount = (await getChatMemberDocs(config, [['room', '=', roomId]], 1000)).length;
  await updateChatRoom(config, roomId, { member_count: memberCount }, actor);
  return { ok: true };
}

export async function removeChatRoomParticipant(config, actor, roomId, user) {
  const room = await getChatRoomByKey(config, roomId);
  if (!room) throw new Error('Chat room not found.');
  const currentMemberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', actor]], 1);
  if (currentMemberDocs.length === 0) {
    throw new Error('You do not have access to this chat room.');
  }
  if (String(room.room_type ?? 'direct') === 'direct' && user !== actor) {
    throw new Error('Direct chats cannot be modified.');
  }

  const memberDocs = await getChatMemberDocs(config, [['room', '=', roomId], ['user', '=', user]], 1);
  if (memberDocs.length === 0) return { ok: true };

  await erpnextJson(config, resourcePath(chatDoctypes.member, String(memberDocs[0].name)), {
    method: 'DELETE',
    headers: { 'X-ADVBench-User': actor },
  });
  const memberCount = (await getChatMemberDocs(config, [['room', '=', roomId]], 1000)).length;
  await updateChatRoom(config, roomId, { member_count: memberCount }, actor);
  return { ok: true };
}

export async function getChatUnreadSummary(config, actor) {
  const memberDocs = await getChatMemberDocs(config, [['user', '=', actor]], 1000);
  const roomUnreadCounts = {};
  let totalUnreadCount = 0;
  for (const member of memberDocs) {
    const unread = Number(member.unread_count ?? 0);
    roomUnreadCounts[String(member.room ?? '')] = unread;
    totalUnreadCount += unread;
  }
  return { totalUnreadCount, roomUnreadCounts };
}
