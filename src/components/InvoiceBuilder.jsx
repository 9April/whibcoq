import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { INITIAL_PRODUCTS, BUSINESS_INFO } from '../data/initialData';
import { ProductRow } from './ProductRow';
import { ClientModal } from './ClientModal';
import { InvoicePrintModal } from './InvoicePrintModal';
import { ArabicSingleDatePickerModal } from './ArabicSingleDatePickerModal';
import {
  formatDh,
  formatKg,
  formatArabicDate,
  formatPhone,
  getClientProductPrice,
  saveClientProductPrice,
  getStoredProducts,
  persistProductWithDb,
  playHapticSound,
} from '../utils/storage';

export function InvoiceBuilder({
  clients,
  products = getStoredProducts(),
  onAddProduct,
  initialClientId,
  onAddClient,
  onSaveInvoice,
  onOpenPrint,
  editingInvoice,
  onCancelEdit,
}) {
  // Step State: 1 = Choose Client, 2 = Choose Date, 3 = Choose Products
  const [step, setStep] = useState(initialClientId ? 2 : 1);

  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter mode: 'all' vs 'active' (selected items only)
  const [filterMode, setFilterMode] = useState('all');

  // Input states per product: { [productId]: { weight: string|number, price: string|number } }
  const [itemsState, setItemsState] = useState(() => {
    const init = {};
    (products || []).forEach((p) => {
      const customPrice = getClientProductPrice(initialClientId, p.id, p.defaultPrice);
      init[p.id] = { weight: '', price: customPrice };
    });
    return init;
  });

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isArabicDatePickerOpen, setIsArabicDatePickerOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSubname, setNewProdSubname] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('découpe');
  const [savedInvoiceForPreview, setSavedInvoiceForPreview] = useState(null);

  // Set default client on load
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Load custom prices when client changes or products change
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
      setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);

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
  const activeItems = products.map((p) => {
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
  }).filter((item) => item.weight > 0);

  const grandTotal = activeItems.reduce((sum, item) => sum + item.total, 0);
  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'default',
    name: 'زبون نقدي',
    phone: '',
    category: 'عام',
  };

  const setToday = () => {
    playHapticSound('tap');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
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

  const handleSaveAndGenerate = () => {
    if (activeItems.length === 0) {
      playHapticSound('error');
      alert('⚠️ يرجى إدخال وزن منتوج واحد على الأقل (مثلاً بالضغط على +1kg أو كتابة الوزن) لحفظ وطباعة الفاتورة.');
      return;
    }

    playHapticSound('success');

    const invoiceId = editingInvoice
      ? editingInvoice.id
      : String(Math.floor(1000 + Math.random() * 9000));

    const invoiceObj = {
      id: invoiceId,
      clientId: selectedClientId,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      date: invoiceDate,
      items: activeItems,
      totalWeight: totalWeight,
      totalAmount: grandTotal,
      timestamp: editingInvoice ? editingInvoice.timestamp : Date.now(),
    };

    onSaveInvoice(invoiceObj);
    if (onOpenPrint) {
      onOpenPrint(invoiceObj);
    } else {
      setSavedInvoiceForPreview(invoiceObj);
      setIsPrintModalOpen(true);
    }
  };

  // Filter clients list for Step 1
  const filteredClients = clients.filter((c) => {
    const term = clientSearch.toLowerCase().trim();
    if (!term) return true;
    const cleanTermDigits = term.replace(/\D/g, '');
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    const matchPhone = cleanTermDigits.length > 0 && cleanPhone.includes(cleanTermDigits);

    return (
      c.name.toLowerCase().includes(term) ||
      matchPhone ||
      (c.phone && c.phone.includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });

  // Products to render based on filter mode
  const displayedProducts = products.filter((p) => {
    if (filterMode === 'active') {
      const w = parseFloat(itemsState[p.id]?.weight) || 0;
      return w > 0;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3 pb-36 animate-fadeIn">
      {/* Top Header with Back to Dashboard Button */}
      <div className="flex items-center justify-between px-0.5">
        <button
          type="button"
          onClick={() => {
            playHapticSound('tap');
            if (onCancelEdit) onCancelEdit();
          }}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع للوحة التحكم</span>
        </button>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          {editingInvoice ? `تعديل الفاتورة #${editingInvoice.id}` : 'إعداد الفاتورة (3 خطوات)'}
        </span>
      </div>

      {/* 3-Step Visual Progress Stepper Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setStep(1);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
              step === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : step > 1
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums ${
              step === 1 ? 'bg-white text-emerald-800' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {step > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
            </span>
            <span className="truncate">1. الزبون</span>
          </button>

          {/* Divider */}
          <div className={`w-3 sm:w-4 h-0.5 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setStep(2);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
              step === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : step > 2
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums ${
              step === 2 ? 'bg-white text-emerald-800' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {step > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
            </span>
            <span className="truncate">2. التاريخ</span>
          </button>

          {/* Divider */}
          <div className={`w-3 sm:w-4 h-0.5 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setStep(3);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
              step === 3
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums ${
              step === 3 ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className="truncate">3. السلع</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: CHOOSE CLIENT (الخطوة 1: اختيار الزبون) */}
      {/* ============================================================== */}
      {step === 1 && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">الخطوة 1: تحديد الزبون</h2>
                  <p className="text-xs text-slate-500">اختر الزبون من القائمة أو أضف زبوناً جديداً</p>
                </div>
              </div>

              {/* Add Client Button */}
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsClientModalOpen(true);
                }}
                className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ زبون جديد</span>
              </button>
            </div>

            {/* Client Search Bar (Auto-detects phone number typing LTR) */}
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="ابحث عن زبون بالاسم أو الهاتف..."
                dir={/^[0-9+]/.test(clientSearch.trim()) ? 'ltr' : 'rtl'}
                className={`w-full h-11 pr-9 pl-9 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all ${
                  /^[0-9+]/.test(clientSearch.trim()) ? 'text-left font-mono tracking-wider' : 'text-right'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {clientSearch && (
                <button
                  type="button"
                  onClick={() => setClientSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Clients List Cards (1 col on mobile, 2 or 3 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((c) => {
              const isSelected = c.id === selectedClientId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    playHapticSound('tap');
                    setSelectedClientId(c.id);
                    setStep(2);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] group ${
                    isSelected
                      ? 'bg-emerald-50/40 border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-black text-slate-900 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                        <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                          {c.category || 'زبون تجاري'}
                        </span>
                        {c.phone && (
                          <bdi
                            dir="ltr"
                            className="font-mono tabular-nums tracking-wide inline-block text-slate-500"
                            style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                          >
                            {formatPhone(c.phone)}
                          </bdi>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 1 Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:py-4">
            <div className="max-w-lg md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="text-right min-w-0">
                <span className="text-[11px] font-bold text-slate-400 block">الزبون المختار:</span>
                <span className="text-base font-black text-slate-900 truncate block">
                  {selectedClient.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(2);
                }}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              >
                <span>متابعة: التاريخ (الخطوة 2)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: CHOOSE DATE (الخطوة 2: اختيار التاريخ) */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="flex flex-col gap-3 animate-fadeIn pb-24 md:pb-16">
          {/* Selected Client Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">الزبون المختار:</span>
                <span className="text-sm font-black text-slate-900">{selectedClient.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setStep(1);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              تغيير الزبون
            </button>
          </div>

          {/* Date Picker Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">الخطوة 2: تحديد تاريخ الفاتورة</h2>
                <p className="text-xs text-slate-500">اختر التاريخ للمتابعة مباشرة إلى إدخال السلع والكميات</p>
              </div>
            </div>

            {/* Quick 1-Click Action Buttons: Today & Yesterday (Sets Date & Directly Advances to Step 3) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('success');
                  setInvoiceDate(new Date().toISOString().split('T')[0]);
                  setStep(3);
                }}
                className={`h-12 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border cursor-pointer ${
                  invoiceDate === new Date().toISOString().split('T')[0]
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
                <span className="truncate">تاريخ اليوم والمتابعة ({new Date().toISOString().split('T')[0].split('-').reverse().join('/')}) ←</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('success');
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setInvoiceDate(d.toISOString().split('T')[0]);
                  setStep(3);
                }}
                className="h-12 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span>تاريخ الأمس والمتابعة ←</span>
              </button>
            </div>

            {/* Current Chosen Date Card with Calendar Modal Trigger */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 block">التاريخ المختار حالياً:</span>
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsArabicDatePickerOpen(true);
                }}
                className="w-full h-13 px-3.5 bg-white hover:bg-slate-100 border-2 border-emerald-500/80 rounded-xl flex items-center justify-between transition-all cursor-pointer text-right group shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-base font-black text-slate-900 truncate">
                    {formatArabicDate(invoiceDate)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline tabular-nums">
                    ({invoiceDate.split('-').reverse().join('/')})
                  </span>
                </div>

                <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 group-hover:bg-emerald-100 transition-colors">
                  تغيير من التقويم 📅
                </span>
              </button>
            </div>

            {/* Primary Continue Button directly in the card */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setStep(3);
              }}
              className="w-full h-13 mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>متابعة: اختيار السلع والكميات (الخطوة 3)</span>
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Step 2 Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:py-4">
            <div className="max-w-lg md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(1);
                }}
                className="h-12 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق: الزبون</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(3);
                }}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>متابعة: اختيار السلع</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: CHOOSE PRODUCTS & WEIGHTS (الخطوة 3: إدخال السلع) */}
      {/* ============================================================== */}
      {step === 3 && (
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
                className="text-right truncate hover:opacity-80 transition-opacity"
                title="تعديل الزبون"
              >
                <span className="text-[10px] font-bold text-slate-400 block">الزبون:</span>
                <span className="text-xs font-black text-slate-900 truncate block">
                  {selectedClient.name}
                </span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(2);
                }}
                className="text-right truncate hover:opacity-80 transition-opacity"
                title="تعديل التاريخ"
              >
                <span className="text-[10px] font-bold text-slate-400 block">التاريخ:</span>
                <span className="text-xs font-black text-slate-900 truncate block font-mono tabular-nums">
                  {invoiceDate.split('-').reverse().join('/')}
                </span>
              </button>
            </div>

            {editingInvoice ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                تعديل #{editingInvoice.id}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                الخطوة 3: السلع
              </span>
            )}
          </div>

          {/* Step 3 Helper Guide Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                3
              </span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 truncate">
                  الخطوة 3: تحديد السلع والكميات بالكيلوغرام (kg)
                </h3>
                <p className="text-[11px] text-emerald-800 font-medium">
                  استعمل أزرار (+1kg / +5kg) أو اكتب الوزن مباشرة في خانة كل سلعة، ثم اضغط على حفظ وطباعة الفاتورة بالأسفل.
                </p>
              </div>
            </div>

            {activeItems.length > 0 && (
              <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0 font-mono tabular-nums">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                title="إضافة منتوج جديد"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ منتوج جديد</span>
              </button>

              {activeItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>
          </div>

          {/* 12 Poultry Products List (1 col on mobile, 2 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
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
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm font-bold flex flex-col items-center gap-2">
                <span>لم يتم إدخال وزن أي منتوج بعد</span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-emerald-700 text-xs font-black underline mt-1"
                >
                  عرض قائمة الـ 12 منتوج
                </button>
              </div>
            )}
          </div>

          {/* Floating Bottom Checkout Bar (Docked cleanly at bottom with safe-area padding) */}
          <div className="floating-checkout fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 md:py-4">
            <div className="max-w-lg md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
              {/* Grand Total */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <span>المجموع الكلي</span>
                  {activeItems.length > 0 && (
                    <bdi dir="ltr" className="font-mono text-slate-300 tabular-nums">
                      ({formatKg(totalWeight)})
                    </bdi>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight tabular-nums">
                  {formatDh(grandTotal)}
                </div>
              </div>

              {/* Primary Save & Print CTA - Always active & interactive */}
              <button
                type="button"
                onClick={handleSaveAndGenerate}
                className={`h-13 sm:h-14 px-5 sm:px-7 rounded-xl font-black text-base sm:text-lg flex items-center gap-2 shadow-md transition-all active:scale-95 select-none cursor-pointer ${
                  activeItems.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50 shadow-emerald-900/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Printer className="w-5 h-5 shrink-0" />
                <span>
                  {activeItems.length > 0
                    ? 'حفظ وطباعة الفاتورة'
                    : 'أدخل أوزان السلع للحفظ والطباعة ✍️'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onAddClient={(newClient) => {
          onAddClient(newClient);
          setSelectedClientId(newClient.id);
        }}
      />

      {/* Moroccan Arabic Single Date Picker Modal */}
      <ArabicSingleDatePickerModal
        isOpen={isArabicDatePickerOpen}
        onClose={() => setIsArabicDatePickerOpen(false)}
        currentDate={invoiceDate}
        onSelectDate={(newDate) => {
          playHapticSound('success');
          setInvoiceDate(newDate);
          setStep(3);
        }}
      />

      {/* Official A4 / Receipt Print Modal (Fallback if not handled by root App) */}
      {!onOpenPrint && (
        <InvoicePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoice={savedInvoiceForPreview}
          onNewInvoice={() => {
            handleClearAll();
          }}
        />
      )}

      {/* Quick Add Product Modal */}
      {isAddProductModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsAddProductModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 flex flex-col gap-3.5 animate-in zoom-in-95 duration-150 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">إضافة منتوج جديد</h3>
                  <p className="text-[10px] text-slate-400">سيتم حفظه وإضافته للفاتورة الحالية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  اسم المنتوج بالعربية <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="مثال: دجاج بلدي، كوردون بلو..."
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  الثمن للكيلوغرام (د.م.):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="مثال: 32.00"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs active:scale-95 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة المنتوج</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
