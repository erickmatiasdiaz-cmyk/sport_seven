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

  return (
    <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-lg">
      {/* Decorative top line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#F7931E] to-[#1FA3C8]"></div>
      
      {/* Image section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={court.image}
          alt={court.name}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover"
        />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        {/* Badge - top right */}
        <div className="absolute top-4 right-4 bg-[#F7931E] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
          Fútbol
        </div>
      </div>
      
      {/* Content section */}
      <div className="p-5">
        {/* Court name */}
        <h3 className="text-xl font-bold text-text-dark mb-1.5">{court.name}</h3>
        
        {/* Availability status */}
        <p className="text-[#22c55e] text-sm font-medium mb-4 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Cancha disponible para reserva inmediata
        </p>
        
        {/* Price and duration row */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          {/* Price */}
          <div>
            <p className="text-[#1FA3C8] font-bold text-2xl leading-tight">
              {formatPrice(displayPrice)}
              <span className="text-sm text-gray-500 font-normal">
                /{displayDuration === 90 ? '90 min' : 'hora'}
              </span>
            </p>
          </div>
          
          {/* Duration */}
          <div className="flex items-center text-text-medium text-sm font-medium">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {displayDuration} min
          </div>
        </div>
        
        {/* Reserve button - full width */}
        <button
          onClick={() => router.push(`/reservar?courtId=${court.id}`)}
          className="w-full bg-[#F7931E] hover:bg-[#E07D0A] active:bg-[#E07D0A] text-white font-bold py-4 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] transform text-base"
        >
          Reservar Ahora
        </button>
      </div>
    </div>
  );
}
