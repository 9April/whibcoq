import React, { useRef } from 'react';
import { Printer, PlusCircle, X, Share2, Copy, FileText, Check } from 'lucide-react';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';
import { BUSINESS_INFO } from '../data/initialData';

export function InvoicePrintModal({
  isOpen,
  onClose,
  invoice,
  onNewInvoice,
}) {
  const printAreaRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    playHapticSound('success');
    window.print();
  };

  const handleNewInvoiceClick = () => {
    playHapticSound('tap');
    onNewInvoice();
    onClose();
  };

  const displayDate = () => {
    if (!invoice.date) return '';
    const parts = invoice.date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return invoice.date;
  };

  const copySummaryText = () => {
    playHapticSound('tap');
    let text = `*فاتورة ${BUSINESS_INFO.name}*\n`;
    text += `رقم الفاتورة: #${invoice.id}\n`;
    text += `الزبون: ${invoice.clientName}\n`;
    text += `التاريخ: ${displayDate()}\n`;
    text += `------------------------\n`;
    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.productName}: ${item.weight} كغ × ${item.price} د.م = ${formatDh(item.total)}\n`;
    });
    text += `------------------------\n`;
    text += `*الوزن الإجمالي: ${formatKg(invoice.totalWeight)}*\n`;
    text += `*المجموع الصافي: ${formatDh(invoice.totalAmount)}*\n`;

    navigator.clipboard.writeText(text);
    alert('تم نسخ ملخص الفاتورة بنجاح لمشاركته!');
  };

  return (
    <div className="printable-invoice-modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className="printable-invoice-modal-dialog w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[96vh]"
        dir="rtl"
      >
        {/* Modal Action Bar (Screen Only - Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <span className="text-base font-black">فاتورة بيع #{invoice.id}</span>
              <span className="text-xs text-slate-400 block">{invoice.clientName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Direct Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / PDF</span>
            </button>

            {/* Copy / Share Button */}
            <button
              type="button"
              onClick={copySummaryText}
              className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 active:scale-95"
              title="نسخ للواتساب"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نسخ</span>
            </button>

            {/* New Invoice Button */}
            <button
              type="button"
              onClick={handleNewInvoiceClick}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 border border-slate-700 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>فاتورة جديدة</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="printable-invoice-area-wrapper overflow-y-auto p-3 sm:p-8 bg-slate-100/60 flex justify-center">
          <div
            ref={printAreaRef}
            className="printable-invoice-area w-full max-w-[210mm] bg-white text-slate-900 p-5 sm:p-10 rounded-2xl shadow-sm border border-slate-200"
          >
            {/* Header matching classic WAHIB COQ invoice */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {BUSINESS_INFO.name}
                  </h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    {BUSINESS_INFO.frenchSubtitle}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {BUSINESS_INFO.arabicTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    {BUSINESS_INFO.taxInfo}
                  </p>
                </div>

                <div className="text-left border-2 border-slate-900 rounded-xl p-2.5 bg-slate-50 min-w-[170px]" dir="ltr">
                  <div className="text-right" dir="rtl">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase">
                      FACTURE / وصل بيع
                    </span>
                    <span className="block text-xl font-black text-slate-900 font-mono tabular-nums">
                      N° {invoice.id}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>التاريخ:</span>
                      <span className="font-mono tabular-nums">{displayDate()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Info Bar */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">الزبون / Client:</span>
                  <span className="text-base font-black text-slate-900">{invoice.clientName}</span>
                </div>
                {invoice.clientPhone && (
                  <div className="text-xs font-mono font-semibold text-slate-700" dir="ltr">
                    Tél: {invoice.clientPhone}
                  </div>
                )}
              </div>
            </div>

            {/* 4-Column Official Poultry Table */}
            <table className="print-table w-full text-right border-2 border-slate-900 mb-4">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-900 text-xs sm:text-sm font-black">
                  <th className="py-2 px-2.5 border-l-2 border-slate-900 text-center w-10">#</th>
                  <th className="py-2 px-3 border-l-2 border-slate-900">المنتوج / Désignation</th>
                  <th className="py-2 px-3 border-l-2 border-slate-900 text-center w-28">العدد بـ Kg</th>
                  <th className="py-2 px-3 border-l-2 border-slate-900 text-center w-24">الثمن (Dh)</th>
                  <th className="py-2 px-3 text-left w-32">المجموع (Dh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-xs sm:text-sm">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={item.productId || index} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 border-l-2 border-slate-900 text-center font-bold text-slate-600 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 border-l-2 border-slate-900 font-bold text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-2 px-3 border-l-2 border-slate-900 text-center font-mono font-bold text-sm tabular-nums">
                        {item.weight}
                      </td>
                      <td className="py-2 px-3 border-l-2 border-slate-900 text-center font-mono font-bold text-sm tabular-nums">
                        {Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-left font-mono font-black text-sm text-slate-900 tabular-nums">
                        {formatDh(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-400">
                      لا توجد بنود
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Summary Box */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-72 border-2 border-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700">
                  <span>مجموع الوزن (Poids Total):</span>
                  <span className="font-mono text-sm font-black text-slate-900 tabular-nums">
                    {formatKg(invoice.totalWeight)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 text-white">
                  <span className="font-black text-sm">المجموع الكلي (TOTAL):</span>
                  <span className="font-mono text-xl font-black text-emerald-400 tabular-nums">
                    {formatDh(invoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="border-t border-slate-300 pt-4 mt-auto">
              <div className="grid grid-cols-2 gap-6 text-center text-xs">
                <div className="border border-slate-300 rounded-xl p-3 h-20 flex flex-col justify-between">
                  <span className="font-bold text-slate-600">توقيع واستلام الزبون</span>
                </div>
                <div className="border border-slate-300 rounded-xl p-3 h-20 flex flex-col justify-between">
                  <span className="font-bold text-slate-600">خاتم وتوقيع المحل ({BUSINESS_INFO.name})</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-3 font-semibold">
                {BUSINESS_INFO.name} • {BUSINESS_INFO.address} • Tél: {BUSINESS_INFO.phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
