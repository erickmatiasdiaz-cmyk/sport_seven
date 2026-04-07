import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSession } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
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
      where: { email },
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

    // Create session
    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
    };

    const sessionId = createSession(userSession);

    return NextResponse.json({
      user: userSession,
      sessionId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
