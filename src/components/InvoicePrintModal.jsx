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

        {/* Printable Official Receipt Body (Spacious & Minimal A4/A5 with Two-Tone Wave) */}
        <div className="printable-invoice-area-wrapper overflow-y-auto p-2 sm:p-6 bg-slate-100/60 flex justify-center">
          <div
            ref={printAreaRef}
            id="printable-invoice"
            className="printable-invoice-area w-full max-w-[144mm] min-h-[200mm] bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          >
            {/* Top Section */}
            <div>
              {/* Top Header Row */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <img
                    src="/wahibcoq.jpeg"
                    alt="WAHIB COQ"
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-0.5 bg-white flex-shrink-0"
                  />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {businessInfo.name || 'WAHIB COQ'}
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {businessInfo.frenchSubtitle || 'Vente de poulets vivants et découpes'}
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono" dir="ltr">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    رقم الفاتورة
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                    NO. {String(invoice.id).padStart(6, '0')}
                  </span>
                </div>
              </div>

              {/* Main Title & Date Line */}
              <div className="pt-3 pb-2 flex items-baseline justify-between border-b border-slate-100">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                  فاتورة / INVOICE
                </h2>
                <div className="text-xs sm:text-sm font-bold text-slate-600">
                  <span className="text-slate-400 ml-1">التاريخ :</span>
                  <span className="font-mono font-black text-slate-800 tabular-nums">{displayDate()}</span>
                </div>
              </div>

              {/* Two-Column Address Block */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
                {/* Billed to */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    فاتورة إلى (Billed to):
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {invoice.clientName}
                  </span>
                  {invoice.clientPhone && (
                    <span className="text-slate-600 font-mono text-[11px]" dir="ltr">
                      Tél: {formatPhone(invoice.clientPhone)}
                    </span>
                  )}
                  {invoice.clientAddress && (
                    <span className="text-slate-500 text-[11px]">
                      {invoice.clientAddress}
                    </span>
                  )}
                </div>

                {/* From */}
                <div className="flex flex-col gap-0.5 text-left" dir="ltr">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    من طرف (From):
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {businessInfo.name || 'WAHIB COQ'}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    {businessInfo.frenchSubtitle || 'Vente de poulets vivants et découpes'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {businessInfo.address}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {businessInfo.taxInfo}
                  </span>
                </div>
              </div>

              {/* Clean Minimalist Table (Light Gray #E5E7EB Header Row, No Heavy Vertical Borders) */}
              <table className="print-table w-full text-right border-collapse my-3">
                <thead>
                  <tr className="bg-[#E5E7EB] text-slate-800 text-xs font-black">
                    <th className="py-2 px-2.5 text-right">المنتوج (Item)</th>
                    <th className="py-2 px-2.5 text-center w-24">الوزن (Kg)</th>
                    <th className="py-2 px-2.5 text-center w-24">الثمن (Dh)</th>
                    <th className="py-2 px-2.5 text-left w-28">المجموع (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={item.productId || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2.5 font-bold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-800 tabular-nums">
                          {item.weight}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-800 tabular-nums">
                          {Number(item.price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-left font-mono font-black text-slate-900 tabular-nums">
                          {formatDh(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 font-medium">
                        لا توجد بنود
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-b-2 border-slate-300 font-black text-xs sm:text-sm bg-slate-50/60">
                    <td className="py-2.5 px-2.5 text-slate-900">
                      المجموع الكلي (Total)
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900 tabular-nums">
                      {formatKg(invoice.totalWeight)}
                    </td>
                    <td className="py-2.5 px-2.5"></td>
                    <td className="py-2.5 px-2.5 text-left font-mono font-black text-base text-emerald-700 tabular-nums">
                      {formatDh(invoice.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer Notes: Payment Method & Thank you */}
              <div className="py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">طريقة الدفع :</span>
                  <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {invoice.paymentMethod || 'نقداً'}
                  </span>
                </div>
                <div className="font-bold text-slate-600">
                  <span className="text-slate-400 ml-1">ملاحظة :</span>
                  <span>شكراً لتعاملكم معنا!</span>
                </div>
              </div>
            </div>

            {/* Bottom Decorative Modern Wave (Two-tone charcoal #374151 and light gray #D1D5DB) */}
            <div className="invoice-bottom-wave w-full overflow-hidden leading-none mt-auto pt-4">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 sm:h-14">
                <path
                  d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
                  fill="#D1D5DB"
                />
                <path
                  d="M0,35 C200,110 400,-10 600,70 C800,150 1000,30 1200,60 L1200,120 L0,120 Z"
                  fill="#374151"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
