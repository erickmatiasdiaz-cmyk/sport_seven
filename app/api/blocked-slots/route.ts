import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('courtId');
    const date = searchParams.get('date');

    const where: any = {};
    if (courtId) where.courtId = courtId;
    if (date) where.date = date;

    const blockedSlots = await prisma.blockedSlot.findMany({
      where,
      include: {
        court: true,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(blockedSlots);
  } catch (error) {
    console.error('[blocked-slots] GET', error);
    return NextResponse.json(
      { error: 'Error fetching blocked slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Cuerpo de la solicitud invalido' },
        { status: 400 }
      );
    }

    const { response } = await requireAdmin(request);
    if (response) return response;

    const { courtId, date, startTime, endTime, reason } = body;

    if (!courtId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'courtId, date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const blockedSlot = await prisma.blockedSlot.create({
      data: {
        courtId,
        date,
        startTime,
        endTime,
        reason: reason || 'Mantenimiento',
      },
      include: {
        court: true,
      },
    });

    return NextResponse.json(blockedSlot, { status: 201 });
  } catch (error: any) {
    const message = String(error?.message ?? '');
    if (message.includes('blocked_slots_no_overlap')) {
      return NextResponse.json(
        { error: 'Ya existe un bloqueo que se solapa con ese horario' },
        { status: 409 }
      );
    }
    if (message.includes('blocked_slots_time_order_check')) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser anterior a la de termino' },
        { status: 400 }
      );
    }
    console.error('[blocked-slots] POST', error);
    return NextResponse.json(
      { error: 'Error creating blocked slot' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await prisma.blockedSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[blocked-slots] DELETE', error);
    return NextResponse.json(
      { error: 'Error deleting blocked slot' },
      { status: 500 }
    );
  }
}
