import { NextRequest, NextResponse } from 'next/server';
import { ensureBootstrapData } from '@/lib/bootstrap';
import { getAvailableSlots } from '@/lib/availability';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireUser(request);
    if (response) return response;

    await ensureBootstrapData();

    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('courtId');
    const date = searchParams.get('date');
    const durationParam = searchParams.get('duration');
    const durationMinutes = durationParam ? (parseInt(durationParam) as 60 | 90) : 60;

    if (!courtId || !date) {
      return NextResponse.json(
        { error: 'courtId and date are required' },
        { status: 400 }
      );
    }

    const availability = await getAvailableSlots(courtId, date, durationMinutes);
    return NextResponse.json(availability);
  } catch (error) {
    console.error('[availability] GET', error);
    return NextResponse.json(
      { error: 'Error fetching availability' },
      { status: 500 }
    );
  }
}
