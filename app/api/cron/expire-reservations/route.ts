import { NextRequest, NextResponse } from 'next/server';
import { expireStalePendingPayments } from '@/lib/reservations';

// Limpieza periódica de reservas con pago vencido. La correccion de
// disponibilidad NO depende de este cron (las lecturas filtran los holds
// vencidos y la creacion los expira por slot); este job solo mantiene el
// estado "expired" al dia para el panel admin y los reportes.
//
// Vercel Cron invoca esta ruta por GET y agrega el header
// "Authorization: Bearer <CRON_SECRET>" cuando la variable CRON_SECRET existe.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  try {
    const result = await expireStalePendingPayments();
    return NextResponse.json({ expired: result.count });
  } catch (error) {
    console.error('[cron/expire-reservations]', error);
    return NextResponse.json(
      { error: 'Error expirando reservas' },
      { status: 500 }
    );
  }
}
