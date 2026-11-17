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
  Layers
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { formatDh, formatKg, playHapticSound } from '../utils/storage';

export function AnalyticsReports({ invoices, clients }) {
  const [dateFilter, setDateFilter] = useState('all');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState('all');

  const [expandedClientId, setExpandedClientId] = useState(null);
  const [breakdownView, setBreakdownView] = useState('products'); // 'products' | 'clients'

  // Filter logic
  const filteredInvoices = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const getDaysDiff = (dateStr) => {
      const d = new Date(dateStr);
      return (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
    };

    return invoices.filter((inv) => {
      if (dateFilter === 'today') {
        if (inv.date !== todayStr) return false;
      } else if (dateFilter === 'week') {
        const days = getDaysDiff(inv.date);
        if (days > 7 || days < 0) return false;
      } else if (dateFilter === 'month') {
        const days = getDaysDiff(inv.date);
        if (days > 30 || days < 0) return false;
      } else if (dateFilter === 'custom') {
        if (customFromDate && inv.date < customFromDate) return false;
        if (customToDate && inv.date > customToDate) return false;
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
  }, [invoices, dateFilter, customFromDate, customToDate, selectedClientId, selectedProductId]);

  // KPIs
  const kpis = useMemo(() => {
    let totalDh = 0;
    let totalKg = 0;

    filteredInvoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        if (selectedProductId === 'all' || item.productId === selectedProductId) {
          totalDh += item.total || 0;
          totalKg += item.weight || 0;
        }
      });
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
          map[it.productId].totalWeight += it.weight || 0;
          map[it.productId].totalAmount += it.total || 0;
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

      inv.items?.forEach((it) => {
        if (selectedProductId === 'all' || it.productId === selectedProductId) {
          map[cid].totalAmount += it.total || 0;
          map[cid].totalWeight += it.weight || 0;

          if (!map[cid].productsBought[it.productId]) {
            map[cid].productsBought[it.productId] = {
              productName: it.productName,
              weight: 0,
              amount: 0,
            };
          }
          map[cid].productsBought[it.productId].weight += it.weight || 0;
          map[cid].productsBought[it.productId].amount += it.total || 0;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredInvoices, selectedProductId]);

  const maxClientRevenue = Math.max(...clientStats.map((c) => c.totalAmount), 1);

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fadeIn">
      {/* Sticky Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-3">
        {/* Date Range Horizontal Scrollable Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'all', label: 'الكل' },
            { id: 'custom', label: 'تاريخ مخصص' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setDateFilter(pill.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 border ${
                dateFilter === pill.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Custom date range if picked */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">من:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">إلى:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        )}

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
            {formatKg(kpis.weight)}
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            breakdownView === 'products'
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            breakdownView === 'clients'
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

          <div className="flex flex-col gap-2.5 divide-y divide-slate-100">
            {productStats.map((item, idx) => {
              const pct = (item.totalAmount / maxProductRevenue) * 100;
              return (
                <div key={item.id} className="pt-2 first:pt-0 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold w-4">{idx + 1}</span>
                      <span className="font-black text-slate-900 text-sm">{item.name}</span>
                      <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                        ({formatKg(item.totalWeight)})
                      </span>
                    </div>

                    <span className="font-mono font-black text-slate-900 text-sm tabular-nums">
                      {formatDh(item.totalAmount)}
                    </span>
                  </div>

                  {/* Clean Horizontal Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

          <div className="flex flex-col gap-2">
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
                            {c.invoiceCount} فواتير • {formatKg(c.totalWeight)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-700 text-sm tabular-nums">
                          {formatDh(c.totalAmount)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-180 text-emerald-600' : ''
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
                                <span className="font-bold text-slate-900 block text-[11px]">
                                  {formatKg(p.weight)}
                                </span>
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
    </div>
  );
}
