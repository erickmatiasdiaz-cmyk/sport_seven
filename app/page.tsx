'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const fallbackHeroImage =
  'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=900&h=1200&fit=crop';

function HomeContent() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const sharedOpeningTime = courts[0]?.openingTime ?? '14:00';
  const sharedClosingTime = courts[0]?.closingTime ?? '23:00';
  const heroImage = courts[0]?.image || fallbackHeroImage;
  const openHours =
    courts.length > 0
      ? Math.max(
          ...courts.map((court) => {
            const openHour = Number((court.openingTime ?? '14:00').split(':')[0]);
            const closeHour = Number((court.closingTime ?? '23:00').split(':')[0]);
            return Math.max(closeHour - openHour, 0);
          })
        )
      : 9;

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (!res.ok) return;
        setCourts(await res.json());
      } catch (error) {
        console.warn('No se pudieron cargar las canchas.', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourts();
  }, []);

  return (
    <main className="page-content home-shell min-h-screen">
      <header
        className="premium-home-hero"
        style={{ backgroundImage: `url("${heroImage}")` }}
      >
        <div className="relative header-container px-5 pt-6 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="brand-mark">
                <Image
                  src="/sport-seven-logo.png"
                  alt="Sport Seven"
                  width={52}
                  height={52}
                  priority
                />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.28em]">
                  Sport Seven
                </p>
                <p className="mt-1 text-white text-sm font-semibold">
                  Hola, {user?.name.split(' ')[0] || 'bienvenido'}
                </p>
              </div>
            </div>
            {user ? (
              <Link
                href="/reservar"
                className="bg-white/12 hover:bg-white/20 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border border-white/20"
              >
                Ver horarios
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white text-[#101828] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-black/20"
              >
                Ingresar
              </Link>
            )}
          </div>

          <div className="mb-7 max-w-[360px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7931E]"></span>
              Reserva online en segundos
            </div>
            <h1 className="text-[3.35rem] font-black leading-[0.88] tracking-normal text-white">
              Sport<br />Seven
            </h1>
            <p className="mt-4 text-[15px] font-medium leading-5 text-white/82">
              Canchas listas para jugar, horarios reales y pago online sin llamadas.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 bg-white/12 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-semibold">
                Abierto hoy {sharedOpeningTime} - {sharedClosingTime}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/reservar" className="rounded-2xl bg-[#F7931E] px-4 py-3 text-center text-sm font-extrabold text-white shadow-lg shadow-orange-950/30">
                Reservar ahora
              </Link>
              <Link href={user ? '/mis-reservas' : '/registro'} className="rounded-2xl bg-white/12 px-4 py-3 text-center text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur-md">
                {user ? 'Mis reservas' : 'Crear cuenta'}
              </Link>
            </div>
          </div>

          <div className="hero-metrics mt-6 grid grid-cols-3 overflow-hidden rounded-[1.35rem] border border-white/14 bg-white/10 backdrop-blur-xl">
            <div>
              <strong>{courts.length || 2}</strong>
              <span>Canchas</span>
            </div>
            <div>
              <strong>Online</strong>
              <span>Pago</span>
            </div>
            <div>
              <strong>{openHours}</strong>
              <span>Horas</span>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 pt-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F7931E]">
              Disponibilidad real
            </p>
            <h2 className="mt-1 text-xl font-black text-[#0F172A]">Elige tu cancha</h2>
            <p className="text-[#64748B] text-sm">Fotos, precios y horarios actualizados</p>
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
    <AuthGuard requireAuth={false}>
      <HomeContent />
    </AuthGuard>
  );
}
