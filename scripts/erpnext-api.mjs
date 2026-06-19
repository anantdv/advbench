import http from 'node:http';
import { deleteProject, deleteSprint, deleteTask, loginWithCredentials, saveProject, saveSprint, saveTask, syncCache } from './erpnext-bridge.mjs';

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

const server = http.createServer(async (req, res) => {
  try {
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

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ERPNext API relay listening on http://127.0.0.1:${port}`);
});
