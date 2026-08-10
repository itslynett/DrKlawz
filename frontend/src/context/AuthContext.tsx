"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string, role?: 'ADMIN' | 'STAFF') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load user from localStorage and fetch profile on boot
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Attempt fresh profile verification online
        if (navigator.onLine && storedToken && !storedToken.startsWith('offline-token')) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/profile`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });
            if (res.ok) {
              const freshUser = await res.json();
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          } catch (err) {
            console.warn('Could not verify profile online. Retaining local journal session.');
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (res.ok) {
            const data = await res.json();
            setToken(data.accessToken);
            setUser(data.user);
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            setLoading(false);
            router.push('/');
            return;
          }
        } catch (netErr) {
          console.warn('Network API unreachable during login. Falling back to offline journal mode.');
        }
      }

      // Offline-First Resilient Fallback: Unlock Local Journal Session
      const offlineUser: User = {
        id: `offline-${Date.now()}`,
        email: email || 'tech@drklawz.com',
        name: email ? email.split('@')[0] : 'Dr. Klawz Artist',
        role: 'ADMIN',
      };
      const offlineToken = `offline-token-${Date.now()}`;
      setToken(offlineToken);
      setUser(offlineUser);
      localStorage.setItem('token', offlineToken);
      localStorage.setItem('user', JSON.stringify(offlineUser));
      setLoading(false);
      router.push('/');
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.message || 'Unlock failed');
    }
  };

  const register = async (name: string, email: string, password?: string, role?: 'ADMIN' | 'STAFF') => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
          });

          if (res.ok) {
            const data = await res.json();
            setToken(data.accessToken);
            setUser(data.user);
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            setLoading(false);
            router.push('/');
            return;
          }
        } catch (netErr) {
          console.warn('Network API unreachable during registration. Falling back to offline journal creation.');
        }
      }

      // Offline-First Resilient Fallback: Unlock New Local Journal Session
      const offlineUser: User = {
        id: `offline-${Date.now()}`,
        email: email || 'tech@drklawz.com',
        name: name || 'Dr. Klawz Artist',
        role: role || 'ADMIN',
      };
      const offlineToken = `offline-token-${Date.now()}`;
      setToken(offlineToken);
      setUser(offlineUser);
      localStorage.setItem('token', offlineToken);
      localStorage.setItem('user', JSON.stringify(offlineUser));
      setLoading(false);
      router.push('/');
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
