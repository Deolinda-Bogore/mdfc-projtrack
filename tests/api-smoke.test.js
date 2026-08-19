import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const port = 5199;
const baseUrl = `http://127.0.0.1:${port}`;
const tempDir = await mkdtemp(join(tmpdir(), 'mdfc-projtrack-test-'));
const dbPath = join(tempDir, 'database.json');

const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: String(port), MDFC_DB_PATH: dbPath },
  stdio: ['ignore', 'pipe', 'pipe'],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/bootstrap`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('Server did not start');
}

async function json(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  return { response, body };
}

async function login(role, email) {
  const { response, body } = await json('/api/login', {
    method: 'POST',
    body: JSON.stringify({ role, email, password: 'mdfc-demo' }),
  });
  assert.equal(response.status, 200);
  return body.token;
}

try {
  await waitForServer();

  const managerToken = await login('manager', 'manager@mdfc.rw');
  const financeToken = await login('finance', 'finance@mdfc.rw');
  const directorToken = await login('director', 'director@mdfc.rw');

  const blockedUserCreate = await json('/api/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ name: 'Blocked User', systemRole: 'employee' }),
  });
  assert.equal(blockedUserCreate.response.status, 403);

  const createdBudget = await json('/api/modules/budgets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${financeToken}` },
    body: JSON.stringify({ row: ['Smoke Project', 'Smoke Donor', 'Testing', 'Smoke Line', 1000, 0, 1000, 1000, 'Healthy'] }),
  });
  assert.equal(createdBudget.response.status, 201);

  const createdRequest = await json('/api/requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      requestDate: '2026-08-20',
      requestingTitle: 'Program Manager',
      department: 'Programs',
      project: 'Smoke Project',
      donor: 'Smoke Donor',
      budgetLine: 'Smoke Line',
      particularActivity: 'Smoke approval',
      item: 'Testing support',
      amount: 100,
      documents: 'Test quotation',
      preparedBy: 'Program Manager',
    }),
  });
  assert.equal(createdRequest.response.status, 201);
  assert.equal(createdRequest.body.budgetStatus, 'Budget OK');

  const verified = await json(`/api/requests/${createdRequest.body.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${financeToken}` },
    body: JSON.stringify({ status: 'Approved' }),
  });
  assert.equal(verified.response.status, 200);
  assert.equal(verified.body.status, 'Verified');

  const approved = await json(`/api/requests/${createdRequest.body.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${directorToken}` },
    body: JSON.stringify({ status: 'Approved' }),
  });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.body.status, 'Approved');

  const upload = await json('/api/uploads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      fileName: 'smoke.pdf',
      documentType: 'Quotation',
      linkedModule: 'Finance',
      linkedRecord: createdRequest.body.code,
      contentBase64: 'c21va2U=',
      size: 5,
    }),
  });
  assert.equal(upload.response.status, 201);

  const csvResponse = await fetch(`${baseUrl}/api/reports/finance?format=csv`, {
    headers: { Authorization: `Bearer ${financeToken}` },
  });
  assert.equal(csvResponse.status, 200);
  assert.match(await csvResponse.text(), /Project.*Donor/);

  console.log('API smoke tests passed');
} finally {
  server.kill('SIGTERM');
  await rm(tempDir, { recursive: true, force: true });
}
