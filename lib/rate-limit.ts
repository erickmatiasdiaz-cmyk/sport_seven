import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return request.headers.get('x-real-ip') || 'unknown';
}

export function rateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientIp(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  current.count += 1;

  if (current.count <= options.maxRequests) {
    return null;
  }

  const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  );
}
