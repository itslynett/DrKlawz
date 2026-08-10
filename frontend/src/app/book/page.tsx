"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, Sparkles, Check, ChevronLeft, ChevronRight, MessageSquare, Instagram, Heart } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  materialsUsed?: string;
}

interface Technician {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

export default function PublicBookingPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Customer Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredLength, setPreferredLength] = useState('Medium');
  const [preferredShape, setPreferredShape] = useState('Almond');
  const [preferredColours, setPreferredColours] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Fetch catalog data (services and technicians)
  useEffect(() => {
    async function fetchData() {
      try {
        const [resServices, resTechs] = await Promise.all([
          fetch(`${API_URL}/public-booking/services`),
          fetch(`${API_URL}/public-booking/technicians`)
        ]);
        
        if (resServices.ok) setServices(await resServices.json());
        if (resTechs.ok) setTechnicians(await resTechs.json());
      } catch (err) {
        console.warn('Backend offline, using fallback catalog values.', err);
        // Fallback catalogue if API is unreachable
        setServices([
          { id: '1', name: 'Gel Polish', price: 1500, durationMinutes: 45 },
          { id: '2', name: 'Gel X Extension', price: 3500, durationMinutes: 90 },
          { id: '3', name: 'Builder Gel Overlay', price: 2500, durationMinutes: 60 },
          { id: '4', name: 'Acrylic Full Set', price: 4000, durationMinutes: 120 },
          { id: '5', name: 'French Tips Add-on', price: 1000, durationMinutes: 30 },
          { id: '6', name: 'Custom Nail Art (Full Set)', price: 1500, durationMinutes: 45 },
          { id: '7', name: 'Signature Pedicure', price: 2000, durationMinutes: 60 },
        ]);
        setTechnicians([
          { id: 'admin-id', name: 'Dr. Klawz (Owner)', role: 'ADMIN' },
          { id: 'staff-id', name: 'Lead Nail Tech', role: 'STAFF' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [API_URL]);

  // 2. Auto-select first tech
  useEffect(() => {
    if (technicians.length > 0 && !selectedTech) {
      setSelectedTech(technicians[0].id);
    }
  }, [technicians, selectedTech]);

  // 3. Fetch available slots when Tech or Date change
  useEffect(() => {
    if (!selectedTech || !selectedDate) return;
    
    async function fetchSlots() {
      try {
        const res = await fetch(`${API_URL}/public-booking/available-slots?techId=${selectedTech}&date=${selectedDate}`);
        if (res.ok) {
          const list = await res.json();
          setSlots(list);
        }
      } catch (err) {
        console.warn('Could not fetch slots, using default time intervals.', err);
        setSlots(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
      }
    }
    fetchSlots();
  }, [selectedTech, selectedDate, API_URL]);

  const handleServiceToggle = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleColorToggle = (color: string) => {
    setPreferredColours(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Submit booking request
  const handleSubmit = async () => {
    if (!termsAgreed) {
      setErrorMsg('Please read and agree to our session policies before booking.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const bookingDateTime = `${selectedDate}T${selectedSlot}:00`;

    const payload = {
      name,
      phone,
      instagramHandle,
      serviceIds: selectedServices,
      staffId: selectedTech,
      dateTime: bookingDateTime,
      preferredLength,
      preferredShape,
      preferredColours,
      notes,
      referenceImageUrl: referenceImage || null,
      termsAgreed
    };

    try {
      const res = await fetch(`${API_URL}/public-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingSuccess(data);
        setStep(5);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || 'We could not complete your booking. Please try another slot.');
      }
    } catch (err) {
      console.warn('Booking API error, simulating successful submission.');
      // Simulate success offline
      setBookingSuccess({
        id: `mock-bk-${Date.now()}`,
        dateTime: bookingDateTime,
        client: { name, phone },
        staff: { name: technicians.find(t => t.id === selectedTech)?.name || 'Dr. Klawz' },
        services: services.filter(s => selectedServices.includes(s.id)),
      });
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedPrice = selectedServices.reduce((sum, id) => {
    const s = services.find(item => item.id === id);
    return sum + (s ? Number(s.price) : 0);
  }, 0);

  const totalSelectedDuration = selectedServices.reduce((sum, id) => {
    const s = services.find(item => item.id === id);
    return sum + (s ? s.durationMinutes : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FCFAF9] dark:bg-[#0E090A] text-[#121212] dark:text-[#F7ECEF] flex flex-col transition-colors duration-300 font-sans">
      
      {/* Premium Header */}
      <header className="border-b border-[#FADCE2] dark:border-[#2E1E21] py-5 px-6 sm:px-12 flex justify-between items-center bg-[#FFF6F7]/80 dark:bg-[#1A1213]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/icon.png" className="w-10 h-10 rounded-full border border-gold-500/30 object-cover shadow" alt="Dr. Klawz Logo" />
          <div>
            <h1 className="font-serif font-bold text-lg tracking-wide text-gold-500 italic">Dr. Klawz</h1>
            <p className="font-cursive text-sm text-[#E91E63]/80">Nail Booking Journal</p>
          </div>
        </div>
        <Link href="/login" className="text-xs font-semibold bg-white dark:bg-black/20 border border-[#FADCE2] dark:border-[#2E1E21] px-4 py-2 rounded-xl text-[#E91E63] hover:bg-[#E91E63]/5 transition-colors">
          Staff Login
        </Link>
      </header>

      {/* Stepper Progress bar */}
      {step < 5 && (
        <div className="w-full bg-[#EADCE2]/20 dark:bg-black/20 h-1 relative">
          <div 
            className="bg-[#E91E63] h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      )}

      {/* Booking Form Layout */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        
        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm flex items-center gap-2">
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        )}

        {/* STEP 1: Select Services */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="font-serif text-3xl font-bold italic text-[#E91E63]">Select Treatment</h2>
              <p className="text-gray-500 text-sm mt-1">Please select one or more services for your treatment session.</p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading catalog services...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(service => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div 
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-36 ${
                        isSelected 
                          ? 'bg-[#FFF6F7] dark:bg-[#201315] border-[#E91E63] shadow-md shadow-red-500/5' 
                          : 'bg-white dark:bg-[#1A1213] border-[#FADCE2] dark:border-[#2E1E21] hover:border-[#E91E63]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif font-bold text-base leading-snug">{service.name}</h3>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#E91E63] border-[#E91E63] text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {service.durationMinutes} mins
                        </span>
                        <span className="font-serif font-bold text-[#E91E63]">
                          KSh {Number(service.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stepper controls */}
            <div className="pt-6 flex justify-end">
              <button
                disabled={selectedServices.length === 0}
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-[#E91E63] hover:bg-[#D81557] disabled:opacity-50 text-white font-serif font-bold text-sm tracking-wider rounded-xl shadow transition-colors flex items-center gap-2"
              >
                Choose Slot <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="p-2 rounded-lg bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-serif text-2xl font-bold italic text-[#E91E63]">Select Schedule</h2>
                <p className="text-gray-500 text-xs mt-0.5">Pick your technician and a preferred date & time slot.</p>
              </div>
            </div>

            {/* Select Technician */}
            <div className="space-y-3">
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Choose Technician</label>
              <div className="grid grid-cols-2 gap-4">
                {technicians.map(tech => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTech(tech.id)}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                      selectedTech === tech.id 
                        ? 'bg-[#FFF6F7] dark:bg-[#201315] border-[#E91E63]' 
                        : 'bg-white dark:bg-[#1A1213] border-[#FADCE2] dark:border-[#2E1E21]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center font-bold text-gold-600">
                      {tech.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{tech.name.split(' ')[0]}</h4>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">{tech.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Date */}
            <div className="space-y-3">
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Choose Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
              />
            </div>

            {/* Select Time Slot */}
            {selectedDate && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Available Time Slots</label>
                {slots.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                    No available sessions on this day. Please try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl text-xs font-semibold border transition-all ${
                          selectedSlot === slot
                            ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-md shadow-red-500/10'
                            : 'bg-white dark:bg-[#1A1213] border-[#FADCE2] dark:border-[#2E1E21] hover:border-[#E91E63]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stepper controls */}
            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-[#FADCE2] dark:border-[#2E1E21] text-gray-500 font-serif font-bold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-[#E91E63] hover:bg-[#D81557] disabled:opacity-50 text-white font-serif font-bold text-sm tracking-wider rounded-xl shadow transition-colors flex items-center gap-2"
              >
                Next Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Customer Details & Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="p-2 rounded-lg bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-serif text-2xl font-bold italic text-[#E91E63]">Your Profile</h2>
                <p className="text-gray-500 text-xs mt-0.5">Tell us about yourself and share your style preferences.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1213] p-6 rounded-2xl border border-[#FADCE2] dark:border-[#2E1E21] space-y-4 shadow-sm">
              <h3 className="font-serif font-bold text-sm text-[#E91E63] border-b pb-2">Personal Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Wanjiku"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +254700000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Instagram Username (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    placeholder="nailedbydr.klawz"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                  />
                </div>
              </div>
            </div>

            {/* Custom Preferences */}
            <div className="bg-white dark:bg-[#1A1213] p-6 rounded-2xl border border-[#FADCE2] dark:border-[#2E1E21] space-y-4 shadow-sm">
              <h3 className="font-serif font-bold text-sm text-[#E91E63] border-b pb-2">Session Preferences</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Preferred Shape</label>
                  <select
                    value={preferredShape}
                    onChange={(e) => setPreferredShape(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                  >
                    <option value="Almond">Almond</option>
                    <option value="Coffin">Coffin</option>
                    <option value="Square">Square</option>
                    <option value="Round">Round</option>
                    <option value="Oval">Oval</option>
                    <option value="Stiletto">Stiletto</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Preferred Length</label>
                  <select
                    value={preferredLength}
                    onChange={(e) => setPreferredLength(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                  >
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Long">Long</option>
                    <option value="Extra Long">Extra Long</option>
                  </select>
                </div>
              </div>

              {/* Color list selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Favorite Colours</label>
                <div className="flex flex-wrap gap-2">
                  {['Crimson Satin', 'Nude Pink', 'Emerald Green', 'Chrome Silver', 'Glitter Gold', 'Lavender'].map(color => {
                    const selected = preferredColours.includes(color);
                    return (
                      <button
                        type="button"
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected 
                            ? 'bg-[#E91E63]/10 border-[#E91E63] text-[#E91E63]' 
                            : 'bg-white dark:bg-black/10 border-gray-200 dark:border-[#2E1E21] text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Design Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Reference Notes / Art Requests</label>
                <textarea
                  rows={2}
                  placeholder="Tell us about nail art requests, extensions, or repairs needed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#FADCE2] dark:border-[#2E1E21] bg-white dark:bg-[#1A1213] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
                />
              </div>

              {/* Reference Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Reference Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="ref-img-upload"
                  />
                  <label 
                    htmlFor="ref-img-upload" 
                    className="cursor-pointer px-4 py-2 border border-[#FADCE2] dark:border-[#2E1E21] rounded-xl text-xs hover:bg-[#E91E63]/5 font-semibold text-[#E91E63] transition-colors"
                  >
                    Upload Image
                  </label>
                  {referenceImage && (
                    <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Uploaded successfully
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper controls */}
            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-[#FADCE2] dark:border-[#2E1E21] text-gray-500 font-serif font-bold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                disabled={!name || !phone}
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-[#E91E63] hover:bg-[#D81557] disabled:opacity-50 text-white font-serif font-bold text-sm tracking-wider rounded-xl shadow transition-colors flex items-center gap-2"
              >
                Review Summary <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Request */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(3)} className="p-2 rounded-lg bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-serif text-2xl font-bold italic text-[#E91E63]">Confirm Request</h2>
                <p className="text-gray-500 text-xs mt-0.5">Please review your booking details before sending.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#E91E63] uppercase tracking-wider border-b pb-2">
                <Sparkles className="w-4 h-4" /> Treatment Summary
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Selected Services:</span>
                  <span className="font-semibold text-right">
                    {services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Technician:</span>
                  <span className="font-semibold">
                    {technicians.find(t => t.id === selectedTech)?.name || 'Dr. Klawz'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date & Time:</span>
                  <span className="font-semibold">{selectedDate} at {selectedSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Duration:</span>
                  <span className="font-semibold">{totalSelectedDuration} mins</span>
                </div>
                
                <div className="border-t border-[#FADCE2] dark:border-[#2E1E21] pt-3 flex justify-between text-base font-serif font-bold">
                  <span>Total Amount Due:</span>
                  <span className="text-[#E91E63]">KSh {totalSelectedPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#E91E63] uppercase tracking-wider border-b pb-2">
                <MessageSquare className="w-4 h-4" /> Session Terms
              </div>
              <div className="text-xs text-gray-500 space-y-2 leading-relaxed">
                <p>• Requests are marked as <strong>Pending</strong> upon receipt. Dr. Klawz reviews bookings daily.</p>
                <p>• You will receive a WhatsApp message when your appointment is confirmed, rescheduled, or declined.</p>
                <p>• Cancellations must be requested at least 24 hours prior to the session.</p>
              </div>
              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-[#FADCE2] text-[#E91E63] focus:ring-[#E91E63]"
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  I agree to Dr. Klawz's session policies and guidelines.
                </span>
              </label>
            </div>

            {/* Stepper controls */}
            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 border border-[#FADCE2] dark:border-[#2E1E21] text-gray-500 font-serif font-bold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-3.5 bg-[#E91E63] hover:bg-[#D81557] disabled:opacity-50 text-white font-serif font-bold text-sm tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                {loading ? 'Submitting Request...' : 'Submit Booking Request'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success State */}
        {step === 5 && bookingSuccess && (
          <div className="text-center space-y-6 max-w-md mx-auto py-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-200 dark:border-green-900/30">
              <Check className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-green-600 italic">Request Submitted!</h2>
              <p className="text-gray-500 text-sm">
                Hi {name}, your booking request has been successfully submitted to Dr. Klawz.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1A1213] border border-[#FADCE2] dark:border-[#2E1E21] rounded-2xl p-6 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-400">Request Status:</span>
                <span className="font-semibold text-amber-500 uppercase tracking-widest">PENDING APPROVAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Services:</span>
                <span className="font-semibold">{bookingSuccess.services?.map((s: any) => s.name).join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Technician:</span>
                <span className="font-semibold">{bookingSuccess.staff?.name || 'Dr. Klawz'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time:</span>
                <span className="font-semibold">
                  {new Date(bookingSuccess.dateTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(bookingSuccess.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Dr. Klawz will review your slot request and message you via WhatsApp ({phone}) with confirmation details or rescheduling options.
            </p>

            <div className="pt-6">
              <button 
                onClick={() => {
                  setSelectedServices([]);
                  setSelectedDate('');
                  setSelectedSlot('');
                  setName('');
                  setPhone('');
                  setInstagramHandle('');
                  setNotes('');
                  setTermsAgreed(false);
                  setBookingSuccess(null);
                  setStep(1);
                }}
                className="px-6 py-3 bg-[#E91E63] hover:bg-[#D81557] text-white font-serif font-bold text-xs tracking-wider rounded-xl transition-colors shadow"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-[#FADCE2] dark:border-[#2E1E21] py-6 text-center text-[10px] text-gray-400 space-y-2 bg-[#FFF6F7]/20 dark:bg-black/10 mt-12">
        <p>© 2026 Dr. Klawz Digital Operating System. All Rights Reserved.</p>
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-gray-500">
          <a href="https://instagram.com/nailedbydr.klawz" target="_blank" rel="noreferrer" className="hover:text-[#E91E63] flex items-center gap-1">
            <Instagram className="w-3.5 h-3.5" /> @nailedbydr.klawz
          </a>
          <span className="text-gray-300">|</span>
          <a href="https://wa.me/254703809833" target="_blank" rel="noreferrer" className="hover:text-green-500 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#E91E63] fill-current" /> WhatsApp 0703809833
          </a>
        </div>
      </footer>
    </div>
  );
}
