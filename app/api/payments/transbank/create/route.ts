import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { getReservationPaymentAmount } from '@/lib/reservations';
import { createWebpayTransaction } from '@/lib/transbank';

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
      include: { court: true },
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

    const amount = getReservationPaymentAmount(
      reservation.court.price60,
      reservation.court.price90,
      reservation.durationMinutes
    );

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto de pago invalido' }, { status: 400 });
    }

    // buy_order admite hasta 26 caracteres alfanumericos; un cuid (25) entra justo.
    const buyOrder = reservation.id.slice(0, 26);
    const returnUrl = `${getAppUrl(request)}/api/payments/transbank/commit`;

    // Cada intento crea una transaccion nueva: el token de Webpay es de un solo
    // uso y caduca, por lo que no reutilizamos el anterior.
    const transaction = await createWebpayTransaction({
      buyOrder,
      sessionId: reservation.id,
      amount,
      returnUrl,
    });

    await prisma.payment.upsert({
      where: { externalReference: reservation.id },
      update: {
        provider: 'transbank',
        amount,
        token: transaction.token,
        buyOrder,
        checkoutUrl: transaction.url,
        status: 'pending',
        rawStatus: null,
        providerPaymentId: null,
        authorizationCode: null,
        paymentTypeCode: null,
        installments: null,
        paidAt: null,
      },
      create: {
        reservationId: reservation.id,
        externalReference: reservation.id,
        provider: 'transbank',
        amount,
        token: transaction.token,
        buyOrder,
        checkoutUrl: transaction.url,
        status: 'pending',
      },
    });

    return NextResponse.json({ url: transaction.url, token: transaction.token });
  } catch {
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
