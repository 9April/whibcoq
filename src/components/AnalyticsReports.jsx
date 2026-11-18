import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Scale,
  FileText,
  ChevronDown,
  Filter,
  Calendar,
  Users,
  Package,
  Layers,
  RotateCcw
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';
import { ArabicDateRangeModal, formatArabicDisplayDate } from './ArabicDateRangeModal';

export function AnalyticsReports({ invoices, clients }) {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isAllDates, setIsAllDates] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedClientId, setSelectedClientId] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState('all');

  const [expandedClientId, setExpandedClientId] = useState(null);
  const [breakdownView, setBreakdownView] = useState('products'); // 'products' | 'clients'

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!isAllDates) {
        if (fromDate && inv.date < fromDate) return false;
        if (toDate && inv.date > toDate) return false;
      }

      if (selectedClientId !== 'all' && inv.clientId !== selectedClientId) {
        return false;
      }

      if (selectedProductId !== 'all') {
        const has = inv.items?.some((it) => it.productId === selectedProductId);
        if (!has) return false;
      }

      return true;
    });
  }, [invoices, isAllDates, fromDate, toDate, selectedClientId, selectedProductId]);

  // KPIs
  const kpis = useMemo(() => {
    let totalDh = 0;
    let totalKg = 0;

    filteredInvoices.forEach((inv) => {
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((item) => {
          if (selectedProductId === 'all' || item.productId === selectedProductId) {
            const w = Number(item.weight) || 0;
            const t =
              item.total !== undefined && !isNaN(Number(item.total)) && Number(item.total) !== 0
                ? Number(item.total)
                : w * (Number(item.price) || 0);
            totalKg += w;
            totalDh += t;
          }
        });
      } else if (selectedProductId === 'all') {
        totalKg += Number(inv.totalWeight) || 0;
        totalDh += Number(inv.totalAmount) || 0;
      }
    });

    return {
      revenue: totalDh,
      weight: totalKg,
      count: filteredInvoices.length,
    };
  }, [filteredInvoices, selectedProductId]);

  // Product performance calculation
  const productStats = useMemo(() => {
    const map = {};
    INITIAL_PRODUCTS.forEach((p) => {
      map[p.id] = { ...p, totalWeight: 0, totalAmount: 0, orderCount: 0 };
    });

    filteredInvoices.forEach((inv) => {
      inv.items?.forEach((it) => {
        if (map[it.productId]) {
          const w = Number(it.weight) || 0;
          const t =
            it.total !== undefined && !isNaN(Number(it.total)) && Number(it.total) !== 0
              ? Number(it.total)
              : w * (Number(it.price) || 0);
          map[it.productId].totalWeight += w;
          map[it.productId].totalAmount += t;
          map[it.productId].orderCount += 1;
        }
      });
    });

    const list = Object.values(map);
    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredInvoices]);

  const maxProductRevenue = Math.max(...productStats.map((p) => p.totalAmount), 1);

  // Client breakdown
  const clientStats = useMemo(() => {
    const map = {};

    filteredInvoices.forEach((inv) => {
      const cid = inv.clientId || 'unregistered';
      const cname = inv.clientName || 'زبون عام';

      if (!map[cid]) {
        map[cid] = {
          clientId: cid,
          clientName: cname,
          phone: inv.clientPhone || '',
          totalAmount: 0,
          totalWeight: 0,
          invoiceCount: 0,
          productsBought: {},
        };
      }

      map[cid].invoiceCount += 1;

      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((it) => {
          if (selectedProductId === 'all' || it.productId === selectedProductId) {
            const w = Number(it.weight) || 0;
            const t =
              it.total !== undefined && !isNaN(Number(it.total)) && Number(it.total) !== 0
                ? Number(it.total)
                : w * (Number(it.price) || 0);
            map[cid].totalAmount += t;
            map[cid].totalWeight += w;

            if (!map[cid].productsBought[it.productId]) {
              map[cid].productsBought[it.productId] = {
                productName: it.productName,
                weight: 0,
                amount: 0,
              };
            }
            map[cid].productsBought[it.productId].weight += w;
            map[cid].productsBought[it.productId].amount += t;
          }
        });
      } else if (selectedProductId === 'all') {
        map[cid].totalAmount += Number(inv.totalAmount) || 0;
        map[cid].totalWeight += Number(inv.totalWeight) || 0;
      }
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredInvoices, selectedProductId]);

  const maxClientRevenue = Math.max(...clientStats.map((c) => c.totalAmount), 1);

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fadeIn">
      {/* Sticky Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-3">
        {/* Date Range Selector Trigger */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>فترة التقرير (من تاريخ إلى تاريخ):</span>
            </span>
            {!isAllDates && (
              <button
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setIsAllDates(true);
                  setFromDate('');
                }}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-all flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط إلى (الكل)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setIsDateModalOpen(true);
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/70 border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 text-right transition-all flex items-center justify-between shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:border-emerald-300 transition-all">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="min-w-0 flex-1">
                {isAllDates ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">جميع التواريخ (الكل)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        محدد افتراضياً
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      اضغط لتحديد الفترة من تاريخ محدد إلى تاريخ انتهاء بالتقويم العربي
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 truncate">
                      <span className="text-slate-500 font-bold">من:</span>
                      <span className="text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {formatArabicDisplayDate(fromDate) || 'البداية'}
                      </span>
                      <span className="text-slate-400 font-normal">➔</span>
                      <span className="text-slate-500 font-bold">إلى:</span>
                      <span className="text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {formatArabicDisplayDate(toDate) || 'اليوم'}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                      <span>✓ فترة مخصصة</span>
                      <span className="text-slate-400 font-normal">• اضغط لتعديل التواريخ بالتقويم</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mr-2 text-slate-400 group-hover:text-slate-600 transition-all">
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Client & Product Selectors (Full Width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          {/* Client Filter */}
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => {
                playHapticSound('tap');
                setSelectedClientId(e.target.value);
              }}
              className="w-full h-11 pr-8 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              <option value="all">جميع الزبائن</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Users className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => {
                playHapticSound('tap');
                setSelectedProductId(e.target.value);
              }}
              className="w-full h-11 pr-8 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              <option value="all">جميع المنتوجات (12)</option>
              {INITIAL_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} - {p.name}
                </option>
              ))}
            </select>
            <Package className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3 High-Contrast Commercial KPI Cards (2 + 1 Grid on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* KPI 1: Revenue (Bold Emerald) */}
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-emerald-600/30 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>إجمالي المبيعات</span>
          </span>
          <div className="text-3xl font-black font-mono text-emerald-700 tracking-tight mt-1.5 tabular-nums">
            {formatDh(kpis.revenue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">المدخول الصافي</span>
        </div>

        {/* KPI 2: Weight */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-slate-700" />
            <span>إجمالي الوزن</span>
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 tracking-tight mt-1.5 tabular-nums">
            <bdi dir="ltr">{formatKg(kpis.weight)}</bdi>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">السلع المسلمة</span>
        </div>

        {/* KPI 3: Invoices Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>عدد الفواتير</span>
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 tracking-tight mt-1.5 tabular-nums">
            {kpis.count}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">عملية بيع</span>
        </div>
      </div>

      {/* Breakdown View Toggle Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => {
            playHapticSound('tap');
            setBreakdownView('products');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${breakdownView === 'products'
            ? 'bg-white text-slate-900 shadow-sm font-black'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          تحليل المنتوجات
        </button>

        <button
          type="button"
          onClick={() => {
            playHapticSound('tap');
            setBreakdownView('clients');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${breakdownView === 'clients'
            ? 'bg-white text-slate-900 shadow-sm font-black'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          تحليل الزبائن
        </button>
      </div>

      {/* Breakdown View 1: Products */}
      {breakdownView === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">أداء مبيعات المنتوجات الـ 12</h4>
            <span className="text-xs text-slate-400 font-semibold">مرتب حسب المداخيل</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productStats.map((item, idx) => {
              const pct = (item.totalAmount / maxProductRevenue) * 100;
              return (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold w-4">{idx + 1}</span>
                      <span className="font-black text-slate-900 text-sm">{item.name}</span>
                      <bdi dir="ltr" className="text-slate-400 font-mono text-[11px] tabular-nums">
                        ({formatKg(item.totalWeight)})
                      </bdi>
                    </div>

                    <span className="font-mono font-black text-slate-900 text-sm tabular-nums">
                      {formatDh(item.totalAmount)}
                    </span>
                  </div>

                  {/* Clean Horizontal Progress Bar */}
                  <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown View 2: Clients */}
      {breakdownView === 'clients' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">ترتيب الزبائن ومشترياتهم</h4>
            <span className="text-xs text-slate-400 font-semibold">انقر لعرض الأصناف</span>
          </div>

          {/* Clients Cards Grid (1 col on mobile, 2 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientStats.length > 0 ? (
              clientStats.map((c, idx) => {
                const isExpanded = expandedClientId === c.clientId;
                const productsList = Object.values(c.productsBought);

                return (
                  <div
                    key={c.clientId}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-white"
                  >
                    <div
                      onClick={() => {
                        playHapticSound('tap');
                        setExpandedClientId(isExpanded ? null : c.clientId);
                      }}
                      className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-xs text-slate-400 w-4">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-black text-slate-900 block">
                            {c.clientName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {c.invoiceCount} فواتير • <bdi dir="ltr">{formatKg(c.totalWeight)}</bdi>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-700 text-sm tabular-nums">
                          {formatDh(c.totalAmount)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-600' : ''
                            }`}
                        />
                      </div>
                    </div>

                    {/* Expandable Drill-Down of Items Purchased */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-slate-600">
                          السلع المشتراة لـ {c.clientName}:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {productsList.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800">{p.productName}</span>
                              <div className="text-left font-mono tabular-nums">
                                <bdi dir="ltr" className="font-bold text-slate-900 block text-[11px]">
                                  {formatKg(p.weight)}
                                </bdi>
                                <span className="text-emerald-700 text-[10px] font-semibold block">
                                  {formatDh(p.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-bold">
                لا توجد بيانات مطابقة
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arabic Date Range Picker Modal */}
      <ArabicDateRangeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        initialFrom={fromDate}
        initialTo={toDate}
        isAll={isAllDates}
        onApply={({ from, to, isAll }) => {
          setIsAllDates(isAll);
          setFromDate(from);
          setToDate(to);
        }}
      />
    </div>
  );
}
