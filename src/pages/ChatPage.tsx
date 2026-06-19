import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { useAuthStore } from '../store/authStore';
import {
  addChatRoomMember,
  createChatRoom,
  fetchChatMessages,
  fetchChatRooms,
  fetchChatUnreadCounts,
  fetchChatUsers,
  markChatRoomRead,
  messageKey,
  normalizeSearch,
  removeChatRoomMember,
  roomSubtitle,
  roomTitleForDirectRoom,
  sendChatMessage,
  sortMessages,
  type ChatMessage,
  type ChatRoomSummary,
  type ChatRoomType,
  type ChatUserOption,
} from '../lib/chat';

function formatClock(value: string | null) {
  if (!value) return 'No messages yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function roomDisplayName(room: ChatRoomSummary, actor: string) {
  return room.roomType === 'direct' ? roomTitleForDirectRoom(room, actor) : room.title || room.projectTitle || room.project || 'Project room';
}

function dedupeMessages(serverMessages: ChatMessage[], optimisticMessages: ChatMessage[]) {
  const merged = new Map<string, ChatMessage>();
  for (const message of serverMessages) {
    merged.set(messageKey(message), message);
  }
  for (const message of optimisticMessages) {
    if (!merged.has(messageKey(message))) {
      merged.set(messageKey(message), message);
    }
  }
  return sortMessages([...merged.values()]);
}

function resolveUserValue(value: string, users: ChatUserOption[]) {
  const trimmed = value.trim();
  const match = users.find((item) => item.user === trimmed || item.fullName === trimmed || item.email === trimmed);
  return match?.user || trimmed;
}

