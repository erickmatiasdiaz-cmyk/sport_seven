import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago';

function getPaymentId(request: NextRequest, body: any) {
  const searchParams = new URL(request.url).searchParams;

  return (
    body?.data?.id?.toString() ||
    searchParams.get('data.id') ||
    searchParams.get('id') ||
    body?.id?.toString() ||
    null
  );
}

function mapReservationStatus(paymentStatus: string) {
  if (paymentStatus === 'approved') return 'confirmed';
  if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') return 'payment_failed';
  if (paymentStatus === 'refunded') return 'cancelled';
  return 'pending_payment';
}

function mapPaymentStatus(paymentStatus: string) {
  if (paymentStatus === 'approved') return 'approved';
  if (paymentStatus === 'rejected') return 'rejected';
  if (paymentStatus === 'cancelled') return 'cancelled';
  if (paymentStatus === 'refunded') return 'refunded';
  if (paymentStatus === 'in_process') return 'in_process';
  return 'pending';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId = getPaymentId(request, body);

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    if (!verifyMercadoPagoWebhookSignature(request, paymentId)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const mercadoPagoPayment = await getMercadoPagoPayment(paymentId);
    const reservationId = mercadoPagoPayment.external_reference;

    if (!reservationId) {
      return NextResponse.json({ received: true });
    }

    const paymentStatus = mapPaymentStatus(mercadoPagoPayment.status);
    const reservationStatus = mapReservationStatus(mercadoPagoPayment.status);

    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) return;

      await tx.payment.upsert({
        where: { externalReference: reservationId },
        update: {
          providerPaymentId: mercadoPagoPayment.id.toString(),
          amount: Math.round(mercadoPagoPayment.transaction_amount || 0),
          status: paymentStatus,
          rawStatus: mercadoPagoPayment.status,
          paidAt: paymentStatus === 'approved' ? new Date() : undefined,
        },
        create: {
          reservationId,
          externalReference: reservationId,
          providerPaymentId: mercadoPagoPayment.id.toString(),
          amount: Math.round(mercadoPagoPayment.transaction_amount || 0),
          status: paymentStatus,
          rawStatus: mercadoPagoPayment.status,
          paidAt: paymentStatus === 'approved' ? new Date() : undefined,
        },
      });

      if (reservation.status === 'cancelled') return;

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: reservationStatus },
      });
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
