import React, { useState, useMemo } from 'react';
import { Calendar, ChevronRight, ChevronLeft, X, Check, RotateCcw, Clock } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'ماي',
  'يونيو',
  'يوليوز',
  'غشت',
  'شتنبر',
  'أكتوبر',
  'نونبر',
  'دجنبر',
];

const ARABIC_WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export function formatArabicDisplayDate(dStr) {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const year = parts[0];
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${ARABIC_MONTHS[mIdx]} ${year}`;
      }
    }
  } catch {}
  return dStr;
}

export function ArabicDateRangeModal({
  isOpen,
  onClose,
  initialFrom = '',
  initialTo = '',
  isAll: initialIsAll = true,
  onApply,
}) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [activePicking, setActivePicking] = useState('from'); // 'from' | 'to'
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo || todayStr);
  const [isAll, setIsAll] = useState(initialIsAll);

  // Calendar View Month/Year
  const [viewYear, setViewYear] = useState(() => {
    const d = initialFrom ? new Date(initialFrom) : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = initialFrom ? new Date(initialFrom) : new Date();
    return d.getMonth(); // 0 - 11
  });

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    playHapticSound('tap');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    playHapticSound('tap');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handleSelectDay = (day) => {
    playHapticSound('tap');
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateFormatted = `${viewYear}-${mStr}-${dStr}`;

    setIsAll(false);

    if (activePicking === 'from') {
      setFromDate(dateFormatted);
      // Auto-switch to 'to' picking if toDate is earlier than fromDate
      if (toDate && dateFormatted > toDate) {
        setToDate(dateFormatted);
      }
      setActivePicking('to');
    } else {
      if (fromDate && dateFormatted < fromDate) {
        // If selected toDate is before fromDate, swap them
        setToDate(fromDate);
        setFromDate(dateFormatted);
      } else {
        setToDate(dateFormatted);
      }
    }
  };

  const handleSetPreset = (preset) => {
    playHapticSound('tap');
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setIsAll(true);
      setFromDate('');
      setToDate(todayISO);
    } else if (preset === 'today') {
      setIsAll(false);
      setFromDate(todayISO);
      setToDate(todayISO);
    } else if (preset === 'week') {
      setIsAll(false);
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayISO);
    } else if (preset === 'month') {
      setIsAll(false);
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayISO);
    }
  };

  const handleConfirm = () => {
    playHapticSound('success');
    onApply({
      from: isAll ? '' : fromDate,
      to: isAll ? '' : toDate,
      isAll,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn select-none"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">تحديد الفترة بالتقويم</h3>
              <p className="text-[11px] text-slate-500 font-medium">اختر تاريخ البداية والنهاية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: '7 أيام' },
            { id: 'month', label: '30 يوماً' },
          ].map((p) => {
            const isSelected = isAll ? p.id === 'all' : false;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSetPreset(p.id)}
                className={`h-8 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* 2 Date Pick Targets (Start & End) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          {/* Start Date Target */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setActivePicking('from');
              setIsAll(false);
            }}
            className={`p-2.5 rounded-xl text-right transition-all flex flex-col ${
              !isAll && activePicking === 'from'
                ? 'bg-white text-emerald-800 shadow-xs ring-2 ring-emerald-600'
                : 'bg-transparent text-slate-600 hover:bg-white/60'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 block">1. من تاريخ (البداية):</span>
            <span className="text-xs font-black truncate mt-0.5 block">
              {isAll ? 'البداية (الكل)' : formatArabicDisplayDate(fromDate) || 'اختر البداية'}
            </span>
          </button>

          {/* End Date Target */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setActivePicking('to');
              setIsAll(false);
            }}
            className={`p-2.5 rounded-xl text-right transition-all flex flex-col ${
              !isAll && activePicking === 'to'
                ? 'bg-white text-emerald-800 shadow-xs ring-2 ring-emerald-600'
                : 'bg-transparent text-slate-600 hover:bg-white/60'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 block">2. إلى تاريخ (النهاية):</span>
            <span className="text-xs font-black truncate mt-0.5 block">
              {isAll ? 'حتى اليوم' : formatArabicDisplayDate(toDate) || 'اختر النهاية'}
            </span>
          </button>
        </div>

        {/* Arabic Month Navigator */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-sm font-black text-slate-900 block">
              {ARABIC_MONTHS[viewMonth]} {viewYear}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {activePicking === 'from' ? '👈 جارٍ تحديد تاريخ البداية' : '👈 جارٍ تحديد تاريخ النهاية'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
            title="الشهر القادم"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Days Table */}
        <div className="p-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {ARABIC_WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[11px] font-bold text-slate-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(day).padStart(2, '0');
              const cellDate = `${viewYear}-${mStr}-${dStr}`;

              const isFrom = !isAll && fromDate === cellDate;
              const isTo = !isAll && toDate === cellDate;
              const inRange = !isAll && fromDate && toDate && cellDate > fromDate && cellDate < toDate;
              const isToday = cellDate === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all tabular-nums relative ${
                    isFrom || isTo
                      ? 'bg-emerald-600 text-white shadow-xs font-black scale-105 z-10'
                      : inRange
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : isToday
                      ? 'bg-slate-100 text-emerald-700 border border-emerald-300 font-black'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {day}
                  {isToday && !isFrom && !isTo && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>تطبيق الفترة المحددة</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetPreset('all')}
            className="h-12 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
            title="إلغاء الفلتر واختيار الكل"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الكل</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArabicDateRangeModal;
