import React, { useRef, useState } from 'react';
import { Printer, PlusCircle, X, Share2, Copy, FileText, Check, Download, FileDown, Loader2 } from 'lucide-react';
import { formatDh, formatKg, formatPhone, playHapticSound, getBusinessInfo } from '../utils/storage';

export function InvoicePrintModal({
  isOpen,
  onClose,
  invoice,
  onNewInvoice,
}) {
  const printAreaRef = useRef(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const businessInfo = getBusinessInfo();

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    playHapticSound('success');
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Direct Save to Device (Downloads / Desktop) as PDF WITHOUT connecting to printer
  const handleSaveToDevice = async () => {
    if (!printAreaRef.current || !invoice) return;
    setIsSavingPdf(true);
    playHapticSound('success');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = printAreaRef.current;
      const cleanClientName = (invoice.clientName || 'Client').replace(/[^\w\u0600-\u06FF\s-]/gi, '').trim();
      const filename = `Facture_${invoice.id}_${cleanClientName || 'Client'}.pdf`;

      const opt = {
        margin: [4, 4, 4, 4],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving PDF:', err);
      alert('حدث خطأ أثناء حفظ الفاتورة، يرجى المحاولة ثانية');
    } finally {
      setIsSavingPdf(false);
    }
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

    const formatAmountArabic = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '0,00 درهم';
      const val = Number(num);
      const parts = val.toFixed(2).split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${integerPart},${parts[1]} درهم`;
    };

    const formatWeightArabic = (num) => {
      if (num === null || num === undefined || isNaN(num)) return '\u200E0.0 kg\u200E';
      const val = Number(num);
      const parts = val.toFixed(1).split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `\u200E${integerPart}.${parts[1]} kg\u200E`;
    };

    let text = `*فاتورة وهيب كوك*\n`;
    text += `رقم الفاتورة: ${invoice.id}\n`;
    text += `الزبون: ${invoice.clientName}\n`;
    text += `التاريخ: ${displayDate()}\n`;
    text += `------------------------\n`;
    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.productName}: ${item.weight} kg × ${item.price} درهم = ${formatAmountArabic(item.total)}\n`;
    });
    text += `------------------------\n`;
    text += `*الوزن الإجمالي: ${formatWeightArabic(invoice.totalWeight)}*\n`;
    text += `*المجموع الصافي: ${formatAmountArabic(invoice.totalAmount)}*\n`;

    navigator.clipboard.writeText(text);
    alert('تم نسخ تفاصيل الفاتورة بنجاح!');
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
            <img
              src="/wahibcoq.jpeg"
              alt="WAHIB COQ"
              className="w-8 h-8 rounded-lg object-cover border border-slate-700"
            />
            <div>
              <span className="text-base font-black">فاتورة بيع #{invoice.id}</span>
              <span className="text-xs text-slate-400 block">{invoice.clientName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Direct Save to Device (Downloads / Desktop) Button - DOES NOT connect to printer */}
            <button
              type="button"
              onClick={handleSaveToDevice}
              disabled={isSavingPdf}
              className="h-10 px-3.5 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
              title="تحميل الفاتورة مباشرة بصيغة PDF إلى التنزيلات أو سطح المكتب بدون الحاجة لطابعة"
            >
              {isSavingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تم التنزيل!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>حفظ بالجهاز</span>
                </>
              )}
            </button>

            {/* Direct Print Button - Connects to Default / Favourite Printer */}
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
              title="إرسال الفاتورة إلى الطابعة الافتراضية"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
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

        {/* Printable Official Receipt Body (Adapted to A5 Paper: 148mm x 210mm) */}
        <div className="printable-invoice-area-wrapper overflow-y-auto p-2 sm:p-6 bg-slate-100/60 flex justify-center">
          <div
            ref={printAreaRef}
            id="printable-invoice"
            className="printable-invoice-area w-full max-w-[148mm] bg-white text-slate-900 p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200"
          >
            {/* Header matching classic WAHIB COQ invoice (A5 Proportions) */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/wahibcoq.jpeg"
                    alt="WAHIB COQ"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border border-slate-300 p-0.5 bg-white flex-shrink-0"
                  />
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                      {businessInfo.name}
                    </h1>
                    <p className="text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">
                      {businessInfo.frenchSubtitle}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {businessInfo.arabicTitle}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono leading-tight">
                      {businessInfo.taxInfo}
                    </p>
                  </div>
                </div>

                <div className="text-left border-2 border-slate-900 rounded-xl p-1.5 bg-slate-50 min-w-[125px]" dir="ltr">
                  <div className="text-right" dir="rtl">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">
                      FACTURE / وصل بيع
                    </span>
                    <span className="block text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums leading-tight">
                      N° {invoice.id}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-300 flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>التاريخ:</span>
                      <span className="font-mono tabular-nums">{displayDate()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Info Bar */}
              <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500">الزبون:</span>
                  <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{invoice.clientName}</span>
                  {invoice.clientCategory && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                      {invoice.clientCategory}
                    </span>
                  )}
                </div>
                {invoice.clientPhone && (
                  <div className="text-[11px] font-mono font-semibold text-slate-700 flex items-center gap-1 flex-shrink-0">
                    <span>Tél:</span>
                    <bdi dir="ltr" className="font-mono tabular-nums tracking-wide inline-block" style={{ unicodeBidi: 'isolate', direction: 'ltr' }}>
                      {formatPhone(invoice.clientPhone)}
                    </bdi>
                  </div>
                )}
              </div>
            </div>

            {/* 4-Column Official Poultry Table (A5 Compact) */}
            <table className="print-table w-full text-right border-2 border-slate-900 mb-2">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-900 text-[11px] font-black">
                  <th className="py-1 px-1.5 border-l-2 border-slate-900 text-center w-8">#</th>
                  <th className="py-1 px-2 border-l-2 border-slate-900">المنتوج / Désignation</th>
                  <th className="py-1 px-2 border-l-2 border-slate-900 text-center w-20">الوزن (kg)</th>
                  <th className="py-1 px-2 border-l-2 border-slate-900 text-center w-18">الثمن (درهم)</th>
                  <th className="py-1 px-2 text-left w-24">المجموع (درهم)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={item.productId || index} className="hover:bg-slate-50">
                      <td className="py-0.5 px-1.5 border-l-2 border-slate-900 text-center font-bold text-slate-600 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-0.5 px-2 border-l-2 border-slate-900 font-bold text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-0.5 px-2 border-l-2 border-slate-900 text-center font-mono font-bold tabular-nums">
                        {item.weight}
                      </td>
                      <td className="py-0.5 px-2 border-l-2 border-slate-900 text-center font-mono font-bold tabular-nums">
                        {Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-0.5 px-2 text-left font-mono font-black text-slate-900 tabular-nums">
                        {formatDh(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-2 text-center text-slate-400">
                      لا توجد بنود
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Summary Box (A5 Compact) */}
            <div className="flex justify-end mb-2">
              <div className="w-full sm:w-60 border-2 border-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-1 bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                  <span>مجموع الوزن (Poids Total):</span>
                  <span className="font-mono text-xs font-black text-slate-900 tabular-nums" dir="ltr">
                    {formatKg(invoice.totalWeight)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-900 text-white">
                  <span className="font-black text-xs">المجموع الكلي (TOTAL):</span>
                  <span className="font-mono text-base font-black text-emerald-400 tabular-nums">
                    {formatDh(invoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-1.5 mt-auto text-center text-[9px] text-slate-500 font-semibold">
              {businessInfo.name} • {businessInfo.address} • Tél: {businessInfo.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
