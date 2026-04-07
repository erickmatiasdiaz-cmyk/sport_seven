import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import BottomNav from '@/components/bottom-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sport Seven - Reserva Cancha',
  description: 'Sistema de reserva de canchas deportivas',
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
