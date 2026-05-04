import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireUser } from '@/lib/auth';

const VALID_STATUSES = new Set(['confirmed', 'pending', 'cancelled']);

function parseTimeToMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
}

function isPastDate(value: string) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  return value < todayStr;
}

function getDuration(startTime: string, endTime: string) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null || end <= start) return null;
  return end - start;
}

async function validateReservationSlot(params: {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}) {
  const { courtId, date, startTime, endTime, durationMinutes } = params;

  if (!isIsoDate(date) || isPastDate(date)) {
    return { error: 'La fecha no es valida o ya paso' };
  }

  const requestedDuration = getDuration(startTime, endTime);
  if (!requestedDuration || requestedDuration !== durationMinutes) {
    return { error: 'El horario o duracion no es valido' };
  }

  if (![60, 90].includes(durationMinutes)) {
    return { error: 'La duracion debe ser 60 o 90 minutos' };
  }

  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court || !court.isActive) {
    return { error: 'Cancha no encontrada' };
  }

  if (durationMinutes === 60 && !court.allows60) {
    return { error: 'Esta cancha no permite reservas de 60 minutos' };
  }

  if (durationMinutes === 90 && !court.allows90) {
    return { error: 'Esta cancha no permite reservas de 90 minutos' };
  }

  const start = parseTimeToMinutes(startTime)!;
  const end = parseTimeToMinutes(endTime)!;
  const opening = parseTimeToMinutes(court.openingTime);
  const closing = parseTimeToMinutes(court.closingTime);

  if (opening === null || closing === null || start < opening || end > closing) {
    return { error: 'El horario esta fuera del horario de atencion' };
  }

  return { court };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = requireUser(request);
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const courtId = searchParams.get('courtId');
    const isAdmin = currentUser.role === 'admin';

    const where: any = {};

    if (isAdmin) {
      if (phone) where.customerPhone = phone;
    } else {
      where.userId = currentUser.id;
    }

    if (date) where.date = date;
    if (courtId) where.courtId = courtId;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        court: true,
        user: isAdmin
          ? {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            }
          : false,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;

    return NextResponse.json({ error: 'Error fetching reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = requireUser(request);
    const body = await request.json();
    const { courtId, customerName, customerPhone, date, startTime, endTime, status } = body;
    const durationMinutes = Number(body.durationMinutes || 60);

    if (!courtId || !customerName || !customerPhone || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Estado de reserva no valido' }, { status: 400 });
    }

    const validation = await validateReservationSlot({
      courtId,
      date,
      startTime,
      endTime,
      durationMinutes,
    });

    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const reservation = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${courtId} || ':' || ${date}))`;

      const [overlappingReservation, overlappingBlocked] = await Promise.all([
        tx.reservation.findFirst({
          where: {
            courtId,
            date,
            status: { in: ['confirmed', 'pending'] },
            AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
          },
        }),
        tx.blockedSlot.findFirst({
          where: {
            courtId,
            date,
            AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
          },
        }),
      ]);

      if (overlappingReservation || overlappingBlocked) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      return tx.reservation.create({
        data: {
          userId: currentUser.id,
          courtId,
          customerName,
          customerPhone,
          date,
          startTime,
          endTime,
          durationMinutes,
          status: status || 'confirmed',
        },
        include: {
          court: true,
        },
      });
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    const authError = authErrorResponse(error);
    if (authError) return authError;

    if (error?.message === 'SLOT_UNAVAILABLE') {
      return NextResponse.json({ error: 'Este horario no esta disponible' }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = requireUser(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id y status son requeridos' }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Estado de reserva no valido' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && reservation.userId !== currentUser.id) {
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
    const authError = authErrorResponse(error);
    if (authError) return authError;

    return NextResponse.json(
      { error: error.message || 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}
