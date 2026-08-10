"use client";

import React, { useState, useEffect } from 'react';
import { db, EquipmentLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { Wrench, ShieldAlert, Plus, ShieldCheck, HeartCrack, Info, RefreshCw } from 'lucide-react';

export default function EquipmentSection() {
  const [equipment, setEquipment] = useState<EquipmentLocal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState(4500);
  const [condition, setCondition] = useState('Excellent');
  const [schedule, setSchedule] = useState('Clean filters monthly');
  const [notes, setNotes] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/equipment`, { headers });
        if (res.ok) {
          const data = await res.json();
          setEquipment(data);
          await db.equipment.clear();
          await db.equipment.bulkPut(data);
          return;
        }
      }

      const local = await db.equipment.toArray();
      setEquipment(local);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const eqId = `eq-${Date.now()}`;
    const newEq: EquipmentLocal = {
      id: eqId,
      name,
      purchaseCost: Number(cost),
      condition,
      maintenanceSchedule: schedule,
      status: 'OPERATIONAL',
      notes,
    };

    try {
      await db.equipment.add(newEq);
      await db.queueChange('CREATE', 'equipment', eqId, newEq);
      
      setName('');
      setCost(4500);
      setCondition('Excellent');
      setSchedule('Clean filters monthly');
      setNotes('');
      setIsAdding(false);
      await loadEquipment();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center border-b-2 border-[#1A1112] pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Hardware & Studio Assets</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-extrabold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border-2 border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Assets' : (
            <>
              <Plus className="w-4 h-4 text-white" /> Add Asset
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleCreate} className="bg-white dark:bg-[#201715] p-6 rounded-2xl border border-[#E8E2D5] space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-bold text-[#3E2723] dark:text-gold-500 italic mb-2">Register Hardware Asset</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Asset Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Professional UV LED Nail Lamp 48W" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Purchase Cost (KSh)</label>
              <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Current Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none">
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Poor - Needs Repair">Poor - Needs Repair</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Maintenance Schedule</label>
              <input type="text" value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="e.g. Clean filters monthly" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Asset Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Warranty details, model details..." />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-[#1E0F0D] font-serif font-bold rounded-xl text-xs shadow-md">Register Asset</button>
          </div>

        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {equipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#201715] border rounded-xl">
              <Info className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 italic">No equipment logged.</p>
            </div>
          ) : (
            equipment.map((eq) => {
              const isWarning = eq.status === 'MAINTENANCE_REQUIRED' || eq.status === 'IN_REPAIR';
              return (
                <div 
                  key={eq.id} 
                  className="bg-white dark:bg-[#201715] p-4 rounded-2xl border border-[#E8E2D5] dark:border-[#332420] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex gap-3">
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#3E2723] dark:text-[#EFEBE9]">
                        {eq.name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                        <span>Condition: {eq.condition}</span>
                        {eq.maintenanceSchedule && <span>Schedule: {eq.maintenanceSchedule}</span>}
                      </div>

                      {eq.notes && <p className="text-[11px] italic text-gray-400 mt-2">"{eq.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="sm:text-right">
                      <span className="text-xs text-gray-400 block">Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isWarning ? 'bg-amber-500/10 text-amber-600 animate-pulse' : 'bg-green-500/10 text-green-600'
                      }`}>
                        {eq.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
