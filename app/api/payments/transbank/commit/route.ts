import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commitWebpayTransaction, isWebpayApproved } from '@/lib/transbank';

// Webpay redirige el navegador de vuelta a esta URL al terminar el pago. No
// requiere autenticacion: la correlacion se hace por el token de Webpay, y la
// confirmacion es autoritativa porque consultamos a Transbank (commit).

function getAppUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  return new URL(request.url).origin;
}

function redirectToResult(request: NextRequest, result: 'success' | 'failure') {
  return NextResponse.redirect(`${getAppUrl(request)}/mis-reservas?payment=${result}`, 303);
}

async function readTokens(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  let tokenWs = params.get('token_ws') || undefined;
  let tbkToken = params.get('TBK_TOKEN') || undefined;

  if (request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    if (form) {
      tokenWs = (form.get('token_ws') as string | null) || tokenWs;
      tbkToken = (form.get('TBK_TOKEN') as string | null) || tbkToken;
    }
  }

  return { tokenWs, tbkToken };
}

// El usuario aborto el pago o expiro el formulario: Webpay retorna TBK_TOKEN
// (sin token_ws) y la transaccion nunca se autoriza.
async function markAborted(token: string) {
  const payment = await prisma.payment.findFirst({ where: { token } });
  if (!payment) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'cancelled', rawStatus: 'ABORTED' },
    });

    const reservation = await tx.reservation.findUnique({
      where: { id: payment.reservationId },
    });

    if (reservation && reservation.status === 'pending_payment') {
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { status: 'payment_failed' },
      });
    }
  });
}

async function handle(request: NextRequest) {
  const { tokenWs, tbkToken } = await readTokens(request);

  // Solo se confirma cuando llega token_ws SIN TBK_TOKEN. Si aparece TBK_TOKEN
  // (con o sin token_ws) el pago fue anulado por el usuario o expiro el
  // formulario: la transaccion queda reversada y NO se debe hacer commit.
  if (!tokenWs || tbkToken) {
    const abortToken = tbkToken || tokenWs;
    if (abortToken) {
      await markAborted(abortToken);
    }
    return redirectToResult(request, 'failure');
  }

  // Idempotencia: el token de Webpay es de un solo uso. Si ya confirmamos este
  // pago, no volvemos a hacer commit.
  const existing = await prisma.payment.findFirst({ where: { token: tokenWs } });
  if (existing?.status === 'approved') {
    return redirectToResult(request, 'success');
  }

  let commit;
  try {
    commit = await commitWebpayTransaction(tokenWs);
  } catch {
    return redirectToResult(request, 'failure');
  }

  const approved = isWebpayApproved(commit);
  // buy_order y session_id se setean = reservationId al crear la transaccion.
  const reservationId = existing?.reservationId || commit.buy_order || commit.session_id;

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return;

    const payment = await tx.payment.findUnique({
      where: { externalReference: reservationId },
    });
    const expectedAmount = payment?.amount ?? 0;

    // Defensa en profundidad: no confirmar si pagaron menos de lo esperado.
    const amountMismatch = approved && expectedAmount > 0 && commit.amount < expectedAmount;
    const finalApproved = approved && !amountMismatch;

    const paymentData = {
      provider: 'transbank',
      token: tokenWs,
      buyOrder: commit.buy_order,
      amount: commit.amount > 0 ? commit.amount : expectedAmount,
      status: finalApproved ? 'approved' : 'rejected',
      rawStatus: commit.status,
      providerPaymentId: commit.authorization_code || null,
      authorizationCode: commit.authorization_code || null,
      paymentTypeCode: commit.payment_type_code || null,
      installments: commit.installments_number ?? null,
      paidAt: finalApproved ? new Date() : null,
    };

    await tx.payment.upsert({
      where: { externalReference: reservationId },
      update: paymentData,
      create: { reservationId, externalReference: reservationId, ...paymentData },
    });

    if (reservation.status === 'cancelled') return;
    if (amountMismatch) return;

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: finalApproved ? 'confirmed' : 'payment_failed' },
    });
  });

  return redirectToResult(request, approved ? 'success' : 'failure');
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
