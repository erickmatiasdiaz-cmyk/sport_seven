import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import BottomNav from '@/components/bottom-nav';

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sport Seven - Reserva Premium',
  description: 'Reserva tu cancha deportiva en segundos con la mejor experiencia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${sora.variable} ${inter.variable} font-sans`}>
        <AuthProvider>
          <div className="mobile-container">
            {/* Background gradient mesh */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-brand-primary/10 to-transparent blur-3xl"></div>
              <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-brand-secondary/8 to-transparent blur-3xl"></div>
              <div className="absolute -bottom-[30%] right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-brand-accent/6 to-transparent blur-3xl"></div>
            </div>
            {children}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
