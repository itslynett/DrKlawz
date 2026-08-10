"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(false);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Technician entry key created successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFF0F2] dark:bg-[#0D0706] transition-colors duration-300 font-sans">
      
      {/* Closed Leopard Notebook Wrapper */}
      <div className="w-full max-w-md p-8 sm:p-12 leopard-cover-pattern rounded-[32px] relative border-8 border-[#1A1112] shadow-2xl flex flex-col items-center select-none">
        
        {/* Matte Black Buckle Strap */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-20 bg-[#1A1112] rounded-l-md border-y border-l border-white/10 shadow-md flex items-center justify-center">
          <div className="w-1.5 h-8 bg-white/20 rounded-full" />
        </div>

        {/* Logo Image */}
        <div className="mb-6">
          <img src="/icon.png" className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg" alt="Dr. Klawz Logo" />
        </div>

        {/* Journal Cover Titles */}
        <div className="text-center mb-8 bg-[#FFFBFB] border-4 border-[#1A1112] p-5 rounded-2xl shadow-md w-full relative">
          {/* Rivets */}
          <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-rose-gold-500 border border-[#1A1112]" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-gold-500 border border-[#1A1112]" />
          <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-rose-gold-500 border border-[#1A1112]" />
          <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-gold-500 border border-[#1A1112]" />
          
          <h1 className="font-serif text-2xl font-bold tracking-widest text-[#1A1112] uppercase leading-none">
            Dr. Klawz
          </h1>
          <p className="font-cursive text-xl text-[#E91E63] mt-1.5 font-bold">Digital Business Journal</p>
        </div>

        {/* Register Form Box styled like an inserted note */}
        <form onSubmit={handleRegister} className="w-full space-y-5 bg-[#FFFBFB] p-6 rounded-2xl shadow-inner border-2 border-[#1A1112] relative text-left">
          
          {/* Lined paper margin indicator */}
          <div className="absolute left-4 top-0 bottom-0 border-l border-[#FADCE2] pointer-events-none" />

          <div className="pl-4 space-y-4">
            <h2 className="font-serif text-base font-bold text-[#1A1112] italic">
              Register Planner Lock
            </h2>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                {success}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] bg-[#FFFBFB] text-[#1A1112] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Email Address</label>
              <input
                type="email"
                required
                placeholder="jane@drklawz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] bg-[#FFFBFB] text-[#1A1112] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] bg-[#FFFBFB] text-[#1A1112] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#E91E63] hover:bg-[#D81557] active:scale-95 text-white font-serif font-bold text-xs tracking-widest shadow transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Entry...' : 'Create Entry Key'}
            </button>
            
            <p className="text-center text-[10px] text-gray-400 mt-4 font-semibold">
              Already registered?{' '}
              <Link href="/login" className="text-[#E91E63] hover:underline">
                Unlock Journal
              </Link>
            </p>
          </div>
        </form>

        <span className="text-[9px] text-[#1A1112]/40 uppercase tracking-widest mt-8 font-bold pointer-events-none">
          EST. 2026
        </span>
      </div>

    </div>
  );
}
