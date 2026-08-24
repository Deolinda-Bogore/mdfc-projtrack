import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';
import {
  adminOperations,
  assets,
  auditTrail,
  budgets,
  evidence,
  grants,
  hr,
  inventory,
  payments,
  projects,
  requests,
  roles,
  suppliers,
  tasks,
  travel,
} from '../src/data.js';

const dbPath = process.env.MDFC_DB_PATH || fileURLToPath(new URL('./data/database.json', import.meta.url));

function seedDatabase() {
  const demoPasswordHash = hashPassword('mdfc-demo');
  return {
    projects,
    tasks,
    requests,
    budgets,
    payments,
    suppliers,
    assets,
    inventory,
    travel,
    hr,
    evidence,
    grants,
    adminOperations,
    uploads: [],
    notifications: [],
    users: [
      {
        id: 1,
        name: 'Executive Director',
        email: 'executive.director@medicaldoctorsforchoice.org',
        department: 'Leadership',
        role: 'director',
        title: 'Executive Director',
        passwordHash: demoPasswordHash,
        active: true,
      },
      {
        id: 2,
        name: 'Programs Manager',
        email: 'programs.manager@medicaldoctorsforchoice.org',
        department: 'Programs',
        role: 'manager',
        title: 'Programs Manager',
        passwordHash: demoPasswordHash,
        active: true,
      },
      {
        id: 3,
        name: 'Request Initiator',
        email: 'request.initiator@medicaldoctorsforchoice.org',
        department: 'Programs',
        role: 'employee',
        title: 'Software / IT Intern',
        passwordHash: demoPasswordHash,
        active: true,
      },
      {
        id: 4,
        name: 'Finance Director',
        email: 'finance.director@medicaldoctorsforchoice.org',
        department: 'Finance',
        role: 'finance',
        title: 'Finance Director',
        passwordHash: demoPasswordHash,
        active: true,
      },
      {
        id: 5,
        name: 'Administration',
        email: 'administration@medicaldoctorsforchoice.org',
        department: 'Administration',
        role: 'administration',
        title: 'Administration',
        passwordHash: demoPasswordHash,
        active: true,
      },
    ],
    auditTrail: [
      {
        time: new Date().toISOString(),
        user: 'System',
        action: 'Seeded database',
        record: 'INITIAL_DATA',
      },
      ...auditTrail.map((row) => ({
        time: row[0],
        user: row[1],
        action: row[2],
        record: row[3],
        project: row[4],
        donor: row[5],
        budgetLine: row[6],
        status: row[7],
      })),
    ],
  };
}

async function ensureDatabase() {
  try {
    await readFile(dbPath, 'utf8');
  } catch {
    await mkdir(dirname(dbPath), { recursive: true });
    await writeFile(dbPath, JSON.stringify(seedDatabase(), null, 2));
  }
}

export async function readDatabase() {
  await ensureDatabase();
  const raw = await readFile(dbPath, 'utf8');
  return withDefaults(JSON.parse(raw));
}

export async function writeDatabase(data) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function updateDatabase(mutator) {
  const data = await readDatabase();
  const result = mutator(data);
  await writeDatabase(data);
  return result;
}

function withDefaults(data) {
  const seed = seedDatabase();
  const merged = { ...seed, ...data };
  for (const key of ['budgets', 'payments', 'suppliers', 'assets', 'inventory', 'travel', 'hr', 'evidence', 'grants', 'uploads', 'notifications']) {
    if (!Array.isArray(merged[key])) merged[key] = seed[key];
  }
  if (!Array.isArray(merged.users)) merged.users = seed.users;
  if (merged.users.some((user) => Array.isArray(user))) {
    const demoPasswordHash = hashPassword('mdfc-demo');
    merged.users = merged.users.map((user, index) => {
      if (!Array.isArray(user)) return user;
      const role = String(user[2] || user[1] || '').toLowerCase().includes('finance')
        ? 'finance'
        : String(user[2] || user[1] || '').toLowerCase().includes('director')
          ? 'director'
          : String(user[2] || user[1] || '').toLowerCase().includes('employee')
            ? 'employee'
            : 'manager';
      return {
        id: index + 1,
        name: user[0],
        email: `${role}@mdfc.rw`,
        department: user[1],
        role,
        title: user[2],
        passwordHash: demoPasswordHash,
        active: true,
      };
    });
  }
  return merged;
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
}

export function audit(data, user, action, record) {
  data.auditTrail = [
    {
      time: new Date().toISOString(),
      user,
      action,
      record,
    },
    ...(data.auditTrail || []),
  ];
}

export function notify(data, role, message, record) {
  data.notifications = [
    {
      id: nextId(data.notifications || []),
      time: new Date().toISOString(),
      role,
      message,
      record,
      read: false,
    },
    ...(data.notifications || []),
  ];
}
