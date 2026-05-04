'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import AvailabilityCalendar from '@/components/availability-calendar';
import ReservationForm from '@/components/reservation-form';
import { useAuth } from '@/contexts/AuthContext';

interface Court {
  id: string;
  name: string;
  image: string;
  price60: number;
  price90: number;
  allows60: boolean;
  allows90: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

function ReservationPageContent() {
  const searchParams = useSearchParams();
  const courtIdParam = searchParams.get('courtId');
  const { user } = useAuth();

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>(courtIdParam || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState<60 | 90>(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setCourts(data);
        if (data.length > 0) {
          const requestedCourt = courtIdParam
            ? data.find((c: Court) => c.id === courtIdParam)
            : null;
          const initialCourt = requestedCourt ?? data[0];

          setSelectedCourt(initialCourt.id);
          setDuration(initialCourt.allows60 ? 60 : 90);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, [courtIdParam]);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  const getNextDays = () => {
    const days: { date: string; label: string; dayName: string; dayNum: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
      const dayNum = date.getDate();
      days.push({ date: dateStr, label: dateStr, dayName, dayNum });
    }
    return days;
  };

  const days = getNextDays();
  const selectedCourtData = courts.find((c) => c.id === selectedCourt);

  useEffect(() => {
    if (!selectedCourtData) return;

    if (duration === 60 && !selectedCourtData.allows60 && selectedCourtData.allows90) {
      setDuration(90);
      setSelectedSlot(null);
    }

    if (duration === 90 && !selectedCourtData.allows90 && selectedCourtData.allows60) {
      setDuration(60);
      setSelectedSlot(null);
    }
  }, [duration, selectedCourtData]);

  if (loading) {
    return (
      <main className="page-content flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F7931E]"></div>
      </main>
    );
  }

  return (
    <main className="page-content">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#F7931E] to-[#FF9A2F] text-white shadow-lg">
        <div className="max-w-[420px] mx-auto px-5 py-4 pb-6 rounded-b-3xl">
          <Link href="/" className="inline-flex items-center mb-3 text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">Volver</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Reservar Cancha</h1>
          <p className="text-white/75 text-sm mt-0.5">Elige cancha, fecha y horario</p>
        </div>
      </header>

      <div className="px-4 -mt-3 space-y-4">
        {/* Court Selection - Premium Tabs */}
        <section className="bg-white rounded-3xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1F2937] mb-3">Selecciona tu cancha</h2>
          <div className="flex gap-2">
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => {
                  setSelectedCourt(court.id);
                  setDuration(court.allows60 ? 60 : 90);
                  setSelectedSlot(null);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  selectedCourt === court.id
                    ? 'bg-[#F7931E] text-white shadow-md scale-[1.02]'
                    : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#E5E7EB]'
                }`}
              >
                {court.name}
              </button>
            ))}
          </div>
        </section>

        {/* Duration Selection - Only show if court allows both */}
        {selectedCourtData && selectedCourtData.allows60 && selectedCourtData.allows90 && (
          <section className="bg-white rounded-3xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1F2937] mb-3">Selecciona la duración</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDuration(60);
                  setSelectedSlot(null);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  duration === 60
                    ? 'bg-[#1FA3C8] text-white shadow-md scale-[1.02]'
                    : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#E5E7EB]'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>60 minutos</span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    ${new Intl.NumberFormat('es-CL').format(selectedCourtData.price60)}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setDuration(90);
                  setSelectedSlot(null);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  duration === 90
                    ? 'bg-[#F7931E] text-white shadow-md scale-[1.02]'
                    : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#E5E7EB]'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>90 minutos</span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    ${new Intl.NumberFormat('es-CL').format(selectedCourtData.price90)}
                  </span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Date Selection - Premium Chips */}
        <section className="bg-white rounded-3xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1F2937] mb-3">Elige una fecha</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {days.map((day) => (
              <button
                key={day.date}
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedSlot(null);
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  selectedDate === day.date
                    ? 'bg-[#F7931E] text-white shadow-md scale-[1.05]'
                    : 'bg-white border border-[#E5E7EB] text-[#1F2937] hover:border-[#F7931E]'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide ${selectedDate === day.date ? 'text-white/80' : 'text-[#6B7280]'}`}>
                  {day.dayName}
                </span>
                <span className="text-lg font-bold leading-tight mt-0.5">{day.dayNum}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Time Slots - Premium Grid */}
        {selectedCourt && selectedDate && (
          <section className="bg-white rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1F2937]">Escoge un horario disponible</h2>
              <span className="text-[10px] text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-full">{duration} min</span>
            </div>
            <AvailabilityCalendar
              courtId={selectedCourt}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onSlotSelect={setSelectedSlot}
              durationMinutes={duration}
            />
          </section>
        )}

        {/* Summary Card */}
        {selectedSlot && selectedCourtData && (
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#1F2937] mb-4">Tu selección</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#F7931E]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F7931E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Cancha</p>
                    <p className="text-sm font-semibold text-[#1F2937]">{selectedCourtData.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#1FA3C8]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1FA3C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Fecha</p>
                    <p className="text-sm font-semibold text-[#1F2937]">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B7280]">Horario</p>
                  <p className="text-sm font-bold text-[#1FA3C8]">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
              </div>
              <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#FFD24A]/30 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F7931E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Precio</p>
                    <p className="text-lg font-bold text-[#F7931E]">
                      ${new Intl.NumberFormat('es-CL').format(duration === 60 ? selectedCourtData.price60 : selectedCourtData.price90)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B7280]">Duración</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{duration} min</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reservation Form */}
        {selectedSlot && selectedCourtData && (
          <section className="bg-white rounded-3xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1F2937] mb-4">Completa tus datos para confirmar</h2>
            <ReservationForm
              courtId={selectedCourt}
              courtName={selectedCourtData.name}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              durationMinutes={duration}
            />
          </section>
        )}
      </div>
    </main>
  );
}

export default function ReservationPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Suspense fallback={
        <main className="page-content flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F7931E]"></div>
        </main>
      }>
        <ReservationPageContent />
      </Suspense>
    </AuthGuard>
  );
}
