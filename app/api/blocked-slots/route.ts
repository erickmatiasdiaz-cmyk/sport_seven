import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Error fetching blocked slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isAdminRequest(request, body)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: error.message || 'Error creating blocked slot' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: 'Error deleting blocked slot' },
      { status: 500 }
    );
  }
}
