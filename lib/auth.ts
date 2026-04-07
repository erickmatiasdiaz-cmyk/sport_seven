import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface UserRoleBody {
  userRole?: unknown;
}

// Simple session storage (in-memory for demo)
const sessions = new Map<string, UserSession>();

export function createSession(user: UserSession): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, user);
  return sessionId;
}

export function getSession(sessionId: string): UserSession | null {
  return sessions.get(sessionId) || null;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function isAdminRequest(request: Request, body?: UserRoleBody | null): boolean {
  const headerRole = request.headers.get('x-user-role');
  if (headerRole === 'admin') return true;

  const queryRole = new URL(request.url).searchParams.get('userRole');
  if (queryRole === 'admin') return true;

  return body?.userRole === 'admin';
}

// For demo purposes, also store in localStorage compatible format
export function getUserFromStorage(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('sportseven_session');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveUserToStorage(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sportseven_session', JSON.stringify(user));
}

export function clearUserFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sportseven_session');
}
