// Integracion con Transbank Webpay Plus via REST (API v1.2).
// Se usa fetch directo (sin el SDK oficial) para mantener el estilo liviano del
// proyecto. El flujo de Webpay Plus es:
//   1. create  -> POST  /transactions            => { token, url }
//   2. el usuario paga en Webpay (POST con token_ws a `url`)
//   3. commit  -> PUT   /transactions/{token}     => resultado autorizado/rechazado
//
// Modo de operacion via TRANSBANK_ENVIRONMENT:
//   - "integration" (por defecto): ambiente de pruebas de Transbank. Si no se
//     definen credenciales, usa las publicas de integracion de Webpay Plus.
//   - "production": exige TRANSBANK_COMMERCE_CODE y TRANSBANK_API_KEY reales.

const INTEGRATION_BASE_URL = 'https://webpay3gint.transbank.cl';
const PRODUCTION_BASE_URL = 'https://webpay3g.transbank.cl';

// Credenciales publicas de integracion de Webpay Plus (provistas por Transbank
// para pruebas). NO sirven para cobros reales.
const INTEGRATION_COMMERCE_CODE = '597055555532';
const INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

const TRANSACTIONS_PATH = '/rswebpaytransaction/api/webpay/v1.2/transactions';

export interface WebpayCreateResponse {
  token: string;
  url: string;
}

export interface WebpayCommitResponse {
  vci?: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail?: { card_number?: string };
  accounting_date?: string;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code?: number;
  installments_number?: number;
}

function isProduction() {
  return process.env.TRANSBANK_ENVIRONMENT === 'production';
}

function getBaseUrl() {
  return isProduction() ? PRODUCTION_BASE_URL : INTEGRATION_BASE_URL;
}

function getCommerceCode() {
  if (isProduction()) {
    const code = process.env.TRANSBANK_COMMERCE_CODE;
    if (!code) {
      throw new Error('TRANSBANK_COMMERCE_CODE no esta configurado');
    }
    return code;
  }

  return process.env.TRANSBANK_COMMERCE_CODE || INTEGRATION_COMMERCE_CODE;
}

function getApiKey() {
  if (isProduction()) {
    const key = process.env.TRANSBANK_API_KEY;
    if (!key) {
      throw new Error('TRANSBANK_API_KEY no esta configurado');
    }
    return key;
  }

  return process.env.TRANSBANK_API_KEY || INTEGRATION_API_KEY;
}

function getHeaders() {
  return {
    'Tbk-Api-Key-Id': getCommerceCode(),
    'Tbk-Api-Key-Secret': getApiKey(),
    'Content-Type': 'application/json',
  };
}

interface CreateTransactionParams {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
}

export async function createWebpayTransaction({
  buyOrder,
  sessionId,
  amount,
  returnUrl,
}: CreateTransactionParams): Promise<WebpayCreateResponse> {
  const response = await fetch(`${getBaseUrl()}${TRANSACTIONS_PATH}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      buy_order: buyOrder,
      session_id: sessionId,
      amount,
      return_url: returnUrl,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error_message || 'Webpay no pudo crear la transaccion');
  }

  return data as WebpayCreateResponse;
}

export async function commitWebpayTransaction(token: string): Promise<WebpayCommitResponse> {
  const response = await fetch(`${getBaseUrl()}${TRANSACTIONS_PATH}/${token}`, {
    method: 'PUT',
    headers: getHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error_message || 'Webpay no pudo confirmar la transaccion');
  }

  return data as WebpayCommitResponse;
}

// Una transaccion Webpay esta efectivamente pagada cuando el estado es
// AUTHORIZED y el codigo de respuesta es 0.
export function isWebpayApproved(commit: WebpayCommitResponse) {
  return commit.status === 'AUTHORIZED' && commit.response_code === 0;
}
