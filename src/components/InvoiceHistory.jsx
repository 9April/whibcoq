import React, { useState } from 'react';
import { Search, Printer, Edit3, ChevronLeft, Calendar, FileText } from 'lucide-react';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';
import { InvoicePrintModal } from './InvoicePrintModal';

export function InvoiceHistory({
  invoices,
  onEditInvoice,
  onOpenPrint,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  const filtered = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = inv.clientName?.toLowerCase().includes(term);
    const idMatch = String(inv.id).includes(term);
    const dateMatch = inv.date?.includes(term);
    return nameMatch || idMatch || dateMatch;
  });

  const handleEdit = (inv, e) => {
    e.stopPropagation();
    playHapticSound('tap');
    onEditInvoice(inv);
  };

  const handlePrint = (inv, e) => {
    e.stopPropagation();
    playHapticSound('tap');
    if (onOpenPrint) {
      onOpenPrint(inv);
    } else {
      setSelectedInvoiceForPrint(inv);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fadeIn">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، التاريخ، أو رقم الفاتورة..."
            className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-2">
        {filtered.length > 0 ? (
          filtered.map((inv) => (
            <div
              key={inv.id}
              onClick={() => {
                playHapticSound('tap');
                if (onOpenPrint) {
                  onOpenPrint(inv);
                } else {
                  setSelectedInvoiceForPrint(inv);
                }
              }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-3.5 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black font-mono text-sm flex-shrink-0 tabular-nums">
                  #{inv.id}
                </span>

                <div className="min-w-0">
                  <div className="text-base font-black text-slate-900 truncate">
                    {inv.clientName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold font-mono tabular-nums">
                    <span>{inv.date}</span>
                    <span>•</span>
                    <span>{inv.items?.length || 0} بنود</span>
                    <span>•</span>
                    <span>{formatKg(inv.totalWeight)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Total & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-left font-mono">
                  <span className="text-base sm:text-lg font-black text-emerald-700 block tabular-nums">
                    {formatDh(inv.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border-r border-slate-100 pr-1.5 mr-1">
                  <button
                    type="button"
                    onClick={(e) => handlePrint(inv, e)}
                    className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-colors border border-emerald-200"
                    title="طباعة ومعاينة الفاتورة"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleEdit(inv, e)}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center active:scale-95 border border-slate-200"
                    title="تعديل الفاتورة"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs font-bold">
            لا توجد فواتير مطابقة
          </div>
        )}
      </div>

      {/* Re-Print Preview Modal (Fallback if not handled by root App) */}
      {!onOpenPrint && selectedInvoiceForPrint && (
        <InvoicePrintModal
          isOpen={!!selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
          invoice={selectedInvoiceForPrint}
          onNewInvoice={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
}
