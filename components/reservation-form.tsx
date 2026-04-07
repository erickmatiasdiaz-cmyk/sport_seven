'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ReservationFormProps {
  courtId: string;
  courtName: string;
  selectedDate: string;
  selectedSlot: TimeSlot;
  durationMinutes?: number;
  userId: string;
  userRole: string;
}

export default function ReservationForm({
  courtId,
  courtName,
  selectedDate,
  selectedSlot,
  durationMinutes = 60,
  userId,
  userRole,
}: ReservationFormProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId,
          customerName,
          customerPhone,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          durationMinutes,
          userId,
          userRole,
          status: 'confirmed',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error creating reservation');
      }

      localStorage.setItem('userPhone', customerPhone);
      router.push('/mis-reservas?success=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-[#fee2e2] text-[#ef4444] p-3 rounded-2xl text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
          Nombre completo
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E7EB] focus:ring-0 focus:border-[#1FA3C8] outline-none transition-all text-[#1F2937] placeholder-[#9CA3AF]"
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
          Teléfono
        </label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          required
          className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E7EB] focus:ring-0 focus:border-[#1FA3C8] outline-none transition-all text-[#1F2937] placeholder-[#9CA3AF]"
          placeholder="Ej: +56912345678"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !customerName || !customerPhone}
        className="w-full bg-gradient-to-r from-[#F7931E] to-[#FF9A2F] hover:from-[#E07D0A] hover:to-[#F7931E] disabled:from-[#9CA3AF] disabled:to-[#9CA3AF] text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-md disabled:shadow-none text-sm uppercase tracking-wide"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Confirmando...
          </span>
        ) : (
          'Confirmar Reserva'
        )}
      </button>

      <p className="text-center text-[11px] text-[#9CA3AF]">
        Al confirmar aceptas nuestros términos y condiciones
      </p>
    </form>
  );
}
