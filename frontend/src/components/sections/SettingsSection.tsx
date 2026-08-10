"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { seedStressTestData, clearAllJournalData } from '../../lib/db';
import { Settings, Shield, Moon, Sun, Database, RefreshCw, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';

export default function SettingsSection() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [staffEnabled, setStaffEnabled] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Sync state with HTML document theme
  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to wipe all local records (Sarah, Elena, test notes, etc.)? This action will reset your journal to a clean slate.')) return;
    setIsClearing(true);
    setSeedMessage('');
    try {
      await clearAllJournalData();
      setSeedMessage('All local data wiped successfully! Journal is now completely clean.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setSeedMessage('Wipe error: ' + (err.message || 'Failed to clear data'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    try {
      await seedStressTestData();
      setSeedMessage('Stress-test database populated! 40+ Clients, 60+ Sessions & Ledgers populated. Reloading dashboard stats...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSeedMessage('Seeding error: ' + (err.message || 'Failed to populate data'));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      
      <div className="border-b-2 border-[#1A1112] pb-3">
        <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic">Journal Specifications & Controls</h3>
      </div>

      {/* Stress-Test Seeder Panel */}
      <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] shadow-sm space-y-3">
        <div className="flex items-center gap-3 border-b-2 border-[#1A1112] pb-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF0F2] border border-[#1A1112]">
            <Database className="w-5 h-5 text-[#E91E63]" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">Production Stress-Testing Seeder</h4>
            <span className="text-[10px] text-gray-400 block mt-0.5 font-semibold">Populate 60 days of real historical nail sessions, client profiles, & financial ledgers.</span>
          </div>
        </div>

        {seedMessage && (
          <p className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{seedMessage}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-between items-center pt-1 border-t border-[#FADCE2] pt-3">
          <button
            onClick={handleClearData}
            disabled={isClearing || isSeeding}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-all cursor-pointer disabled:opacity-50"
          >
            {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Wipe & Clear All Data</span>
          </button>

          <button
            onClick={handleSeedData}
            disabled={isSeeding || isClearing}
            className="flex items-center gap-2 px-5 py-2 bg-[#E91E63] hover:bg-[#D81557] active:scale-95 text-white font-serif font-bold text-xs tracking-wider rounded-xl shadow-md border border-[#1A1112] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Populating Journal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Stress-Test Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Theme Settings Toggle */}
      <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF0F2] border border-[#1A1112]">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-[#E91E63]" /> : <Sun className="w-5 h-5 text-[#E91E63]" />}
          </div>
          <div>
            <h4 className="text-sm font-serif font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">Display Mode</h4>
            <span className="text-[10px] text-gray-400 block mt-0.5 font-semibold">Toggle between light cream paper and dark leather modes.</span>
          </div>
        </div>
        <button 
          onClick={toggleTheme}
          className="px-4 py-2 bg-[#1A1112] hover:bg-black text-white font-serif font-bold rounded-xl text-xs shadow-sm border border-[#1A1112] cursor-pointer"
        >
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {/* Staff Registry Config */}
      <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] space-y-4 shadow-sm">
        <div className="flex items-center gap-3 border-b-2 border-[#1A1112] pb-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF0F2] border border-[#1A1112]">
            <Shield className="w-5 h-5 text-[#E91E63]" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">Nail Tech Staff Access</h4>
            <span className="text-[10px] text-gray-400 block mt-0.5 font-semibold">Allow multiple staff access keys and custom role restrictions.</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1A1112] dark:text-[#FFF5F6]">Enable Multi-Tech Journaling</span>
          <button 
            disabled={user?.role !== 'ADMIN'}
            onClick={() => setStaffEnabled(!staffEnabled)}
            className={`px-4 py-1.5 border-2 border-[#1A1112] text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              staffEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {staffEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {user?.role !== 'ADMIN' && (
          <p className="text-[10px] text-rose-600 italic bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            * Note: Multi-staff configurations require an Administrator (Owner) key to toggle.
          </p>
        )}
      </div>

      {/* Database Connection Specs */}
      <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-5 rounded-3xl border-2 border-[#1A1112] space-y-2 shadow-sm text-xs text-gray-500">
        <h4 className="text-sm font-serif font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#E91E63]" /> Engine Specifications
        </h4>
        <p><span className="font-bold text-gray-400">Database Driver:</span> PostgreSQL 16 / Dexie IndexedDB</p>
        <p><span className="font-bold text-gray-400">Connection String:</span> postgresql://postgres:admin@localhost:5432/drklawz</p>
        <p className="text-[10px] text-gray-400 italic mt-2 border-t border-[#FADCE2] pt-2">
          Note: This journal is built offline-first. All transaction entries save directly to browser IndexedDB and sync automatically when online.
        </p>
      </div>

    </div>
  );
}
