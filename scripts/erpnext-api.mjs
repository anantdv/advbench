import http from 'node:http';
import {
  addChatRoomParticipant,
  createOrOpenChatRoom,
  deleteProject,
  deleteSprint,
  deleteTask,
  fetchChatRoomMessages,
  fetchChatUsers,
  listChatRooms,
  loadConfig,
  getChatUnreadSummary,
  loginWithCredentials,
  markChatRoomAsRead,
  removeChatRoomParticipant,
  saveProject,
  saveSprint,
  saveTask,
  sendChatRoomMessage,
  syncCache,
} from './erpnext-bridge.mjs';

const port = Number(process.env.ERPNEXT_API_PORT || 8787);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
        return;
      }

      const params = new URLSearchParams(raw);
      const body = {};
      for (const [key, value] of params.entries()) {
        body[key] = value;
      }
      resolve(body);
    });
    req.on('error', reject);
  });
}

function redirect(res, location) {
  res.writeHead(303, { Location: location || '/' });
  res.end();
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getActor(req, body = {}) {
  return String(req.headers['x-advbench-user'] || body.actor || body.user || '').trim();
}

const server = http.createServer(async (req, res) => {
  try {
    const config = loadConfig();
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'GET' && url.pathname === '/api/status') {
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/sync') {
      const payload = await syncCache();
      return json(res, 200, { ok: true, syncedAt: payload.syncedAt });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(req);
      const user = await loginWithCredentials(body);
      return json(res, 200, { ok: true, user });
    }

    if (req.method === 'POST' && url.pathname === '/api/projects/save') {
      const body = await readBody(req);
      await saveProject(body);
      return redirect(res, body.returnTo || '/projects');
    }

    if (req.method === 'POST' && url.pathname === '/api/projects/delete') {
      const body = await readBody(req);
      await deleteProject(body);
      return redirect(res, body.returnTo || '/projects');
    }

    if (req.method === 'POST' && url.pathname === '/api/tasks/save') {
      const body = await readBody(req);
      await saveTask(body);
      return redirect(res, body.returnTo || '/tasks');
    }

    if (req.method === 'POST' && url.pathname === '/api/tasks/delete') {
      const body = await readBody(req);
      await deleteTask(body);
      return redirect(res, body.returnTo || '/tasks');
    }

    if (req.method === 'POST' && url.pathname === '/api/sprints/save') {
      const body = await readBody(req);
      await saveSprint(body);
      return redirect(res, body.returnTo || '/sprints');
    }

    if (req.method === 'POST' && url.pathname === '/api/sprints/delete') {
      const body = await readBody(req);
      await deleteSprint(body);
      return redirect(res, body.returnTo || '/sprints');
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/users') {
      const actor = getActor(req);
      if (!actor) return json(res, 401, { error: 'Missing chat user.' });
      const query = url.searchParams.get('q') || '';
      const users = await fetchChatUsers(config, query);
      return json(res, 200, { ok: true, data: users });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/rooms') {
      const actor = getActor(req);
      if (!actor) return json(res, 401, { error: 'Missing chat user.' });
      const query = url.searchParams.get('q') || '';
      const rooms = await listChatRooms(config, actor, query);
      return json(res, 200, { ok: true, data: rooms });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/unread') {
      const actor = getActor(req);
      if (!actor) return json(res, 401, { error: 'Missing chat user.' });
      const unread = await getChatUnreadSummary(config, actor);
      return json(res, 200, { ok: true, data: unread });
    }

    if (url.pathname.startsWith('/api/chat/rooms/')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const roomId = decodeURIComponent(segments[3] || '');
      const action = segments[4] || '';
      const actor = getActor(req);
      if (!actor) return json(res, 401, { error: 'Missing chat user.' });

      if (req.method === 'GET' && action === 'messages') {
        const before = url.searchParams.get('before') || undefined;
        const limit = Number(url.searchParams.get('limit') || 30);
        const payload = await fetchChatRoomMessages(config, actor, roomId, { before, limit });
        return json(res, 200, { ok: true, data: payload });
      }

      if (req.method === 'POST' && action === 'messages') {
        const body = await readBody(req);
        const message = await sendChatRoomMessage(config, actor, roomId, body);
        return json(res, 200, { ok: true, data: message });
      }

      if (req.method === 'POST' && action === 'read') {
        await markChatRoomAsRead(config, actor, roomId);
        return json(res, 200, { ok: true });
      }

      if (action === 'members' && req.method === 'POST') {
        const body = await readBody(req);
        await addChatRoomParticipant(config, actor, roomId, body.user, body.role || 'member');
        return json(res, 200, { ok: true });
      }

      if (action === 'members' && req.method === 'DELETE') {
        const body = await readBody(req);
        await removeChatRoomParticipant(config, actor, roomId, body.user);
        return json(res, 200, { ok: true });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/chat/rooms') {
      const body = await readBody(req);
      const actor = getActor(req, body);
      if (!actor) return json(res, 401, { error: 'Missing chat user.' });
      const room = await createOrOpenChatRoom(config, actor, body);
      return json(res, 200, { ok: true, data: room });
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ERPNext API relay listening on http://127.0.0.1:${port}`);
});
