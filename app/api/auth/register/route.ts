import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, {
      keyPrefix: 'auth:register',
      maxRequests: 5,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      return NextResponse.json(
        { error: 'Registro publico deshabilitado' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Cuerpo de la solicitud invalido' },
        { status: 400 }
      );
    }
    const { name, email, password, phone } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'El email no es válido' },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    // Convert null to undefined for phone
    const userSession = {
      ...user,
      phone: user.phone ?? undefined,
    };

    const response = NextResponse.json({ user: userSession }, { status: 201 });
    setAuthCookie(response, user.id);

    return response;
  } catch (error) {
    console.error('[auth/register] POST', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
