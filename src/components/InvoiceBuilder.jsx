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
  ArrowDown,
  Search,
  Printer,
  Package,
  Clock,
  Sparkles,
  X,
  Plus,
  PlusCircle,
  AlertTriangle,
  Download,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
  Lock,
  Unlock,
  Edit3,
} from 'lucide-react';
import { INITIAL_PRODUCTS, BUSINESS_INFO } from '../data/initialData';
import { ProductRow } from './ProductRow';
import { ClientModal } from './ClientModal';
import {
  formatDh,
  formatNumberOnly,
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
  onUpdateClient,
  onDeleteClient,
  onSaveInvoice,
  onOpenPrint,
  editingInvoice,
  onCancelEdit,
}) {
  const businessInfo = getBusinessInfo();

  // Focused Step State: 1 (Client & Date) | 2 (Products & Weights) | 3 (Invoice Preview & Actions)
  const [activeStep, setActiveStep] = useState(editingInvoice ? 2 : 1);

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

  // Synchronize invoiceNumber with the lowest available free integer starting from 1 (reusing deleted gaps)
  useEffect(() => {
    if (editingInvoice) return;
    const nextFree = getNextInvoiceNumber(invoices);
    setInvoiceNumber((prev) => {
      if (!prev || isInvoiceNumberTaken(prev, null, invoices)) {
        return nextFree;
      }
      const prevNum = parseInt(String(prev).trim(), 10);
      const nextFreeNum = parseInt(String(nextFree).trim(), 10);
      if (!isNaN(prevNum) && !isNaN(nextFreeNum) && prevNum > nextFreeNum) {
        return nextFree;
      }
      return prev;
    });
  }, [invoices, editingInvoice]);

  // Payment Method: 'نقداً' | 'شيك' | 'تحويل' | 'كريدي'
  const [paymentMethod, setPaymentMethod] = useState('نقداً');

  // Step 2: Products & Weights
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active'
  const [itemsState, setItemsState] = useState(() => {
    const init = {};
    (products || []).forEach((p) => {
      const customPrice = getClientProductPrice(initialClientId, p.id, 0);
      init[p.id] = {
        weight: '',
        price: customPrice !== undefined && customPrice !== null && customPrice !== '' ? customPrice : 0,
      };
    });
    return init;
  });

  // Modals & PDF export state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [lastSavedSuccess, setLastSavedSuccess] = useState(null);
  const printAreaRef = useRef(null);

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
        const customPrice = getClientProductPrice(selectedClientId, p.id, 0);
        next[p.id] = {
          weight: prev[p.id]?.weight || '',
          price:
            prev[p.id]?.price !== undefined && prev[p.id]?.price !== ''
              ? prev[p.id].price
              : customPrice !== undefined && customPrice !== null && customPrice !== ''
                ? customPrice
                : 0,
        };
      });
      return next;
    });
  }, [selectedClientId, products]);

  // Handle Editing if an invoice is passed -> unlock all steps & populate
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
        const savedPrice = getClientProductPrice(editingInvoice.clientId, p.id, 0);
        newState[p.id] = {
          weight: found ? found.weight : '',
          price: found && found.price !== undefined && found.price !== '' ? found.price : (savedPrice !== undefined && savedPrice !== null && savedPrice !== '' ? savedPrice : 0),
        };
      });
      setItemsState(newState);
      setFilterMode('active');
      setActiveStep(2);
    }
  }, [editingInvoice, clients, products]);

  // Navigate to a specific step and scroll to top smoothly
  const goToStep = (stepNumber) => {
    playHapticSound('tap');
    setActiveStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      const currentPrice =
        prev[productId]?.price !== undefined && prev[productId]?.price !== ''
          ? prev[productId].price
          : (getClientProductPrice(selectedClientId, productId, 0) ?? 0);

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

    if (newPrice !== '' && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
      const val = Number(newPrice);
      if (selectedClientId) {
        saveClientProductPrice(selectedClientId, productId, val);
      }
      saveClientProductPrice('default', productId, val);
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
      const priceVal = priceNum > 0 ? priceNum : '';
      setItemsState((prev) => ({
        ...prev,
        [created.id]: { weight: '', price: priceVal },
      }));
      if (priceNum > 0) {
        if (selectedClientId) {
          saveClientProductPrice(selectedClientId, created.id, priceNum);
        }
        saveClientProductPrice('default', created.id, priceNum);
      }
    }
    setNewProdName('');
    setNewProdPrice('');
    setIsAddProductModalOpen(false);
    playHapticSound('success');
  };

  // Active items calculation
  const activeItems = products
    .map((p) => {
      const item = itemsState[p.id] || { weight: '', price: 0 };
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
      const savedPrice = getClientProductPrice(selectedClientId, p.id, 0);
      reset[p.id] = {
        weight: '',
        price: savedPrice !== undefined && savedPrice !== null && savedPrice !== '' ? savedPrice : 0,
      };
    });
    setItemsState(reset);
    setFilterMode('all');
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

  const handleSaveInvoiceAction = async () => {
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

    setIsSavingPdf(true);
    playHapticSound('success');
    const invObj = buildCurrentInvoiceObject();

    // 1. Download PDF directly to device (using exportInvoiceToPdf with native Arabic text shaping)
    try {
      if (printAreaRef.current) {
        const cleanClientName = (selectedClient.name || 'Client').replace(/[^\w\u0600-\u06FF\s-]/gi, '').trim();
        const filename = `Facture_${invoiceNumber}_${cleanClientName || 'Client'}.pdf`;

        const { exportInvoiceToPdf } = await import('../utils/pdfExport');
        await exportInvoiceToPdf(printAreaRef.current, filename);
      }
    } catch (err) {
      console.error('Error generating PDF during invoice save:', err);
    } finally {
      setIsSavingPdf(false);
    }

    // 2. Persist to storage / database
    if (onSaveInvoice) {
      await onSaveInvoice(invObj);
    }

    // 3. Set success notification
    setLastSavedSuccess({
      id: invObj.id,
      clientName: invObj.clientName,
      totalAmount: invObj.totalAmount,
      invoice: invObj,
    });

    // Save all active item prices so they are remembered for next times
    activeItems.forEach((it) => {
      if (it.price && Number(it.price) > 0) {
        if (selectedClientId) {
          saveClientProductPrice(selectedClientId, it.productId, Number(it.price));
        }
        saveClientProductPrice('default', it.productId, Number(it.price));
      }
    });

    // 4. Auto-increment to the next free invoice number in state
    const updatedInvoices = [...invoices.filter((i) => i.id !== invObj.id), invObj];
    setInvoiceNumber(getNextInvoiceNumber(updatedInvoices));
  };

  // Direct Print & Persist Invoice (so number is immediately recorded and taken)
  const handlePrint = async () => {
    if (activeItems.length === 0) {
      playHapticSound('error');
      alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل لطباعة الفاتورة.');
      return;
    }

    if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
      setShowDuplicateAlert(true);
      playHapticSound('error');
      return;
    }

    playHapticSound('success');
    const invObj = buildCurrentInvoiceObject();

    // 1. Persist to storage / database immediately so the invoice number is recorded and taken
    if (onSaveInvoice) {
      await onSaveInvoice(invObj);
    }

    // 2. Set success notification
    setLastSavedSuccess({
      id: invObj.id,
      clientName: invObj.clientName,
      totalAmount: invObj.totalAmount,
      invoice: invObj,
    });

    // 3. Save all active item prices so they are remembered for next times
    activeItems.forEach((it) => {
      if (it.price && Number(it.price) > 0) {
        if (selectedClientId) {
          saveClientProductPrice(selectedClientId, it.productId, Number(it.price));
        }
        saveClientProductPrice('default', it.productId, Number(it.price));
      }
    });

    // 4. Update next free invoice number
    const updatedInvoices = [...invoices.filter((i) => i.id !== invObj.id), invObj];
    setInvoiceNumber(getNextInvoiceNumber(updatedInvoices));

    // 5. Trigger print dialog
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleStartNewInvoice = () => {
    playHapticSound('tap');
    const reset = {};
    products.forEach((p) => {
      const savedPrice = getClientProductPrice(selectedClientId, p.id, 0);
      reset[p.id] = {
        weight: '',
        price: savedPrice !== undefined && savedPrice !== null && savedPrice !== '' ? savedPrice : 0,
      };
    });
    setItemsState(reset);
    setFilterMode('all');
    setInvoiceNumber(getNextInvoiceNumber(invoices));
    setPaymentMethod('نقداً');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    if (onCancelEdit) onCancelEdit();
    goToStep(1);
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
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ============================================================== */}
      {/* STICKY TOP PROGRESS INDICATOR (Focused Step Navigation)        */}
      {/* ============================================================== */}
      <div className="no-print sticky top-12 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs p-2">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => goToStep(1)}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeStep === 1
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${activeStep === 1 ? 'bg-white text-emerald-800' : 'bg-emerald-200 text-emerald-800'
                }`}
            >
              {activeStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
            </span>
            <span className="truncate">1. الزبون والتاريخ</span>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              if (activeStep === 1) {
                if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
                  setShowDuplicateAlert(true);
                  return;
                }
              }
              goToStep(2);
            }}
            disabled={activeStep === 1}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${activeStep === 2
              ? 'bg-emerald-600 text-white shadow-sm cursor-pointer'
              : activeStep === 3
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 cursor-pointer'
                : 'bg-slate-100/60 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${activeStep === 2
                ? 'bg-white text-emerald-800'
                : activeStep === 3 && activeItems.length > 0
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-slate-300 text-slate-600'
                }`}
            >
              {activeStep === 3 && activeItems.length > 0 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
            </span>
            <span className="truncate">2. السلع والكميات</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => {
              if (activeItems.length === 0) {
                alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل لتفعيل معاينة الفاتورة');
                return;
              }
              goToStep(3);
            }}
            disabled={activeStep < 2 || activeItems.length === 0}
            className={`h-11 sm:h-12 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${activeStep === 3
              ? 'bg-emerald-600 text-white shadow-sm cursor-pointer'
              : activeItems.length > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                : 'bg-slate-100/60 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${activeStep === 3 ? 'bg-white text-emerald-800' : 'bg-slate-300 text-slate-700'
                }`}
            >
              3
            </span>
            <span className="truncate">3. معاينة الفاتورة</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUCCESS BANNER: Post-save Confirmation & Instant Preview      */}
      {/* ============================================================== */}
      {lastSavedSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-950">
                ✅ تم حفظ الفاتورة رقم #{lastSavedSuccess.id} بنجاح وتحميل ملف الـ PDF!
              </p>
              <p className="text-xs text-emerald-800 font-bold mt-0.5">
                الزبون: {lastSavedSuccess.clientName} • المجموع: {formatDh(lastSavedSuccess.totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenPrint) onOpenPrint(lastSavedSuccess.invoice);
              }}
              className="h-9 px-3.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-black text-xs hover:bg-emerald-100/50 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>معاينة / طباعة الفاتورة</span>
            </button>
            <button
              type="button"
              onClick={() => setLastSavedSuccess(null)}
              className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: CLIENT, INVOICE #, AND DATE (الخطوة 1)             */}
      {/* ============================================================== */}
      <section id="section-step-1" className="flex flex-col gap-4 scroll-mt-24">
        {activeStep === 1 ? (
          <>
            {/* Step 1 Title Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  1
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-emerald-950">
                    الخطوة 1: تحديد الزبون ورقم الفاتورة والتاريخ
                  </h2>
                  <p className="text-[11px] text-emerald-800">
                    اختر الزبون من القائمة أدناه ثم اضغط متابعة للانتقال للخطوة 2
                  </p>
                </div>
              </div>
              {selectedClientId && (
                <span className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs shrink-0 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>محدد: {selectedClient.name}</span>
                </span>
              )}
            </div>

            {/* Card 1: Invoice Number & Date Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">رقم الفاتورة والتاريخ</h3>
                    <p className="text-[11px] text-slate-500">يتزايد رقم الفاتورة تلقائياً ويمكن تعديله يدوياً</p>
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
                    <span>رقم الفاتورة</span>
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
                      placeholder="1"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      #NO
                    </span>
                  </div>
                </div>

                {/* Invoice Date Picker */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    <span>تاريخ الفاتورة</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full h-12 px-3.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-base font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Client Selection & Creation Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
              {/* Card 2 Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">اختيار الزبون التجاري</h3>
                    <p className="text-[11px] text-slate-500">اختر من القائمة المنسدلة أو أضف زبوناً جديداً</p>
                  </div>
                </div>

                {selectedClient && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shrink-0 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{selectedClient.name}</span>
                  </span>
                )}
              </div>

              {/* 1. CLEAR & FULL-WIDTH ADD NEW CLIENT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsClientModalOpen(true);
                }}
                className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-5 h-5 stroke-[2.5]" />
                <span>+ إضافة زبون جديد</span>
              </button>

              {/* 2. SEARCH BAR & DROPDOWN COMBOBOX */}
              <div className="relative flex flex-col gap-1.5" ref={clientDropdownRef}>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>ابحث أو اختر من القائمة المنسدلة:</span>
                  <span className="text-[11px] text-slate-400 font-mono">({clients.length} زبائن مسجلين)</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    onClick={() => setIsClientDropdownOpen(true)}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    placeholder={selectedClient ? `الزبون الحالي: ${selectedClient.name} (انقر للبحث أو التغيير)` : "ابحث بالاسم، المحل، أو رقم الهاتف..."}
                    className="w-full h-13 pr-11 pl-32 sm:pl-36 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all shadow-2xs"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => setClientSearch('')}
                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Manage Client Icon 1: EDIT */}
                    {selectedClient && selectedClient.id && selectedClient.id !== 'default' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playHapticSound('tap');
                          setClientToEdit(selectedClient);
                          setIsClientModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title={`تعديل بيانات ${selectedClient.name}`}
                      >
                        <Edit3 className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    )}

                    {/* Manage Client Icon 2: DELETE */}
                    {selectedClient && selectedClient.id && selectedClient.id !== 'default' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playHapticSound('warning');
                          setClientToDelete(selectedClient);
                        }}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title={`حذف الزبون ${selectedClient.name}`}
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    )}

                    {/* Dropdown Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                      className="w-8 h-8 rounded-xl text-slate-500 hover:bg-slate-200/70 flex items-center justify-center cursor-pointer transition-colors"
                      title="فتح/إغلاق القائمة"
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu List */}
                {isClientDropdownOpen && (
                  <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span>اختر زبوناً من القائمة:</span>
                      <span className="font-mono tabular-nums">{filteredClients.length} نتائج</span>
                    </div>

                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => {
                        const isSelected = selectedClientId === client.id;
                        return (
                          <div
                            key={client.id}
                            onClick={() => {
                              playHapticSound('tap');
                              setSelectedClientId(client.id);
                              setClientSearch('');
                              setIsClientDropdownOpen(false);
                            }}
                            className={`w-full p-3.5 text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${isSelected
                              ? 'bg-emerald-50 text-emerald-950 font-black'
                              : 'hover:bg-slate-50 text-slate-800'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                              >
                                {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <User className="w-4 h-4" />}
                              </span>

                              <div className="min-w-0">
                                <span className="text-sm font-black text-slate-900 block truncate">
                                  {client.name}
                                </span>
                                {(client.phone || client.address) && (
                                  <span className="text-xs text-slate-500 font-mono block truncate mt-0.5">
                                    {client.phone && <span>📞 {formatPhone(client.phone)}</span>}
                                    {client.phone && client.address && <span> • </span>}
                                    {client.address && <span>📍 {client.address}</span>}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {client.id !== 'default' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playHapticSound('tap');
                                      setClientToEdit(client);
                                      setIsClientModalOpen(true);
                                      setIsClientDropdownOpen(false);
                                    }}
                                    className="w-7 h-7 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-700 flex items-center justify-center transition-colors cursor-pointer"
                                    title={`تعديل بيانات ${client.name}`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playHapticSound('warning');
                                      setClientToDelete(client);
                                      setIsClientDropdownOpen(false);
                                    }}
                                    className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title={`حذف الزبون ${client.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold shrink-0">
                                  محدد
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-xs font-bold flex flex-col items-center gap-2">
                        <span>لا يوجد زبون يطابق "{clientSearch}"</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClientDropdownOpen(false);
                            setIsClientModalOpen(true);
                          }}
                          className="text-emerald-700 text-xs font-black underline cursor-pointer"
                        >
                          + إضافة "{clientSearch}" كزبون جديد الآن
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. SELECTED CLIENT DISPLAY CARD */}
              {selectedClient && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      <User className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-bold">الزبون المعتمد:</span>
                        <span className="text-base font-black text-emerald-950 truncate">{selectedClient.name}</span>
                      </div>
                      {(selectedClient.phone || selectedClient.address) && (
                        <div className="text-xs text-slate-600 font-mono flex items-center gap-3 mt-1 flex-wrap">
                          {selectedClient.phone && <span>📞 {formatPhone(selectedClient.phone)}</span>}
                          {selectedClient.address && <span className="truncate">📍 {selectedClient.address}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen(true)}
                    className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    تغيير
                  </button>
                </div>
              )}
            </div>

            {/* CTA Button: Proceed to Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (isInvoiceNumberTaken(invoiceNumber, editingInvoice?.id, invoices)) {
                  setShowDuplicateAlert(true);
                  return;
                }
                goToStep(2);
              }}
              className="w-full h-14 rounded-2xl bg-softgreen-600 hover:bg-softgreen-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-softgreen-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>متابعة: اختيار السلع والكميات (الخطوة 2)</span>
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        ) : (
          /* Step 1 is DISABLED (User is focusing on Step 2 or 3) */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-900 truncate">
                    الخطوة 1: {selectedClient.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    #{invoiceNumber}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {displayDate()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                  الخطوة 1 مكتملة (معطلة للتركيز على الخطوة الحالية)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => goToStep(1)}
              className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>تعديل</span>
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: PRODUCTS, WEIGHTS, AND PRICES (الخطوة 2)           */}
      {/* ============================================================== */}
      <section id="section-step-2" className="flex flex-col gap-4 scroll-mt-24">
        {activeStep === 1 ? (
          /* Step 2 is DISABLED while in Step 1 */
          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-60 cursor-not-allowed select-none">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center font-black text-xs shrink-0">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-bold text-slate-500 block">الخطوة 2: تحديد السلع والكميات</span>
                <span className="text-[11px] text-slate-400 block">معطلة — أكمل الخطوة 1 واضغط متابعة لتفعيلها</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">معطلة</span>
          </div>
        ) : activeStep === 2 ? (
          /* Step 2 is ACTIVE & FOCUSED */
          <div className="flex flex-col gap-3">
            {/* Step 2 Title Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                  2
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">
                    الخطوة 2: تحديد السلع والكميات بالكيلوغرام (kg)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    استعمل أزرار (+1kg / +5kg) أو اكتب الوزن مباشرة في خانة كل سلعة
                  </p>
                </div>
              </div>

              {activeItems.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shrink-0 font-mono tabular-nums">
                  {activeItems.length} سلع مختارة
                </span>
              )}
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterMode === 'all'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMode === 'active'
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
                {activeItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح الكل</span>
                  </button>
                )}
              </div>
            </div>

            {/* BIG & NOTICEABLE BUTTON ABOVE PRODUCTS (FULL WIDTH) */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsAddProductModalOpen(true);
              }}
              className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>+ إضافة منتوج جديد</span>
            </button>

            {/* 12 Poultry Products List: 1 product per line taking full width */}
            <div className="flex flex-col gap-3 sm:gap-3.5 w-full">
              {displayedProducts.length > 0 ? (
                displayedProducts.map((product) => {
                  const currentItem = itemsState[product.id] || { weight: '', price: 0 };
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

            {/* BIG & NOTICEABLE BUTTON UNDER PRODUCTS (FULL WIDTH) */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsAddProductModalOpen(true);
              }}
              className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>+ إضافة منتوج جديد</span>
            </button>

            {/* Step 2 Summary & Navigation Buttons */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-right w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 block">المجموع الحالي للسلع:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 tabular-nums">
                  {formatDh(grandTotal)}
                </span>
                {activeItems.length > 0 && (
                  <span className="text-xs font-mono font-bold text-slate-400 block tabular-nums">
                    الوزن الإجمالي: {formatKg(totalWeight)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="h-12 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>رجوع للخطوة 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeItems.length === 0) {
                      alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل للمتابعة إلى معاينة الفاتورة.');
                      return;
                    }
                    goToStep(3);
                  }}
                  className={`h-12 px-5 sm:px-6 rounded-xl font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${activeItems.length > 0
                    ? 'bg-softgreen-600 hover:bg-softgreen-700 text-white shadow-softgreen-600/20'
                    : 'bg-slate-200 text-slate-500'
                    }`}
                >
                  <span>متابعة: معاينة الفاتورة (الخطوة 3)</span>
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2 is DISABLED while in Step 3 */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-900 truncate">
                    الخطوة 2: {activeItems.length} سلع مختارة
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {formatDh(grandTotal)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {formatKg(totalWeight)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                  الخطوة 2 مكتملة (معطلة للتركيز على المعاينة النهائية)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => goToStep(2)}
              className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>تعديل السلع</span>
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: FINAL INVOICE PREVIEW & ACTIONS (الخطوة 3)         */}
      {/* ============================================================== */}
      <section id="section-step-3" className="flex flex-col gap-4 scroll-mt-24 pb-16">
        {activeStep < 3 ? (
          /* Step 3 is DISABLED while in Step 1 or 2 */
          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-60 cursor-not-allowed select-none">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center font-black text-xs shrink-0">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-bold text-slate-500 block">الخطوة 3: المعاينة النهائية والطباعة</span>
                <span className="text-[11px] text-slate-400 block">معطلة — حدد السلع في الخطوة 2 للمتابعة إلى المعاينة</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">معطلة</span>
          </div>
        ) : (
          /* Step 3 is ACTIVE & FOCUSED */
          <div className="flex flex-col gap-4">
            {/* Step 3 Title Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  3
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-emerald-950">
                    الخطوة 3: المعاينة النهائية للفاتورة وإصدارها
                  </h2>
                  <p className="text-[11px] text-emerald-800">
                    تحقق من تفاصيل الفاتورة الرسمية أدناه ثم اختر الطباعة أو الحفظ بالجهاز
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>تعديل السلع</span>
              </button>
            </div>

            {/* Top Control Bar */}
            <div className="no-print bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-600">معاينة الفاتورة قبل الطباعة والحفظ</span>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>رجوع لتعديل السلع (الخطوة 2)</span>
              </button>
            </div>

            {/* Printable Official Invoice Card (Exact Reference Design with Two-Tone Wave) */}
            <div className="printable-invoice-area-wrapper overflow-y-auto p-1 sm:p-4 flex justify-center">
              <div
                ref={printAreaRef}
                id="printable-invoice"
                className="printable-invoice-area w-full max-w-[144mm] min-h-[200mm] bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
              >
                {/* Top Section */}
                <div>
                  {/* Header Row: WAHIB COQ + Logo */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
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
                        <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                          {businessInfo.frenchSubtitle || 'Vente de poulets vivants et découpes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Title & Invoice Number & Date Line (IN LINE) */}
                  <div className="pt-3 pb-2 flex items-baseline justify-between border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                        فاتورة
                      </h2>
                      <span className="text-base sm:text-lg font-black text-slate-700 font-mono tracking-wider tabular-nums" dir="ltr">
                        NO. {String(invoiceNumber).padStart(6, '0')}
                      </span>
                    </div>

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
                        الزبون:
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
                        من طرف:
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {businessInfo.name || 'WAHIB COQ'}
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
                        <th className="py-2 px-2.5 text-right">المنتوج</th>
                        <th className="py-2 px-2.5 text-center w-24">الوزن (كلغ)</th>
                        <th className="py-2 px-2.5 text-center w-24">الثمن</th>
                        <th className="py-2 px-2.5 text-left w-28">المجموع</th>
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
                            <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-800 tabular-nums" dir="ltr">
                              {Number(item.price).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2.5 text-left font-mono font-black text-slate-900 tabular-nums" dir="ltr">
                              {formatNumberOnly(item.total)}
                            </td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-b-2 border-slate-300 font-black text-xs sm:text-sm bg-slate-50/60">
                        <td className="py-2.5 px-2.5 text-slate-900">
                          المجموع الكلي
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-900 tabular-nums" dir="ltr">
                          {formatKg(totalWeight)}
                        </td>
                        <td className="py-2.5 px-2.5"></td>
                        <td className="py-2.5 px-2.5 text-left font-mono font-black text-base text-emerald-700 tabular-nums" dir="ltr">
                          {formatDh(grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Footer Notes: Thank you */}
                  <div className="py-2.5 flex items-center justify-center text-xs text-slate-600 border-b border-slate-100">
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
            <div className="no-print flex flex-col gap-3 max-w-[144mm] mx-auto w-full pt-2">
              {/* Row 1: Two Main Action Buttons side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {/* 1. Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full h-16 min-h-[60px] py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="w-6 h-6 shrink-0 stroke-[2.5]" />
                  <span className="whitespace-nowrap">طباعة الفاتورة</span>
                </button>

                {/* 2. Save & Download PDF */}
                <button
                  type="button"
                  onClick={handleSaveInvoiceAction}
                  disabled={isSavingPdf}
                  className="w-full h-16 min-h-[60px] py-4 px-6 rounded-2xl bg-softgreen-600 hover:bg-softgreen-700 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-softgreen-600/25 hover:shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingPdf ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="whitespace-nowrap">جاري تحميل الفاتورة PDF...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-6 h-6 stroke-[3] shrink-0" />
                      <span className="whitespace-nowrap">حفظ وتحميل الفاتورة PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 2: Remake / Restart New Invoice from 0 (placed neatly under the two buttons) */}
              <button
                type="button"
                onClick={handleStartNewInvoice}
                className="w-full h-14 min-h-[52px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 border border-slate-300 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 shrink-0 text-slate-500" />
                <span className="whitespace-nowrap">فاتورة جديدة (البدء من جديد)</span>
              </button>

              {/* Row 3: Return to Step 2 to edit products */}
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full h-11 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الرجوع لتعديل السلع والكميات (الخطوة 2)</span>
              </button>
            </div>
          </div>
        )}
      </section>

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
      {/* ADD / EDIT CLIENT MODAL                                         */}
      {/* ============================================================== */}
      <ClientModal
        isOpen={isClientModalOpen}
        clientToEdit={clientToEdit}
        onClose={() => {
          setIsClientModalOpen(false);
          setClientToEdit(null);
        }}
        onAddClient={(newClient) => {
          if (onAddClient) onAddClient(newClient);
          setSelectedClientId(newClient.id);
        }}
        onUpdateClient={(updatedClient) => {
          if (onUpdateClient) onUpdateClient(updatedClient);
          if (selectedClientId === updatedClient.id) {
            setSelectedClientId(updatedClient.id);
          }
        }}
      />

      {/* ============================================================== */}
      {/* DELETE CLIENT CONFIRMATION MODAL                                */}
      {/* ============================================================== */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-900" dir="rtl">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">تأكيد حذف الزبون</h3>
                <p className="text-xs text-slate-500 mt-0.5">هل أنت متأكد من حذف هذا الزبون نهائياً؟</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-sm font-black text-slate-900">{clientToDelete.name}</span>
              {clientToDelete.phone && (
                <span className="text-xs text-slate-500 font-mono">📞 {formatPhone(clientToDelete.phone)}</span>
              )}
              {clientToDelete.address && (
                <span className="text-xs text-slate-500">📍 {clientToDelete.address}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={async () => {
                  playHapticSound('tap');
                  const idToDelete = clientToDelete.id;
                  if (onDeleteClient) {
                    await onDeleteClient(idToDelete);
                  }
                  if (selectedClientId === idToDelete) {
                    const remaining = clients.filter((c) => c.id !== idToDelete);
                    setSelectedClientId(remaining[0]?.id || '');
                  }
                  setClientToDelete(null);
                  playHapticSound('success');
                }}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
