import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  UserPlus,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Trash2,
  Filter,
  Check,
  ArrowRight,
  ArrowLeft,
  Search,
  Printer,
  Package,
  Clock,
  Sparkles,
  X,
  Plus,
  AlertTriangle,
  Download,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
} from 'lucide-react';
import { INITIAL_PRODUCTS, BUSINESS_INFO } from '../data/initialData';
import { ProductRow } from './ProductRow';
import { ClientModal } from './ClientModal';
import {
  formatDh,
  formatKg,
  formatArabicDate,
  formatPhone,
  getClientProductPrice,
  saveClientProductPrice,
  getStoredProducts,
  persistProductWithDb,
  getNextInvoiceNumber,
  isInvoiceNumberTaken,
  getBusinessInfo,
  playHapticSound,
} from '../utils/storage';

export function InvoiceBuilder({
  clients,
  invoices = [],
  products = getStoredProducts(),
  onAddProduct,
  initialClientId,
  onAddClient,
  onSaveInvoice,
  onOpenPrint,
  editingInvoice,
  onCancelEdit,
}) {
  const businessInfo = getBusinessInfo();

  // Step State: 1 = Client & Date, 2 = Products & Weights, 3 = Preview & Final Invoice
  const [step, setStep] = useState(1);

  // Step 1: Client, Auto-Incremented Invoice #, and Date
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    if (editingInvoice?.id) return editingInvoice.id;
    return getNextInvoiceNumber(invoices);
  });
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Payment Method: 'نقداً' | 'شيك' | 'تحويل' | 'كريدي'
  const [paymentMethod, setPaymentMethod] = useState('نقداً');

  // Step 2: Products & Weights
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active'
  const [itemsState, setItemsState] = useState(() => {
    const init = {};
    (products || []).forEach((p) => {
      const customPrice = getClientProductPrice(initialClientId, p.id, p.defaultPrice);
      init[p.id] = { weight: '', price: customPrice };
    });
    return init;
  });

  // Modals & PDF export state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const printAreaRef = useRef(null);

  // Set default client on load
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Load custom prices when client or products change
  useEffect(() => {
    if (!selectedClientId) return;

    setItemsState((prev) => {
      const next = { ...prev };
      products.forEach((p) => {
        const customPrice = getClientProductPrice(selectedClientId, p.id, p.defaultPrice);
        next[p.id] = {
          weight: prev[p.id]?.weight || '',
          price: prev[p.id]?.price !== undefined && prev[p.id]?.price !== '' ? prev[p.id].price : customPrice,
        };
      });
      return next;
    });
  }, [selectedClientId, products]);

  // Handle Editing if an invoice is passed -> jump directly to step 3
  useEffect(() => {
    if (editingInvoice) {
      setSelectedClientId(editingInvoice.clientId || clients[0]?.id || '');
      setInvoiceNumber(editingInvoice.id);
      setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
      if (editingInvoice.paymentMethod) {
        setPaymentMethod(editingInvoice.paymentMethod);
      }

      const newState = {};
      products.forEach((p) => {
        const found = editingInvoice.items?.find((i) => i.productId === p.id);
        newState[p.id] = {
          weight: found ? found.weight : '',
          price: found ? found.price : p.defaultPrice,
        };
      });
      setItemsState(newState);
      setFilterMode('active');
      setStep(3);
    }
  }, [editingInvoice, clients, products]);

  // Invoice Number validation
  const handleInvoiceNumberChange = (val) => {
    const clean = val.replace(/[^\w-]/g, '');
    setInvoiceNumber(clean);
  };

  const handleInvoiceNumberBlur = () => {
    if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
      setShowDuplicateAlert(true);
      playHapticSound('error');
    }
  };

  const handleWeightChange = (productId, newWeight) => {
    setItemsState((prev) => {
      const prod = products.find((p) => p.id === productId);
      const defaultPrice = prod ? prod.defaultPrice : 0;
      const currentPrice =
        prev[productId]?.price !== undefined && prev[productId]?.price !== ''
          ? prev[productId].price
          : getClientProductPrice(selectedClientId, productId, defaultPrice);

      return {
        ...prev,
        [productId]: {
          weight: newWeight,
          price: currentPrice,
        },
      };
    });
  };

  const handlePriceChange = (productId, newPrice) => {
    setItemsState((prev) => {
      const currentWeight = prev[productId]?.weight !== undefined ? prev[productId].weight : '';
      return {
        ...prev,
        [productId]: {
          weight: currentWeight,
          price: newPrice,
        },
      };
    });

    if (selectedClientId) {
      saveClientProductPrice(selectedClientId, productId, Number(newPrice) || 0);
    }
  };

  const handleQuickAddProduct = async (e) => {
    e?.preventDefault();
    const clean = newProdName.trim();
    if (!clean) return;
    const priceNum = parseFloat(newProdPrice) || 0;
    const newProd = {
      name: clean,
      subname: '',
      defaultPrice: priceNum,
      category: 'découpe',
    };
    let updated;
    if (onAddProduct) {
      updated = await onAddProduct(newProd);
    } else {
      updated = await persistProductWithDb(newProd);
    }
    const created = updated?.find((p) => p.name === clean) || updated?.[updated.length - 1];
    if (created) {
      setItemsState((prev) => ({
        ...prev,
        [created.id]: { weight: '', price: priceNum },
      }));
    }
    setNewProdName('');
    setNewProdPrice('');
    setIsAddProductModalOpen(false);
    playHapticSound('success');
  };

  // Active items calculation
  const activeItems = products
    .map((p) => {
      const item = itemsState[p.id] || { weight: '', price: p.defaultPrice };
      const weight = parseFloat(item.weight) || 0;
      const price = parseFloat(item.price) || 0;
      return {
        productId: p.id,
        productName: p.name,
        subname: p.subname,
        number: p.number,
        weight,
        price,
        total: weight * price,
      };
    })
    .filter((item) => item.weight > 0);

  const grandTotal = activeItems.reduce((sum, item) => sum + item.total, 0);
  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'default',
    name: 'زبون نقدي',
    phone: '',
    address: '',
    category: 'عام',
  };

  const displayDate = () => {
    if (!invoiceDate) return '';
    const parts = invoiceDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return invoiceDate;
  };

  const handleClearAll = () => {
    playHapticSound('tap');
    const reset = {};
    products.forEach((p) => {
      const customPrice = getClientProductPrice(selectedClientId, p.id, p.defaultPrice);
      reset[p.id] = { weight: '', price: customPrice };
    });
    setItemsState(reset);
    setFilterMode('all');
    setStep(1);
    if (onCancelEdit) onCancelEdit();
  };

  // Build the invoice object
  const buildCurrentInvoiceObject = () => {
    return {
      id: invoiceNumber || getNextInvoiceNumber(invoices),
      clientId: selectedClientId,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      clientAddress: selectedClient.address,
      date: invoiceDate,
      items: activeItems,
      totalWeight: totalWeight,
      totalAmount: grandTotal,
      paymentMethod: paymentMethod,
      timestamp: editingInvoice ? editingInvoice.timestamp : Date.now(),
    };
  };

  const handleSaveInvoiceAction = () => {
    if (activeItems.length === 0) {
      playHapticSound('error');
      alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل لحفظ الفاتورة.');
      return;
    }

    if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
      setShowDuplicateAlert(true);
      playHapticSound('error');
      return;
    }

    playHapticSound('success');
    const invObj = buildCurrentInvoiceObject();
    onSaveInvoice(invObj);
  };

  // Direct Print
  const handlePrint = () => {
    playHapticSound('success');
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Direct Save PDF
  const handleSaveToDevice = async () => {
    if (!printAreaRef.current) return;
    setIsSavingPdf(true);
    playHapticSound('success');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = printAreaRef.current;
      const cleanClientName = (selectedClient.name || 'Client').replace(/[^\w\u0600-\u06FF\s-]/gi, '').trim();
      const filename = `Facture_${invoiceNumber}_${cleanClientName || 'Client'}.pdf`;

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
    } catch (err) {
      console.error('Error saving PDF:', err);
      alert('حدث خطأ أثناء حفظ الفاتورة كـ PDF');
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleStartNewInvoice = () => {
    playHapticSound('tap');
    const reset = {};
    products.forEach((p) => {
      reset[p.id] = { weight: '', price: p.defaultPrice };
    });
    setItemsState(reset);
    setFilterMode('all');
    setInvoiceNumber(getNextInvoiceNumber(invoices));
    setPaymentMethod('نقداً');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setStep(1);
    if (onCancelEdit) onCancelEdit();
  };

  // Filter clients list for Step 1
  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  // Filter products for Step 2
  const displayedProducts = products.filter((p) => {
    if (filterMode === 'active') {
      const w = parseFloat(itemsState[p.id]?.weight) || 0;
      return w > 0;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4 animate-fadeIn" dir="rtl">
      {/* ============================================================== */}
      {/* STICKY TOP PROGRESS INDICATOR (3 Sequential Guided Steps)      */}
      {/* ============================================================== */}
      <div className="no-print sticky top-12 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs p-2">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setStep(1);
            }}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              step === 1
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                step === 1 ? 'bg-white text-emerald-800' : 'bg-slate-300 text-slate-700'
              }`}
            >
              1
            </span>
            <span className="truncate">الزبون والتاريخ</span>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
                setShowDuplicateAlert(true);
                return;
              }
              setStep(2);
            }}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              step === 2
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                step === 2 ? 'bg-white text-emerald-800' : 'bg-slate-300 text-slate-700'
              }`}
            >
              2
            </span>
            <span className="truncate">المنتوجات والكميات</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
                setShowDuplicateAlert(true);
                return;
              }
              setStep(3);
            }}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              step === 3
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                step === 3 ? 'bg-white text-emerald-800' : 'bg-slate-300 text-slate-700'
              }`}
            >
              3
            </span>
            <span className="truncate">معاينة الفاتورة</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: CLIENT, INVOICE #, AND DATE                            */}
      {/* ============================================================== */}
      {step === 1 && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Card 1: Invoice Number & Date Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">رقم الفاتورة والتاريخ</h2>
                  <p className="text-[11px] text-slate-500">يتزايد رقم الفاتورة تلقائياً ويمكن تغييره يدوياً</p>
                </div>
              </div>

              {editingInvoice && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  تعديل #{editingInvoice.id}
                </span>
              )}
            </div>

            {/* Inputs Grid: Invoice # and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Invoice Number Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>رقم الفاتورة (N° de Facture)</span>
                  <span className="text-[10px] text-slate-400 font-mono">تلقائي +1</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={invoiceNumber}
                    onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                    onBlur={handleInvoiceNumberBlur}
                    className="w-full h-12 px-3.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-lg font-black font-mono text-slate-900 outline-none tabular-nums transition-all"
                    placeholder="000001"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    #NO
                  </span>
                </div>
              </div>

              {/* Invoice Date Picker */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  <span>تاريخ الفاتورة (Date)</span>
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full h-12 px-3.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-base font-bold text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Quick 1-Click Date Buttons: Today & Yesterday */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setInvoiceDate(new Date().toISOString().split('T')[0]);
                }}
                className={`h-11 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border cursor-pointer ${
                  invoiceDate === new Date().toISOString().split('T')[0]
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                <span className="truncate">تاريخ اليوم ({new Date().toISOString().split('T')[0].split('-').reverse().join('/')})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setInvoiceDate(d.toISOString().split('T')[0]);
                }}
                className={`h-11 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border cursor-pointer ${
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    return invoiceDate === d.toISOString().split('T')[0];
                  })()
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>تاريخ الأمس</span>
              </button>
            </div>
          </div>

          {/* Card 2: Client Selection & Creation Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">اختيار الزبون التجاري</h2>
                  <p className="text-[11px] text-slate-500">اختر من القائمة أو أضف زبوناً جديداً بضغطة زر</p>
                </div>
              </div>

              {/* Prominent Add Client Button */}
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsClientModalOpen(true);
                }}
                className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ إضافة زبون جديد</span>
              </button>
            </div>

            {/* Search Client Input */}
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="ابحث بالاسم، المحل، أو رقم الهاتف..."
                className="w-full h-12 pr-10 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {clientSearch && (
                <button
                  type="button"
                  onClick={() => setClientSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto p-0.5">
              {filteredClients.map((client) => {
                const isSelected = selectedClientId === client.id;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      playHapticSound('tap');
                      setSelectedClientId(client.id);
                    }}
                    className={`p-3 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-black text-sm text-slate-900 block truncate">
                          {client.name}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>

                    {(client.phone || client.address) && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
                        {client.phone && <span>{formatPhone(client.phone)}</span>}
                        {client.address && <span className="truncate text-slate-400">{client.address}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Continue Button to Step 2 */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
                setShowDuplicateAlert(true);
                return;
              }
              setStep(2);
            }}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span>متابعة: اختيار السلع والكميات (الخطوة 2)</span>
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: PRODUCTS, WEIGHTS, AND PRICES                          */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Header Summary Strip (Client & Date with Quick Edits) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(1);
                }}
                className="text-right truncate hover:opacity-80 transition-opacity cursor-pointer"
                title="تعديل الزبون"
              >
                <span className="text-[10px] font-bold text-slate-400 block">الزبون:</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                  {selectedClient.name}
                </span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(1);
                }}
                className="text-right truncate hover:opacity-80 transition-opacity cursor-pointer"
                title="تعديل التاريخ والرقم"
              >
                <span className="text-[10px] font-bold text-slate-400 block">الفاتورة #{invoiceNumber}:</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate block font-mono tabular-nums">
                  {displayDate()}
                </span>
              </button>
            </div>

            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
              الخطوة 2: السلع
            </span>
          </div>

          {/* List Filter Tabs & Add Product Button */}
          <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setFilterMode('all');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({products.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setFilterMode('active');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'active'
                    ? 'bg-white text-emerald-800 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>المختارة فقط</span>
                {activeItems.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center font-mono tabular-nums">
                    {activeItems.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsAddProductModalOpen(true);
                }}
                className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="إضافة منتوج جديد"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ منتوج جديد</span>
              </button>

              {activeItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>
          </div>

          {/* 12 Poultry Products List (1 col on mobile, 2 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 pb-24">
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product) => {
                const currentItem = itemsState[product.id] || { weight: '', price: product.defaultPrice };
                return (
                  <ProductRow
                    key={product.id}
                    product={product}
                    weight={currentItem.weight}
                    price={currentItem.price}
                    onWeightChange={handleWeightChange}
                    onPriceChange={handlePriceChange}
                  />
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm font-bold flex flex-col items-center gap-2">
                <span>لم يتم إدخال وزن أي منتوج بعد</span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-emerald-700 text-xs font-black underline mt-1 cursor-pointer"
                >
                  عرض قائمة المنتوجات ({products.length})
                </button>
              </div>
            )}
          </div>

          {/* Step 2 Bottom Checkout Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div className="max-w-lg md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
              {/* Grand Total */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <span>المجموع الكلي</span>
                  {activeItems.length > 0 && (
                    <span className="text-emerald-400 font-mono tabular-nums">
                      ({formatKg(totalWeight)})
                    </span>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                  {formatDh(grandTotal)}
                </div>
              </div>

              {/* Action Buttons: Prev & Continue to Step 3 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playHapticSound('tap');
                    setStep(1);
                  }}
                  className="h-12 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden sm:inline">السابق</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playHapticSound('tap');
                    if (activeItems.length === 0) {
                      alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل للمعاينة.');
                      return;
                    }
                    setStep(3);
                  }}
                  className="h-12 px-5 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <span>معاينة الفاتورة (الخطوة 3)</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: FINAL INVOICE PREVIEW & ACTIONS                         */}
      {/* ============================================================== */}
      {step === 3 && (
        <div className="flex flex-col gap-4 animate-fadeIn pb-12">
          {/* Top Control Bar: Payment Method & Return */}
          <div className="no-print bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-slate-500">طريقة الدفع:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                {['نقداً', 'شيك', 'تحويل', 'كريدي'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      playHapticSound('tap');
                      setPaymentMethod(method);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setStep(2);
              }}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>تعديل السلع</span>
            </button>
          </div>

          {/* Printable Official Invoice Card (A4/A5 with Two-Tone Wave) */}
          <div className="printable-invoice-area-wrapper overflow-y-auto p-1 sm:p-4 flex justify-center">
            <div
              ref={printAreaRef}
              id="printable-invoice"
              className="printable-invoice-area w-full max-w-[144mm] min-h-[200mm] bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
            >
              {/* Top Section */}
              <div>
                {/* Header Row: WAHIB COQ + Subtitle & Invoice Number */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <img
                      src="/wahibcoq.jpeg"
                      alt="WAHIB COQ"
                      className="w-13 h-13 sm:w-15 sm:h-15 object-contain rounded-xl border border-slate-200 p-0.5 bg-white flex-shrink-0"
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
                      NO. {String(invoiceNumber).padStart(6, '0')}
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
                      {selectedClient.name}
                    </span>
                    {selectedClient.phone && (
                      <span className="text-slate-600 font-mono text-[11px]" dir="ltr">
                        Tél: {formatPhone(selectedClient.phone)}
                      </span>
                    )}
                    {selectedClient.address && (
                      <span className="text-slate-500 text-[11px]">
                        {selectedClient.address}
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
                    {activeItems && activeItems.length > 0 ? (
                      activeItems.map((item, idx) => (
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
                          لا توجد سلع مختارة
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
                        {formatKg(totalWeight)}
                      </td>
                      <td className="py-2.5 px-2.5"></td>
                      <td className="py-2.5 px-2.5 text-left font-mono font-black text-base text-emerald-700 tabular-nums">
                        {formatDh(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer Notes: Payment Method & Thank you */}
                <div className="py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">طريقة الدفع :</span>
                    <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {paymentMethod}
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

          {/* Action Buttons Below Invoice */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-[144mm] mx-auto w-full">
            {/* 1. Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            {/* 2. Save Invoice */}
            <button
              type="button"
              onClick={handleSaveInvoiceAction}
              className="h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>حفظ وإصدار الفاتورة</span>
            </button>

            {/* 3. New Invoice */}
            <button
              type="button"
              onClick={handleStartNewInvoice}
              className="h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center gap-2 border border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DUPLICATE INVOICE NUMBER WARNING POPUP MODAL                   */}
      {/* ============================================================== */}
      {showDuplicateAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-rose-500 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">تنبيه: رقم الفاتورة مستعمل!</h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                رقم الفاتورة <span className="font-mono text-rose-600 font-black">#{invoiceNumber}</span> مستعمل من قبل! المرجو اختيار رقم آخر.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextFree = getNextInvoiceNumber(invoices);
                setInvoiceNumber(nextFree);
                setShowDuplicateAlert(false);
                playHapticSound('success');
              }}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>تعيين الرقم التالي المتاح ({getNextInvoiceNumber(invoices)})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDuplicateAlert(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              تعديل الرقم يدوياً
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD NEW CLIENT MODAL                                            */}
      {/* ============================================================== */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onAddClient={(newClient) => {
          if (onAddClient) onAddClient(newClient);
          setSelectedClientId(newClient.id);
        }}
      />

      {/* ============================================================== */}
      {/* ADD NEW PRODUCT MODAL                                           */}
      {/* ============================================================== */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn" dir="rtl">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  <Package className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">إضافة منتوج جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">اسم المنتوج بالعربية *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="مثال: صدر ديك رومي، دجاج بلدي..."
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">الثمن الافتراضي للكيلوغرام (درهم)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="مثال: 32.00"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold font-mono text-slate-900 outline-none tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إلى قائمة السلع</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
