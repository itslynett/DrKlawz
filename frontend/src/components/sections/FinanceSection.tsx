"use client";

import React, { useState, useEffect } from 'react';
import { db, IncomeLocal, ExpenseLocal } from '../../lib/db';
import { useSync } from '../../hooks/useSync';
import { TrendingUp, TrendingDown, Plus, Info, RefreshCw, Upload } from 'lucide-react';

export default function FinanceSection() {
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
  const [incomes, setIncomes] = useState<IncomeLocal[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLocal[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('RENT');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY'>('CASH');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      if (navigator.onLine && token) {
        // Income
        const incRes = await fetch(`${API_BASE_URL}/finance/income`, { headers });
        if (incRes.ok) {
          const incData = await incRes.json();
          setIncomes(incData);
          await db.income.bulkPut(incData);
        }
        // Expenses
        const expRes = await fetch(`${API_BASE_URL}/finance/expenses`, { headers });
        if (expRes.ok) {
          const expData = await expRes.json();
          setExpenses(expData);
          await db.expenses.bulkPut(expData);
        }
        return;
      }

      // Offline load
      const localInc = await db.income.toArray();
      setIncomes(localInc);
      const localExp = await db.expenses.toArray();
      setExpenses(localExp);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (activeTab === 'expenses') {
      const expId = `exp-${Date.now()}`;
      const newExp: ExpenseLocal = {
        id: expId,
        category: category as any,
        amount: Number(amount),
        notes,
        date: new Date().toISOString(),
      };
      await db.expenses.add(newExp);
      await db.queueChange('CREATE', 'expenses', expId, newExp);
    } else {
      const incId = `inc-${Date.now()}`;
      const newInc: IncomeLocal = {
        id: incId,
        amount: Number(amount),
        tips: 0,
        paymentMethod,
        paymentDate: new Date().toISOString(),
        notes,
      };
      await db.income.add(newInc);
      await db.queueChange('CREATE', 'income', incId, newInc);
    }

    setAmount(0);
    setNotes('');
    setIsAdding(false);
    await loadFinance();
  };

  return (
    <div className="space-y-6">
      
      {/* High Contrast Tab Switcher */}
      <div className="flex flex-wrap justify-between items-center border-b-2 border-[#1A1112] pb-3 gap-3">
        <div className="flex gap-2">
          <button 
            onClick={() => { setActiveTab('income'); setIsAdding(false); }}
            className={`px-5 py-2 rounded-xl text-xs font-serif font-extrabold italic transition-all cursor-pointer border-2 border-[#1A1112] ${
              activeTab === 'income' 
                ? 'bg-[#E91E63] text-white shadow-md' 
                : 'bg-[#FFF0F2] text-[#1A1112] hover:bg-[#FADCE2]'
            }`}
          >
            Income Ledger
          </button>
          <button 
            onClick={() => { setActiveTab('expenses'); setIsAdding(false); }}
            className={`px-5 py-2 rounded-xl text-xs font-serif font-extrabold italic transition-all cursor-pointer border-2 border-[#1A1112] ${
              activeTab === 'expenses' 
                ? 'bg-[#E91E63] text-white shadow-md' 
                : 'bg-[#FFF0F2] text-[#1A1112] hover:bg-[#FADCE2]'
            }`}
          >
            Expenses Ledger
          </button>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-serif font-extrabold bg-[#E91E63] hover:bg-[#D81557] text-white px-5 py-2 rounded-xl shadow-md border-2 border-[#1A1112] transition-all cursor-pointer active:scale-95"
        >
          {isAdding ? 'View Entries' : (
            <>
              <Plus className="w-4 h-4 text-white" /> {activeTab === 'income' ? 'Log Income' : 'Log Expense'}
            </>
          )}
        </button>
      </div>

      {isAdding ? (
        /* Addition Form */
        <form onSubmit={handleSubmit} className="bg-[#FFFBFB] dark:bg-[#1C1113] p-6 rounded-3xl border-2 border-[#1A1112] shadow-sm space-y-4 max-w-xl">
          <h3 className="font-serif text-base font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic border-b-2 border-[#1A1112] pb-2">
            {activeTab === 'income' ? 'Log Business Payment' : 'Log Business Expense'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount (KSh) *</label>
              <input required type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30" placeholder="3500" />
            </div>

            {activeTab === 'expenses' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expense Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none bg-white">
                  <option value="RENT">Studio Rent</option>
                  <option value="PRODUCTS">Consumables / Polish</option>
                  <option value="EQUIPMENT">Equipment & Tools</option>
                  <option value="MARKETING">Marketing & Social</option>
                  <option value="INTERNET">Internet & Utilities</option>
                  <option value="TRANSPORT">Transport & Deliveries</option>
                  <option value="MISCELLANEOUS">Miscellaneous</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none bg-white">
                  <option value="MOBILE_MONEY">M-Pesa / Mobile Money</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Description / Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#FADCE2] text-xs focus:outline-none" placeholder={activeTab === 'income' ? 'Client Sarah - Gel-X full set' : 'Restocked OPI top coats'} />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#FADCE2] pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border-2 border-[#1A1112] rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-[#E91E63] hover:bg-[#D81557] text-white font-serif font-bold rounded-xl text-xs shadow-md border border-[#1A1112] cursor-pointer">Save Transaction</button>
          </div>
        </form>
      ) : (
        /* Ledger Tables */
        <div>
          {activeTab === 'income' ? (
            incomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] text-center">
                <Info className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-serif italic text-sm text-gray-400">No income entries recorded.</p>
              </div>
            ) : (
              <div className="bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF0F2] dark:bg-white/5 border-b-2 border-[#1A1112] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Client / Service</th>
                      <th className="p-4">Method</th>
                      <th className="p-4 text-right">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FADCE2]">
                    {incomes.map(inc => (
                      <tr key={inc.id} className="hover:bg-[#FFF0F2]/50">
                        <td className="p-4 font-semibold text-gray-400">{new Date(inc.paymentDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="font-extrabold text-[#1A1112] dark:text-[#FFF5F6] block">{inc.clientName || 'Client Payment'}</span>
                          <span className="text-[10px] text-gray-400 block">{inc.notes || inc.serviceName || 'Direct payment'}</span>
                        </td>
                        <td className="p-4 font-semibold">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-300">{inc.paymentMethod}</span>
                        </td>
                        <td className="p-4 text-right font-serif font-extrabold text-green-600">
                          + KSh {Number(inc.amount + (inc.tips || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] text-center">
                <Info className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-serif italic text-sm text-gray-400">No expense entries recorded.</p>
              </div>
            ) : (
              <div className="bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF0F2] dark:bg-white/5 border-b-2 border-[#1A1112] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FADCE2]">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-[#FFF0F2]/50">
                        <td className="p-4 font-semibold text-gray-400">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 border border-rose-300 font-bold">{exp.category}</span>
                        </td>
                        <td className="p-4 font-semibold text-[#1A1112] dark:text-[#FFF5F6]">{exp.notes || 'Studio expenditure'}</td>
                        <td className="p-4 text-right font-serif font-extrabold text-red-500">
                          - KSh {Number(exp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}
