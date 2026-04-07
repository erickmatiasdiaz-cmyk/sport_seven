import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSlotAvailable } from '@/lib/availability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const courtId = searchParams.get('courtId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    const where: any = {};

    // If user info is provided, filter accordingly
    if (userId && userRole) {
      if (userRole === 'admin') {
        // Admin can see all reservations
        if (phone) where.customerPhone = phone;
        if (date) where.date = date;
        if (courtId) where.courtId = courtId;
      } else {
        // Regular users only see their own reservations
        where.userId = userId;
        if (date) where.date = date;
        if (courtId) where.courtId = courtId;
      }
    } else {
      // No user info - use phone filter (legacy behavior)
      if (phone) where.customerPhone = phone;
      if (date) where.date = date;
      if (courtId) where.courtId = courtId;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        court: true,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching reservations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courtId, customerName, customerPhone, date, startTime, endTime, status, durationMinutes, userId, userRole } = body;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para crear una reserva' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!courtId || !customerName || !customerPhone || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Check slot availability
    const available = await isSlotAvailable(courtId, date, startTime, endTime);
    if (!available) {
      return NextResponse.json(
        { error: 'Este horario no está disponible' },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        courtId,
        customerName,
        customerPhone,
        date,
        startTime,
        endTime,
        durationMinutes: durationMinutes || 60,
        status: status || 'confirmed',
      },
      include: {
        court: true,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, userId, userRole } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id y status son requeridos' },
        { status: 400 }
      );
    }

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    // Check if user owns this reservation or is admin
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (userRole !== 'admin' && reservation.userId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta reserva' },
        { status: 403 }
      );
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        court: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}
