import React from 'react';
import { X, Users } from 'lucide-react';
import { ClientsManager } from './ClientsManager';
import { playHapticSound } from '../utils/storage';

export function ClientsDrawer({
  isOpen,
  onClose,
  clients = [],
  invoices = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onStartInvoiceForClient,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-fadeIn" dir="rtl">
      <div className="w-full max-w-4xl h-full sm:h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">إدارة وتعديل الزبائن</h2>
                {clients.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500 text-slate-950 tabular-nums">
                    {clients.length} زبون
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">عرض الزبائن الحاليين، تعديل البيانات، إضافة زبون، أو إنشاء فاتورة مباشرة</p>
            </div>
          </div>

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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50">
          <ClientsManager
            clients={clients}
            invoices={invoices}
            onAddClient={onAddClient}
            onUpdateClient={onUpdateClient}
            onDeleteClient={onDeleteClient}
            onStartInvoiceForClient={onStartInvoiceForClient}
          />
        </div>
      </div>
    </div>
  );
}
