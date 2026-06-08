import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import {
  createMercadoPagoPreference,
  getMercadoPagoCheckoutUrl,
  getReservationPaymentAmount,
} from '@/lib/mercadopago';

function getAppUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId es requerido' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        court: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (reservation.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Esta reserva no esta pendiente de pago' },
        { status: 400 }
      );
    }

    const existingPayment = reservation.payments[0];
    if (existingPayment?.status === 'pending' && existingPayment.checkoutUrl) {
      return NextResponse.json({ url: existingPayment.checkoutUrl });
    }

    const amount = getReservationPaymentAmount(
      reservation.court.price60,
      reservation.court.price90,
      reservation.durationMinutes
    );

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto de pago invalido' }, { status: 400 });
    }

    const title = `${reservation.court.name} ${reservation.date} ${reservation.startTime}`;
    const preference = await createMercadoPagoPreference({
      reservationId: reservation.id,
      payerEmail: process.env.MERCADOPAGO_TEST_PAYER_EMAIL || user.email,
      payerName: reservation.customerName,
      amount,
      title,
      appUrl: getAppUrl(request),
    });

    const checkoutUrl = getMercadoPagoCheckoutUrl(preference);
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Mercado Pago no entrego URL de checkout' },
        { status: 500 }
      );
    }

    await prisma.payment.upsert({
      where: { externalReference: reservation.id },
      update: {
        amount,
        preferenceId: preference.id,
        checkoutUrl,
        status: 'pending',
      },
      create: {
        reservationId: reservation.id,
        externalReference: reservation.id,
        amount,
        preferenceId: preference.id,
        checkoutUrl,
        status: 'pending',
      },
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear pago' },
      { status: 500 }
    );
  }
}
