'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(name, email, password, phone);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <header className="premium-top-gradient">
        <div className="relative max-w-[480px] mx-auto px-5 pt-6 pb-8">
          <Link href="/login" className="inline-flex items-center text-white/75 hover:text-white text-sm mb-5">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em]">Sport Seven</p>
          <h1 className="mt-2 text-2xl font-extrabold text-white leading-tight">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-white/75">Reserva horarios, paga online y revisa tu historial.</p>
        </div>
      </header>

      <section className="px-4 -mt-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E2E8F0]">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Nombre completo</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="input-premium"
                placeholder="Ej: Maty Diaz"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="input-premium"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Telefono</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="input-premium"
                placeholder="+56912345678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="input-premium"
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#64748B]">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="font-bold text-[#F7931E]">
              Inicia sesion
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
