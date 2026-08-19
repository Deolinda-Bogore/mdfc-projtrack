import crypto from 'node:crypto';

const passwordKeyLength = 64;

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, passwordKeyLength).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash = '') {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, passwordKeyLength);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

export function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function can(role, action) {
  const permissions = {
    director: ['read', 'approve', 'finance_review', 'manage_projects', 'manage_users', 'manage_admin', 'manage_finance', 'reports', 'upload'],
    manager: ['read', 'manage_projects', 'manage_admin', 'reports', 'upload'],
    employee: ['read', 'create_request', 'upload'],
    finance: ['read', 'finance_review', 'manage_finance', 'reports', 'upload'],
  };
  return permissions[role]?.includes(action);
}
