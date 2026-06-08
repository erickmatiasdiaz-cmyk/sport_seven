'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CourtCard from '@/components/court-card';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/contexts/AuthContext';

interface Court {
  id: string;
  name: string;
  image: string;
  price60: number;
  price90: number;
  allows60: boolean;
  allows90: boolean;
  openingTime?: string;
  closingTime?: string;
}

function HomeContent() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const sharedOpeningTime = courts[0]?.openingTime ?? '18:00';
  const sharedClosingTime = courts[0]?.closingTime ?? '23:00';

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (!res.ok) throw new Error('Error fetching courts');
        setCourts(await res.json());
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourts();
  }, []);

  return (
    <main className="page-content bg-[#F8FAFC] min-h-screen">
      <header className="premium-top-gradient">
        <div className="relative header-container px-5 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/90 text-sm font-medium">
              Hola, {user?.name.split(' ')[0] || 'bienvenido'}
            </p>
            <Link
              href="/reservar"
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border border-white/25"
            >
              Ver horarios
            </Link>
          </div>

          <div className="mb-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em]">Sport Seven</p>
            <h1 className="mt-2 text-2xl font-extrabold text-white leading-tight">
              Reserva tu cancha<br />en segundos
            </h1>
            <p className="text-white/80 text-sm mt-1 font-medium">
              Horarios en tiempo real, pagos online y gestion de reservas.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3.5 py-2 rounded-full border border-white/25">
            <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-semibold">
              Abierto hoy {sharedOpeningTime} - {sharedClosingTime}
            </span>
          </div>
        </div>
      </header>

      <section className="px-4 -mt-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card animate-fade-in-up">
            <div className="metric-icon bg-gradient-to-br from-[#E8F7FB] to-[#D4F0F8]">
              <svg className="w-6 h-6 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="metric-value">{courts.length}</div>
            <div className="metric-label">Canchas</div>
          </div>

          <div className="metric-card animate-fade-in-up">
            <div className="metric-icon bg-gradient-to-br from-[#FFF3C4] to-[#FDE68A]">
              <svg className="w-6 h-6 text-[#F7931E]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 1.45-.39 2.81-1.06 3.98l1.46 1.46C21.41 15.89 22 14.02 22 12c0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V3.03c-4.06.5-7.18 3.91-7.18 8.03 0 4.51 3.66 8.17 8.18 8.17 1.85 0 3.55-.62 4.92-1.66l-1.46-1.46A4.952 4.952 0 0112 19z" />
              </svg>
            </div>
            <div className="metric-value text-[#F7931E]">Online</div>
            <div className="metric-label">Pago</div>
          </div>

          <div className="metric-card animate-fade-in-up">
            <div className="metric-icon bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0]">
              <svg className="w-6 h-6 text-[#22C55E]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
            </div>
            <div className="metric-value">
              {courts.length > 0
                ? Math.max(
                    ...courts.map((court) => {
                      const openHour = Number((court.openingTime ?? '18:00').split(':')[0]);
                      const closeHour = Number((court.closingTime ?? '23:00').split(':')[0]);
                      return Math.max(closeHour - openHour, 0);
                    })
                  )
                : 0}
            </div>
            <div className="metric-label">Horas</div>
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">Canchas disponibles</h2>
            <p className="text-[#64748B] text-sm">Selecciona una cancha y revisa sus horarios</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((item) => (
              <div key={item} className="card-premium overflow-hidden">
                <div className="skeleton skeleton-image rounded-none h-52"></div>
                <div className="p-5">
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {courts.map((court) => (
              <div key={court.id} className="animate-fade-in-up">
                <CourtCard court={court} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <AuthGuard requireAuth={true}>
      <HomeContent />
    </AuthGuard>
  );
}
