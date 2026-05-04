'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/contexts/AuthContext';

interface Reservation {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
  };
  court: {
    id: string;
    name: string;
    price60?: number;
    price90?: number;
  };
}

function MyReservationsContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(success === 'true');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setReservations(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    } else {
      setLoading(false);
    }
  }, [fetchReservations, user]);

  const handleCancel = async (id: string) => {
    setShowCancelModal(null);
    setCancellingId(id);
    try {
      if (!user) throw new Error('No autenticado');

      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }

      fetchReservations();
    } catch (error: any) {
      alert(error.message || 'Error al cancelar la reserva');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatCreatedAt = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCountdown = (dateStr: string, startTime: string) => {
    const reservationDate = new Date(`${dateStr}T${startTime}:00`);
    const diff = reservationDate.getTime() - currentTime.getTime();
    if (diff < 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, totalMinutes: Math.floor(diff / (1000 * 60)) };
  };

  const getDurationLabel = (reservation: Reservation) => {
    const duration = reservation.durationMinutes || 60;
    return `${duration} min`;
  };

  const getPriceLabel = (reservation: Reservation) => {
    const duration = reservation.durationMinutes || 60;
    const price = duration === 90 ? reservation.court.price90 : reservation.court.price60;
    if (!price) return null;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isFuture = (dateStr: string, startTime: string) => {
    const reservationDate = new Date(`${dateStr}T${startTime}:00`);
    return reservationDate > currentTime;
  };

  const isInProgress = (dateStr: string, startTime: string, endTime: string) => {
    const now = currentTime;
    const reservationDate = new Date(`${dateStr}T${startTime}:00`);
    const endDate = new Date(`${dateStr}T${endTime}:00`);
    return now >= reservationDate && now < endDate;
  };

  // Categorize reservations
  const todayReservations = reservations.filter(
    (r) => isToday(r.date) && r.status === 'confirmed'
  );

  const upcomingReservations = reservations.filter(
    (r) => !isToday(r.date) && r.status === 'confirmed' && isFuture(r.date, r.startTime)
  );

  const historyReservations = reservations.filter(
    (r) => r.status === 'cancelled' || (isToday(r.date) && r.status === 'confirmed' && !isFuture(r.date, r.startTime)) || (!isToday(r.date) && !isFuture(r.date, r.startTime) && r.status === 'confirmed')
  );

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-l-[#22c55e]';
      case 'cancelled': return 'border-l-[#ef4444]';
      default: return 'border-l-[#94A3B8]';
    }
  };

  const showAdminMetadata = user?.role === 'admin';

  // Reservation card component
  const ReservationCard = ({ reservation, showCountdown = true }: { reservation: Reservation; showCountdown?: boolean }) => {
    const inProgress = isInProgress(reservation.date, reservation.startTime, reservation.endTime);
    const countdown = showCountdown && !inProgress ? getCountdown(reservation.date, reservation.startTime) : null;

    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-[#E2E8F0] border-l-4 ${getStatusBorderColor(reservation.status)} p-4 relative transition-all duration-200 hover:shadow-md`}>
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {inProgress ? (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              En curso
            </span>
          ) : reservation.status === 'confirmed' ? (
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Confirmada</span>
          ) : reservation.status === 'cancelled' ? (
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Cancelada</span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Completada</span>
          )}
        </div>

        {/* Court Name */}
        <h3 className="font-bold text-[#0F172A] text-base mb-3 pr-24">
          {reservation.court.name}
        </h3>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-sm mb-3">
          <div className="flex items-center gap-2 text-[#475569]">
            <div className="w-7 h-7 bg-[#E8F7FB] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[9px] text-[#94A3B8] font-medium uppercase">Horario</p>
              <p className="font-semibold text-[#0F172A]">{reservation.startTime} - {reservation.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#475569]">
            <div className="w-7 h-7 bg-[#FFF3C4] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-[#F7931E]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[9px] text-[#94A3B8] font-medium uppercase">Duración</p>
              <p className="font-semibold text-[#0F172A]">{getDurationLabel(reservation)}</p>
            </div>
          </div>
          {!isToday(reservation.date) && (
            <div className="flex items-center gap-2 text-[#475569] col-span-2">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-[#94A3B8] font-medium uppercase">Fecha</p>
                <p className="font-semibold text-[#0F172A] text-xs">{formatDate(reservation.date)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        {getPriceLabel(reservation) && !inProgress && (
          <div className="text-sm font-bold text-[#F7931E] mb-3 bg-orange-50 inline-block px-3 py-1.5 rounded-full">
            {getPriceLabel(reservation)}
          </div>
        )}

        {/* Admin Metadata */}
        {showAdminMetadata && (
          <div className="mt-3 space-y-1 text-xs text-[#64748B] bg-gray-50 rounded-xl p-3">
            <p>Reservó: <span className="font-medium text-[#475569]">{reservation.user?.name || reservation.customerName}</span></p>
            <p>Creado: <span className="font-medium text-[#475569]">{formatCreatedAt(reservation.createdAt)}</span></p>
          </div>
        )}

        {/* Countdown or Status */}
        {inProgress ? (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              En curso ahora
            </p>
          </div>
        ) : countdown && isFuture(reservation.date, reservation.startTime) ? (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Comienza en {countdown.hours}h {countdown.minutes}m
            </p>
          </div>
        ) : null}

        {/* Cancel Button */}
        {reservation.status === 'confirmed' && !inProgress && isFuture(reservation.date, reservation.startTime) && (
          <button
            onClick={() => setShowCancelModal(reservation.id)}
            className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar reserva
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="page-content bg-[#F8FAFC]">
      {/* Compact Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7931E] to-[#F59E0B]"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-8 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative header-container px-5 pt-6 pb-5">
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            {showAdminMetadata ? 'Reservas del Sistema' : 'Mis Reservas'}
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium">
            {showAdminMetadata ? 'Gestiona las reservas del complejo' : 'Gestiona tus reservas y horarios'}
          </p>
        </div>
      </header>

      {/* Success Toast */}
      {showSuccess && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl animate-slide-down shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-semibold text-sm">¡Reserva creada exitosamente!</p>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1">¿Cancelar reserva?</h3>
              <p className="text-sm text-[#64748B]">Esta acción no se puede deshacer</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={cancellingId === showCancelModal}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all text-sm"
              >
                {cancellingId === showCancelModal ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Cancelando...
                  </span>
                ) : 'Confirmar cancelación'}
              </button>
              <button
                onClick={() => setShowCancelModal(null)}
                className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-semibold py-3.5 px-4 rounded-2xl transition-colors text-sm"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 -mt-3 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
                <div className="skeleton skeleton-title rounded-xl" style={{ width: '60%' }}></div>
                <div className="skeleton skeleton-text rounded-xl"></div>
                <div className="skeleton skeleton-text rounded-xl" style={{ width: '40%' }}></div>
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-[#E2E8F0] animate-fade-in">
            <div className="w-20 h-20 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1.5">No tienes reservas aún</h3>
            <p className="text-sm text-[#64748B] mb-6">Reserva tu cancha y comienza a disfrutar</p>
            <Link
              href="/reservar"
              className="btn-primary inline-block text-sm"
            >
              Reservar cancha
            </Link>
          </div>
        ) : (
          <>
            {/* Today's Reservations */}
            {todayReservations.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <h2 className="text-base font-bold text-[#0F172A]">Hoy</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#1FA3C8] bg-[#E8F7FB] px-2.5 py-1 rounded-full">
                    {todayReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {todayReservations.map((reservation) => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Reservations */}
            {upcomingReservations.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="text-base font-bold text-[#0F172A]">Próximas</h2>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    {upcomingReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingReservations.map((reservation) => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              </section>
            )}

            {/* History */}
            {historyReservations.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#94A3B8] rounded-full"></div>
                    <h2 className="text-base font-bold text-[#0F172A]">Historial</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {historyReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {historyReservations.map((reservation) => (
                    <div key={reservation.id} className="opacity-70">
                      <ReservationCard reservation={reservation} showCountdown={false} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function MyReservationsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Suspense fallback={
        <main className="page-content flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#F7931E] border-t-transparent"></div>
        </main>
      }>
        <MyReservationsContent />
      </Suspense>
    </AuthGuard>
  );
}
