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
  Sparkles
} from 'lucide-react';
import { INITIAL_PRODUCTS, BUSINESS_INFO } from '../data/initialData';
import { ProductRow } from './ProductRow';
import { ClientModal } from './ClientModal';
import { InvoicePrintModal } from './InvoicePrintModal';
import {
  formatDh,
  formatKg,
  formatArabicDate,
  getClientProductPrice,
  saveClientProductPrice,
  playHapticSound,
} from '../utils/storage';

export function InvoiceBuilder({
  clients,
  onAddClient,
  onSaveInvoice,
  onOpenPrint,
  editingInvoice,
  onCancelEdit,
}) {
  // Step State: 1 = Choose Client, 2 = Choose Date, 3 = Choose Products
  const [step, setStep] = useState(1);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter mode: 'all' (all 12 products) vs 'active' (selected items only)
  const [filterMode, setFilterMode] = useState('all');

  // Input states per product: { [productId]: { weight: string|number, price: string|number } }
  const [itemsState, setItemsState] = useState({});

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [savedInvoiceForPreview, setSavedInvoiceForPreview] = useState(null);

  // Set default client on load
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Load custom prices when client changes
  useEffect(() => {
    if (!selectedClientId) return;

    setItemsState((prev) => {
      const next = { ...prev };
      INITIAL_PRODUCTS.forEach((p) => {
        const customPrice = getClientProductPrice(selectedClientId, p.id, p.defaultPrice);
        next[p.id] = {
          weight: prev[p.id]?.weight || '',
          price: prev[p.id]?.price !== undefined && prev[p.id]?.price !== '' ? prev[p.id].price : customPrice,
        };
      });
      return next;
    });
  }, [selectedClientId]);

  // Handle Editing if an invoice is passed -> jump directly to step 3
  useEffect(() => {
    if (editingInvoice) {
      setSelectedClientId(editingInvoice.clientId || clients[0]?.id || '');
      setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);

      const newState = {};
      INITIAL_PRODUCTS.forEach((p) => {
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
  }, [editingInvoice, clients]);

  const handleWeightChange = (productId, newWeight) => {
    setItemsState((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        weight: newWeight,
      },
    }));
  };

  const handlePriceChange = (productId, newPrice) => {
    setItemsState((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        price: newPrice,
      },
    }));

    if (selectedClientId) {
      saveClientProductPrice(selectedClientId, productId, Number(newPrice) || 0);
    }
  };

  // Active items calculation
  const activeItems = INITIAL_PRODUCTS.map((p) => {
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
    INITIAL_PRODUCTS.forEach((p) => {
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
      alert('الرجاء إدخال وزن منتوج واحد على الأقل لحفظ الفاتورة.');
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
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });

  // Products to render based on filter mode
  const displayedProducts = INITIAL_PRODUCTS.filter((p) => {
    if (filterMode === 'active') {
      const w = parseFloat(itemsState[p.id]?.weight) || 0;
      return w > 0;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3 pb-36 animate-fadeIn">
      {/* 4-Step Visual Progress Stepper Bar */}
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

            {/* Client Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="ابحث عن زبون بالاسم أو الهاتف..."
                className="w-full h-11 pr-9 pl-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Clients List Cards */}
          <div className="flex flex-col gap-2">
            {filteredClients.map((c) => {
              const isSelected = c.id === selectedClientId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    playHapticSound('tap');
                    setSelectedClientId(c.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
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
                        {c.category && (
                          <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                            {c.category}
                          </span>
                        )}
                        {c.phone && (
                          <span className="font-mono tabular-nums">{c.phone}</span>
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
          <div className="fixed bottom-16 sm:bottom-18 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-xl p-3">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
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
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all flex-shrink-0"
              >
                <span>متابعة: التاريخ</span>
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
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Selected Client Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">الزبون:</span>
                <span className="text-sm font-black text-slate-900">{selectedClient.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setStep(1);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              تغيير الزبون
            </button>
          </div>

          {/* Date Picker Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">الخطوة 2: تحديد تاريخ الفاتورة</h2>
                <p className="text-xs text-slate-500">يتم تحديد تاريخ اليوم تلقائياً، يمكنك تغييره بالضغط أدناه</p>
              </div>
            </div>

            {/* Expanded Arabic Date Selector */}
            <div className="relative group">
              <div className="w-full h-14 pr-11 pl-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 focus-within:border-emerald-600 rounded-xl flex items-center justify-between transition-all cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-5 h-5 text-emerald-600 absolute right-3.5 pointer-events-none" />
                  <span className="text-base font-black text-slate-900 truncate">
                    {formatArabicDate(invoiceDate)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline tabular-nums">
                    ({invoiceDate.split('-').reverse().join('/')})
                  </span>
                </div>

                <span className="text-xs text-slate-600 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex-shrink-0">
                  تغيير 📅
                </span>
              </div>

              {/* Native Date Input Overlay */}
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="تحديد تاريخ الفاتورة"
              />
            </div>

            {/* Quick Set Today Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-semibold">هل الفاتورة لتاريخ اليوم؟</span>
              <button
                type="button"
                onClick={setToday}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                  invoiceDate === new Date().toISOString().split('T')[0]
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                اليوم ({new Date().toISOString().split('T')[0].split('-').reverse().join('/')})
              </button>
            </div>
          </div>

          {/* Step 2 Bottom Action Bar */}
          <div className="fixed bottom-16 sm:bottom-18 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-xl p-3">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setStep(1);
                }}
                className="h-12 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
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
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all"
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

          {/* List Filter Tabs: All (12) vs Selected Only */}
          <div className="flex items-center justify-between gap-2 px-1">
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
                الكل (12)
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

          {/* 12 Poultry Products List */}
          <div className="flex flex-col gap-2.5">
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
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm font-bold flex flex-col items-center gap-2">
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

          {/* Floating Bottom Checkout Bar (Above Nav) */}
          <div className="floating-checkout fixed bottom-16 sm:bottom-18 left-0 right-0 z-30 bg-slate-900 text-white border-t border-slate-800 shadow-2xl p-3 sm:p-4">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              {/* Grand Total */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <span>المجموع الكلي</span>
                  {activeItems.length > 0 && (
                    <span className="font-mono text-slate-300 tabular-nums">
                      ({formatKg(totalWeight)})
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight tabular-nums">
                  {formatDh(grandTotal)}
                </div>
              </div>

              {/* Primary Save & Print CTA */}
              <button
                type="button"
                onClick={handleSaveAndGenerate}
                disabled={activeItems.length === 0}
                className={`h-13 sm:h-14 px-5 sm:px-7 rounded-xl font-black text-base sm:text-lg flex items-center gap-2 shadow-md transition-all active:scale-95 select-none ${
                  activeItems.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer ring-2 ring-emerald-400/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Printer className="w-5 h-5" />
                <span>حفظ وطباعة الفاتورة</span>
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
    </div>
  );
}
