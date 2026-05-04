import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const SESSION_COOKIE = 'sportseven_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET debe tener al menos 32 caracteres');
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: UserSession): string {
  const payload = base64UrlEncode(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    })
  );
  return `${payload}.${signPayload(payload)}`;
}

export function readSessionToken(token?: string): UserSession | null {
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as UserSession & { exp?: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function getCurrentUser(request: NextRequest): UserSession | null {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function requireUser(request: NextRequest): UserSession {
  const user = getCurrentUser(request);
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}

export function requireAdmin(request: NextRequest): UserSession {
  const user = requireUser(request);
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}

export function setSessionCookie(response: NextResponse, user: UserSession) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
    return NextResponse.json({ error: 'Debes iniciar sesion' }, { status: 401 });
  }

  if (error instanceof Error && error.message === 'FORBIDDEN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return null;
}
