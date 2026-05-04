'use client';

import { useState, useEffect, useCallback } from 'react';
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
  createdAt: string;
  court: Court;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
  };
}

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  _count: {
    reservations: number;
  };
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
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'block' | 'users'>('reservations');

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

  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setCourts(data);
      if (data.length > 0) {
        setNewReservation((prev) => ({ ...prev, courtId: data[0].id }));
        setBlockSlot((prev) => ({ ...prev, courtId: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, resBlocked, resUsers] = await Promise.all([
        fetch(`/api/reservations?date=${selectedDate}`),
        fetch(`/api/blocked-slots?date=${selectedDate}`),
        fetch('/api/users'),
      ]);
      setReservations(await resRes.json());
      setBlockedSlots(await resBlocked.json());
      setUsers(await resUsers.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchCourts(); }, [fetchCourts]);
  useEffect(() => { if (selectedDate) fetchData(); }, [fetchData, selectedDate]);

  const handleCancelReservation = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Error');
      fetchData();
    } catch {
      alert('Error al cancelar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnblockSlot = async (id: string) => {
    if (!confirm('¿Desbloquear este horario?')) return;
    try {
      const res = await fetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      fetchData();
    } catch {
      alert('Error al desbloquear');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReservation, status: 'confirmed' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      alert('Reserva creada exitosamente');
      setNewReservation((prev) => ({ ...prev, customerName: '', customerPhone: '', startTime: '18:00', endTime: '19:00' }));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockSlot),
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
    return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCreatedTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Confirmada</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Pendiente</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Cancelada</span>;
      default:
        return null;
    }
  };

  // Input/select styles
  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#1FA3C8] focus:ring-2 focus:ring-[#1FA3C8]/10 outline-none transition-all text-sm bg-white text-[#0F172A] placeholder-[#94A3B8]";
  const btnClass = "w-full py-3 rounded-xl text-sm font-semibold transition-all";

  return (
    <main className="page-content bg-[#F8FAFC]">
      {/* Compact Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7931E] to-[#F59E0B]"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-8 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative header-container px-5 pt-6 pb-5">
          <Link href="/" className="inline-flex items-center mb-3 text-white/80 hover:text-white text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-extrabold text-white leading-tight">Panel Admin</h1>
          <p className="text-white/80 text-sm mt-1 font-medium">Gestión de reservas del complejo</p>
        </div>
      </header>

      <div className="px-4 -mt-3 space-y-4">
        {/* Date Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Ver reservas por día</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-[#94A3B8] mt-2 font-medium">{formatDate(selectedDate)}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-[#E2E8F0] flex gap-1">
          {([
            { key: 'reservations', label: 'Reservas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { key: 'block', label: 'Bloquear', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
            { key: 'users', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[#F7931E] text-white shadow-sm'
                  : 'text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
          <Link
            href="/admin/configuracion"
            className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l.972.486a1 1 0 00.894 0l.972-.486a1 1 0 011.35.936l.074 1.083a1 1 0 00.592.83l.998.43a1 1 0 01.548 1.274l-.36 1.024a1 1 0 00.214 1.022l.739.807a1 1 0 010 1.352l-.739.807a1 1 0 00-.214 1.022l.36 1.024a1 1 0 01-.548 1.274l-.998.43a1 1 0 00-.592.83l-.074 1.083a1 1 0 01-1.35.936l-.972-.486a1 1 0 00-.894 0l-.972.486a1 1 0 01-1.35-.936l-.074-1.083a1 1 0 00-.592-.83l-.998-.43a1 1 0 01-.548-1.274l.36-1.024a1 1 0 00-.214-1.022l-.739-.807a1 1 0 010-1.352l.739-.807a1 1 0 00.214-1.022l-.36-1.024a1 1 0 01.548-1.274l.998-.43a1 1 0 00.592-.83l.074-1.083z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Config
          </Link>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'reservations' && (
            <>
              {/* Create Reservation Form */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F7931E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Crear Reserva Manual</h2>
                </div>
                <form onSubmit={handleCreateReservation} className="space-y-3">
                  <select value={newReservation.courtId} onChange={(e) => setNewReservation({ ...newReservation, courtId: e.target.value })} className={inputClass} required>
                    <option value="">Seleccionar cancha</option>
                    {courts.map((court) => (<option key={court.id} value={court.id}>{court.name}</option>))}
                  </select>
                  <input type="text" placeholder="Nombre del cliente" value={newReservation.customerName} onChange={(e) => setNewReservation({ ...newReservation, customerName: e.target.value })} className={inputClass} required />
                  <input type="tel" placeholder="Teléfono" value={newReservation.customerPhone} onChange={(e) => setNewReservation({ ...newReservation, customerPhone: e.target.value })} className={inputClass} required />
                  <select
                    value={newReservation.startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      const endHour = parseInt(start) + 1;
                      setNewReservation({ ...newReservation, startTime: start, endTime: `${endHour.toString().padStart(2, '0')}:00` });
                    }}
                    className={inputClass}
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => 18 + i).map((hour) => (
                      <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00 – {(hour + 1).toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={`${btnClass} bg-gradient-to-r from-[#F7931E] to-[#FF9A2F] text-white hover:shadow-md`}>
                    Crear Reserva
                  </button>
                </form>
              </section>

              {/* Reservations List */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-[#0F172A]">Reservas del día</h2>
                  <span className="text-xs font-semibold text-[#1FA3C8] bg-[#E8F7FB] px-2.5 py-1 rounded-full">{reservations.length}</span>
                </div>
                {loading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F7931E] border-t-transparent"></div></div>
                ) : reservations.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E2E8F0]">
                    <p className="text-[#64748B] text-sm">No hay reservas para este día</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reservations.map((res) => (
                      <div key={res.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#0F172A]">{res.court.name}</span>
                              {getStatusBadge(res.status)}
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5 font-medium">{res.startTime} – {res.endTime}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-[#64748B]">
                          <p>Cliente: <span className="font-medium text-[#475569]">{res.customerName}</span></p>
                          <p>Tel: <span className="font-medium text-[#475569]">{res.customerPhone}</span></p>
                          <p className="col-span-2">Reservó: <span className="font-medium text-[#475569]">{res.user?.name || res.customerName}</span> · {formatCreatedTime(res.createdAt)}</p>
                        </div>
                        {res.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            disabled={processingId === res.id}
                            className="mt-2.5 text-xs text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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

          {activeTab === 'users' && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#0F172A]">Usuarios registrados</h2>
                <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">{users.length}</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F7931E] border-t-transparent"></div></div>
              ) : users.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E2E8F0]">
                  <p className="text-[#64748B] text-sm">No hay usuarios registrados</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {users.map((registeredUser) => (
                    <div key={registeredUser.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] transition-all hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#E8F7FB] to-[#D4F0F8] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1FA3C8] font-bold text-sm">{registeredUser.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#0F172A]">{registeredUser.name}</p>
                            <p className="text-xs text-[#64748B]">{registeredUser.email}</p>
                            <p className="text-xs text-[#94A3B8]">{registeredUser.phone || 'Sin teléfono'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                          registeredUser.role === 'admin'
                            ? 'bg-orange-100 text-[#F7931E]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}>
                          {registeredUser.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8] pt-3 border-t border-[#F1F5F9]">
                        <span>{formatDateTime(registeredUser.createdAt)}</span>
                        <span className="font-semibold text-[#475569]">{registeredUser._count.reservations} reservas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'block' && (
            <>
              {/* Block Slot Form */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Bloquear Horario</h2>
                </div>
                <form onSubmit={handleBlockSlot} className="space-y-3">
                  <select value={blockSlot.courtId} onChange={(e) => setBlockSlot({ ...blockSlot, courtId: e.target.value })} className={inputClass} required>
                    <option value="">Seleccionar cancha</option>
                    {courts.map((court) => (<option key={court.id} value={court.id}>{court.name}</option>))}
                  </select>
                  <input type="date" value={blockSlot.date} onChange={(e) => setBlockSlot({ ...blockSlot, date: e.target.value })} className={inputClass} required />
                  <select
                    value={blockSlot.startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      const endHour = parseInt(start) + 1;
                      setBlockSlot({ ...blockSlot, startTime: start, endTime: `${endHour.toString().padStart(2, '0')}:00` });
                    }}
                    className={inputClass}
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => 18 + i).map((hour) => (
                      <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00 – {(hour + 1).toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                  <input type="text" placeholder="Motivo (opcional)" value={blockSlot.reason} onChange={(e) => setBlockSlot({ ...blockSlot, reason: e.target.value })} className={inputClass} />
                  <button type="submit" className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}>
                    Bloquear Horario
                  </button>
                </form>
              </section>

              {/* Blocked Slots List */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-[#0F172A]">Horarios Bloqueados</h2>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{blockedSlots.length}</span>
                </div>
                {blockedSlots.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E2E8F0]">
                    <p className="text-[#64748B] text-sm">No hay horarios bloqueados</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {blockedSlots.map((slot) => (
                      <div key={slot.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">{slot.court.name}</span>
                          <p className="text-xs text-[#64748B] font-medium">{slot.startTime} – {slot.endTime}</p>
                          {slot.reason && <p className="text-[10px] text-[#94A3B8] mt-0.5">{slot.reason}</p>}
                        </div>
                        <button
                          onClick={() => handleUnblockSlot(slot.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Desbloquear
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
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
