import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adminOperations,
  projects,
  requests,
  roles,
  tasks,
} from '../src/data.js';

const dbPath = fileURLToPath(new URL('./data/database.json', import.meta.url));

function seedDatabase() {
  return {
    projects,
    tasks,
    requests,
    adminOperations,
    users: Object.values(roles).map((role) => [role.name, role.label, role.description]),
    auditTrail: [
      {
        time: new Date().toISOString(),
        user: 'System',
        action: 'Seeded database',
        record: 'INITIAL_DATA',
      },
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
  return JSON.parse(raw);
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
