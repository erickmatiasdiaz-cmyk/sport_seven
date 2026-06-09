'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Compact Header */}
      <header className="premium-top-gradient">
        <div className="relative max-w-[480px] mx-auto w-full px-5 py-6">
          <Link href="/" className="inline-flex items-center mb-4 text-white/80 hover:text-white text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="brand-mark brand-mark-sm">
              <Image
                src="/sport-seven-logo.png"
                alt="Sport Seven"
                width={48}
                height={48}
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Iniciar Sesión</h1>
              <p className="text-white/80 text-sm font-medium">Accede a tu cuenta</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Card */}
      <div className="flex-1 px-4 -mt-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E2E8F0] animate-slide-down">
          <div className="mb-5 rounded-2xl bg-[#F8FAFC] p-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Acceso Sport Seven</p>
            <p className="mt-1 text-sm text-[#475569]">Entra o crea una cuenta para reservar horarios.</p>
          </div>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-sm mb-5 flex items-start gap-3 animate-fade-in">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </div>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-premium"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Contraseña
                </div>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-premium"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Ingresando...
                </span>
              ) : (
                <>
                  Iniciar Sesión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
            <p className="text-[#64748B] text-sm">
              No tienes cuenta?{' '}
              <Link href="/registro" className="font-bold text-[#F7931E]">
                Crear usuario
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
