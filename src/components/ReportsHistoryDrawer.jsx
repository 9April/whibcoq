import React, { useState } from 'react';
import { X, Receipt, BarChart3 } from 'lucide-react';
import { InvoiceHistory } from './InvoiceHistory';
import { AnalyticsReports } from './AnalyticsReports';
import { playHapticSound } from '../utils/storage';

export function ReportsHistoryDrawer({
  isOpen,
  onClose,
  invoices,
  clients,
  products,
  onDeleteInvoice,
  onEditInvoice,
  onOpenPrint,
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'reports'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-fadeIn" dir="rtl">
      <div className="w-full max-w-4xl h-full sm:h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              {activeTab === 'history' ? <Receipt className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">التقارير والسجل التجاري</h2>
              <p className="text-[11px] text-slate-400">متابعة الفواتير السابقة وإحصائيات المبيعات والأوزان</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setActiveTab('history');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>السجل ({invoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setActiveTab('reports');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reports'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>التقارير</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50">
          {activeTab === 'history' ? (
            <InvoiceHistory
              invoices={invoices}
              clients={clients}
              onDeleteInvoice={onDeleteInvoice}
              onEditInvoice={(inv) => {
                onEditInvoice(inv);
                onClose();
              }}
              onOpenPrint={onOpenPrint}
            />
          ) : (
            <AnalyticsReports
              invoices={invoices}
              clients={clients}
              products={products}
            />
          )}
        </div>
      </div>
    </div>
  );
}
