"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { 
  Sparkles, CheckCircle2, ChevronRight, AlertCircle, 
  Plus, Calendar, Package, DollarSign, Wrench, RefreshCw, Heart
} from 'lucide-react';

export default function DailyNotesSection() {
  const { isOnline } = useSync();
  const [noteText, setNoteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [notesList, setNotesList] = useState<any[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/daily-notes`, { headers });
        if (res.ok) {
          const data = await res.json();
          setNotesList(data);
          if (data.length > 0 && !activeNoteId) {
            setActiveNoteId(data[0].id);
          }
          // Save cache locally
          await db.dailyNotes.clear();
          await db.dailyNotes.bulkPut(data);
          return;
        }
      }
      
      // Offline fallback: load from IndexedDB
      const localNotes = await db.dailyNotes.toArray();
      setNotesList(localNotes);
      if (localNotes.length > 0 && !activeNoteId) {
        setActiveNoteId(localNotes[0].id);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) return;
    setError('');
    setIsAnalyzing(true);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // If online, call API
      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/daily-notes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ rawText: noteText }),
        });

        if (!res.ok) throw new Error('Analysis failed');
        const data = await res.json();
        setNoteText('');
        await loadNotes();
        setActiveNoteId(data.id);
      } else {
        // Offline processing: Fallback mock simulation directly in frontend database
        const mockResult = await mockLocalParse(noteText);
        
        // Save note and mock extractions locally in Dexie IndexedDB
        const localNoteId = `local-note-${Date.now()}`;
        const newLocalNote = {
          id: localNoteId,
          date: new Date().toISOString(),
          rawText: noteText,
          processed: true,
          extractions: mockResult.extractions.map((ext: any, idx: number) => ({
            id: `local-ext-${localNoteId}-${idx}`,
            noteId: localNoteId,
            entityType: ext.entityType,
            matchedText: ext.matchedText,
            data: JSON.stringify(ext.data),
            confirmed: false,
          }))
        };

        await db.dailyNotes.add(newLocalNote);
        
        // Add to offline outbox queue to sync when online
        await db.queueChange('CREATE', 'dailynotes', localNoteId, { rawText: noteText });

        setNoteText('');
        await loadNotes();
        setActiveNoteId(localNoteId);
      }
    } catch (err: any) {
      setError(err.message || 'Could not parse note.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAnalyze(e);
    }
  };

  // Mock offline note extractor matching MockProvider backend behavior
  const mockLocalParse = async (text: string) => {
    const extractions: any[] = [];
    const lower = text.toLowerCase();

    // Sarah came for Gel X and paid KSh 3,500
    if (lower.includes('sarah') && lower.includes('gel x')) {
      extractions.push({
        entityType: 'INCOME',
        matchedText: 'Sarah Jenkins - Gel X: 3500',
        data: { clientName: 'Sarah Jenkins', serviceName: 'Gel X Extension', amount: 3500, paymentMethod: 'MOBILE_MONEY' }
      });
    }
    // Bought 4 nude gel polishes from Beauty World for KSh 3,200
    if (lower.includes('beauty world') && (lower.includes('3,200') || lower.includes('3200'))) {
      extractions.push({
        entityType: 'EXPENSE',
        matchedText: 'PRODUCTS: 3200',
        data: { category: 'PRODUCTS', amount: 3200, notes: 'Bought 4 nude gel polishes from Beauty World' }
      });
      extractions.push({
        entityType: 'INVENTORY',
        matchedText: 'Nude Gel Polish (4 units)',
        data: { productName: 'Nude Gel Polish', category: 'Consumables', supplierName: 'Beauty World', quantityPurchased: 4, unitCost: 800 }
      });
    }
    // Ordered a new UV lamp
    if (lower.includes('uv lamp') || lower.includes('uv led')) {
      extractions.push({
        entityType: 'EQUIPMENT_MAINTENANCE',
        matchedText: 'UV LED Nail Lamp (ORDERED)',
        data: { equipmentName: 'UV LED Nail Lamp', notes: 'Ordered a new UV lamp', action: 'ORDERED' }
      });
    }
    // replace old drill
    if (lower.includes('drill')) {
      extractions.push({
        entityType: 'EQUIPMENT_MAINTENANCE',
        matchedText: 'Nail Drill (REPLACE)',
        data: { equipmentName: 'Professional Nail Drill', notes: 'Replace the old drill next month', action: 'REPLACE' }
      });
    }

    // Default general expense fallback if no matches
    if (extractions.length === 0) {
      extractions.push({
        entityType: 'EXPENSE',
        matchedText: 'MISCELLANEOUS: 1000',
        data: { category: 'MISCELLANEOUS', amount: 1000, notes: text.substring(0, 40) }
      });
    }

    return { extractions };
  };

  const handleConfirmExtraction = async (extId: string) => {
    setConfirmingId(extId);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/daily-notes/extractions/${extId}/confirm`, {
          method: 'POST',
          headers,
        });

        if (res.ok) {
          await loadNotes();
        }
      } else {
        // Offline: update local Dexie database
        const activeNote = notesList.find(note => note.id === activeNoteId);
        if (activeNote) {
          const updatedExtractions = activeNote.extractions.map((ext: any) => {
            if (ext.id === extId) {
              return { ...ext, confirmed: true };
            }
            return ext;
          });
          
          await db.dailyNotes.update(activeNote.id, { extractions: updatedExtractions });
          await db.queueChange('UPDATE', 'dailynotes', activeNote.id, activeNote);
          await loadNotes();
        }
      }
    } catch (err) {
      console.error('Failed to confirm extraction:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'EXPENSE': return <DollarSign className="w-4 h-4 text-red-500" />;
      case 'INCOME': return <Plus className="w-4 h-4 text-green-500" />;
      case 'INVENTORY': return <Package className="w-4 h-4 text-amber-500" />;
      case 'EQUIPMENT_MAINTENANCE': return <Wrench className="w-4 h-4 text-blue-500" />;
      default: return <Sparkles className="w-4 h-4 text-[#E91E63]" />;
    }
  };

  const activeNote = notesList.find(note => note.id === activeNoteId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-[78vh] min-h-0">
      
      {/* LEFT PAGE: Notebook notepad editor */}
      <div className="flex flex-col h-full min-h-0 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] p-6 shadow-sm">
        <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic mb-4 border-b-2 border-[#1A1112] pb-2">
          New Entry
        </h3>
        
        <form onSubmit={handleAnalyze} className="flex-1 flex flex-col min-h-0">
          <textarea
            required
            placeholder="Type or paste daily logs here...&#10;e.g. 'Sarah came for Gel X and paid KSh 3,500. Bought 4 nude gel polishes from Beauty World for KSh 3,200.'"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 w-full p-4 rounded-xl border border-[#FADCE2] dark:border-[#2D1D1A] bg-[#FFFBFB] dark:bg-[#1C1113] text-[#1A1112] dark:text-[#FFF5F6] text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30 notebook-ruled notebook-margin resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 italic pl-6 sm:pl-10">
            Tip: Press Ctrl + Enter to analyze.
          </p>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-200 mt-4">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">
              {isOnline ? 'Google Gemini AI Active' : 'Offline Mode (Local Parser)'}
            </span>
            
            <button
              type="submit"
              disabled={isAnalyzing || !noteText.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E91E63] hover:bg-[#D81557] active:scale-95 text-white font-serif font-bold text-xs tracking-widest shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Inscribing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PAGE: AI extractions list & pending cards */}
      <div className="flex flex-col h-full min-h-0 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b-2 border-[#1A1112] pb-2">
          <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic">
            AI Ledger Extraction
          </h3>
          <span className="text-[10px] bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/20 px-2.5 py-1 rounded-full font-bold tracking-widest uppercase">
            Review Required
          </span>
        </div>

        {notesList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="font-serif text-base text-gray-500 dark:text-gray-400 italic">
              No entries logged yet. Write a note on the left and submit it to see the structured ledger output.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-6">
            
            {/* 1. History selection bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#FADCE2] dark:border-[#2D1D1A]">
              {notesList.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    activeNoteId === note.id
                      ? 'bg-[#E91E63]/10 border-[#E91E63] text-[#E91E63]'
                      : 'bg-transparent border-[#FADCE2] dark:border-[#2D1D1A] text-gray-400'
                  }`}
                >
                  {new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>

            {/* 2. Active note extractions view */}
            {activeNote ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="bg-[#FFF0F2] dark:bg-white/5 border border-[#FADCE2] p-3 rounded-xl mb-4">
                  <p className="text-[10px] text-[#E91E63] uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-current" /> Original Log
                  </p>
                  <p className="text-sm italic text-gray-600 dark:text-gray-300">"{activeNote.rawText}"</p>
                </div>

                {(!activeNote.extractions || activeNote.extractions.length === 0) ? (
                  <p className="text-sm italic text-gray-400">No entities could be extracted from this note.</p>
                ) : (
                  activeNote.extractions.map((ext: any) => {
                    const data = JSON.parse(ext.data);
                    return (
                      <div 
                        key={ext.id}
                        className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                          ext.confirmed 
                            ? 'bg-green-50/20 border-green-500/20' 
                            : 'bg-white dark:bg-[#201715] border-[#FADCE2] dark:border-[#332420] shadow-sm hover:border-[#E91E63]/50'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${ext.confirmed ? 'bg-green-500/10' : 'bg-[#FFF0F2]'}`}>
                            {getEntityIcon(ext.entityType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{ext.entityType}</span>
                              {ext.confirmed && (
                                <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-bold bg-green-500/10 px-1.5 py-0.25 rounded-md">
                                  <CheckCircle2 className="w-3 h-3" /> Logged
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-sm font-bold text-[#1A1112] dark:text-[#EFEBE9] mt-0.5">
                              {ext.matchedText}
                            </h4>

                            {/* Render details based on type */}
                            {ext.entityType === 'EXPENSE' && (
                              <p className="text-xs text-gray-400 mt-1">
                                Category: <span className="font-semibold text-gray-500">{data.category}</span> | Cost: <span className="font-semibold text-gray-500">KSh {data.amount}</span>
                              </p>
                            )}
                            {ext.entityType === 'INCOME' && (
                              <p className="text-xs text-gray-400 mt-1">
                                Client: <span className="font-semibold text-gray-500">{data.clientName}</span> | Service: <span className="font-semibold text-gray-500">{data.serviceName}</span> | Paid: <span className="font-semibold text-gray-500">KSh {data.amount}</span>
                              </p>
                            )}
                            {ext.entityType === 'INVENTORY' && (
                              <p className="text-xs text-gray-400 mt-1">
                                Product: <span className="font-semibold text-gray-500">{data.productName}</span> | Qty: <span className="font-semibold text-gray-500">{data.quantityPurchased}</span> | Unit Cost: <span className="font-semibold text-gray-500">KSh {data.unitCost}</span>
                              </p>
                            )}
                            {ext.entityType === 'EQUIPMENT_MAINTENANCE' && (
                              <p className="text-xs text-gray-400 mt-1">
                                Item: <span className="font-semibold text-gray-500">{data.equipmentName}</span> | Action: <span className="font-semibold text-gray-500">{data.action}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {!ext.confirmed && (
                          <button
                            onClick={() => handleConfirmExtraction(ext.id)}
                            disabled={confirmingId === ext.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A1112] hover:bg-black text-white font-serif font-bold text-[10px] tracking-wider rounded-xl shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {confirmingId === ext.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <span>Confirm</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}

          </div>
        )}
      </div>

    </div>
  );
}
