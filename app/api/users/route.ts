import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}
