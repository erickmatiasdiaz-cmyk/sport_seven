'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAuth = true, requireAdmin = false }: Props) {
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push('/');
      return;
    }
  }, [loading, isAuthenticated, isAdmin, requireAuth, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1FA3C8]"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
