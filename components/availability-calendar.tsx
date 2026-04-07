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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1FA3C8]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-[#ef4444] text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-[#1FA3C8]"></div>
          <span className="text-[11px] text-[#6B7280]">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1FA3C8]"></div>
          <span className="text-[11px] text-[#6B7280]">Seleccionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F3F4F6]"></div>
          <span className="text-[11px] text-[#6B7280]">Ocupado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#fee2e2]"></div>
          <span className="text-[11px] text-[#6B7280]">Bloqueado</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] text-[#6B7280] font-medium">{durationMinutes} min</span>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {allSlots.map((slot) => {
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
                relative py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-0.5
                ${
                  selected
                    ? 'bg-[#1FA3C8] text-white shadow-lg shadow-[#1FA3C8]/30 scale-[1.03]'
                    : reserved
                    ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed opacity-70'
                    : blocked
                    ? 'bg-[#fee2e2] text-[#ef4444] cursor-not-allowed opacity-70'
                    : 'bg-white text-[#1F2937] border-2 border-[#1FA3C8] hover:shadow-md active:scale-[0.98]'
                }
              `}
            >
              <span className="font-semibold">{slot.startTime}</span>
              <span className="text-[10px] opacity-70">{slot.endTime}</span>
              {!available && (
                <span className="text-[9px] font-medium mt-0.5">
                  {reserved ? 'Ocupado' : 'Bloqueado'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {availableSlots.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-[#9CA3AF] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#6B7280] text-sm">No hay horarios disponibles</p>
        </div>
      )}
    </div>
  );
}
