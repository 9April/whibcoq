import React, { useState, useMemo } from 'react';
import { Search, Printer, Edit3, ChevronLeft, Calendar, FileText, X, Trash2, AlertTriangle } from 'lucide-react';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';
import { INITIAL_CLIENTS } from '../data/initialData';
import { InvoicePrintModal } from './InvoicePrintModal';

export function InvoiceHistory({
  invoices,
  clients = [],
  onDeleteInvoice,
  onEditInvoice,
  onOpenPrint,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

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
    const cleanTermDigits = term.replace(/\D/g, '');
    const cleanPhone = (inv.clientPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanTermDigits.length > 0 && cleanPhone.includes(cleanTermDigits);

    const nameMatch = inv.clientName?.toLowerCase().includes(term);
    const idMatch = String(inv.id).includes(term);
    const dateMatch = inv.date?.includes(term);
    return nameMatch || idMatch || dateMatch || phoneMatch || (inv.clientPhone && inv.clientPhone.includes(term));
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

  const handleDeleteClick = (inv, e) => {
    e.stopPropagation();
    playHapticSound('warning');
    setInvoiceToDelete(inv);
  };

  const handleConfirmDelete = () => {
    if (!invoiceToDelete) return;
    playHapticSound('tap');
    if (onDeleteInvoice) {
      onDeleteInvoice(invoiceToDelete.id);
    }
    setInvoiceToDelete(null);
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
            placeholder="بحث باسم الزبون، الهاتف، أو التاريخ..."
            dir={/^[0-9+]/.test(searchTerm.trim()) ? 'ltr' : 'rtl'}
            className={`w-full h-11 pr-10 pl-9 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all ${
              /^[0-9+]/.test(searchTerm.trim()) ? 'text-left font-mono tracking-wider' : 'text-right'
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Invoices List (Full-width vertical list, one under one) */}
      <div className="flex flex-col gap-2.5 w-full">
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
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-3 sm:px-5 sm:py-3.5 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] w-full"
              >
                {/* Client Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-md">
                      {inv.clientName}
                    </span>
                    {category && (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        {category}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                      #{inv.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-medium font-mono tabular-nums mt-1 truncate">
                    <span>{inv.date}</span>
                    <span>•</span>
                    <bdi dir="ltr">{formatKg(inv.totalWeight)}</bdi>
                  </div>
                </div>

                {/* Price & Action Buttons (Print, Edit, Delete) */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  <div className="text-left font-mono">
                    <span className="text-xs sm:text-base font-black text-emerald-700 tabular-nums whitespace-nowrap">
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

                    {onDeleteInvoice && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(inv, e)}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center active:scale-95 border border-slate-200 transition-colors"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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

      {/* Delete Confirmation Warning Popup Modal */}
      {invoiceToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setInvoiceToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header with Warning Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تأكيد حذف الفاتورة</h3>
                <p className="text-xs text-rose-600 font-bold">تحذير: هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              </div>
            </div>

            {/* Warning Message & Invoice Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">الزبون:</span>
                <span className="font-black text-slate-900 truncate max-w-[180px]">
                  {invoiceToDelete.clientName || 'زبون عام'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">رقم الفاتورة:</span>
                <span className="font-mono font-bold text-slate-700">
                  #{invoiceToDelete.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">التاريخ:</span>
                <span className="font-mono text-slate-600">
                  {invoiceToDelete.date}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                <span className="text-slate-500 font-medium">المبلغ الإجمالي:</span>
                <span className="font-mono font-black text-emerald-700">
                  {formatDh(invoiceToDelete.totalAmount)}
                </span>
              </div>
              {invoiceToDelete.totalWeight > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">الوزن الإجمالي:</span>
                  <bdi dir="ltr" className="font-mono font-bold text-slate-700">
                    {formatKg(invoiceToDelete.totalWeight)}
                  </bdi>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ سيتم مسحها نهائياً من السجل وقاعدة البيانات.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceHistory;
