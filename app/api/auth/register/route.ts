import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setAuthCookie } from '@/lib/auth';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      return NextResponse.json(
        { error: 'Registro publico deshabilitado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, phone } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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
        email,
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
