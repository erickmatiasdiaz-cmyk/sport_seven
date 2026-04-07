'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/contexts/AuthContext';

interface Court {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  court: Court;
}

interface BlockedSlot {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  court: Court;
}

function AdminPage() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'block' | 'config'>('reservations');

  // New reservation form
  const [newReservation, setNewReservation] = useState({
    courtId: '',
    customerName: '',
    customerPhone: '',
    date: selectedDate,
    startTime: '18:00',
    endTime: '19:00',
  });

  // Block slot form
  const [blockSlot, setBlockSlot] = useState({
    courtId: '',
    date: selectedDate,
    startTime: '18:00',
    endTime: '19:00',
    reason: 'Mantenimiento',
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const adminHeaders = useMemo(
    () => (user?.role === 'admin' ? { 'x-user-role': user.role } : undefined),
    [user?.role]
  );

  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch('/api/courts', {
        headers: adminHeaders,
      });
      const data = await res.json();
      setCourts(data);
      if (data.length > 0) {
        setNewReservation((prev) => ({ ...prev, courtId: data[0].id }));
        setBlockSlot((prev) => ({ ...prev, courtId: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  }, [adminHeaders]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, resBlocked] = await Promise.all([
        fetch(`/api/reservations?date=${selectedDate}&userId=${user?.id}&userRole=${user?.role}`),
        fetch(`/api/blocked-slots?date=${selectedDate}`, {
          headers: adminHeaders,
        }),
      ]);
      const reservationsData = await resRes.json();
      const blockedData = await resBlocked.json();
      setReservations(reservationsData);
      setBlockedSlots(blockedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [adminHeaders, selectedDate, user?.id, user?.role]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  useEffect(() => {
    if (selectedDate) {
      fetchData();
    }
  }, [fetchData, selectedDate]);

  const handleCancelReservation = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled', userId: user?.id, userRole: user?.role }),
      });
      if (!res.ok) throw new Error('Error');
      fetchData();
    } catch (error) {
      alert('Error al cancelar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnblockSlot = async (id: string) => {
    if (!confirm('¿Desbloquear este horario?')) return;
    try {
      const res = await fetch(`/api/blocked-slots?id=${id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (!res.ok) throw new Error('Error');
      fetchData();
    } catch (error) {
      alert('Error al desbloquear');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReservation, status: 'confirmed', userId: user?.id, userRole: user?.role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      alert('Reserva creada exitosamente');
      setNewReservation((prev) => ({
        ...prev,
        customerName: '',
        customerPhone: '',
        startTime: '18:00',
        endTime: '19:00',
      }));
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders ?? {}),
        },
        body: JSON.stringify({ ...blockSlot, userRole: user?.role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      alert('Horario bloqueado');
      fetchData();
    } catch (error: any) {
      alert(error.message);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-status-confirmed-bg text-status-confirmed text-xs font-medium px-2 py-1 rounded-full">Confirmada</span>;
      case 'pending':
        return <span className="bg-status-pending-bg text-status-pending text-xs font-medium px-2 py-1 rounded-full">Pendiente</span>;
      case 'cancelled':
        return <span className="bg-status-cancelled-bg text-status-cancelled text-xs font-medium px-2 py-1 rounded-full">Cancelada</span>;
      default:
        return null;
    }
  };

  return (
    <main className="page-content">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#F7931E] to-[#FF8C2A] text-white shadow-lg">
        <div className="header-container px-4 py-4 pb-6 rounded-b-3xl">
          <Link href="/" className="inline-flex items-center mb-3 text-white/80 hover:text-white">
            <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">Volver</span>
          </Link>
          <h1 className="text-xl font-bold text-white truncate">Panel Admin</h1>
          <p className="text-white/80 text-sm mt-1">Gestión de reservas</p>
        </div>
      </header>

      {/* Date Selector */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Ver reservas por día</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'reservations'
                ? 'bg-brand-secondary text-white'
                : 'text-text-medium hover:bg-gray-100'
            }`}
          >
            Reservas
          </button>
          <button
            onClick={() => setActiveTab('block')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'block'
                ? 'bg-brand-secondary text-white'
                : 'text-text-medium hover:bg-gray-100'
            }`}
          >
            Bloquear
          </button>
          <button
            onClick={() => window.location.href = '/admin/configuracion'}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'config'
                ? 'bg-brand-secondary text-white'
                : 'text-text-medium hover:bg-gray-100'
            }`}
          >
            Config
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {activeTab === 'reservations' && (
          <>
            {/* Create Reservation Form */}
            <section className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Crear Reserva Manual</h2>
              <form onSubmit={handleCreateReservation} className="space-y-3">
                <select
                  value={newReservation.courtId}
                  onChange={(e) => setNewReservation({ ...newReservation, courtId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Seleccionar cancha</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={newReservation.customerName}
                  onChange={(e) => setNewReservation({ ...newReservation, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newReservation.customerPhone}
                  onChange={(e) => setNewReservation({ ...newReservation, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <div className="flex gap-2">
                  <select
                    value={newReservation.startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      const endHour = parseInt(start) + 1;
                      setNewReservation({
                        ...newReservation,
                        startTime: start,
                        endTime: `${endHour.toString().padStart(2, '0')}:00`,
                      });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => 18 + i).map((hour) => (
                      <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-secondary text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-secondary-light transition-colors"
                >
                  Crear Reserva
                </button>
              </form>
            </section>

            {/* Reservations List */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Reservas del día ({reservations.length})
              </h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-gray-500 text-sm">No hay reservas para este día</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reservations.map((res) => (
                    <div key={res.id} className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-semibold text-sm">{res.court.name}</span>
                          <p className="text-xs text-gray-500">{res.startTime} - {res.endTime}</p>
                        </div>
                        {getStatusBadge(res.status)}
                      </div>
                      <p className="text-xs text-gray-600">{res.customerName} | {res.customerPhone}</p>
                      {res.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelReservation(res.id)}
                          disabled={processingId === res.id}
                          className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          {processingId === res.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'block' && (
          <>
            {/* Block Slot Form */}
            <section className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Bloquear Horario</h2>
              <form onSubmit={handleBlockSlot} className="space-y-3">
                <select
                  value={blockSlot.courtId}
                  onChange={(e) => setBlockSlot({ ...blockSlot, courtId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Seleccionar cancha</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={blockSlot.date}
                  onChange={(e) => setBlockSlot({ ...blockSlot, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <select
                  value={blockSlot.startTime}
                  onChange={(e) => {
                    const start = e.target.value;
                    const endHour = parseInt(start) + 1;
                    setBlockSlot({
                      ...blockSlot,
                      startTime: start,
                      endTime: `${endHour.toString().padStart(2, '0')}:00`,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => 18 + i).map((hour) => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Motivo (opcional)"
                  value={blockSlot.reason}
                  onChange={(e) => setBlockSlot({ ...blockSlot, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-status-cancelled text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Bloquear Horario
                </button>
              </form>
            </section>

            {/* Blocked Slots List */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Horarios Bloqueados ({blockedSlots.length})
              </h2>
              {blockedSlots.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-gray-500 text-sm">No hay horarios bloqueados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedSlots.map((slot) => (
                    <div key={slot.id} className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-sm">{slot.court.name}</span>
                          <p className="text-xs text-gray-500">{slot.startTime} - {slot.endTime}</p>
                          <p className="text-xs text-gray-400">{slot.reason}</p>
                        </div>
                        <button
                          onClick={() => handleUnblockSlot(slot.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Desbloquear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AdminPageWrapper() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <AdminPage />
    </AuthGuard>
  );
}

export { AdminPageWrapper as default };
