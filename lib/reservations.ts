import { prisma } from '@/lib/prisma';

const DEFAULT_PAYMENT_HOLD_MINUTES = 15;

export function getPaymentHoldMinutes() {
  const configured = Number(process.env.PAYMENT_HOLD_MINUTES || DEFAULT_PAYMENT_HOLD_MINUTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_PAYMENT_HOLD_MINUTES;
}

export function getPaymentHoldExpirationDate() {
  return new Date(Date.now() - getPaymentHoldMinutes() * 60 * 1000);
}

export async function expireStalePendingPayments() {
  return prisma.reservation.updateMany({
    where: {
      status: 'pending_payment',
      createdAt: {
        lt: getPaymentHoldExpirationDate(),
      },
    },
    data: {
      status: 'expired',
    },
  });
}
