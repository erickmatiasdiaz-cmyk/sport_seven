import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSlotAvailable } from '@/lib/availability';
import { requireAdmin, requireUser } from '@/lib/auth';
import { expireStalePendingPayments } from '@/lib/reservations';

function isValidStatus(status: unknown) {
  return (
    status === 'pending' ||
    status === 'pending_payment' ||
    status === 'confirmed' ||
    status === 'cancelled' ||
    status === 'expired' ||
    status === 'payment_failed'
  );
}

function minutesBetween(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return null;
  }

  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function isReservationConflict(error: any) {
  const message = String(error?.message ?? '');
  return (
    error?.code === 'P2002' ||
    error?.code === 'P2034' ||
    message.includes('reservations_no_overlap')
  );
}

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;
    await expireStalePendingPayments();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const courtId = searchParams.get('courtId');

    const where: any = {};

    if (phone) where.customerPhone = phone;

    if (date) where.date = date;
    if (courtId) where.courtId = courtId;
    if (user?.role !== 'admin') where.userId = user?.id;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        court: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json(
      { error: 'Error fetching reservations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;
    await expireStalePendingPayments();

    const body = await request.json();
    const { courtId, customerName, customerPhone, date, startTime, endTime, status, durationMinutes } = body;

    if (!courtId || !customerName || !customerPhone || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const duration = durationMinutes || minutesBetween(startTime, endTime);
    if (duration !== 60 && duration !== 90) {
      return NextResponse.json(
        { error: 'La duracion debe ser de 60 o 90 minutos' },
        { status: 400 }
      );
    }

    if (minutesBetween(startTime, endTime) !== duration) {
      return NextResponse.json(
        { error: 'El horario no coincide con la duracion seleccionada' },
        { status: 400 }
      );
    }

    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court || !court.isActive) {
      return NextResponse.json(
        { error: 'Cancha no disponible' },
        { status: 404 }
      );
    }

    if ((duration === 60 && !court.allows60) || (duration === 90 && !court.allows90)) {
      return NextResponse.json(
        { error: 'Esta duracion no esta permitida para la cancha seleccionada' },
        { status: 400 }
      );
    }

    const reservationStatus = isValidStatus(status) ? status : 'pending_payment';
    const available = await isSlotAvailable(courtId, date, startTime, endTime);

    if (!available) {
      return NextResponse.json(
        { error: 'Este horario no esta disponible' },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        courtId,
        customerName,
        customerPhone,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        status: reservationStatus,
      },
      include: {
        court: true,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    if (isReservationConflict(error)) {
      return NextResponse.json(
        { error: 'Este horario no esta disponible' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    const body = await request.json();
    const { id, status } = body;

    if (!id || !isValidStatus(status)) {
      return NextResponse.json(
        { error: 'id y un estado valido son requeridos' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (user?.role !== 'admin' && reservation.userId !== user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
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
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}
