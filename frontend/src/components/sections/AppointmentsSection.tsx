"use client";

import React, { useState, useEffect } from 'react';
import { db, AppointmentLocal, ClientLocal, ServiceLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { 
  Calendar as CalIcon, Clock, User, Sparkles, Check, 
  X, AlertCircle, Plus, Info, RefreshCw, RotateCcw, CheckCircle2, XCircle
} from 'lucide-react';

export default function AppointmentsSection() {
  const [appointments, setAppointments] = useState<AppointmentLocal[]>([]);
  const [clients, setClients] = useState<ClientLocal[]>([]);
  const [services, setServices] = useState<ServiceLocal[]>([]);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [deposit, setDeposit] = useState(0);
  const [notes, setNotes] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let syncSuccess = false;
    try {
       const token = localStorage.getItem('token');
       const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
 
       if (navigator.onLine && token) {
         // Appointments
         const appRes = await fetch(`${API_BASE_URL}/appointments`, { headers });
         if (appRes.ok) {
           const apps = await appRes.json();
           setAppointments(apps);
           await db.appointments.bulkPut(apps);
         }
         // Clients
         const cliRes = await fetch(`${API_BASE_URL}/clients`, { headers });
         if (cliRes.ok) {
           const clis = await cliRes.json();
           setClients(clis);
         }
         // Services
         const serRes = await fetch(`${API_BASE_URL}/appointments/services`, { headers });
         if (serRes.ok) {
           const sers = await serRes.json();
           setServices(sers);
         }
         syncSuccess = true;
       }
    } catch (err: any) {
      console.warn('Network sync failed in planner, using offline local state:', err.message);
    }

    if (!syncSuccess) {
      try {
        // Offline fallback
        const localApps = await db.appointments.toArray();
        setAppointments(localApps);
        const localClis = await db.clients.toArray();
        setClients(localClis);
        const localSers = await db.services.toArray();
        setServices(localSers);
      } catch (localErr) {
        console.error('Failed to load local appointments data:', localErr);
      }
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedServiceId || !date || !time) return;

    const client = clients.find(c => c.id === selectedClientId);
    const service = services.find(s => s.id === selectedServiceId);
    if (!client || !service) return;

    const appId = `app-${Date.now()}`;
    const dateTimeStr = new Date(`${date}T${time}`).toISOString();

    const newApp: AppointmentLocal = {
      id: appId,
      clientId: selectedClientId,
      clientName: client.name,
      staffId: 'staff-1',
      dateTime: dateTimeStr,
      durationMinutes: Number(duration),
      status: 'CONFIRMED',
      depositPaid: Number(deposit),
      remainingBalance: Math.max(0, Number(service.price) - Number(deposit)),
      notes,
      services: [service],
    };

    try {
      // Add locally
      await db.appointments.add(newApp);

      // Call API if online
      const token = localStorage.getItem('token');
      if (navigator.onLine && token) {
        await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientId: selectedClientId,
            serviceIds: [selectedServiceId],
            dateTime: dateTimeStr,
            durationMinutes: Number(duration),
            depositPaid: Number(deposit),
            notes,
          }),
        }).catch(err => console.warn('Online appointment creation failed, saved locally:', err));
      } else {
        await db.queueChange('CREATE', 'appointments', appId, newApp);
      }

      setIsAdding(false);
      setSelectedClientId('');
      setSelectedServiceId('');
      setDate('');
      setTime('');
      setDeposit(0);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to create appointment:', err);
    }
  };

  const handleStatusChange = async (appId: string, status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      // 1. Optimistically update local React state
      setAppointments(prev =>
        prev.map(a => (a.id === appId ? { ...a, status } : a))
      );

      // 2. Update local Dexie IndexedDB database
      const app = appointments.find(a => a.id === appId);
      if (app) {
        const updatedApp = { ...app, status };
        await db.appointments.put(updatedApp);

        // 3. Send HTTP update to backend API if online
        const token = localStorage.getItem('token');
        if (navigator.onLine && token) {
          await fetch(`${API_BASE_URL}/appointments/${appId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          }).catch(async (netErr) => {
            console.warn('Backend update failed, queuing offline change:', netErr);
            await db.queueChange('UPDATE', 'appointments', appId, updatedApp);
          });
        } else {
          await db.queueChange('UPDATE', 'appointments', appId, updatedApp);
        }
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header bar */}
      <div className="flex justify-between items-center border-b-2 border-[#1A1112] pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Appointment Planner</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-bold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Appointments' : (
            <>
              <Plus className="w-4 h-4 text-white" /> Book Appointment
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        /* Booking form */
        <form onSubmit={handleBook} className="bg-[#FFFBFB] dark:bg-[#1C1113] p-6 rounded-3xl border-2 border-[#1A1112] shadow-sm space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-2">Book Nail Session</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Client *</label>
              <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30">
                <option value="">-- Choose Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Service *</label>
              <select required value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30">
                <option value="">-- Choose Service --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - KSh {Number(s.price).toLocaleString()}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time *</label>
              <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration (Minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deposit Paid (KSh)</label>
              <input type="number" value={deposit} onChange={e => setDeposit(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Appointment Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="Special requirements..." />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#FADCE2] pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border-2 border-[#1A1112] rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-[#E91E63] hover:bg-[#D81557] text-white font-serif font-bold rounded-xl text-xs shadow-md border border-[#1A1112] cursor-pointer">Book Visit</button>
          </div>

        </form>
      ) : (
        /* Appointment list */
        <div className="grid grid-cols-1 gap-4">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112]">
              <Info className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-serif italic text-sm text-gray-400">No appointments scheduled.</p>
            </div>
          ) : (
            appointments.map((app) => (
              <div 
                key={app.id} 
                className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex gap-4">
                  <div className="p-3.5 bg-[#FFF0F2] border-2 border-[#1A1112] rounded-2xl flex flex-col items-center justify-center min-w-16 shadow-xs">
                    <span className="text-[10px] text-[#E91E63] font-extrabold uppercase block">
                      {new Date(app.dateTime).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-2xl font-serif font-bold text-[#1A1112] block mt-0.5">
                      {new Date(app.dateTime).getDate()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">
                        {app.clientName || 'Walk-in Customer'}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' :
                        app.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#E91E63]" /> {new Date(app.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({app.durationMinutes} min)</span>
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#E91E63]" /> {app.services?.map(s => s.name).join(', ') || 'Nail Treatment'}</span>
                    </div>

                    {app.notes && <p className="text-xs italic text-gray-500 mt-2">"{app.notes}"</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full sm:w-auto border-t-2 sm:border-t-0 border-[#1A1112]/10 pt-3 sm:pt-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#E91E63] block">KSh {app.services?.reduce((sum, s) => sum + Number(s.price), 0).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 block font-bold">Deposit: KSh {app.depositPaid} | Due: KSh {app.remainingBalance}</span>
                  </div>

                  {/* High-Contrast Interactive Action Buttons for ALL Statuses */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {app.status === 'COMPLETED' ? (
                      <>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1A1112] hover:bg-black text-[#FFF0F2] border border-[#E91E63]/40 text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#E91E63]" /> Mark Incomplete / Reopen
                        </button>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'CANCELLED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    ) : app.status === 'CANCELLED' ? (
                      <>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#E91E63] hover:bg-[#D81557] text-white text-xs font-bold rounded-xl shadow-sm border border-[#1A1112] cursor-pointer active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reopen Appointment
                        </button>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'CANCELLED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
