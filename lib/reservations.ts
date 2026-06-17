import { prisma } from '@/lib/prisma';

const DEFAULT_PAYMENT_HOLD_MINUTES = 5;

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

// Versión acotada a una cancha+fecha: barata (usa el índice courtId+date) y
// segura de llamar en el camino de creación de reservas, en lugar del UPDATE
// global que satura la base bajo concurrencia.
export async function expireStalePendingPaymentsForSlot(courtId: string, date: string) {
  return prisma.reservation.updateMany({
    where: {
      courtId,
      date,
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