export function ChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const actor = user?.username || '';
  const displayName = user?.displayName || user?.username || 'You';
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRoomId = searchParams.get('room') || '';
  const projectParam = searchParams.get('project') || '';
  const projectTitleParam = searchParams.get('title') || '';
  const [roomSearch, setRoomSearch] = useState('');
  const [directTarget, setDirectTarget] = useState('');
  const [inviteTarget, setInviteTarget] = useState('');
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const projectRoomHandledRef = useRef<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const roomsQuery = useQuery({
    queryKey: ['chat', 'rooms', actor],
    queryFn: () => fetchChatRooms(actor),
    enabled: Boolean(actor),
    refetchInterval: 5000,
  });

  const usersQuery = useQuery({
    queryKey: ['chat', 'users', actor],
    queryFn: () => fetchChatUsers(actor),
    enabled: Boolean(actor),
    staleTime: 5 * 60 * 1000,
  });

  const unreadQuery = useQuery({
    queryKey: ['chat', 'unread', actor],
    queryFn: () => fetchChatUnreadCounts(actor),
    enabled: Boolean(actor),
    refetchInterval: 4000,
  });

  const createRoomMutation = useMutation({
    mutationFn: (input: { roomType: ChatRoomType; title?: string; project?: string; projectTitle?: string; participantUsers?: string[] }) =>
      createChatRoom(actor, input),
    onSuccess: (room) => {
      setRoomError('');
      setSearchParams({ room: room.id }, { replace: true });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error) => {
      projectRoomHandledRef.current = null;
      setRoomError(error instanceof Error ? error.message : 'Unable to open chat room.');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ roomId, content, clientMessageId }: { roomId: string; content: string; clientMessageId: string }) =>
      sendChatMessage(actor, roomId, { content, clientMessageId }),
    onMutate: async (variables) => {
      setDraftError('');
      const optimistic: ChatMessage = {
        id: variables.clientMessageId,
        roomId: variables.roomId,
        sender: actor,
        senderName: displayName,
        content: variables.content,
        messageType: 'text',
        clientMessageId: variables.clientMessageId,
        createdAt: new Date().toISOString(),
        mine: true,
        status: 'sending',
      };
      setOptimisticMessages((current) => [...current.filter((message) => message.clientMessageId !== variables.clientMessageId), optimistic]);
      return { clientMessageId: variables.clientMessageId };
    },
    onSuccess: (message, _variables, context) => {
      setOptimisticMessages((current) => current.filter((item) => item.clientMessageId !== context?.clientMessageId));
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      setDraft('');
      return message;
    },
    onError: (error, _variables, context) => {
      setOptimisticMessages((current) =>
        current.map((item) =>
          item.clientMessageId === context?.clientMessageId
            ? {
                ...item,
                status: 'failed',
              }
            : item,
        ),
      );
      setDraftError(error instanceof Error ? error.message : 'Message failed to send');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (roomId: string) => markChatRoomRead(actor, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ roomId, user }: { roomId: string; user: string }) => addChatRoomMember(actor, roomId, { user }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ roomId, user }: { roomId: string; user: string }) => removeChatRoomMember(actor, roomId, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });

  const selectedRoom = useMemo(() => roomsQuery.data?.find((room) => room.id === selectedRoomId) ?? null, [roomsQuery.data, selectedRoomId]);
  const filteredRooms = useMemo(() => {
    const term = normalizeSearch(roomSearch);
    const source = roomsQuery.data ?? [];
    if (!term) return source;
    return source.filter((room) => {
      const memberNames = room.members.map((member) => member.fullName || member.user).join(' ');
      return [room.title, room.project ?? '', room.projectTitle ?? '', room.lastMessagePreview ?? '', memberNames]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [roomSearch, roomsQuery.data]);

  const messagesQuery = useInfiniteQuery({
    queryKey: ['chat', 'messages', actor, selectedRoomId],
    queryFn: ({ pageParam }) => fetchChatMessages(actor, selectedRoomId, { before: pageParam || undefined, limit: 30 }),
    enabled: Boolean(actor && selectedRoomId),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    refetchInterval: selectedRoomId ? 4000 : false,
  });

  const messages = useMemo(() => {
    const serverMessages = (messagesQuery.data?.pages ?? []).flatMap((page) => page.items);
    return dedupeMessages(serverMessages, optimisticMessages.filter((message) => message.roomId === selectedRoomId));
  }, [messagesQuery.data?.pages, optimisticMessages, selectedRoomId]);

  const availableDirectUsers = useMemo(() => {
    const roster = usersQuery.data ?? [];
    return roster.filter((item) => item.user !== actor && normalizeSearch(`${item.user} ${item.fullName} ${item.email}`).includes(normalizeSearch(directTarget)));
  }, [actor, directTarget, usersQuery.data]);

  const availableInviteUsers = useMemo(() => {
    const roster = usersQuery.data ?? [];
    const members = new Set(selectedRoom?.members.map((member) => member.user) ?? []);
    return roster.filter((item) => item.user !== actor && !members.has(item.user) && normalizeSearch(`${item.user} ${item.fullName} ${item.email}`).includes(normalizeSearch(inviteTarget)));
  }, [actor, inviteTarget, selectedRoom?.members, usersQuery.data]);

  const actorIsMember = Boolean(selectedRoom?.members.some((member) => member.user === actor));
  const canManageMembers = Boolean(selectedRoom && selectedRoom.roomType === 'project_group' && actorIsMember);

  useEffect(() => {
    if (!selectedRoomId) return;
    if (selectedRoom?.unreadCount === 0) return;
    markReadMutation.mutate(selectedRoomId);
  }, [markReadMutation, selectedRoom?.unreadCount, selectedRoomId]);

  useEffect(() => {
    if (!projectParam || selectedRoomId || !actor) return;
    if (projectRoomHandledRef.current === projectParam) return;
    projectRoomHandledRef.current = projectParam;

    let cancelled = false;
    createRoomMutation.mutate(
      {
        roomType: 'project_group',
        project: projectParam,
        projectTitle: projectTitleParam || projectParam,
        participantUsers: [actor],
        title: projectTitleParam ? `Project Chat: ${projectTitleParam}` : `Project Chat: ${projectParam}`,
      },
      {
        onSuccess: (room) => {
          if (!cancelled) {
            setSearchParams({ room: room.id }, { replace: true });
          }
        },
      },
    );

    return () => {
      cancelled = true;
    };
  }, [actor, createRoomMutation, projectParam, projectTitleParam, selectedRoomId, setSearchParams]);

  useEffect(() => {
    if (selectedRoomId || projectParam) return;
    const firstRoom = filteredRooms[0];
    if (!firstRoom) return;
    setSearchParams({ room: firstRoom.id }, { replace: true });
  }, [filteredRooms, projectParam, selectedRoomId, setSearchParams]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, selectedRoomId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const openDirectChat = () => {
    if (!directTarget) return;
    const resolvedUser = resolveUserValue(directTarget, usersQuery.data ?? []);
    setRoomError('');
    createRoomMutation.mutate({
      roomType: 'direct',
      participantUsers: [resolvedUser],
      title: availableDirectUsers.find((item) => item.user === resolvedUser)?.fullName || resolvedUser,
    });
    setDirectTarget('');
  };

  const handleSend = () => {
    if (!selectedRoomId || !draft.trim() || sendMessageMutation.isPending) return;
    const clientMessageId = typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sendMessageMutation.mutate({
      roomId: selectedRoomId,
      content: draft.trim(),
      clientMessageId,
    });
  };

  const handleAddMember = () => {
    if (!selectedRoomId || !inviteTarget.trim()) return;
    addMemberMutation.mutate({ roomId: selectedRoomId, user: resolveUserValue(inviteTarget, usersQuery.data ?? []) });
    setInviteTarget('');
  };

  const selectedRoomMessages = messages;

  return (
    <>
      <Topbar title="Chat" description="Direct messages, project rooms, unread badges, and delivery conversations in one place." />

      <section className="chat-layout">
        <aside className="panel chat-sidebar">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Conversations</p>
              <h2>Inbox</h2>
            </div>
            <span className="badge">{unreadQuery.data?.totalUnreadCount ?? 0} unread</span>
          </div>

          <label className="search chat-search">
            <span>Search conversations</span>
            <input value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} placeholder="Search by name, project, or message..." />
          </label>

          <div className="chat-create-block">
            <div className="chat-create-row">
              <label className="search">
                <span>Start direct chat</span>
                <input
                  list="chat-users"
                  value={directTarget}
                  onChange={(event) => setDirectTarget(event.target.value)}
                  placeholder="Search employees"
                />
              </label>
              <button type="button" className="secondary-btn" onClick={openDirectChat} disabled={!directTarget || createRoomMutation.isPending}>
                Open
              </button>
            </div>
            {roomError ? <p className="chat-error">{roomError}</p> : null}
            <datalist id="chat-users">
              {availableDirectUsers.map((option: ChatUserOption) => (
                <option key={option.user} value={option.user}>
                  {option.fullName}
                </option>
              ))}
            </datalist>
          </div>

          {roomsQuery.isLoading ? <p className="empty-copy">Loading conversations...</p> : null}
          {roomsQuery.error ? <p className="empty-copy">{roomsQuery.error instanceof Error ? roomsQuery.error.message : 'Unable to load conversations.'}</p> : null}

          <div className="conversation-list">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const active = room.id === selectedRoomId;
                const unread = room.unreadCount;
                return (
                  <button
                    key={room.id}
                    type="button"
                    className={`conversation-item ${active ? 'active' : ''}`}
                    onClick={() => setSearchParams({ room: room.id }, { replace: true })}
                  >
                    <div className="conversation-item-header">
                      <strong>{roomDisplayName(room, actor)}</strong>
                      {unread > 0 ? <span className="pill unread-pill">{unread}</span> : null}
                    </div>
                    <span>{room.roomType === 'project_group' ? roomSubtitle(room, actor) : room.lastMessagePreview || roomSubtitle(room, actor)}</span>
                    <small>{formatClock(room.lastMessageAt)}</small>
                  </button>
                );
              })
            ) : (
              <p className="empty-copy">No conversations yet. Start a direct chat or open a project room.</p>
            )}
          </div>
        </aside>

        <main className="panel chat-thread">
          <div className="chat-thread-header">
            <div>
              <p className="panel-kicker">Messages</p>
              <h2>{selectedRoom ? roomDisplayName(selectedRoom, actor) : 'Select a conversation'}</h2>
              <p className="drawer-subtitle">{selectedRoom ? roomSubtitle(selectedRoom, actor) : 'Choose a direct message or create a project room.'}</p>
            </div>
            <div className="chat-thread-actions">
              {selectedRoom?.project ? (
                <button type="button" className="secondary-btn" onClick={() => navigate(`/projects?doc=${encodeURIComponent(selectedRoom.project || '')}`)}>
                  Open Project
                </button>
              ) : null}
              {messagesQuery.hasNextPage ? (
                <button type="button" className="secondary-btn" onClick={() => messagesQuery.fetchNextPage()} disabled={messagesQuery.isFetchingNextPage}>
                  {messagesQuery.isFetchingNextPage ? 'Loading older...' : 'Load older'}
                </button>
              ) : null}
            </div>
          </div>

          {selectedRoom ? (
            <>
              <div className="message-feed">
                {messagesQuery.isLoading ? <p className="empty-copy">Loading messages...</p> : null}
                {messagesQuery.error ? (
                  <p className="empty-copy">{messagesQuery.error instanceof Error ? messagesQuery.error.message : 'Unable to load messages.'}</p>
                ) : null}

                {selectedRoomMessages.length > 0 ? (
                  selectedRoomMessages.map((message) => (
                    <article key={messageKey(message)} className={`chat-message ${message.mine ? 'mine' : ''} ${message.status === 'sending' ? 'sending' : ''}`}>
                      <div className="chat-message-meta">
                        <strong>{message.mine ? displayName : message.senderName || message.sender}</strong>
                        <span>{formatClock(message.createdAt)}</span>
                      </div>
                      <p>{message.content}</p>
                      {message.status === 'sending' ? <small>Sending...</small> : null}
                      {message.status === 'failed' ? <small>Failed to send</small> : null}
                    </article>
                  ))
                ) : !messagesQuery.isLoading ? (
                  <p className="empty-copy">No messages yet. Start the conversation.</p>
                ) : null}
                <div ref={threadEndRef} />
              </div>

              <form
                className="chat-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  rows={4}
                  disabled={sendMessageMutation.isPending}
                />
                <div className="chat-composer-footer">
                  <span className="chat-hint">{draftError || 'Press Enter to send from the button below.'}</span>
                  <button type="submit" className="primary-btn" disabled={!draft.trim() || sendMessageMutation.isPending}>
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <p className="empty-copy">Select a conversation from the left or start a direct message.</p>
            </div>
          )}
        </main>

        <aside className="panel chat-info">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Room</p>
              <h2>Details</h2>
            </div>
          </div>

          {selectedRoom ? (
            <div className="detail-stack">
              <div className="detail-row">
                <span>Type</span>
                <strong>{selectedRoom.roomType === 'project_group' ? 'Project Group' : 'Direct'}</strong>
              </div>
              <div className="detail-row">
                <span>Unread</span>
                <strong>{selectedRoom.unreadCount}</strong>
              </div>
              <div className="detail-row">
                <span>Members</span>
                <strong>{selectedRoom.memberCount}</strong>
              </div>
              <div className="detail-row">
                <span>Last update</span>
                <strong>{formatClock(selectedRoom.lastMessageAt)}</strong>
              </div>

              <div>
                <p className="panel-kicker">Members</p>
                <div className="member-list">
                  {selectedRoom.members.length > 0 ? (
                    selectedRoom.members.map((member) => (
                      <div key={member.user} className="member-card">
                        <div>
                          <strong>{member.fullName || member.user}</strong>
                          <span>{member.user}</span>
                        </div>
                        {member.user === actor ? <span className="pill">You</span> : null}
                        {canManageMembers && member.user !== actor ? (
                          <button type="button" className="secondary-btn danger-btn" onClick={() => removeMemberMutation.mutate({ roomId: selectedRoom.id, user: member.user })}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="empty-copy">No members are listed yet.</p>
                  )}
                </div>
              </div>

              {selectedRoom.roomType === 'project_group' ? (
                <div className="chat-invite-block">
                  <p className="panel-kicker">Invite</p>
                  <div className="chat-create-row">
                    <label className="search">
                      <span>Add member</span>
                      <input list="invite-users" value={inviteTarget} onChange={(event) => setInviteTarget(event.target.value)} placeholder="Search employee" />
                    </label>
                    <button type="button" className="secondary-btn" onClick={handleAddMember} disabled={!inviteTarget.trim() || addMemberMutation.isPending}>
                      Add
                    </button>
                  </div>
                  <datalist id="invite-users">
                    {availableInviteUsers.map((option: ChatUserOption) => (
                      <option key={option.user} value={option.user}>
                        {option.fullName}
                      </option>
                    ))}
                  </datalist>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="empty-copy">Room details, members, and invite controls will appear here once you open a conversation.</p>
          )}
        </aside>
      </section>
    </>
  );
}
