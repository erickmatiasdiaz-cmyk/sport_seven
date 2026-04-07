'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CourtCard from '@/components/court-card';
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

export default function Home() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCourts = courts;
  const sharedOpeningTime = activeCourts[0]?.openingTime ?? '18:00';
  const sharedClosingTime = activeCourts[0]?.closingTime ?? '23:00';

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (!res.ok) throw new Error('Error fetching courts');
        const data = await res.json();
        setCourts(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, []);

  return (
    <main className="page-content bg-gradient-to-b from-[#F6F8FA] to-white min-h-screen">
      {/* Hero Header Premium */}
      <header className="bg-gradient-to-b from-[#F7931E] to-[#FF9A2F] shadow-lg rounded-b-[32px]">
        <div className="header-container px-6 pt-8 pb-10">
          {/* Top section with greeting and icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              {user ? (
                <p className="text-white/90 text-sm font-medium mb-1">
                  Hola, {user.name.split(' ')[0]} 👋
                </p>
              ) : (
                <p className="text-white/90 text-sm font-medium mb-1">
                  Bienvenido a Sport Seven 👋
                </p>
              )}
              
              {/* Main title */}
              <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                Sport Seven
              </h1>
              
              {/* Subtitle */}
              <p className="text-white/85 text-base font-medium">
                Reserva tu cancha de fútbol en segundos
              </p>
            </div>
            
            {/* Icon with elegant background */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {!user && (
                <Link href="/login" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-white/30">
                  Ingresar
                </Link>
              )}
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Schedule badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/30">
            <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-semibold">
              Abierto hoy {sharedOpeningTime} - {sharedClosingTime}
            </span>
          </div>
        </div>
      </header>

      {/* Info cards block */}
      <section className="px-4 -mt-6 mb-6">
        <div className="bg-white rounded-3xl shadow-md p-5 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            {/* Canchas */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#E8F7FB] p-2.5 rounded-2xl mb-2">
                <svg className="w-5 h-5 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v1h14V4a1 1 0 00-1-1H4zm14 3v1a1 1 0 01-1 1H5a1 1 0 01-1-1V6h14zM4 12v4h12v-4H4z" />
                </svg>
              </div>
              <p className="text-text-dark font-bold text-lg leading-tight">{courts.length}</p>
              <p className="text-text-light text-xs font-medium">Canchas</p>
            </div>
            
            {/* Reserva rápida */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#FFF3C4] p-2.5 rounded-2xl mb-2">
                <svg className="w-5 h-5 text-[#F7931E]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-text-dark font-bold text-sm leading-tight">Rápida</p>
              <p className="text-text-light text-xs font-medium">Reserva</p>
            </div>
            
            {/* Horarios */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#E8F7FB] p-2.5 rounded-2xl mb-2">
                <svg className="w-5 h-5 text-[#1FA3C8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-text-dark font-bold text-sm leading-tight">
                {courts.length > 0
                  ? Math.max(
                      ...courts.map((court) => {
                        const openHour = Number((court.openingTime ?? '18:00').split(':')[0]);
                        const closeHour = Number((court.closingTime ?? '23:00').split(':')[0]);
                        return Math.max(closeHour - openHour, 0);
                      })
                    )
                  : 0}
              </p>
              <p className="text-text-light text-xs font-medium">Horarios</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courts List */}
      <section className="px-4 mt-8">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-dark mb-1.5">
            Canchas disponibles
          </h2>
          <p className="text-text-light text-sm">
            Selecciona una cancha y revisa sus horarios
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7931E]"></div>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {courts.map((court) => <CourtCard key={court.id} court={court} />)}
          </div>
        )}
      </section>
    </main>
  );
}
