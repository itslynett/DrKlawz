"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../hooks/useSync';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Users, Calendar, Package, Wrench, 
  TrendingDown, TrendingUp, Truck, ShieldAlert,
  Sparkles, BarChart2, Settings, LogOut, RefreshCw,
  Edit, Heart, Lock, BookOpenCheck
} from 'lucide-react';

interface NotebookFrameProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function NotebookFrame({ activeTab, setActiveTab, children }: NotebookFrameProps) {
  const { user, logout } = useAuth();
  const { isOnline, syncStatus, pendingCount, triggerSync } = useSync();
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'equipment', label: 'Equipment', icon: Wrench },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'services', label: 'Services', icon: Sparkles },
    { id: 'daily-notes', label: 'Daily Notes', icon: Edit },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const visibleTabs = tabs;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-[#FFF0F2] dark:bg-[#0D0706] transition-colors duration-300">
      
      <AnimatePresence mode="wait">
        {!isOpened ? (
          /* CLOSED LEOPARD PLANNER COVER (A4 PROPORTIONED - MINIMAL LUXURY) */
          <motion.div
            key="closed-cover"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ rotateY: -95, opacity: 0, transition: { duration: 0.6 } }}
            style={{ transformOrigin: "left center" }}
            className="relative w-full max-w-[600px] min-h-[80vh] sm:h-[90vh] leopard-cover-pattern rounded-[32px] border-4 sm:border-8 border-[#1A1112] shadow-2xl flex flex-col items-center justify-center gap-8 sm:gap-12 p-6 sm:p-12 text-center select-none"
          >
            {/* Sleek Magnetic Clasp Strap (Simple, no charms) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-28 bg-[#1A1112] rounded-l-2xl border-l border-y border-white/10 shadow-lg flex items-center justify-start pl-4">
              <div className="w-2.5 h-12 bg-white/20 rounded-full" />
            </div>

            {/* Minimal Logo Avatar */}
            <div>
              <img src="/icon.png" className="w-20 h-20 rounded-full border-4 border-[#1A1112] object-cover shadow-md mx-auto" alt="Dr. Klawz Logo" />
            </div>

            {/* Clean Luxury Planner Title Plate */}
            <div className="bg-[#FFFBFB]/95 backdrop-blur-sm border-2 border-[#1A1112] p-8 rounded-3xl shadow-xl w-full max-w-sm relative transform hover:scale-[1.01] transition-transform">
              <h1 className="font-serif text-3xl font-extrabold tracking-[0.2em] text-[#1A1112] uppercase">DR. KLAWZ</h1>
              <p className="font-cursive text-2.5xl text-[#E91E63] mt-2 font-bold">Digital Business Journal</p>
              <div className="w-16 h-0.5 bg-[#E91E63]/20 mx-auto my-4" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Premium Nail Operating System</p>
            </div>

            {/* Sleek Pink Opening Button */}
            <button
              onClick={() => setIsOpened(true)}
              className="px-10 py-4 bg-[#E91E63] hover:bg-[#D81557] active:scale-95 text-white font-serif font-bold text-xs tracking-widest rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border-2 border-[#1A1112]"
            >
              Open Journal <BookOpenCheck className="w-4 h-4" />
            </button>

            <span className="text-[9px] text-[#1A1112]/40 font-bold tracking-widest uppercase">
              EST. 2026
            </span>
          </motion.div>
        ) : (
          /* OPEN NOTEBOOK INTERIOR PAGE WORKSPACE (A4 SIZE DESIGN) */
          <motion.div
            key="open-notebook"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-[950px] h-[92vh] sm:h-[90vh] flex flex-col lg:flex-row rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[#1A1112]"
          >
            {/* 2. Left side index menu (Desktop sidebar layout) */}
            <div className="hidden lg:flex flex-col justify-between w-64 p-6 bg-[#1A1112] text-white border-r border-[#0A0405]">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <img src="/icon.png" className="w-12 h-12 rounded-full border border-white/20 object-cover shadow" alt="Dr. Klawz Logo" />
                  <div>
                    <h1 className="font-serif text-lg font-bold tracking-wide text-[#F6D6D9] italic">Dr. Klawz</h1>
                    <p className="font-cursive text-sm text-[#F6D6D9]/70">Business Journal</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-[#E91E63] text-white shadow-md' 
                            : 'hover:bg-white/5 text-white/70'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4">
                {/* Sync Wax Seal Status Widget */}
                <div 
                  onClick={triggerSync}
                  className={`cursor-pointer group flex items-center justify-between p-3 rounded-2xl border ${
                    syncStatus === 'synced' ? 'bg-[#E91E63]/10 border-[#E91E63]/20' :
                    syncStatus === 'syncing' ? 'bg-[#E91E63]/20 border-[#E91E63]/40 animate-pulse' :
                    'bg-red-950/20 border-red-500/20'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Journal Status</span>
                    <span className="text-xs font-serif text-[#F6D6D9] font-semibold italic">
                      {syncStatus === 'synced' ? 'All Synced' :
                       syncStatus === 'syncing' ? 'Syncing...' :
                       syncStatus === 'offline' ? `Offline (${pendingCount} queued)` :
                       'Sync Error'}
                    </span>
                  </div>
                  <RefreshCw className={`w-3.5 h-3.5 text-[#F6D6D9] group-hover:rotate-180 transition-all duration-500 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </div>

                {/* Logout button */}
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs hover:bg-red-500/10 text-red-400 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>

            {/* 3. Center open notebook frame layout */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#FFF0F2] dark:bg-[#1A1210] relative">
              
              {/* Header Bar with page details & Mobile Menu */}
              <header className="flex justify-between items-center px-4 sm:px-8 py-4 border-b border-[#FADCE2] dark:border-[#2D1D1A] bg-[#FFFBFB]/80 dark:bg-[#1A1213]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <img src="/icon.png" className="w-8 h-8 rounded-full lg:hidden border border-white/20 object-cover" alt="Dr. Klawz Logo" />
                  {/* Cursive handwritten-style page title */}
                  <h2 className="font-cursive text-3.5xl font-bold text-[#E91E63]">
                    {visibleTabs.find(t => t.id === activeTab)?.label || 'Journal'}
                  </h2>
                  
                  {/* Sync Status Badge */}
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} title={isOnline ? 'Online' : 'Offline Mode'} />
                </div>

                {/* Ribbon Bookmark simulation in the header */}
                <div className="absolute left-1/2 -top-1 w-6 h-36 bg-[#E91E63] rounded-b-md shadow-lg transform -translate-x-1/2 pointer-events-none hidden md:block z-20">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="flex items-center gap-2">
                  {/* Close Cover Button */}
                  <button 
                    onClick={() => setIsOpened(false)}
                    className="flex items-center gap-1 text-[10px] font-bold border border-[#E91E63]/30 text-[#E91E63] hover:bg-[#E91E63]/5 px-2.5 py-1.5 rounded-xl transition-all"
                    title="Close Cover"
                  >
                    <Lock className="w-3 h-3" /> Close Cover
                  </button>

                  <span className="hidden sm:inline text-[10px] font-bold bg-[#E91E63]/10 border border-[#E91E63]/20 text-[#E91E63] px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
                    {user?.role}
                  </span>
                  
                  {/* Mobile Logout */}
                  <button 
                    onClick={logout}
                    className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-black/5"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* 4. Ruled Notebook Paper Page area */}
              <div className="flex-1 flex flex-col justify-between min-h-0 bg-[#FFFBFB] dark:bg-[#1C1113]">
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 notebook-interior-pattern text-[#1A1112] dark:text-[#FFF5F6] relative shadow-inner">
                  
                  {/* Lined paper margin line on the left side of the writing area */}
                  <div className="absolute left-6 sm:left-10 top-0 bottom-0 border-l border-[#F4B8B8]/30 pointer-events-none" />
                  
                  {/* Content wrapper */}
                  <div className="pl-6 sm:pl-10 min-h-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        {children}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </main>

                {/* Motivational Signature Page Footer (Fixed below page content) */}
                <div className="text-center py-3 bg-[#FFFBFB] dark:bg-[#1C1113] border-t border-[#FADCE2] dark:border-[#2E1E21] select-none z-10">
                  <span className="font-cursive text-xl text-[#C28C9F] italic font-bold">"I got this."</span>
                </div>
              </div>

              {/* Mobile Horizontally Scrollable Tab Navigation */}
              <nav className="lg:hidden flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#FADCE2] dark:border-[#2D1D1A] bg-[#FFFBFB] dark:bg-[#1A1213] px-2 py-2 z-10">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center flex-shrink-0 px-3 py-1.5 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[#E91E63] text-white font-bold shadow-sm' 
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Help Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showWhatsAppMenu && (
          <div className="bg-[#FFFBFB] dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21] rounded-2xl p-4 shadow-xl w-64 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <h4 className="font-serif font-bold text-xs text-[#E91E63] italic border-b pb-1.5 flex items-center gap-1.5">
              Dr. Klawz Support
            </h4>
            <div className="flex flex-col gap-1 text-[11px]">
              <a 
                href="https://wa.me/254703809833?text=Hello%20Dr.%20Klawz,%20I'd%20like%20to%20get%20in%20touch." 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 hover:bg-[#E91E63]/10 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Contact Dr. Klawz</span>
                <span className="text-[#E91E63] font-bold">→</span>
              </a>
              <a 
                href="https://wa.me/254703809833?text=Hello%20Dr.%20Klawz,%20I%20need%20assistance%20with%20my%20session." 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 hover:bg-[#E91E63]/10 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Need Help?</span>
                <span className="text-[#E91E63] font-bold">→</span>
              </a>
              <a 
                href="https://wa.me/254703809833?text=Hello%20Dr.%20Klawz,%20I%20have%20a%20question%20about%20your%20services." 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 hover:bg-[#E91E63]/10 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Ask a Question</span>
                <span className="text-[#E91E63] font-bold">→</span>
              </a>
              <a 
                href="https://wa.me/254703809833?text=Hello%20Dr.%20Klawz,%20I'd%20like%20to%20reschedule%20my%20booking." 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 hover:bg-[#E91E63]/10 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Reschedule Appointment</span>
                <span className="text-[#E91E63] font-bold">→</span>
              </a>
              <a 
                href="https://wa.me/254703809833?text=Hello%20Dr.%20Klawz,%20I'm%20reaching%20out%20to%20customer%20support." 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 hover:bg-[#E91E63]/10 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Customer Support</span>
                <span className="text-[#E91E63] font-bold">→</span>
              </a>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowWhatsAppMenu(!showWhatsAppMenu)}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105"
          title="WhatsApp Support"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.785 1.453 5.424 0 9.835-4.405 9.838-9.817.001-2.622-1.02-5.086-2.87-6.938C16.495 1.98 14.043.96 11.433.96c-5.424 0-9.83 4.407-9.833 9.824-.001 1.76.47 3.486 1.365 5.013l-.97 3.546 3.637-.954zm10.902-6.53c-.27-.135-1.597-.788-1.846-.878-.25-.09-.432-.135-.612.135-.18.27-.7 1.135-.858 1.32-.16.18-.315.2-.585.065-1.096-.547-1.828-.973-2.556-2.22-.19-.327.19-.304.545-1.01.06-.125.03-.233-.015-.324-.045-.09-.432-1.04-.593-1.428-.156-.377-.328-.327-.45-.333-.113-.005-.244-.006-.375-.006-.13 0-.342.049-.52.244-.18.195-.685.67-6.85.67-.685 1.37-1.493 2.685-1.637 2.88-.144.195-.285.26-.55.125-.267-.136-1.127-.514-2.146-1.423-.79-.704-1.323-1.573-1.478-1.84-.155-.267-.016-.412.118-.546.12-.12.27-.315.405-.473.134-.16.18-.27.27-.45.09-.18.046-.34-.02-.474-.067-.135-.612-1.477-.838-2.023-.22-.53-.44-.457-.61-.466-.16-.008-.344-.01-.52-.01z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
