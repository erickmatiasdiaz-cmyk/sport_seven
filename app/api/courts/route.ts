import { NextRequest, NextResponse } from 'next/server';
import { ensureBootstrapData } from '@/lib/bootstrap';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

// GET - List all courts (only active ones for non-admin)
export async function GET(request: NextRequest) {
  try {
    await ensureBootstrapData();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const user = await getCurrentUser(request);

    const where: any = {};
    
    // Only admins can request inactive courts.
    if (!includeInactive || user?.role !== 'admin') {
      where.isActive = true;
    }

    const courts = await prisma.court.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(courts);
  } catch (error) {
    console.error('[courts] GET', error);
    return NextResponse.json(
      { error: 'Error fetching courts' },
      { status: 500 }
    );
  }
}

// POST - Create new court (admin only)
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

    const {
      name,
      description,
      image,
      price60,
      price90,
      openingTime,
      closingTime,
      allows60,
      allows90,
      isActive,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!allows60 && !allows90) {
      return NextResponse.json(
        { error: 'Debes permitir al menos una duración (60 o 90 minutos)' },
        { status: 400 }
      );
    }

    const sharedOpeningTime = openingTime || '18:00';
    const sharedClosingTime = closingTime || '23:00';

    const court = await prisma.$transaction(async (tx) => {
      const createdCourt = await tx.court.create({
        data: {
          name,
          description: description || null,
          image: image || 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
          price60: price60 || 20000,
          price90: price90 || 30000,
          openingTime: sharedOpeningTime,
          closingTime: sharedClosingTime,
          allows60: allows60 !== undefined ? allows60 : true,
          allows90: allows90 !== undefined ? allows90 : false,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      await tx.court.updateMany({
        data: {
          openingTime: sharedOpeningTime,
          closingTime: sharedClosingTime,
        },
      });

      return createdCourt;
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error) {
    console.error('[courts] POST', error);
    return NextResponse.json(
      { error: 'Error al crear la cancha' },
      { status: 500 }
    );
  }
}

// PUT - Update court (admin only)
export async function PUT(request: NextRequest) {
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

    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
        { status: 400 }
      );
    }

    if (data.allows60 === false && data.allows90 === false) {
      return NextResponse.json(
        { error: 'Debes permitir al menos una duración (60 o 90 minutos)' },
        { status: 400 }
      );
    }

    const court = await prisma.court.findUnique({
      where: { id },
    });

    if (!court) {
      return NextResponse.json(
        { error: 'Cancha no encontrada' },
        { status: 404 }
      );
    }

    const { openingTime, closingTime, ...courtData } = data;

    const updated = await prisma.$transaction(async (tx) => {
      if (openingTime || closingTime) {
        await tx.court.updateMany({
          data: {
            openingTime: openingTime ?? court.openingTime,
            closingTime: closingTime ?? court.closingTime,
          },
        });
      }

      return tx.court.update({
        where: { id },
        data: courtData,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[courts] PUT', error);
    return NextResponse.json(
      { error: 'Error al actualizar la cancha' },
      { status: 500 }
    );
  }
}

// DELETE - Delete court (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El ID es requerido' },
        { status: 400 }
      );
    }

    const court = await prisma.court.findUnique({
      where: { id },
    });

    if (!court) {
      return NextResponse.json(
        { error: 'Cancha no encontrada' },
        { status: 404 }
      );
    }

    // Si la cancha tiene reservas (y por lo tanto posibles pagos), no la
    // borramos en cascada para no perder el historial financiero/auditoria.
    // En su lugar la desactivamos (soft delete).
    const reservationCount = await prisma.reservation.count({
      where: { courtId: id },
    });

    if (reservationCount > 0) {
      await prisma.court.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true, deactivated: true });
    }

    await prisma.court.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[courts] DELETE', error);
    return NextResponse.json(
      { error: 'Error al eliminar la cancha' },
      { status: 500 }
    );
  }
}
