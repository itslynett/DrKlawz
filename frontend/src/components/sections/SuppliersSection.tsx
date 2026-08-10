"use client";

import React, { useState, useEffect } from 'react';
import { db, SupplierLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { Truck, Plus, Info, RefreshCw, User, Phone, Mail, Globe } from 'lucide-react';

export default function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<SupplierLocal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/inventory/suppliers`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data);
          await db.suppliers.clear();
          await db.suppliers.bulkPut(data);
          return;
        }
      }

      const local = await db.suppliers.toArray();
      setSuppliers(local);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const supId = `sup-${Date.now()}`;
    const newSup: SupplierLocal = {
      id: supId,
      name,
      contactPerson: contact,
      phone,
      email,
      notes,
    };

    try {
      await db.suppliers.add(newSup);
      await db.queueChange('CREATE', 'suppliers', supId, newSup);

      setName('');
      setContact('');
      setPhone('');
      setEmail('');
      setNotes('');
      setIsAdding(false);
      await loadSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center border-b-2 border-[#1A1112] pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Nail Supply Distributors</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-extrabold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border-2 border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Suppliers' : (
            <>
              <Plus className="w-4 h-4 text-white" /> Add Supplier
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#201715] p-6 rounded-2xl border border-[#E8E2D5] space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-bold text-[#3E2723] dark:text-gold-500 italic mb-2">Register Vendor / Supplier</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Supplier Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Beauty World" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Contact Person</label>
              <input type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Alice Kamau" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="+254712345678" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="sales@beautyworld.co.ke" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Pricing rates, delivery speeds..." />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-[#1E0F0D] font-serif font-bold rounded-xl text-xs shadow-md">Register Supplier</button>
          </div>

        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#201715] border rounded-xl">
              <Info className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 italic">No suppliers listed.</p>
            </div>
          ) : (
            suppliers.map((sup) => (
              <div 
                key={sup.id} 
                className="bg-white dark:bg-[#201715] p-5 rounded-2xl border border-[#E8E2D5] dark:border-[#332420] shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3 border-b border-gray-50 dark:border-white/5 pb-2">
                  <div className="p-2.5 bg-gold-500/5 border border-gold-500/10 rounded-xl">
                    <Truck className="w-5 h-5 text-gold-500" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#3E2723] dark:text-[#EFEBE9]">
                    {sup.name}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500">
                  {sup.contactPerson && <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> <span className="font-semibold w-16">Contact:</span> {sup.contactPerson}</p>}
                  {sup.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> <span className="font-semibold w-16">Phone:</span> {sup.phone}</p>}
                  {sup.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> <span className="font-semibold w-16">Email:</span> {sup.email}</p>}
                </div>

                {sup.notes && <p className="text-[11px] italic text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded-lg">"{sup.notes}"</p>}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
