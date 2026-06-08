import crypto from 'crypto';

interface PreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: 'CLP';
}

interface CreatePreferenceParams {
  reservationId: string;
  payerEmail: string;
  payerName: string;
  amount: number;
  title: string;
  appUrl: string;
}

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
}

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no esta configurado');
  }

  return token;
}

export function getReservationPaymentAmount(price60?: number | null, price90?: number | null, durationMinutes = 60) {
  if (process.env.PAYMENT_MODE === 'deposit') {
    return Number(process.env.RESERVATION_DEPOSIT_AMOUNT || 5000);
  }

  return durationMinutes === 90 ? Number(price90 || 0) : Number(price60 || 0);
}

export async function createMercadoPagoPreference({
  reservationId,
  payerEmail,
  payerName,
  amount,
  title,
  appUrl,
}: CreatePreferenceParams) {
  const item: PreferenceItem = {
    title,
    quantity: 1,
    unit_price: amount,
    currency_id: 'CLP',
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [item],
      payer: {
        name: payerName,
        email: payerEmail,
      },
      external_reference: reservationId,
      notification_url: `${appUrl}/api/payments/mercadopago/webhook?source_news=webhooks`,
      back_urls: {
        success: `${appUrl}/mis-reservas?payment=success`,
        pending: `${appUrl}/mis-reservas?payment=pending`,
        failure: `${appUrl}/mis-reservas?payment=failure`,
      },
      auto_return: 'approved',
      expires: true,
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Mercado Pago no pudo crear el checkout');
  }

  return data as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'No se pudo consultar el pago en Mercado Pago');
  }

  return data as MercadoPagoPayment;
}

export function verifyMercadoPagoWebhookSignature(request: Request, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  if (!xSignature || !xRequestId) return false;

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  }

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parts.v1);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
