'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/contexts/AuthContext';

interface Payment {
  amount: number;
  status: string;
  paidAt?: string | null;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  status: string;
  createdAt: string;
  court: {
    name: string;
    price60?: number;
    price90?: number;
  };
  payments?: Payment[];
}

function currency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
}

function getReservationAmount(reservation: Reservation) {
  const paymentAmount = reservation.payments?.[0]?.amount;
  if (paymentAmount && paymentAmount > 0) return paymentAmount;

  return reservation.durationMinutes === 90
    ? reservation.court.price90 || 0
    : reservation.court.price60 || 0;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function downloadCsv(reservations: Reservation[]) {
  const rows = [
    ['Fecha', 'Cancha', 'Horario', 'Duración', 'Estado', 'Monto'],
    ...reservations.map((reservation) => [
      reservation.date,
      reservation.court.name,
      `${reservation.startTime}-${reservation.endTime}`,
      `${reservation.durationMinutes || 60} min`,
      reservation.status,
      getReservationAmount(reservation).toString(),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sport-seven-reporte-reservas.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function ReportsContent() {
  const { isAdmin } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch('/api/reservations');
        if (!response.ok) throw new Error('No se pudieron cargar los reportes');
        setReservations(await response.json());
      } catch (err: any) {
        setError(err.message || 'Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const summary = useMemo(() => {
    const confirmed = reservations.filter((reservation) => reservation.status === 'confirmed');
    const pending = reservations.filter((reservation) => reservation.status === 'pending_payment');
    const failed = reservations.filter((reservation) =>
      ['cancelled', 'payment_failed', 'expired'].includes(reservation.status)
    );

    return {
      total: reservations.length,
      confirmed: confirmed.length,
      pending: pending.length,
      failed: failed.length,
      paidAmount: confirmed.reduce((total, reservation) => total + getReservationAmount(reservation), 0),
      pendingAmount: pending.reduce((total, reservation) => total + getReservationAmount(reservation), 0),
    };
  }, [reservations]);

  const recentReservations = reservations.slice(0, 8);

  return (
    <main className="page-content bg-[#F8FAFC] min-h-screen">
      <header className="premium-top-gradient">
        <div className="relative px-5 pt-7 pb-8">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em]">Sport Seven</p>
          <h1 className="mt-2 text-2xl font-extrabold text-white">Reportes</h1>
          <p className="mt-1 text-sm text-white/75">
            {isAdmin ? 'Vista general de reservas y pagos.' : 'Tu resumen de reservas y pagos.'}
          </p>
        </div>
      </header>

      <section className="px-4 -mt-5 space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase">Reservas</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0F172A]">{loading ? '-' : summary.total}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase">Confirmadas</p>
            <p className="mt-2 text-3xl font-extrabold text-[#22C55E]">{loading ? '-' : summary.confirmed}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase">Pagado</p>
            <p className="mt-2 text-xl font-extrabold text-[#0F172A]">{loading ? '-' : currency(summary.paidAmount)}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase">Pendiente</p>
            <p className="mt-2 text-xl font-extrabold text-[#F7931E]">{loading ? '-' : currency(summary.pendingAmount)}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Estado de actividad</h2>
              <p className="text-xs text-[#64748B]">Confirmadas, pendientes y cerradas</p>
            </div>
            <button
              onClick={() => downloadCsv(reservations)}
              disabled={reservations.length === 0}
              className="rounded-2xl bg-[#0F172A] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              Exportar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: 'Confirmadas', value: summary.confirmed, color: 'bg-[#22C55E]' },
              { label: 'Pendientes de pago', value: summary.pending, color: 'bg-[#F7931E]' },
              { label: 'Canceladas o expiradas', value: summary.failed, color: 'bg-[#EF4444]' },
            ].map((item) => {
              const percent = summary.total > 0 ? Math.round((item.value / summary.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
                    <span>{item.label}</span>
                    <span>{item.value} ({percent}%)</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A]">Ultimos movimientos</h2>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="py-8 text-center text-sm text-[#64748B]">Cargando reportes...</div>
            ) : recentReservations.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#64748B]">Aun no hay reservas para reportar.</div>
            ) : (
              recentReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-2xl bg-[#F8FAFC] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-[#0F172A]">{reservation.court.name}</p>
                      <p className="text-xs text-[#64748B]">
                        {formatDate(reservation.date)} · {reservation.startTime} - {reservation.endTime}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-[#475569]">
                      {reservation.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-extrabold text-[#F7931E]">{currency(getReservationAmount(reservation))}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ReportsContent />
    </AuthGuard>
  );
}
