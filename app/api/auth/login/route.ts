import { NextRequest, NextResponse } from 'next/server';
import { ensureBootstrapData } from '@/lib/bootstrap';
import { prisma } from '@/lib/prisma';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, {
      keyPrefix: 'auth:login',
      maxRequests: 10,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    await ensureBootstrapData();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
    };

    const response = NextResponse.json({ user: userSession });
    setAuthCookie(response, user.id);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error al iniciar sesion' },
      { status: 500 }
    );
  }
}
