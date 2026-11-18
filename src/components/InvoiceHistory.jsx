import React, { useState, useMemo } from 'react';
import { Search, Printer, Edit3, ChevronLeft, Calendar, FileText } from 'lucide-react';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';
import { INITIAL_CLIENTS } from '../data/initialData';
import { InvoicePrintModal } from './InvoicePrintModal';

export function InvoiceHistory({
  invoices,
  clients = [],
  onEditInvoice,
  onOpenPrint,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Map clientId to category for displaying badges like "مطعم", "سناك", "شواية"
  const clientCategoryMap = useMemo(() => {
    const map = {};
    INITIAL_CLIENTS.forEach((c) => {
      if (c.id && c.category) map[c.id] = c.category;
      if (c.name && c.category) {
        map[c.name.trim()] = c.category;
        map[c.name.trim().toLowerCase()] = c.category;
      }
    });

    if (Array.isArray(clients)) {
      clients.forEach((c) => {
        if (c.id && c.category) map[c.id] = c.category;
        if (c.name && c.category) {
          map[c.name.trim()] = c.category;
          map[c.name.trim().toLowerCase()] = c.category;
        }
      });
    }
    return map;
  }, [clients]);

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
    <div className="flex flex-col gap-3 pb-24 animate-fadeIn" dir="rtl">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الزبون أو التاريخ..."
            className="w-full h-11 pr-10 pl-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Invoices List (1 col on mobile, 2 or 3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length > 0 ? (
          filtered.map((inv) => {
            const rawName = (inv.clientName || '').trim();
            let category =
              clientCategoryMap[inv.clientId] ||
              clientCategoryMap[rawName] ||
              clientCategoryMap[rawName.toLowerCase()] ||
              inv.clientCategory ||
              '';

            if (!category) {
              const lower = rawName.toLowerCase();
              if (lower.includes('مطعم')) category = 'مطعم';
              else if (lower.includes('سناك')) category = 'سناك';
              else if (lower.includes('شواية')) category = 'شواية';
              else if (lower.includes('جملة')) category = 'تاجر جملة';
              else if (lower.includes('طباخ') || lower.includes('حفل')) category = 'تموين حفلات';
              else if (lower.includes('نقدي') || lower.includes('مباشر')) category = 'مباشر';
              else category = 'زبون تجاري';
            }

            return (
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
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-3 shadow-xs flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {/* Client Info (Reduced Font Size & Category Badge like snack/restaurants) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                      {inv.clientName}
                    </span>
                    {category && (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        {category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium font-mono tabular-nums mt-0.5 truncate">
                    <span>{inv.date}</span>
                    <span>•</span>
                    <span>{formatKg(inv.totalWeight)}</span>
                  </div>
                </div>

                {/* Price & Action Buttons (Print & Edit) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-left font-mono">
                    <span className="text-xs sm:text-sm font-black text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatDh(inv.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
            );
          })
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

export default InvoiceHistory;
