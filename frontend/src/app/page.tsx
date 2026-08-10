"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

// Import Notebook Wrapper
import NotebookFrame from '../components/notebook/NotebookFrame';

// Import Section Views
import DashboardSection from '../components/sections/DashboardSection';
import ClientsSection from '../components/sections/ClientsSection';
import AppointmentsSection from '../components/sections/AppointmentsSection';
import InventorySection from '../components/sections/InventorySection';
import EquipmentSection from '../components/sections/EquipmentSection';
import FinanceSection from '../components/sections/FinanceSection';
import SuppliersSection from '../components/sections/SuppliersSection';
import ServicesSection from '../components/sections/ServicesSection';
import DailyNotesSection from '../components/sections/DailyNotesSection';
import ReportsSection from '../components/sections/ReportsSection';
import SettingsSection from '../components/sections/SettingsSection';

export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Enforce route protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#EFECE3] dark:bg-[#0D0706]">
        {/* Skeleton notebook page-turning animation effect */}
        <div className="w-20 h-20 rounded-full border-4 border-t-gold-500 border-gold-500/10 animate-spin mb-4" />
        <span className="font-serif italic text-gold-500 text-sm tracking-wide">Opening Leather Journal...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Route redirect in progress
  }

  // Render correct panel based on selected tab index
  const renderSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardSection setActiveTab={setActiveTab} />;
      case 'clients':
        return <ClientsSection />;
      case 'appointments':
        return <AppointmentsSection />;
      case 'inventory':
        return <InventorySection />;
      case 'equipment':
        return <EquipmentSection />;
      case 'expenses':
      case 'income':
        return <FinanceSection />;
      case 'suppliers':
        return <SuppliersSection />;
      case 'services':
        return <ServicesSection />;
      case 'daily-notes':
        return <DailyNotesSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardSection setActiveTab={setActiveTab} />;
    }
  };

  return (
    <NotebookFrame activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderSection()}
    </NotebookFrame>
  );
}
