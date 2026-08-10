"use client";

import React, { useState, useEffect } from 'react';
import { db, InventoryItemLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { Package, AlertTriangle, Plus, Tag, ShoppingCart, RefreshCw, Barcode } from 'lucide-react';

export default function InventorySection() {
  const [items, setItems] = useState<InventoryItemLocal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Consumables');
  const [brand, setBrand] = useState('');
  const [colour, setColour] = useState('');
  const [qty, setQty] = useState(10);
  const [minStock, setMinStock] = useState(2);
  const [cost, setCost] = useState(800);
  const [barcode, setBarcode] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let syncSuccess = false;
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        const res = await fetch(`${API_BASE_URL}/inventory/items`, { headers });
        if (res.ok) {
          const data = await res.json();
          setItems(data);
          await db.inventory.bulkPut(data);
          syncSuccess = true;
        }
      }
    } catch (err: any) {
      console.warn('Network sync failed for inventory, using offline local state:', err.message);
    }

    if (!syncSuccess) {
      try {
        const local = await db.inventory.toArray();
        setItems(local);
      } catch (localErr) {
        console.error('Failed to load local inventory items:', localErr);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const itemId = `inv-${Date.now()}`;
    const newItem: InventoryItemLocal = {
      id: itemId,
      name,
      category,
      brand,
      colour,
      quantityPurchased: Number(qty),
      quantityRemaining: Number(qty),
      minimumStock: Number(minStock),
      unitCost: Number(cost),
      barcode,
    };

    try {
      await db.inventory.add(newItem);
      await db.queueChange('CREATE', 'inventory', itemId, newItem);
      
      setName('');
      setBrand('');
      setColour('');
      setQty(10);
      setCost(800);
      setBarcode('');
      setIsAdding(false);
      await loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustQty = async (itemId: string, amount: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.quantityRemaining = Math.max(0, Number(item.quantityRemaining) + amount);
        await db.inventory.put(item);
        await db.queueChange('UPDATE', 'inventory', itemId, item);
        await loadItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center border-b-2 border-[#1A1112] pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Consumables & Product Stock</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-extrabold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border-2 border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Inventory' : (
            <>
              <Plus className="w-4 h-4 text-white" /> Add Product
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleCreate} className="bg-white dark:bg-[#201715] p-6 rounded-2xl border border-[#E8E2D5] space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-bold text-[#3E2723] dark:text-gold-500 italic mb-2">Register Inventory Item</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Product Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Nude Gel Polish #04" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none">
                <option value="Consumables">Consumables (Polish, Gel)</option>
                <option value="Tools">Tools (Files, Clippers)</option>
                <option value="Sanitary">Sanitary (Disinfectant, Wipes)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Brand</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="OPI" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Colour / Variant</label>
              <input type="text" value={colour} onChange={e => setColour(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="Nude Pink" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Quantity Purchased</label>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Minimum Stock Alert</label>
              <input type="number" value={minStock} onChange={e => setMinStock(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Unit Cost (KSh)</label>
              <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Barcode</label>
              <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none" placeholder="12345678" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-[#1E0F0D] font-serif font-bold rounded-xl text-xs shadow-md">Register Item</button>
          </div>

        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => {
            const isLow = Number(item.quantityRemaining) <= Number(item.minimumStock);
            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-[#201715] p-4 rounded-2xl border border-[#E8E2D5] dark:border-[#332420] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex gap-3">
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#3E2723] dark:text-[#EFEBE9] flex items-center gap-2">
                      {item.name}
                      {item.brand && <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 px-2 py-0.5 rounded font-normal">{item.brand}</span>}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      <span>Category: {item.category}</span>
                      {item.colour && <span>Colour: {item.colour}</span>}
                      {item.barcode && <span className="flex items-center gap-0.5"><Barcode className="w-3.5 h-3.5" /> {item.barcode}</span>}
                    </div>

                    {isLow && (
                      <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-md mt-2 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Warning
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="sm:text-right">
                    <span className="text-xs text-gray-400 block">Quantity Remaining</span>
                    <span className="text-base font-bold text-[#3E2723] dark:text-[#EFEBE9]">{item.quantityRemaining} units</span>
                  </div>

                  <div className="flex gap-1.5 mt-1">
                    <button 
                      onClick={() => handleAdjustQty(item.id, -1)}
                      className="p-1 px-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-500/20"
                    >
                      Use 1
                    </button>
                    <button 
                      onClick={() => handleAdjustQty(item.id, 5)}
                      className="p-1 px-3 bg-green-500/10 border border-green-500/20 text-green-600 text-[10px] font-bold rounded-lg hover:bg-green-500/20"
                    >
                      Restock 5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
