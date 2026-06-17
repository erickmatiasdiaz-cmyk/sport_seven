import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import BottomNav from '@/components/bottom-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sport-seven-flame.vercel.app'),
  title: 'Sport Seven - Reserva Cancha',
  description: 'Sistema de reserva de canchas deportivas',
  icons: {
    icon: '/sport-seven-icon.png',
    apple: '/sport-seven-icon.png',
  },
  openGraph: {
    title: 'Sport Seven - Reserva tu cancha',
    description: 'Reserva canchas de futbol online, con horarios reales y pago sin llamadas.',
    type: 'website',
    locale: 'es_CL',
    siteName: 'Sport Seven',
    images: [
      {
        url: '/sport-seven-logo.png',
        width: 512,
        height: 512,
        alt: 'Sport Seven',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="mobile-container">
            {children}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
