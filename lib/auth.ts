import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'sportseven_auth';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET debe estar configurado');
  }

  return 'development-only-sportseven-auth-secret';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', getAuthSecret())
    .update(value)
    .digest('base64url');
}

function verifySignature(value: string, signature: string) {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function getCookie(request: Request, name: string) {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const cookie = cookies
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function createSessionToken(userId: string) {
  const payload = base64UrlEncode(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }));

  return `${payload}.${sign(payload)}`;
}

export function setAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(userId),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getCurrentUser(request: Request): Promise<UserSession | null> {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !verifySignature(payload, signature)) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as { sub?: string; exp?: number };
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? undefined,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireAdmin(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return { user: null, response };

  if (user!.role !== 'admin') {
    return {
      user: null,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }),
    };
  }

  return { user: user!, response: null };
}
