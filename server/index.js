import { createServer } from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit, nextId, readDatabase, updateDatabase } from './store.js';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 5174);
const root = fileURLToPath(new URL('../dist', import.meta.url));
const roles = new Set(['director', 'manager', 'employee', 'finance']);
const sessions = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requireSession(request, response) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) return sessions.get(token);
  sendJson(response, 401, { message: 'Demo session required' });
  return null;
}

function createToken(role) {
  const token = `demo-${role}-${crypto.randomUUID()}`;
  sessions.set(token, { role, createdAt: new Date().toISOString() });
  return token;
}

function normalizeRequest(input, id) {
  return {
    ...input,
    id,
    code: input.code || `REQ-${String(id).padStart(3, '0')}`,
    status: input.status || 'Submitted',
    verifiedBy: input.verifiedBy || 'Pending finance verification',
    executiveApproval: input.executiveApproval || 'Pending',
    boardApproval: input.boardApproval || 'Not required yet',
    comments: input.comments || 'New request submitted.',
    recommendations: input.recommendations || 'Awaiting review.',
    spentAmount: Number(input.spentAmount || 0),
    variance: Number(input.variance || 0),
    referenceNo: input.referenceNo || 'Pending',
  };
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
    sendJson(response, 200, await readDatabase());
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/login') {
    const body = await readBody(request);
    if (!roles.has(body.role)) {
      sendJson(response, 400, { message: 'Unknown role' });
      return;
    }
    sendJson(response, 200, { role: body.role, token: createToken(body.role) });
    return;
  }

  const session = requireSession(request, response);
  if (!session) return;

  if (request.method === 'POST' && url.pathname === '/api/projects') {
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const project = { ...body, id: nextId(data.projects), spent: 0, progress: 0, status: body.status || 'Planning' };
      data.projects.unshift(project);
      audit(data, body.owner || session.role, 'Created project', project.title);
      return project;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/tasks') {
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const task = { ...body, id: nextId(data.tasks), status: body.status || 'Not Started' };
      data.tasks.unshift(task);
      audit(data, body.assignee || session.role, 'Created task', task.title);
      return task;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/requests') {
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const requisition = normalizeRequest(body, nextId(data.requests));
      data.requests.unshift(requisition);
      audit(data, body.preparedBy || body.requestingTitle || session.role, 'Created requisition', requisition.code);
      return requisition;
    });
    sendJson(response, 201, created);
    return;
  }

  const statusMatch = url.pathname.match(/^\/api\/requests\/(\d+)\/status$/);
  if (request.method === 'PATCH' && statusMatch) {
    const id = Number(statusMatch[1]);
    const body = await readBody(request);
    const updated = await updateDatabase((data) => {
      const requisition = data.requests.find((item) => item.id === id);
      if (!requisition) return null;
      requisition.status = body.status;
      requisition.verifiedBy = body.status === 'Returned' ? 'Returned by Finance Officer' : 'Finance Officer';
      requisition.executiveApproval = body.status === 'Approved' ? 'Approved' : requisition.executiveApproval;
      requisition.boardApproval = body.status === 'Approved' ? 'Approved' : requisition.boardApproval;
      requisition.comments = body.status === 'Returned' ? 'Correction requested before approval.' : 'Request updated through workflow.';
      requisition.recommendations = body.status === 'Rejected' ? 'Do not proceed.' : 'Proceed with next workflow step.';
      audit(data, session.role, `Marked request ${body.status}`, requisition.code);
      return requisition;
    });
    sendJson(response, updated ? 200 : 404, updated || { message: 'Request not found' });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/admin-operations') {
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const operation = [body.name, Number(body.amount || 0), body.responsible, body.timeline, body.remarks, body.method];
      data.adminOperations.unshift(operation);
      audit(data, body.responsible || session.role, 'Created admin operation', body.name);
      return operation;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/users') {
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const user = [body.name, body.department, body.systemRole];
      data.users.unshift(user);
      audit(data, session.role, 'Created user', body.name);
      return user;
    });
    sendJson(response, 201, created);
    return;
  }

  sendJson(response, 404, { message: 'API route not found' });
}

async function serveStatic(response, url) {
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await readFile(target);
    const type = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
    }[extname(target)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type });
    response.end(file);
  } catch {
    const index = await readFile(join(root, 'index.html'));
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(index);
  }
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url);
    else await serveStatic(response, url);
  } catch (error) {
    sendJson(response, 500, { message: error.message });
  }
}).listen(port, host, () => {
  console.log(`MDFC ProjTrack server running on http://${host}:${port}`);
});
