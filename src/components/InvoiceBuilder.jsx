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
  ArrowRight
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
  editingInvoice,
  onCancelEdit,
}) {
  const [selectedClientId, setSelectedClientId] = useState('');
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

  // Handle Editing if an invoice is passed
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
  };

  const setToday = () => {
    playHapticSound('tap');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  const handleClearAll = () => {
    if (activeItems.length > 0 && !window.confirm('هل أنت متأكد من تفريغ كافة بنود الفاتورة الحالية؟')) {
      return;
    }
    playHapticSound('tap');
    const reset = {};
    INITIAL_PRODUCTS.forEach((p) => {
      const customPrice = getClientProductPrice(selectedClientId, p.id, p.defaultPrice);
      reset[p.id] = { weight: '', price: customPrice };
    });
    setItemsState(reset);
    setFilterMode('all');
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
    setSavedInvoiceForPreview(invoiceObj);
    setIsPrintModalOpen(true);
  };

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
      {/* Compact Sticky Top Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-2.5">
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              W
            </span>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight">
                {BUSINESS_INFO.name}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold block -mt-0.5">
                {BUSINESS_INFO.frenchSubtitle}
              </span>
            </div>
          </div>

          {editingInvoice ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                تعديل #{editingInvoice.id}
              </span>
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-xs text-rose-600 underline font-bold"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-500">
              وصل تجاري مباشر
            </span>
          )}
        </div>

        {/* 1. Client Card (Full Width with Quick + New Button) */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={selectedClientId}
              onChange={(e) => {
                playHapticSound('tap');
                setSelectedClientId(e.target.value);
              }}
              className="w-full h-12 pr-9 pl-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-base font-bold text-slate-900 outline-none cursor-pointer appearance-none transition-all"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.category ? `(${c.category})` : ''}
                </option>
              ))}
            </select>
            <User className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setIsClientModalOpen(true);
            }}
            className="h-12 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ زبون</span>
          </button>
        </div>

        {/* 2. Expanded Arabic Date Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          {/* Expanded Arabic Date Button with overlaid native date picker */}
          <div className="relative flex-1 group">
            <div className="w-full h-12 pr-10 pl-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 focus-within:border-emerald-600 rounded-xl flex items-center justify-between transition-all cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-emerald-600 absolute right-3 pointer-events-none" />
                <span className="text-sm font-black text-slate-900 truncate">
                  {formatArabicDate(invoiceDate)}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline tabular-nums">
                  ({invoiceDate.split('-').reverse().join('/')})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
                تغيير 📅
              </span>
            </div>

            {/* Invisible native input over the entire card to trigger device date picker */}
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="تحديد تاريخ الفاتورة"
            />
          </div>

          {/* Quick Today Button */}
          <button
            type="button"
            onClick={setToday}
            className={`h-12 px-4 rounded-xl text-xs font-bold transition-all border active:scale-95 flex-shrink-0 ${
              invoiceDate === new Date().toISOString().split('T')[0]
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            اليوم
          </button>
        </div>
      </div>

      {/* List Filter Tabs: All (12) vs Selected Only */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
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

      {/* Streamlined Mobile-First Single-Column Product List */}
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
            <span>لم يتم اختيار أي منتوج بعد</span>
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
            <span>حفظ وإصدار الفاتورة</span>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Add Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onAddClient={(newClient) => {
          onAddClient(newClient);
          setSelectedClientId(newClient.id);
        }}
      />

      {/* Official A4 / Receipt Print Modal */}
      <InvoicePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={savedInvoiceForPreview}
        onNewInvoice={() => {
          handleClearAll();
        }}
      />
    </div>
  );
}
