import { createServer } from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { can, hashPassword, publicUser, verifyPassword } from './auth.js';
import { audit, nextId, notify, readDatabase, updateDatabase } from './store.js';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 5174);
const root = fileURLToPath(new URL('../dist', import.meta.url));
const roles = new Set(['director', 'manager', 'employee', 'finance', 'administration']);
const sessions = new Map();
const moduleConfig = {
  budgets: { permission: 'manage_finance', label: 'budget row' },
  payments: { permission: 'manage_finance', label: 'payment' },
  suppliers: { permission: 'manage_finance', label: 'supplier' },
  assets: { permission: 'manage_admin', label: 'asset' },
  inventory: { permission: 'manage_admin', label: 'inventory item' },
  travel: { permission: 'manage_admin', label: 'travel record' },
  hr: { permission: 'manage_admin', label: 'HR record' },
  evidence: { permission: 'manage_projects', label: 'M&E evidence' },
  grants: { permission: 'manage_projects', label: 'grant' },
};

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text, type = 'text/plain') {
  response.writeHead(status, { 'Content-Type': type });
  response.end(text);
}

function publicDatabase(data) {
  return {
    ...data,
    users: data.users.map(publicUser),
    uploads: (data.uploads || []).map(({ contentBase64, ...upload }) => upload),
  };
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requireSession(request, response, action = 'read') {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    const session = sessions.get(token);
    if (can(session.role, action)) return session;
    sendJson(response, 403, { message: 'You do not have permission for this action' });
    return null;
  }
  sendJson(response, 401, { message: 'Demo session required' });
  return null;
}

function createToken(user) {
  const role = user.role;
  const token = `demo-${role}-${crypto.randomUUID()}`;
  sessions.set(token, { role, userId: user.id, name: user.name, createdAt: new Date().toISOString() });
  return token;
}

function roleForDepartment(department = '') {
  const value = String(department).toLowerCase();
  if (value.includes('admin')) return 'administration';
  if (value.includes('finance')) return 'finance';
  if (value.includes('program') || value.includes('meal') || value.includes('m&e')) return 'manager';
  return 'employee';
}

function findBudget(data, requisition) {
  return data.budgets.find((row) => row[0] === requisition.project || row[3] === requisition.budgetLine);
}

function checkBudget(data, requisition) {
  const budget = findBudget(data, requisition);
  if (!budget) return { status: 'Budget Not Found', available: false, remaining: 0 };
  const remaining = Number(budget[6] || 0);
  return {
    status: Number(requisition.amount || 0) <= remaining ? 'Budget OK' : 'Budget Not Available',
    available: Number(requisition.amount || 0) <= remaining,
    remaining,
  };
}

function applyApprovedRequestToBudget(data, requisition) {
  const budget = findBudget(data, requisition);
  if (!budget || requisition.budgetPosted) return;
  const amount = Number(requisition.amount || 0);
  budget[5] = Number(budget[5] || 0) + amount;
  budget[6] = Math.max(Number(budget[4] || 0) - Number(budget[5] || 0), 0);
  requisition.spentAmount = amount;
  requisition.referenceNo = requisition.referenceNo === 'Pending' ? `PAY-${requisition.code}` : requisition.referenceNo;
  requisition.budgetPosted = true;
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
    workflowStage: input.workflowStage || 'Finance Director Review',
    approvalHistory: input.approvalHistory || [],
    uploads: input.uploads || [],
  };
}

function rowName(row) {
  if (Array.isArray(row)) return row[0] || 'record';
  return row?.name || row?.title || 'record';
}

