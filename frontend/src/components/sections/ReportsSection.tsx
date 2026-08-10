"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { FileText, Download, TrendingUp, DollarSign, Info } from 'lucide-react';

export default function ReportsSection() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      let incomes: any[] = [];
      let expenses: any[] = [];

      if (navigator.onLine && token) {
        try {
          const incRes = await fetch(`${API_BASE_URL}/finance/income`, { headers });
          if (incRes.ok) incomes = await incRes.json();
          const expRes = await fetch(`${API_BASE_URL}/finance/expenses`, { headers });
          if (expRes.ok) expenses = await expRes.json();
        } catch (e) {
          console.warn('API fetch failed for reports, falling back to IndexedDB.');
        }
      }

      if (incomes.length === 0 && expenses.length === 0) {
        incomes = await db.income.toArray();
        expenses = await db.expenses.toArray();
      }

      if (incomes.length === 0 && expenses.length === 0) {
        setReportData([]);
        setTotalRevenue(0);
        setTotalExpenses(0);
        setTotalProfit(0);
        setLoading(false);
        return;
      }

      // Aggregate by Month
      const monthlyMap: { [key: string]: { month: string; revenue: number; expenses: number; profit: number } } = {};

      incomes.forEach(inc => {
        const d = new Date(inc.paymentDate || inc.date || Date.now());
        const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        if (!monthlyMap[key]) {
          monthlyMap[key] = { month: key, revenue: 0, expenses: 0, profit: 0 };
        }
        monthlyMap[key].revenue += Number(inc.amount || 0) + Number(inc.tips || 0);
      });

      expenses.forEach(exp => {
        const d = new Date(exp.date || Date.now());
        const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        if (!monthlyMap[key]) {
          monthlyMap[key] = { month: key, revenue: 0, expenses: 0, profit: 0 };
        }
        monthlyMap[key].expenses += Number(exp.amount || 0);
      });

      const aggregated = Object.values(monthlyMap).map(m => ({
        ...m,
        profit: m.revenue - m.expenses,
      }));

      const totRev = aggregated.reduce((acc, curr) => acc + curr.revenue, 0);
      const totExp = aggregated.reduce((acc, curr) => acc + curr.expenses, 0);

      setReportData(aggregated);
      setTotalRevenue(totRev);
      setTotalExpenses(totExp);
      setTotalProfit(totRev - totExp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: string) => {
    alert(`Exporting business journal report in ${format} format...`);
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 border-b-2 border-[#1A1112] pb-3 justify-between items-center">
        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-extrabold">Financial Reports & Performance Analytics</span>
        
        <div className="flex gap-2">
          <button 
            onClick={() => handleDownload('PDF')} 
            className="flex items-center gap-1.5 text-xs font-serif font-bold bg-[#E91E63] hover:bg-[#D81557] text-white px-4 py-2 rounded-xl shadow-md border border-[#1A1112] transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Download PDF Report
          </button>
          <button 
            onClick={() => handleDownload('Excel')} 
            className="flex items-center gap-1.5 text-xs font-serif font-bold bg-[#1A1112] hover:bg-black text-white px-4 py-2 rounded-xl shadow-md border border-[#1A1112] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Excel Ledger
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-serif italic text-gray-400">Loading report metrics...</div>
      ) : reportData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#FFFBFB] dark:bg-[#1C1113] rounded-3xl border-2 border-[#1A1112] text-center space-y-3">
          <Info className="w-12 h-12 text-gray-300 mb-1" />
          <h3 className="font-serif text-lg font-extrabold text-[#1A1112] dark:text-[#FFF5F6]">No Transaction Records</h3>
          <p className="font-serif italic text-sm text-gray-400 max-w-md">
            No income or expense entries have been recorded yet. Log sessions or expenses to generate dynamic financial growth charts.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] rounded-3xl shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Income</span>
              <span className="text-xl font-serif font-extrabold text-green-600 block mt-1">KSh {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="p-5 bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] rounded-3xl shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Expenses</span>
              <span className="text-xl font-serif font-extrabold text-red-500 block mt-1">KSh {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="p-5 bg-[#FFFBFB] dark:bg-[#1C1113] border-2 border-[#1A1112] rounded-3xl shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Accumulated Profit</span>
              <span className="text-xl font-serif font-extrabold text-[#E91E63] block mt-1">KSh {totalProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-6 rounded-3xl border-2 border-[#1A1112] shadow-sm">
            <h3 className="font-serif text-sm font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E91E63]" /> Monthly Revenue & Expense Trends
            </h3>

            <div className="w-full h-80 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FADCE2" />
                  <XAxis dataKey="month" stroke="#909090" />
                  <YAxis stroke="#909090" />
                  <Tooltip contentStyle={{ background: '#FFFBFB', border: '2px solid #1A1112', borderRadius: '16px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue (KSh)" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses (KSh)" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Net Profit (KSh)" stroke="#E91E63" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Expense Breakdown Bar Chart */}
          <div className="bg-[#FFFBFB] dark:bg-[#1C1113] p-6 rounded-3xl border-2 border-[#1A1112] shadow-sm">
            <h3 className="font-serif text-sm font-extrabold text-[#1A1112] dark:text-[#FFF5F6] italic mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E91E63]" /> Monthly Expense Comparison
            </h3>

            <div className="w-full h-80 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FADCE2" />
                  <XAxis dataKey="month" stroke="#909090" />
                  <YAxis stroke="#909090" />
                  <Tooltip contentStyle={{ background: '#FFFBFB', border: '2px solid #1A1112', borderRadius: '16px' }} />
                  <Legend />
                  <Bar dataKey="expenses" name="Expenses (KSh)" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
