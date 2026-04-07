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

  // Update current time every minute for countdown
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

      const res = await fetch(`/api/reservations?userId=${user.id}&userRole=${user.role}`);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: 'cancelled',
          userId: user.id,
          userRole: user.role,
        }),
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

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  // Calculate countdown in hours and minutes
  const getCountdown = (dateStr: string, startTime: string) => {
    const reservationDate = new Date(`${dateStr}T${startTime}:00`);
    const diff = reservationDate.getTime() - currentTime.getTime();
    
    if (diff < 0) return null; // Already started
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, totalMinutes: Math.floor(diff / (1000 * 60)) };
  };

  // Get duration label
  const getDurationLabel = (reservation: Reservation) => {
    const duration = reservation.durationMinutes || 60;
    return `${duration} min`;
  };

  // Get price label
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

  // Check if reservation is today
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  // Check if reservation is in the future
  const isFuture = (dateStr: string, startTime: string) => {
    const reservationDate = new Date(`${dateStr}T${startTime}:00`);
    return reservationDate > currentTime;
  };

  // Check if reservation is currently in progress
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

  // Status badge component
  const getStatusBadge = (status: string, isInProgress: boolean = false) => {
    if (isInProgress) {
      return (
        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
          En curso
        </span>
      );
    }
    switch (status) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Confirmada</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Pendiente</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Cancelada</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Completada</span>;
    }
  };

  // Border color based on status
  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-green-500';
      case 'cancelled':
        return 'border-l-red-400';
      default:
        return 'border-l-gray-400';
    }
  };

  return (
    <main className="page-content">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#F7931E] to-[#FF8C2A] text-white shadow-lg">
        <div className="header-container px-4 py-4 pb-6 rounded-b-3xl">
          <h1 className="text-xl font-bold text-white truncate">Mis Reservas</h1>
          <p className="text-white/80 text-sm mt-1">Gestiona tus reservas</p>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="mx-4 mt-4 bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            ¡Reserva creada exitosamente!
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-1">Cancelar reserva</h3>
              <p className="text-sm text-text-light">¿Estás seguro de que deseas cancelar esta reserva?</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={cancellingId === showCancelModal}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all"
              >
                {cancellingId === showCancelModal ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
              <button
                onClick={() => setShowCancelModal(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-text-dark font-semibold py-3.5 px-4 rounded-2xl transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 -mt-3 space-y-5">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7931E]"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-dark mb-1">No tienes reservas aún</h3>
            <p className="text-sm text-text-light mb-5">Reserva tu cancha y comienza a disfrutar</p>
            <Link
              href="/reservar"
              className="inline-block bg-[#F7931E] hover:bg-[#E07D0A] text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              Reservar cancha
            </Link>
          </div>
        ) : (
          <>
            {/* Today's Reservations */}
            {todayReservations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-text-dark">Reservas de hoy</h2>
                  <span className="text-xs font-medium text-text-light bg-blue-50 text-[#1FA3C8] px-2.5 py-1 rounded-full">
                    {todayReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {todayReservations.map((reservation) => {
                    const inProgress = isInProgress(reservation.date, reservation.startTime, reservation.endTime);
                    const countdown = !inProgress ? getCountdown(reservation.date, reservation.startTime) : null;

                    return (
                      <div
                        key={reservation.id}
                        className={`bg-white rounded-2xl shadow-md border border-gray-100 border-l-4 ${getStatusBorderColor(reservation.status)} p-4 relative`}
                      >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(reservation.status, inProgress)}
                        </div>

                        {/* Court Name */}
                        <h3 className="font-bold text-text-dark text-base mb-3 pr-20">
                          {reservation.court.name}
                        </h3>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-text-medium">
                            <svg className="w-4 h-4 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-text-medium">
                            <svg className="w-4 h-4 text-[#F7931E]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>{getDurationLabel(reservation)}</span>
                          </div>
                        </div>

                        {/* Countdown or Status Message */}
                        {inProgress ? (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                            <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              En curso
                            </p>
                          </div>
                        ) : countdown && (
                          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                            <p className="text-sm font-semibold text-orange-700">
                              Comienza en {countdown.hours}h {countdown.minutes}m
                            </p>
                          </div>
                        )}

                        {/* Cancel Button */}
                        {reservation.status === 'confirmed' && !inProgress && (
                          <button
                            onClick={() => setShowCancelModal(reservation.id)}
                            className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Upcoming Reservations */}
            {upcomingReservations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-text-dark">Próximas reservas</h2>
                  <span className="text-xs font-medium text-text-light bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                    {upcomingReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingReservations.map((reservation) => {
                    const countdown = getCountdown(reservation.date, reservation.startTime);

                    return (
                      <div
                        key={reservation.id}
                        className={`bg-white rounded-2xl shadow-md border border-gray-100 border-l-4 ${getStatusBorderColor(reservation.status)} p-4 relative`}
                      >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(reservation.status)}
                        </div>

                        {/* Court Name */}
                        <h3 className="font-bold text-text-dark text-base mb-3 pr-20">
                          {reservation.court.name}
                        </h3>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-text-medium">
                            <svg className="w-4 h-4 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span>{formatTime(reservation.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-text-medium">
                            <svg className="w-4 h-4 text-[#F7931E]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>{getDurationLabel(reservation)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-text-medium col-span-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">{formatDate(reservation.date)}</span>
                          </div>
                        </div>

                        {/* Price */}
                        {getPriceLabel(reservation) && (
                          <div className="text-sm font-bold text-[#1FA3C8] mb-3">
                            {getPriceLabel(reservation)}
                          </div>
                        )}

                        {/* Countdown */}
                        {countdown && (
                          <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                            <p className="text-sm font-semibold text-green-700">
                              Faltan: {countdown.hours}h {countdown.minutes}m
                            </p>
                          </div>
                        )}

                        {/* Cancel Button */}
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => setShowCancelModal(reservation.id)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* History */}
            {historyReservations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-text-dark">Historial</h2>
                  <span className="text-xs font-medium text-text-light bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {historyReservations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {historyReservations.map((reservation) => {
                    const reservationIsToday = isToday(reservation.date);
                    const wasCompleted = reservation.status === 'confirmed' && !isFuture(reservation.date, reservation.startTime);

                    return (
                      <div
                        key={reservation.id}
                        className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getStatusBorderColor(reservation.status)} p-4 relative opacity-75`}
                      >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          {wasCompleted ? getStatusBadge('completed') : getStatusBadge(reservation.status)}
                        </div>

                        {/* Court Name */}
                        <h3 className="font-bold text-text-dark text-base mb-3 pr-20">
                          {reservation.court.name}
                        </h3>

                        {/* Details */}
                        <div className="space-y-2 text-sm text-text-medium">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(reservation.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span>{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
        </main>
      }>
        <MyReservationsContent />
      </Suspense>
    </AuthGuard>
  );
}
