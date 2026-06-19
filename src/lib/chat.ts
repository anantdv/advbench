import { buildErpnextUrl } from '../config/erpnext';

export type ChatRoomType = 'direct' | 'project_group';

export type ChatUserOption = {
  user: string;
  fullName: string;
  email?: string;
  designation?: string;
  department?: string;
};

export type ChatRoomMember = {
  user: string;
  fullName: string;
  role: 'owner' | 'member';
  unreadCount: number;
  lastReadAt: string | null;
  muted: boolean;
};

export type ChatRoomSummary = {
  id: string;
  roomType: ChatRoomType;
  title: string;
  project: string | null;
  projectTitle: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSender: string | null;
  memberCount: number;
  unreadCount: number;
  members: ChatRoomMember[];
};

export type ChatMessage = {
  id: string;
  roomId: string;
  sender: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'system';
  clientMessageId: string | null;
  createdAt: string;
  mine?: boolean;
  status?: 'sending' | 'sent' | 'failed';
};

type ApiPayload<T> = {
  ok?: boolean;
  error?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

function buildHeaders(actor: string, headers: HeadersInit = {}) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-ADVBench-User': actor,
    ...headers,
  };
}

async function requestJson<T>(path: string, actor: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: buildHeaders(actor, init.headers ?? {}),
  });

  const raw = await response.text();
  let payload: ApiPayload<T> | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiPayload<T>) : null;
  } catch {
    payload = { error: raw };
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || raw || `Request failed with ${response.status}`);
  }

  return (payload?.data ?? (payload as unknown as T)) as T;
}

function getText(value: unknown) {
  return value == null ? '' : String(value);
}

export async function fetchChatUsers(actor: string, query = '') {
  const url = new URL(buildErpnextUrl('/api/chat/users'), window.location.origin);
  url.searchParams.set('user', actor);
  if (query.trim()) {
    url.searchParams.set('q', query.trim());
  }
  return requestJson<ChatUserOption[]>(url.pathname + url.search, actor);
}

export async function fetchChatRooms(actor: string, search = '') {
  const url = new URL(buildErpnextUrl('/api/chat/rooms'), window.location.origin);
  url.searchParams.set('user', actor);
  if (search.trim()) {
    url.searchParams.set('q', search.trim());
  }
  return requestJson<ChatRoomSummary[]>(url.pathname + url.search, actor);
}

export async function createChatRoom(
  actor: string,
  input: {
    roomType: ChatRoomType;
    title?: string;
    project?: string;
    projectTitle?: string;
    participantUsers?: string[];
  },
) {
  return requestJson<ChatRoomSummary>(buildErpnextUrl('/api/chat/rooms'), actor, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actor,
    }),
  });
}

export async function fetchChatMessages(
  actor: string,
  roomId: string,
  options: {
    before?: string | null;
    limit?: number;
  } = {},
) {
  const url = new URL(buildErpnextUrl(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`), window.location.origin);
  url.searchParams.set('user', actor);
  if (options.before) {
    url.searchParams.set('before', options.before);
  }
  if (options.limit) {
    url.searchParams.set('limit', String(options.limit));
  }
  return requestJson<{
    room: ChatRoomSummary;
    items: ChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(url.pathname + url.search, actor);
}

export async function sendChatMessage(
  actor: string,
  roomId: string,
  input: {
    content: string;
    clientMessageId?: string;
  },
) {
  return requestJson<ChatMessage>(buildErpnextUrl(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`), actor, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actor,
    }),
  });
}

export async function markChatRoomRead(actor: string, roomId: string) {
  return requestJson<{ ok: true }>(buildErpnextUrl(`/api/chat/rooms/${encodeURIComponent(roomId)}/read`), actor, {
    method: 'POST',
    body: JSON.stringify({ actor }),
  });
}

export async function addChatRoomMember(
  actor: string,
  roomId: string,
  input: {
    user: string;
    role?: 'owner' | 'member';
  },
) {
  return requestJson<{ ok: true }>(buildErpnextUrl(`/api/chat/rooms/${encodeURIComponent(roomId)}/members`), actor, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actor,
    }),
  });
}

export async function removeChatRoomMember(actor: string, roomId: string, user: string) {
  return requestJson<{ ok: true }>(buildErpnextUrl(`/api/chat/rooms/${encodeURIComponent(roomId)}/members`), actor, {
    method: 'DELETE',
    body: JSON.stringify({
      actor,
      user,
    }),
  });
}

export async function fetchChatUnreadCounts(actor: string) {
  const url = new URL(buildErpnextUrl('/api/chat/unread'), window.location.origin);
  url.searchParams.set('user', actor);
  return requestJson<{ totalUnreadCount: number; roomUnreadCounts: Record<string, number> }>(url.pathname + url.search, actor);
}

export function getChatDisplayName(user: ChatUserOption | string, fallback?: string) {
  if (typeof user === 'string') {
    return user || fallback || 'Unknown';
  }
  return user.fullName || user.email || user.user || fallback || 'Unknown';
}

export function roomTitleForDirectRoom(room: ChatRoomSummary, actor: string) {
  const partner = room.members.find((member) => member.user !== actor);
  return room.title || partner?.fullName || partner?.user || 'Direct message';
}

export function roomSubtitle(room: ChatRoomSummary, actor: string) {
  if (room.roomType === 'project_group') {
    return room.projectTitle ? `Project: ${room.projectTitle}` : room.project ? `Project: ${room.project}` : 'Project room';
  }

  const partnerNames = room.members
    .filter((member) => member.user !== actor)
    .map((member) => member.fullName || member.user)
    .filter(Boolean);

  return partnerNames.length > 0 ? partnerNames.join(', ') : 'Direct message';
}

export function messageKey(message: ChatMessage) {
  return message.clientMessageId || message.id;
}

export function sortMessages(items: ChatMessage[]) {
  return [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function normalizeSearch(text: string) {
  return getText(text).trim().toLowerCase();
}