function sanitizeModuleRow(row) {
  return Array.isArray(row) ? row : Object.values(row || {});
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
    sendJson(response, 200, publicDatabase(await readDatabase()));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/login') {
    const body = await readBody(request);
    const data = await readDatabase();
    const user = data.users.find((item) => item.email === body.email && item.role === body.role && item.active !== false);
    if (!user || !roles.has(user.role) || !verifyPassword(body.password || '', user.passwordHash)) {
      sendJson(response, 401, { message: 'Invalid email, role, or password' });
      return;
    }
    sendJson(response, 200, { user: publicUser(user), token: createToken(user) });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/projects') {
    const session = requireSession(request, response, 'manage_projects');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const project = { ...body, id: nextId(data.projects), spent: 0, progress: 0, status: body.status || 'Planning' };
      data.projects.unshift(project);
      audit(data, body.owner || session.role, 'Created project', project.title);
      notify(data, 'director', `New project created: ${project.title}`, project.title);
      return project;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/tasks') {
    const session = requireSession(request, response, 'manage_projects');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const task = { ...body, id: nextId(data.tasks), status: body.status || 'Not Started' };
      data.tasks.unshift(task);
      audit(data, body.assignee || session.role, 'Created task', task.title);
      notify(data, 'employee', `New task assigned: ${task.title}`, task.title);
      return task;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/requests') {
    const session = requireSession(request, response, can(sessions.get(request.headers.authorization?.replace('Bearer ', ''))?.role, 'manage_projects') ? 'manage_projects' : 'create_request');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const requisition = normalizeRequest(body, nextId(data.requests));
      const budgetCheck = checkBudget(data, requisition);
      requisition.budgetStatus = budgetCheck.status;
      requisition.remainingBudgetAtSubmission = budgetCheck.remaining;
      requisition.status = budgetCheck.available ? requisition.status : 'Returned';
      requisition.comments = budgetCheck.available
        ? requisition.comments
        : 'Budget not available. Request needs revision or budget adjustment.';
      data.requests.unshift(requisition);
      audit(data, body.preparedBy || body.requestingTitle || session.role, 'Created requisition', requisition.code);
      notify(data, 'finance', `New requisition ready for Finance Director review: ${requisition.code}`, requisition.code);
      notify(data, roleForDepartment(requisition.department), `Your request ${requisition.code} has been submitted`, requisition.code);
      return requisition;
    });
    sendJson(response, 201, created);
    return;
  }

  const statusMatch = url.pathname.match(/^\/api\/requests\/(\d+)\/status$/);
  if (request.method === 'PATCH' && statusMatch) {
    const session = requireSession(request, response, 'finance_review');
    if (!session) return;
    const id = Number(statusMatch[1]);
    const body = await readBody(request);
    const updated = await updateDatabase((data) => {
      const requisition = data.requests.find((item) => item.id === id);
      if (!requisition) return null;
      const budgetCheck = checkBudget(data, requisition);
      if (body.status === 'Approved' && !budgetCheck.available) {
        requisition.status = 'Returned';
        requisition.budgetStatus = budgetCheck.status;
        requisition.comments = 'Approval blocked because budget is not available.';
        requisition.recommendations = 'Request a budget adjustment before approval.';
        notify(data, 'manager', `Budget blocked request ${requisition.code}`, requisition.code);
        return requisition;
      }
      if (body.status === 'Approved' && session.role === 'finance') {
        requisition.status = 'Verified';
        requisition.workflowStage = 'Executive Director Approval';
        requisition.verifiedBy = 'Finance Director';
        requisition.executiveApproval = 'Pending';
        requisition.comments = 'Finance Director reviewed the request. It has moved to Executive Director approval.';
        requisition.recommendations = 'Executive approval required.';
        notify(data, 'director', `Request ${requisition.code} is ready for executive approval`, requisition.code);
        notify(data, roleForDepartment(requisition.department), `Your request ${requisition.code} was verified by Finance Director`, requisition.code);
      } else {
        requisition.status = body.status;
        requisition.workflowStage = body.status === 'Approved' ? 'Progress Tracking' : body.status;
        requisition.verifiedBy = body.status === 'Returned' ? 'Returned by Finance Director' : requisition.verifiedBy || 'Finance Director';
        requisition.executiveApproval = body.status === 'Approved' ? 'Approved' : requisition.executiveApproval;
        requisition.boardApproval = body.status === 'Approved' ? 'Approved' : requisition.boardApproval;
        requisition.comments = body.status === 'Returned' ? 'Correction requested before approval.' : 'Request updated through workflow.';
        requisition.recommendations = body.status === 'Rejected' ? 'Do not proceed.' : 'Proceed with next workflow step.';
        notify(data, 'finance', `Request ${requisition.code} was updated by ${session.name}`, requisition.code);
        notify(data, roleForDepartment(requisition.department), `Your request ${requisition.code} was ${body.status.toLowerCase()}`, requisition.code);
      }
      requisition.approvalHistory = [
        ...(requisition.approvalHistory || []),
        { time: new Date().toISOString(), role: session.role, status: body.status, comment: requisition.comments },
      ];
      if (body.status === 'Approved' && session.role === 'director') applyApprovedRequestToBudget(data, requisition);
      audit(data, session.role, `Marked request ${body.status}`, requisition.code);
      return requisition;
    });
    sendJson(response, updated ? 200 : 404, updated || { message: 'Request not found' });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/admin-operations') {
    const session = requireSession(request, response, 'manage_admin');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const operation = [body.name, Number(body.amount || 0), body.responsible, body.timeline, body.remarks, body.method];
      data.adminOperations.unshift(operation);
      audit(data, body.responsible || session.role, 'Created admin operation', body.name);
      notify(data, 'finance', `Administration operation created: ${body.name}`, body.name);
      return operation;
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/users') {
    const session = requireSession(request, response, 'manage_users');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const requestedRole = String(body.systemRole || 'employee').toLowerCase();
      const role = requestedRole.includes('finance')
        ? 'finance'
        : requestedRole.includes('director')
          ? 'director'
          : requestedRole.includes('admin')
            ? 'administration'
            : requestedRole.includes('manager')
            ? 'manager'
            : 'employee';
      const user = {
        id: nextId(data.users),
        name: body.name,
        email: body.email || `${body.name.toLowerCase().replaceAll(' ', '.')}@medicaldoctorsforchoice.org`,
        department: body.department,
        role,
        title: body.title || body.systemRole,
        passwordHash: hashPassword(body.password || 'mdfc-demo'),
        active: true,
      };
      data.users.unshift(user);
      audit(data, session.role, 'Created user', body.name);
      notify(data, user.role, 'Your account has been created', user.email);
      return publicUser(user);
    });
    sendJson(response, 201, created);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/uploads') {
    const session = requireSession(request, response, 'upload');
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const upload = {
        id: nextId(data.uploads || []),
        fileName: body.fileName,
        mimeType: body.mimeType || 'application/octet-stream',
        size: Number(body.size || 0),
        contentBase64: body.contentBase64 || '',
        documentType: body.documentType,
        linkedModule: body.linkedModule,
        linkedRecord: body.linkedRecord,
        uploadedBy: session.name,
        uploadedAt: new Date().toISOString(),
        notes: body.notes || '',
      };
      data.uploads.unshift(upload);
      audit(data, session.role, 'Uploaded supporting document metadata', upload.fileName);
      return upload;
    });
    sendJson(response, 201, created);
    return;
  }

  const moduleCreateMatch = url.pathname.match(/^\/api\/modules\/([\w-]+)$/);
  if (request.method === 'POST' && moduleCreateMatch) {
    const moduleName = moduleCreateMatch[1];
    const config = moduleConfig[moduleName];
    if (!config) {
      sendJson(response, 404, { message: 'Module not found' });
      return;
    }
    const session = requireSession(request, response, config.permission);
    if (!session) return;
    const body = await readBody(request);
    const created = await updateDatabase((data) => {
      const row = sanitizeModuleRow(body.row);
      data[moduleName].unshift(row);
      audit(data, session.role, `Created ${config.label}`, rowName(row));
      return row;
    });
    sendJson(response, 201, created);
    return;
  }

  const moduleItemMatch = url.pathname.match(/^\/api\/modules\/([\w-]+)\/(\d+)$/);
  if ((request.method === 'PATCH' || request.method === 'DELETE') && moduleItemMatch) {
    const moduleName = moduleItemMatch[1];
    const index = Number(moduleItemMatch[2]);
    const config = moduleConfig[moduleName];
    if (!config) {
      sendJson(response, 404, { message: 'Module not found' });
      return;
    }
    const session = requireSession(request, response, config.permission);
    if (!session) return;
    const body = request.method === 'PATCH' ? await readBody(request) : {};
    const updated = await updateDatabase((data) => {
      if (!Array.isArray(data[moduleName]) || !data[moduleName][index]) return null;
      if (request.method === 'DELETE') {
        const [removed] = data[moduleName].splice(index, 1);
        audit(data, session.role, `Deleted ${config.label}`, rowName(removed));
        return removed;
      }
      const row = sanitizeModuleRow(body.row);
      data[moduleName][index] = row;
      audit(data, session.role, `Updated ${config.label}`, rowName(row));
      return row;
    });
    sendJson(response, updated ? 200 : 404, updated || { message: 'Record not found' });
    return;
  }

  const reportMatch = url.pathname.match(/^\/api\/reports\/([\w-]+)$/);
  if (request.method === 'GET' && reportMatch) {
    const session = requireSession(request, response, 'reports');
    if (!session) return;
    const type = reportMatch[1];
    const data = await readDatabase();
    const now = new Date().toISOString();
    const reports = {
      'project-dashboard': {
        generatedAt: now,
        projectCount: data.projects.length,
        activeProjects: data.projects.filter((item) => item.status === 'Active').length,
        submittedRequests: data.requests.filter((item) => item.status === 'Submitted').length,
        projects: data.projects.map((item) => ({ title: item.title, donor: item.donor, progress: item.progress, budget: item.budget, spent: item.spent })),
      },
      'workplan-activity-status': {
        generatedAt: now,
        activities: data.tasks.map((item) => ({ projectId: item.projectId, activity: item.title, status: item.status, assignee: item.assignee, due: item.due, outputs: item.outputs })),
      },
      'meal-indicator-performance': {
        generatedAt: now,
        indicators: data.evidence.map((row) => ({ project: row[0], activity: row[1], data: row[2], surveyResults: row[5], status: row[6] })),
      },
      'budget-vs-expenditure': {
        generatedAt: now,
        budgets: data.budgets.map((row) => ({ project: row[0], donor: row[1], budgetLine: row[3], approved: row[4], actual: row[5], remaining: row[6], forecast: row[7], alert: row[8] })),
      },
      'beneficiary-reach': {
        generatedAt: now,
        reachRecords: data.evidence.map((row) => ({ project: row[0], activity: row[1], dataSource: row[2], testimonials: row[3], status: row[6] })),
      },
      'risk-issues': {
        generatedAt: now,
        issues: data.tasks.map((item) => ({ projectId: item.projectId, activity: item.title, challenges: item.challenges || 'No challenge recorded', remarks: item.remarks || '', status: item.status })),
      },
      'staff-task-accountability': {
        generatedAt: now,
        tasks: data.tasks.map((item) => ({ task: item.title, assignee: item.assignee, status: item.status, priority: item.priority, due: item.due })),
      },
      'donor-narrative-reporting': {
        generatedAt: now,
        grants: data.grants.map((row) => ({ grant: row[0], funder: row[1], owner: row[2], progress: row[4], remarks: row[5] })),
      },
    };
    if (url.searchParams.get('format') === 'csv') {
      const csvRows = {
        'project-dashboard': [
          ['Project', 'Donor', 'Progress', 'Budget', 'Spent'],
          ...data.projects.map((item) => [item.title, item.donor, item.progress, item.budget, item.spent]),
        ],
        'workplan-activity-status': [
          ['Project ID', 'Activity', 'Status', 'Assignee', 'Due Date', 'Outputs'],
          ...data.tasks.map((item) => [item.projectId, item.title, item.status, item.assignee, item.due, item.outputs]),
        ],
        'meal-indicator-performance': [
          ['Project', 'Activity', 'Data', 'Survey Results', 'Status'],
          ...data.evidence.map((row) => [row[0], row[1], row[2], row[5], row[6]]),
        ],
        'budget-vs-expenditure': [
          ['Project', 'Donor', 'Budget Line', 'Approved', 'Actual', 'Remaining', 'Forecast', 'Alert'],
          ...data.budgets.map((row) => [row[0], row[1], row[3], row[4], row[5], row[6], row[7], row[8]]),
        ],
        'beneficiary-reach': [
          ['Project', 'Activity', 'Data Source', 'Testimonials', 'Status'],
          ...data.evidence.map((row) => [row[0], row[1], row[2], row[3], row[6]]),
        ],
        'risk-issues': [
          ['Project ID', 'Activity', 'Challenges', 'Remarks', 'Status'],
          ...data.tasks.map((item) => [item.projectId, item.title, item.challenges || 'No challenge recorded', item.remarks || '', item.status]),
        ],
        'staff-task-accountability': [
          ['Task', 'Assignee', 'Status', 'Priority', 'Due Date'],
          ...data.tasks.map((item) => [item.title, item.assignee, item.status, item.priority, item.due]),
        ],
        'donor-narrative-reporting': [
          ['Grant', 'Funder', 'Owner', 'Progress', 'Remarks'],
          ...data.grants.map((row) => [row[0], row[1], row[2], row[4], row[5]]),
        ],
      };
      if (!csvRows[type]) sendJson(response, 404, { message: 'Report not found' });
      else sendText(response, 200, toCsv(csvRows[type]), 'text/csv');
      return;
    }
    sendJson(response, reports[type] ? 200 : 404, reports[type] || { message: 'Report not found' });
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
