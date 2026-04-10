'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Court {
  id: string;
  name: string;
  image: string;
  price60: number;
  price90: number;
  allows60: boolean;
  allows90: boolean;
}

export default function CourtCard({ court }: { court: Court }) {
  const router = useRouter();

  const displayDuration = !court.allows60 && court.allows90 ? 90 : 60;
  const displayPrice = displayDuration === 90 ? court.price90 : court.price60;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDurationLabel = () => {
    if (court.allows60 && court.allows90) return '60 o 90 min';
    if (court.allows90) return '90 min';
    return '60 min';
  };

  return (
    <div
      className="court-card group cursor-pointer"
      onClick={() => router.push(`/reservar?courtId=${court.id}`)}
    >
      {/* Image Section with Overlay */}
      <div className="image-wrapper relative h-52">
        <Image
          src={court.image}
          alt={court.name}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
          priority
        />

        {/* Floating badge top-right */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[#0F172A] px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Disponible
          </span>
        </div>

        {/* Type badge bottom-left over image */}
        <div className="absolute bottom-3.5 left-3.5 z-10">
          <span className="inline-flex items-center bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
            </svg>
            {getDurationLabel()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Court name */}
        <h3 className="text-xl font-bold text-[#0F172A] mb-1 group-hover:text-[#F7931E] transition-colors duration-200">
          {court.name}
        </h3>

        {/* Subtitle */}
        <p className="text-[#64748B] text-sm mb-4">
          Cancha de fútbol profesional · Iluminación LED
        </p>

        {/* Price row */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[#64748B] text-xs font-medium mb-0.5">Desde</p>
            <p className="text-[#F7931E] font-extrabold text-2xl leading-tight">
              {formatPrice(displayPrice)}
              <span className="text-sm text-[#94A3B8] font-normal">
                /{displayDuration === 90 ? '90 min' : 'hora'}
              </span>
            </p>
          </div>

          {/* Features chips */}
          <div className="flex gap-1.5">
            {court.allows60 && (
              <span className="bg-[#E8F7FB] text-[#1FA3C8] text-[10px] font-semibold px-2 py-1 rounded-full">
                60 min
              </span>
            )}
            {court.allows90 && (
              <span className="bg-[#FFF3C4] text-[#B45309] text-[10px] font-semibold px-2 py-1 rounded-full">
                90 min
              </span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/reservar?courtId=${court.id}`);
          }}
          className="btn-primary w-full text-sm flex items-center justify-center gap-2"
        >
          Ver horarios
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
