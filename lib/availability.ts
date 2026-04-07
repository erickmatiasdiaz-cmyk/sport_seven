import { prisma } from './prisma';

// Generate time slots for a court based on its configuration
function generateTimeSlotsForCourt(
  openingTime: string,
  closingTime: string,
  durationMinutes: 60 | 90
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);
  
  let startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;
  const duration = durationMinutes;
  
  while (startMinutes + duration <= endMinutes) {
    const startH = Math.floor(startMinutes / 60);
    const startM = startMinutes % 60;
    const endTotal = startMinutes + duration;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    
    slots.push({
      startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
    });
    
    startMinutes += 60; // Move in 1-hour increments for better slot options
  }
  
  return slots;
}

// Get available slots for a court on a specific date with duration support
export async function getAvailableSlots(
  courtId: string,
  date: string,
  durationMinutes: 60 | 90 = 60
) {
  // Get court configuration
  const court = await prisma.court.findUnique({
    where: { id: courtId },
  });

  if (!court) {
    throw new Error('Cancha no encontrada');
  }

  // Check if this duration is allowed
  if (durationMinutes === 60 && !court.allows60) {
    throw new Error('Duración de 60 minutos no permitida para esta cancha');
  }
  if (durationMinutes === 90 && !court.allows90) {
    throw new Error('Duración de 90 minutos no permitida para esta cancha');
  }

  const allSlots = generateTimeSlotsForCourt(court.openingTime, court.closingTime, durationMinutes);

  // Get existing confirmed/pending reservations for this court and date
  const reservations = await prisma.reservation.findMany({
    where: {
      courtId,
      date,
      status: {
        in: ['confirmed', 'pending'],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Get blocked slots for this court and date
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      courtId,
      date,
    },
    select: {
      startTime: true,
      endTime: true,
      reason: true,
    },
  });

  // Filter out reserved and blocked slots using proper overlap logic
  // A slot conflicts if: newStart < existingEnd && newEnd > existingStart
  const availableSlots = allSlots.filter((slot) => {
    const hasConflict =
      reservations.some((r) => slot.startTime < r.endTime && slot.endTime > r.startTime) ||
      blockedSlots.some((b) => slot.startTime < b.endTime && slot.endTime > b.startTime);
    
    return !hasConflict;
  });

  return {
    availableSlots,
    reservedSlots: reservations,
    blockedSlots,
    court,
  };
}

// Check if a specific slot is available using proper overlap logic
export async function isSlotAvailable(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Check for overlapping reservations using: newStart < existingEnd && newEnd > existingStart
  const overlappingReservations = await prisma.reservation.findFirst({
    where: {
      courtId,
      date,
      status: {
        in: ['confirmed', 'pending'],
      },
      AND: [
        {
          startTime: {
            lt: endTime,
          },
        },
        {
          endTime: {
            gt: startTime,
          },
        },
      ],
    },
  });

  if (overlappingReservations) return false;

  // Check for overlapping blocked slots
  const overlappingBlocked = await prisma.blockedSlot.findFirst({
    where: {
      courtId,
      date,
      AND: [
        {
          startTime: {
            lt: endTime,
          },
        },
        {
          endTime: {
            gt: startTime,
          },
        },
      ],
    },
  });

  if (overlappingBlocked) return false;

  return true;
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Get next 7 days
export function getNextDays(days: number = 7): { date: string; label: string }[] {
  const result: { date: string; label: string }[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
    });
    result.push({ date: dateStr, label });
  }

  return result;
}
