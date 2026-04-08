import { NextRequest, NextResponse } from 'next/server';
import { ensureBootstrapData } from '@/lib/bootstrap';
import { getAvailableSlots } from '@/lib/availability';

export async function GET(request: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error fetching availability' },
      { status: 500 }
    );
  }
}
