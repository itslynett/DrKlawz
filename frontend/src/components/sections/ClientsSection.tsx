"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db, ClientLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { 
  Search, Plus, User, Phone, Instagram, Mail, 
  MapPin, HeartCrack, Info, Camera, Calendar, Award, Trash2
} from 'lucide-react';

export default function ClientsSection() {
  const { isOnline } = useSync();
  const [clients, setClients] = useState<ClientLocal[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // File input ref for client photo lookbook upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [shape, setShape] = useState('Almond');
  const [length, setLength] = useState('Medium');
  const [notes, setNotes] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadClients();
  }, [search]);

  const loadClients = async () => {
    let syncSuccess = false;
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        const url = search ? `${API_BASE_URL}/clients?search=${search}` : `${API_BASE_URL}/clients`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setClients(data);
          // Mirror in IndexedDB
          await db.clients.bulkPut(data);
          syncSuccess = true;
        }
      }
    } catch (err: any) {
      console.warn('Network sync failed for clients directory, using local backup state:', err.message);
    }

    if (!syncSuccess) {
      try {
        // Offline load
        const local = await db.clients.toArray();
        const filtered = search
          ? local.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
          : local;
        setClients(filtered);
      } catch (localErr) {
        console.error('Failed to load local clients directory fallback:', localErr);
      }
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const clientId = `client-${Date.now()}`;
    const newClient: ClientLocal = {
      id: clientId,
      name,
      phone,
      whatsapp: whatsapp || phone,
      instagram,
      email,
      birthday: birthday ? new Date(birthday).toISOString() : undefined,
      address,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      allergies,
      medicalNotes,
      preferredNailShape: shape,
      preferredNailLength: length,
      favouriteColours: [],
      favouriteDesigns: [],
      notes,
      lifetimeSpending: 0,
      totalVisits: 0,
      status: 'Active',
      photos: [],
    };

    try {
      // 1. Add locally
      await db.clients.add(newClient);

      // 2. Queue in syncOutbox
      await db.queueChange('CREATE', 'clients', clientId, newClient);

      // 3. Reset form
      setName('');
      setPhone('');
      setWhatsapp('');
      setInstagram('');
      setEmail('');
      setBirthday('');
      setAddress('');
      setEmergencyName('');
      setEmergencyPhone('');
      setAllergies('');
      setMedicalNotes('');
      setNotes('');
      setIsAdding(false);

      await loadClients();
      setSelectedClientId(clientId);
    } catch (err) {
      console.error('Failed to add client:', err);
    }
  };

  // Handle Photo Upload for Selected Client Lookbook
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedClient) return;

    const newPhotos: { id: string; url: string; createdAt: string }[] = [];

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      newPhotos.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: dataUrl,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedPhotos = [...(selectedClient.photos || []), ...newPhotos];

    try {
      // Update IndexedDB
      await db.clients.update(selectedClient.id, { photos: updatedPhotos });

      // Update Local State
      setClients(prev =>
        prev.map(c => (c.id === selectedClient.id ? { ...c, photos: updatedPhotos } : c))
      );

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to save client lookbook photo:', err);
    }
  };

  // Handle Deleting a Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedClient) return;
    const updatedPhotos = (selectedClient.photos || []).filter((p: any) => p.id !== photoId);

    try {
      await db.clients.update(selectedClient.id, { photos: updatedPhotos });
      setClients(prev =>
        prev.map(c => (c.id === selectedClient.id ? { ...c, photos: updatedPhotos } : c))
      );
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const shapes = ['Almond', 'Square', 'Coffin', 'Stiletto', 'Oval', 'Round'];
  const lengths = ['Short', 'Medium', 'Long', 'Extra Long'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
      
      {/* Hidden File Input for Lookbook Photos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* COLUMN 1: Client Directory */}
      <div className="flex flex-col h-full min-h-0 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] p-4 shadow-sm">
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#FADCE2] dark:border-[#2D1D1A] bg-[#FFFBFB] dark:bg-[#1C1113] text-[#1A1112] dark:text-[#FFF5F6] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30"
          />
        </div>

        {/* Directory header */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Directory</span>
          <button 
            onClick={() => { setIsAdding(true); setSelectedClientId(null); }}
            className="flex items-center gap-1.5 text-xs font-serif font-bold bg-[#E91E63] hover:bg-[#D81557] text-white px-3 py-1.5 rounded-xl shadow-sm border border-[#1A1112] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" /> Add Client
          </button>
        </div>

        {/* Client lists */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {clients.length === 0 ? (
            <p className="text-xs text-center text-gray-400 italic py-8">No clients in directory.</p>
          ) : (
            clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedClientId(c.id); setIsAdding(false); }}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectedClientId === c.id
                    ? 'bg-[#FFF0F2] border-[#E91E63] text-[#1A1112] shadow-sm'
                    : 'bg-white dark:bg-[#201715] border-[#FADCE2] dark:border-[#332420] text-gray-700 hover:border-[#E91E63]/40'
                }`}
              >
                <div>
                  <h4 className="font-serif text-sm font-bold block text-[#1A1112] dark:text-[#FFF5F6]">{c.name}</h4>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{c.phone || c.email || 'No contact'}</span>
                </div>
                {c.status === 'VIP' && (
                  <span className="text-[9px] bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/30 px-2 py-0.5 rounded-full font-bold uppercase">VIP</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2 & 3: Details Panel or Creation Form */}
      <div className="md:col-span-2 flex flex-col h-full min-h-0 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] p-6 shadow-sm overflow-y-auto">
        
        {isAdding ? (
          /* Client Creation Form */
          <form onSubmit={handleAddClient} className="space-y-6">
            <h3 className="font-serif text-lg font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-2">
              Log New Client Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="e.g. Elena Rostova" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="+254700000000" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instagram Handle</label>
                <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="@username" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="name@domain.com" />
              </div>
            </div>

            {/* Preference Selectors */}
            <div className="border-t border-[#FADCE2] pt-4 space-y-4">
              <h4 className="text-xs font-bold text-[#1A1112] dark:text-[#FFF5F6] uppercase tracking-wider">Style & Preferences</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nail Shape Cards */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preferred Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {shapes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setShape(s)}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          shape === s ? 'bg-[#E91E63] border-[#1A1112] text-white shadow-sm' : 'bg-white hover:border-[#E91E63]/40 text-[#1A1112]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nail Length Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preferred Length</label>
                  <div className="grid grid-cols-2 gap-2">
                    {lengths.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLength(l)}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          length === l ? 'bg-[#E91E63] border-[#1A1112] text-white shadow-sm' : 'bg-white hover:border-[#E91E63]/40 text-[#1A1112]'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Allergies / Medical Notes */}
            <div className="border-t border-[#FADCE2] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><HeartCrack className="w-3.5 h-3.5 text-red-500" /> Allergies</label>
                <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none" placeholder="e.g. Latex, Acrylic monomers" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medical Notes</label>
                <input type="text" value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-sm focus:outline-none" placeholder="e.g. Sensitive cuticles" />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end gap-3 border-t border-[#FADCE2] pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border-2 border-[#1A1112] rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-[#E91E63] hover:bg-[#D81557] text-white font-serif font-bold rounded-xl text-xs shadow-md border border-[#1A1112] cursor-pointer">Log Client</button>
            </div>

          </form>
        ) : selectedClient ? (
          /* Client Detail View */
          <div className="space-y-6">
            
            {/* Header profile block */}
            <div className="flex justify-between items-start border-b-2 border-[#1A1112] pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#FFF0F2] border-2 border-[#1A1112] flex items-center justify-center">
                  <User className="w-7 h-7 text-[#E91E63]" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">{selectedClient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">ID: {selectedClient.id.substring(0, 8)}</span>
                    <span className="text-[10px] font-bold bg-[#E91E63]/10 border border-[#E91E63]/30 text-[#E91E63] px-2.5 py-0.5 rounded-full uppercase">{selectedClient.status}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block font-semibold">Lifetime Spending</span>
                <span className="font-serif text-xl font-bold text-[#E91E63]">KSh {selectedClient.lifetimeSpending.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5 font-bold">{selectedClient.totalVisits} visits logged</span>
              </div>
            </div>

            {/* Style Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FFF0F2] border border-[#FADCE2] rounded-2xl">
                <span className="text-[10px] font-bold text-[#E91E63] uppercase tracking-widest">Nail Specifications</span>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2.5 bg-white rounded-xl border border-[#FADCE2] text-center shadow-xs">
                    <span className="text-[10px] text-gray-400 block font-semibold">Shape</span>
                    <span className="text-xs font-bold text-[#1A1112]">{selectedClient.preferredNailShape || 'Almond'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#FADCE2] text-center shadow-xs">
                    <span className="text-[10px] text-gray-400 block font-semibold">Length</span>
                    <span className="text-xs font-bold text-[#1A1112]">{selectedClient.preferredNailLength || 'Medium'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-2xl">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1"><HeartCrack className="w-3.5 h-3.5 text-red-500" /> Medical Details</span>
                <div className="space-y-1.5 mt-3 text-xs">
                  <p><span className="font-semibold text-gray-500">Allergies:</span> {selectedClient.allergies || 'None recorded'}</p>
                  <p><span className="font-semibold text-gray-500">Medical Notes:</span> {selectedClient.medicalNotes || 'No special requirements'}</p>
                </div>
              </div>
            </div>

            {/* Client Details fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 border border-[#FADCE2] rounded-2xl bg-white dark:bg-[#201715]">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#E91E63]" /> <span className="font-bold text-gray-400 w-24">Phone:</span> <span className="text-[#1A1112] dark:text-white font-semibold">{selectedClient.phone || 'No phone'}</span></p>
                <p className="flex items-center gap-2"><Instagram className="w-4 h-4 text-[#E91E63]" /> <span className="font-bold text-gray-400 w-24">Instagram:</span> <span className="text-[#1A1112] dark:text-white font-semibold">{selectedClient.instagram || 'No handle'}</span></p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#E91E63]" /> <span className="font-bold text-gray-400 w-24">Email:</span> <span className="text-[#1A1112] dark:text-white font-semibold">{selectedClient.email || 'No email'}</span></p>
              </div>

              <div className="space-y-2 p-3.5 border border-[#FADCE2] rounded-2xl bg-white dark:bg-[#201715]">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E91E63]" /> <span className="font-bold text-gray-400 w-24">Address:</span> <span className="text-[#1A1112] dark:text-white font-semibold">{selectedClient.address || 'No address'}</span></p>
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#E91E63]" /> <span className="font-bold text-gray-400 w-24">Birthday:</span> <span className="text-[#1A1112] dark:text-white font-semibold">{selectedClient.birthday ? new Date(selectedClient.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No birthday'}</span></p>
              </div>
            </div>

            {/* Real Client Lookbook Photo Gallery */}
            <div className="border-t-2 border-[#1A1112] pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-serif text-sm font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#E91E63]" /> Client Lookbook Gallery
                </h4>
                <span className="text-[10px] text-gray-400 font-bold">
                  {selectedClient.photos?.length || 0} photos saved
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* Real File Upload Trigger Card */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-[#FFF0F2] border-2 border-dashed border-[#E91E63] flex flex-col items-center justify-center cursor-pointer hover:bg-[#E91E63]/20 hover:scale-[1.02] transition-all shadow-sm group"
                >
                  <div className="p-2 rounded-full bg-white border border-[#1A1112] group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4 text-[#E91E63]" />
                  </div>
                  <span className="text-[10px] text-[#1A1112] font-bold uppercase tracking-wider mt-2">Upload</span>
                </div>

                {/* Uploaded Lookbook Photos */}
                {selectedClient.photos?.map((photo: any) => (
                  <div key={photo.id} className="aspect-square rounded-2xl bg-gray-100 border-2 border-[#1A1112] overflow-hidden relative group shadow-sm">
                    <img src={photo.url} className="w-full h-full object-cover" alt="Nail Art Design" />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Info className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-serif text-base text-gray-500 dark:text-gray-400 italic">
              Select a client from the directory to inspect their journal record, or click "Add Client" to enter a new nail client profile.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
