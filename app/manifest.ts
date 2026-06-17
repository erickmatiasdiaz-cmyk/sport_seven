import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sport Seven - Reserva de Canchas',
    short_name: 'Sport Seven',
    description: 'Reserva canchas de futbol en el complejo Sport Seven.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#F7931E',
    icons: [
      {
        src: '/sport-seven-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
