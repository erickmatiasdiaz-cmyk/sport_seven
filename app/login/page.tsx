'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#F7931E] to-[#FF8C2A] text-white shadow-lg">
        <div className="max-w-[420px] mx-auto px-6 py-6 pb-8 rounded-b-3xl">
          <Link href="/" className="inline-flex items-center mb-4 text-white/80 hover:text-white">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-white">Iniciar Sesión</h1>
          <p className="text-white/80 text-sm mt-1">Accede a tu cuenta Sport Seven</p>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 px-4 -mt-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {error && (
            <div className="bg-[#fee2e2] text-[#ef4444] p-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1FA3C8] focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1FA3C8] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F7931E] hover:bg-[#FDB14E] disabled:bg-[#9ca3af] text-white font-semibold py-4 rounded-xl transition-colors duration-200 active:scale-95 transform"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6B7280] text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-[#F7931E] font-medium hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="bg-[#E8F7FB] rounded-xl p-4 mt-4">
          <p className="text-sm font-medium text-[#1FA3C8] mb-2">Credenciales de prueba:</p>
          <div className="text-xs text-[#1F2937] space-y-1">
            <p><strong>Admin:</strong> admin@sportseven.cl / admin123</p>
            <p><strong>Usuario:</strong> usuario@sportseven.cl / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
