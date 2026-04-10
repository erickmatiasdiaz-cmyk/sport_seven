'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ReservedSlot {
  startTime: string;
  endTime: string;
}

interface BlockedSlot {
  startTime: string;
  endTime: string;
  reason: string;
}

interface CourtSchedule {
  openingTime: string;
  closingTime: string;
}

interface AvailabilityCalendarProps {
  courtId: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  durationMinutes?: 60 | 90;
}

export default function AvailabilityCalendar({
  courtId,
  selectedDate,
  selectedSlot,
  onSlotSelect,
  durationMinutes = 60,
}: AvailabilityCalendarProps) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [reservedSlots, setReservedSlots] = useState<ReservedSlot[]>([]);
  const [blockedSlotsData, setBlockedSlotsData] = useState<BlockedSlot[]>([]);
  const [courtSchedule, setCourtSchedule] = useState<CourtSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/availability?courtId=${courtId}&date=${selectedDate}&duration=${durationMinutes}`
        );
        if (!res.ok) throw new Error('Error fetching availability');
        const data = await res.json();
        setAvailableSlots(data.availableSlots);
        setReservedSlots(data.reservedSlots);
        setBlockedSlotsData(data.blockedSlots);
        setCourtSchedule(data.court);
      } catch (err) {
        setError('No se pudo cargar la disponibilidad');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [courtId, selectedDate, durationMinutes]);

  // Use availableSlots from API and merge with reserved/blocked for display
  const allSlots: TimeSlot[] = [];

  if (courtSchedule) {
    const [openHour, openMinute] = courtSchedule.openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = courtSchedule.closingTime.split(':').map(Number);
    let startMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute;

    while (startMinutes + durationMinutes <= endMinutes) {
      const startH = Math.floor(startMinutes / 60);
      const startM = startMinutes % 60;
      const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
      const endTotal = startMinutes + durationMinutes;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      allSlots.push({ startTime, endTime });
      startMinutes += 60;
    }
  } else {
    const startTime = '18:00';
    const endTotal = 18 * 60 + durationMinutes;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    allSlots.push({ startTime, endTime });
  }

  const isReserved = (slot: TimeSlot) =>
    reservedSlots.some((r) => r.startTime === slot.startTime && r.endTime === slot.endTime);

  const isBlocked = (slot: TimeSlot) =>
    blockedSlotsData.some((b) => b.startTime === slot.startTime && b.endTime === slot.endTime);

  const isAvailable = (slot: TimeSlot) =>
    availableSlots.some((s) => s.startTime === slot.startTime && s.endTime === slot.endTime);

  const isSelected = (slot: TimeSlot) =>
    selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;

  // Skeleton loading
  if (loading) {
    return (
      <div>
        {/* Skeleton Legend */}
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-[#E2E8F0]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="skeleton w-3 h-3 rounded-full"></div>
              <div className="skeleton w-16 h-3 rounded"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-[#64748B] text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-[#1FA3C8] shadow-sm"></div>
          <span className="text-[11px] text-[#64748B] font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1FA3C8] shadow-sm"></div>
          <span className="text-[11px] text-[#64748B] font-medium">Seleccionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F1F5F9]"></div>
          <span className="text-[11px] text-[#64748B] font-medium">Ocupado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#fee2e2]"></div>
          <span className="text-[11px] text-[#64748B] font-medium">Bloqueado</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-3.5 h-3.5 text-[#64748B]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] text-[#64748B] font-semibold">{durationMinutes} min</span>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {allSlots.map((slot, index) => {
          const reserved = isReserved(slot);
          const blocked = isBlocked(slot);
          const selected = isSelected(slot);
          const available = isAvailable(slot);

          return (
            <button
              key={slot.startTime}
              onClick={() => available && onSlotSelect(slot)}
              disabled={!available}
              className={`
                relative py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-300
                flex flex-col items-center justify-center gap-0.5
                ${
                  selected
                    ? 'bg-gradient-to-br from-[#1FA3C8] to-[#1889A8] text-white shadow-lg shadow-[#1FA3C8]/30 scale-[1.03]'
                    : reserved
                    ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed opacity-60'
                    : blocked
                    ? 'bg-[#fee2e2] text-[#ef4444] cursor-not-allowed opacity-60'
                    : 'bg-white text-[#0F172A] border-2 border-[#1FA3C8]/30 hover:border-[#1FA3C8] hover:shadow-md active:scale-[0.97]'
                }
              `}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <span className="font-bold text-base">{slot.startTime}</span>
              <span className="text-[10px] opacity-60">{slot.endTime}</span>
              {!available && (
                <span className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide">
                  {reserved ? 'Ocupado' : 'Bloqueado'}
                </span>
              )}
              {available && !selected && (
                <span className="text-[9px] font-semibold mt-0.5 text-[#1FA3C8] uppercase tracking-wide">
                  Libre
                </span>
              )}
            </button>
          );
        })}
      </div>

      {availableSlots.length === 0 && (
        <div className="text-center py-8 animate-fade-in">
          <div className="w-14 h-14 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[#64748B] text-sm font-medium">No hay horarios disponibles</p>
          <p className="text-[#94A3B8] text-xs mt-1">Intenta con otra fecha o cancha</p>
        </div>
      )}
    </div>
  );
}
