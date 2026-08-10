"use client";

import React, { useState, useEffect } from 'react';
import { db, ServiceLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { Sparkles, Plus, Info, RefreshCw, Clock } from 'lucide-react';

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceLocal[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(1500);
  const [duration, setDuration] = useState(45);
  const [materials, setMaterials] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/appointments/services`, { headers });
        if (res.ok) {
          const data = await res.json();
          setServices(data);
          await db.services.clear();
          await db.services.bulkPut(data);
          return;
        }
      }

      const local = await db.services.toArray();
      setServices(local);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const serId = `ser-${Date.now()}`;
    const newSer: ServiceLocal = {
      id: serId,
      name,
      price: Number(price),
      durationMinutes: Number(duration),
      materialsUsed: materials,
      estimatedProfit: Number(price) * 0.8, // Default 80% margins
    };

    try {
      await db.services.add(newSer);
      await db.queueChange('CREATE', 'services', serId, newSer);

      setName('');
      setPrice(1500);
      setDuration(45);
      setMaterials('');
      setIsAdding(false);
      await loadServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center border-b-2 border-[#1A1112] pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Nail Art & Treatment Catalogue</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-bold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Treatments' : (
            <>
              <Plus className="w-4 h-4 text-white" /> Add Treatment
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-[#FFFBFB] dark:bg-[#1C1113] p-6 rounded-3xl border-2 border-[#1A1112] shadow-sm space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-2">Register Nail Treatment Service</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nail Service Name *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="French Tips Gel-X" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Treatment Price (KSh) *</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration (Minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Materials / Polish Used</label>
              <input type="text" value={materials} onChange={e => setMaterials(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="Gel-X tips, Dehydrator, Chrome" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#FADCE2] pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border-2 border-[#1A1112] rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-[#E91E63] hover:bg-[#D81557] text-white font-serif font-bold rounded-xl text-xs shadow-md border border-[#1A1112] cursor-pointer">Save Service</button>
          </div>

        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112]">
              <Info className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-serif italic text-sm text-gray-400">No nail treatments registered in catalogue.</p>
            </div>
          ) : (
            services.map((s) => (
              <div 
                key={s.id} 
                className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">{s.name}</h4>
                    <span className="font-serif text-base font-extrabold text-[#E91E63]">KSh {Number(s.price).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-3">
                    <Clock className="w-3.5 h-3.5 text-[#E91E63]" />
                    <span>{s.durationMinutes} minutes</span>
                  </div>

                  {s.materialsUsed && (
                    <p className="text-xs text-gray-400 italic bg-[#FFF0F2] dark:bg-white/5 p-2.5 rounded-xl border border-[#FADCE2] dark:border-white/10">
                      Materials: {s.materialsUsed}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#FADCE2] flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Est. Margin: 80%</span>
                  <span className="text-emerald-600">Est. Profit: KSh {(Number(s.price) * 0.8).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
