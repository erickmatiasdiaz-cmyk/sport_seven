'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_STORAGE_KEY = 'sportseven_session';
const SESSION_EVENT_NAME = 'sportseven-auth-changed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const syncUserFromStorage = () => {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setUser(null);
      }
    };

    syncUserFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SESSION_STORAGE_KEY) {
        syncUserFromStorage();
      }
    };

    const handleAuthChanged = () => {
      syncUserFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SESSION_EVENT_NAME, handleAuthChanged);
    setLoading(false);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SESSION_EVENT_NAME, handleAuthChanged);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    setUser(data.user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
    window.dispatchEvent(new Event(SESSION_EVENT_NAME));
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al registrar');
    }

    setUser(data.user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
    window.dispatchEvent(new Event(SESSION_EVENT_NAME));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('userPhone');
    window.dispatchEvent(new Event(SESSION_EVENT_NAME));
    router.replace('/login');
    router.refresh();
  }, [router]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
