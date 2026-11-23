import React, { useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Package,
  PlusCircle,
  Receipt,
  Scale,
  ArrowUpRight,
  Flame,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { INITIAL_PRODUCTS, BUSINESS_INFO } from '../data/initialData';
import { formatDh, formatKg, playHapticSound, getBusinessInfo } from '../utils/storage';

export function HomeDashboard({
  clients,
  invoices,
  products,
  onStartNewInvoice,
  onViewClients,
  onViewHistory,
  onManageProducts,
}) {
  const businessInfo = getBusinessInfo();
  const activeProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;

  // Compute Products Sales Analytics
  const analytics = useMemo(() => {
    const productStats = {};

    // Initialize all products
    activeProducts.forEach((p) => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        subname: p.subname,
        category: p.category,
        totalWeight: 0,
        totalAmount: 0,
        orderCount: 0,
      };
    });

    let totalRevenue = 0;
    let totalWeight = 0;

    invoices.forEach((inv) => {
      totalRevenue += Number(inv.totalAmount) || 0;
      totalWeight += Number(inv.totalWeight) || 0;

      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const pid = item.productId;
          if (!productStats[pid]) {
            productStats[pid] = {
              id: pid,
              name: item.productName || pid,
              subname: '',
              category: 'عام',
              totalWeight: 0,
              totalAmount: 0,
              orderCount: 0,
            };
          }
          productStats[pid].totalWeight += Number(item.weight) || 0;
          productStats[pid].totalAmount += Number(item.total) || 0;
          productStats[pid].orderCount += 1;
        });
      }
    });

    // Sort by total weight sold descending
    const sortedProducts = Object.values(productStats).sort(
      (a, b) => b.totalWeight - a.totalWeight
    );

    const mostSoldProduct = sortedProducts[0] || null;

    // Today's summary
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter((i) => i.date === todayStr);
    const todayRevenue = todayInvoices.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);
    const todayWeight = todayInvoices.reduce((acc, i) => acc + (Number(i.totalWeight) || 0), 0);

    return {
      totalRevenue,
      totalWeight,
      todayRevenue,
      todayWeight,
      todayInvoicesCount: todayInvoices.length,
      sortedProducts,
      mostSoldProduct,
    };
  }, [invoices]);

  const { mostSoldProduct, sortedProducts } = analytics;

  return (
    <div className="flex flex-col gap-4 pb-28 sm:pb-32 animate-fadeIn" dir="rtl">
      {/* Welcome Banner & Quick Start Button */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-700/15 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-400/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs font-bold text-emerald-100">لوحة التحكم السريعة</span>
              <span className="text-xs font-medium text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs mr-2">
                {new Date().toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                مرحباً بك في {businessInfo.name || BUSINESS_INFO.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                تجارة وتوزيع الدواجن بالجملة والتفصيل
              </p>
            </div>
          </div>

          {/* Prominent CTA to Launch Invoice Steps */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('success');
              onStartNewInvoice();
            }}
            className="w-full md:w-auto md:min-w-[280px] h-13 px-6 bg-white hover:bg-emerald-50 active:bg-slate-100 text-emerald-800 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-98 transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            <span>+ إنشاء فاتورة جديدة الآن (نظام الخطوات)</span>
            <ChevronLeft className="w-4 h-4 text-emerald-600 mr-auto ml-1 md:mr-2 md:ml-0" />
          </button>
        </div>
      </div>

      {/* 1 & 2. STATS ROW (Best Seller + Clients + Products: 2 cols on mobile, 3 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. MOST SOLD PRODUCT CARD (المنتج الأكثر مبيعاً) */}
        {mostSoldProduct && mostSoldProduct.totalWeight > 0 ? (
          <div className="col-span-2 lg:col-span-1 bg-white border-2 border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-600 animate-pulse" />
                </span>
                <div>
                  <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider block">
                    المنتج الأكثر مبيعاً
                  </span>
                  <span className="text-xs text-slate-500 font-bold">Top 1 Best Seller</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                {mostSoldProduct.category}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {mostSoldProduct.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{mostSoldProduct.subname || 'سلعة رئيسية'}</p>
              </div>

              <div className="text-left flex flex-col items-end">
                <div className="flex items-baseline gap-1" dir="ltr">
                  <span className="font-mono text-2xl font-black text-emerald-700 tabular-nums">
                    {mostSoldProduct.totalWeight.toFixed(1)}
                  </span>
                  <span className="text-xs font-black text-slate-600">g</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 tabular-nums">
                  {formatDh(mostSoldProduct.totalAmount)}
                </span>
              </div>
            </div>

            {/* Mini progress representation of top product vs total weight */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>نسبة الوزن من إجمالي المبيعات</span>
                <span className="font-mono text-emerald-700">
                  {analytics.totalWeight > 0
                    ? Math.round((mostSoldProduct.totalWeight / analytics.totalWeight) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      analytics.totalWeight > 0
                        ? Math.min(100, Math.round((mostSoldProduct.totalWeight / analytics.totalWeight) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 text-center text-slate-500 text-xs flex items-center justify-center">
            لا توجد مبيعات مسجلة حتى الآن
          </div>
        )}

        {/* Clients Card */}
        <div
          onClick={onViewClients}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:border-emerald-300 transition-all cursor-pointer active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 block">الزبائن المسجلون</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {clients.length}
              </span>
              <span className="text-xs font-bold text-slate-600">زبون</span>
            </div>
          </div>

          <span className="text-[10px] sm:text-xs text-indigo-600 font-bold mt-2 block">
            إدارة وتعديل الزبائن ←
          </span>
        </div>

        {/* Products Card */}
        <div
          onClick={() => {
            playHapticSound('tap');
            onManageProducts?.();
          }}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:border-amber-300 transition-all cursor-pointer active:scale-98 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 block">سلع الدواجن</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {activeProducts.length}
              </span>
              <span className="text-xs font-bold text-slate-600">سلعة</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playHapticSound('tap');
              onManageProducts?.();
            }}
            className="text-[10px] sm:text-xs text-amber-600 hover:text-amber-700 font-bold mt-2 block text-right group-hover:underline cursor-pointer"
          >
            إدارة وتعديل السلع ←
          </button>
        </div>
      </div>

      {/* 3 & 4. RANKING & ACTIVITY ROW (Stacked on mobile, 2 cols on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 3. TOP PRODUCTS SALES RANKING (المنتجات الأكثر مبيعاً بالتفصيل) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-600" />
                </span>
                <h2 className="text-sm font-black text-slate-900">أعلى سلع الدواجن طلباً</h2>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">بالوزن (g)</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {sortedProducts.slice(0, 4).map((prod, idx) => {
                const percentage =
                  analytics.totalWeight > 0
                    ? Math.round((prod.totalWeight / analytics.totalWeight) * 100)
                    : 0;

                return (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-900'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900">{prod.name}</span>
                        <span className="text-[10px] text-slate-500">({prod.category})</span>
                      </div>

                      <div className="text-left flex items-baseline gap-1" dir="ltr">
                        <span className="font-mono text-xs font-black text-slate-900 tabular-nums">
                          {prod.totalWeight.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">g</span>
                        <span className="text-slate-300 mr-1 ml-1">•</span>
                        <span className="font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                          {formatDh(prod.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. TOTAL INVOICES ACTIVITY SUMMARY */}
        <div
          onClick={onViewHistory}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-emerald-300 transition-all cursor-pointer active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <span className="text-base font-black text-slate-900 block">سجل الفواتير الصادرة</span>
                <span className="text-xs text-slate-500 font-medium">
                  عرض وتعديل وطباعة جميع الفواتير المسجلة
                </span>
              </div>
            </div>

            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 block">عدد الفواتير</span>
              <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                {invoices.length}
              </span>
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/60">
              <span className="text-[11px] font-bold text-emerald-700 block">إجمالي المبيعات</span>
              <span className="text-xl font-black font-mono text-emerald-800 tabular-nums truncate block">
                {formatDh(analytics.totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
