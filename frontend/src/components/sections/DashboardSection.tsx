"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Package, Gift, Award, Star, BookOpen,
  Plus, Sparkles, Wrench, Heart
} from 'lucide-react';

export default function DashboardSection({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState<any>({
    todayAppointmentsCount: 0,
    todayRevenue: 0.00,
    monthlyRevenue: 0.00,
    monthlyExpenses: 0.00,
    profit: 0.00,
    lowStockCount: 0,
    lowStockItems: [],
    equipmentMaintenanceCount: 0,
    maintenanceItems: [],
    recentClients: [],
    recentNotes: [],
    upcomingBirthdays: [],
    topClients: [],
    popularServices: []
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    async function loadStats() {
      try {
        const token = localStorage.getItem('token');
        if (navigator.onLine && token) {
          const res = await fetch(`${API_BASE_URL}/finance/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        }
      } catch (err) {
        console.warn('Could not load online dashboard statistics. Using local cached model.');
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 pb-8">
      
      {/* 1. Quick Add Panel */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] rounded-2xl shadow-sm">
        <span className="text-xs font-serif text-[#1A1112] dark:text-[#FFF5F6] italic font-bold flex items-center mr-2 gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#E91E63]" /> Quick Planner Actions:
        </span>
        <button 
          onClick={() => setActiveTab('daily-notes')} 
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81557] text-white active:scale-95 shadow-sm transition-all duration-200"
        >
          <BookOpen className="w-3.5 h-3.5" /> Log Daily Note
        </button>
        <button 
          onClick={() => setActiveTab('appointments')} 
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#1A1112] hover:bg-black text-white active:scale-95 shadow-sm transition-all duration-200"
        >
          <Calendar className="w-3.5 h-3.5" /> Book Visit
        </button>
        <button 
          onClick={() => setActiveTab('clients')} 
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-[#1A1112] border border-[#FADCE2] active:scale-95 shadow-sm transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" /> Add Client
        </button>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Appointments */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112] flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1A1112] transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Today's Visits</span>
            <span className="text-xl font-bold font-serif text-[#1A1112] dark:text-[#FFF5F6] block mt-1">{stats.todayAppointmentsCount} Scheduled</span>
          </div>
          <div className="p-3 bg-[#E91E63]/10 text-[#E91E63] rounded-2xl">
            <Heart className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112] flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1A1112] transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Today's Sales</span>
            <span className="text-xl font-bold font-serif text-green-600 block mt-1">KSh {stats.todayRevenue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Profit */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112] flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1A1112] transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Monthly Net Profit</span>
            <span className="text-xl font-bold font-serif text-green-600 block mt-1">KSh {stats.profit.toLocaleString()}</span>
            <span className="text-[9px] font-semibold text-gray-400 block mt-0.5">Rev: KSh {stats.monthlyRevenue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112] flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1A1112] transition-all duration-200">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Expenses Ledger</span>
            <span className="text-xl font-bold font-serif text-red-500 block mt-1">KSh {stats.monthlyExpenses.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-red-100 text-red-500 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Alerts & Reminders Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112]">
          <div className="flex items-center justify-between border-b-2 border-[#1A1112] pb-3 mb-3">
            <h4 className="font-serif font-bold text-sm text-[#1A1112] dark:text-[#FFF5F6] italic flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#E91E63]" /> Low Stock Warnings
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-bold uppercase">{stats.lowStockCount} items</span>
          </div>
          {stats.lowStockCount === 0 || !stats.lowStockItems || stats.lowStockItems.length === 0 ? (
            <p className="text-xs italic text-gray-400">All consumables fully stocked.</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-[#FFF0F2] rounded-xl border border-[#FADCE2]">
                  <span className="font-bold text-[11px] truncate max-w-[130px]">{item.name}</span>
                  <span className="text-red-500 font-bold text-[10px]">
                    {item.quantityRemaining} left (Min: {item.minimumStock})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Warnings */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112]">
          <div className="flex items-center justify-between border-b-2 border-[#1A1112] pb-3 mb-3">
            <h4 className="font-serif font-bold text-sm text-[#1A1112] dark:text-[#FFF5F6] italic flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#E91E63]" /> Hardware Servicing
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-[#E91E63]/10 text-[#E91E63] rounded-md font-bold uppercase">{stats.equipmentMaintenanceCount} pending</span>
          </div>
          {stats.equipmentMaintenanceCount === 0 || !stats.maintenanceItems || stats.maintenanceItems.length === 0 ? (
            <p className="text-xs italic text-gray-400">All hardware operational.</p>
          ) : (
            <div className="space-y-2">
              {stats.maintenanceItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-[#FFF0F2] rounded-xl border border-[#FADCE2]">
                  <span className="font-bold text-[11px] truncate max-w-[150px]">{item.name}</span>
                  <span className="text-[#E91E63] font-bold text-[10px]">Needs Servicing</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Birthday Reminders */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112]">
          <div className="flex items-center justify-between border-b-2 border-[#1A1112] pb-3 mb-3">
            <h4 className="font-serif font-bold text-sm text-[#1A1112] dark:text-[#FFF5F6] italic flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#E91E63]" /> Upcoming Birthdays
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-[#E91E63]/10 text-[#E91E63] rounded-md font-bold uppercase">{stats.upcomingBirthdays.length} this month</span>
          </div>
          {stats.upcomingBirthdays.length === 0 ? (
            <p className="text-xs italic text-gray-400">No birthdays this month.</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingBirthdays.map((bday: any) => (
                <div key={bday.id} className="flex justify-between items-center text-xs p-2.5 bg-[#FFF0F2] rounded-xl border border-[#FADCE2]">
                  <span className="font-bold">{bday.name}</span>
                  <span className="text-[#E91E63] font-bold">
                    {new Date(bday.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. Lists & Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Clients */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112]">
          <h4 className="font-serif font-bold text-base text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-3 mb-4 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-[#E91E63]" /> VIP Clients Ledger
          </h4>
          {!stats.topClients || stats.topClients.length === 0 ? (
            <p className="text-xs italic text-gray-400 py-4 text-center">No client spending logged yet.</p>
          ) : (
            <div className="divide-y divide-[#FADCE2] dark:divide-white/5">
              {stats.topClients.map((client: any) => (
                <div key={client.id} className="flex justify-between items-center py-3">
                  <span className="text-sm font-semibold">{client.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#E91E63] block">KSh {Number(client.lifetimeSpending).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 block font-semibold">{client.totalVisits} visits logged</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Popular Services */}
        <div className="bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] p-5 rounded-[24px] shadow-[4px_4px_0px_#1A1112]">
          <h4 className="font-serif font-bold text-base text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-3 mb-4 flex items-center gap-1.5">
            <Star className="w-5 h-5 text-[#E91E63]" /> Popular Treatment Tiers
          </h4>
          {!stats.popularServices || stats.popularServices.length === 0 ? (
            <p className="text-xs italic text-gray-400 py-4 text-center">No treatment statistics logged yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.popularServices.map((service: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{service.name}</span>
                    <span className="text-[#E91E63]">{service.count} appointments</span>
                  </div>
                  <div className="w-full bg-[#FFF0F2] dark:bg-white/5 h-2 rounded-full overflow-hidden border border-[#FADCE2]">
                    <div 
                      className="bg-[#E91E63] h-full rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(10, service.count * 10))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
