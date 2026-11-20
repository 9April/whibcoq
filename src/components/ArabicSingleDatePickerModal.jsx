import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronLeft, X, Check, RotateCcw, Clock } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

export const MOROCCAN_ARABIC_MONTHS = [
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

export const ARABIC_WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export function formatMoroccanDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${MOROCCAN_ARABIC_MONTHS[mIdx]} ${year}`;
      }
    }
  } catch {}
  return dateStr;
}

export function ArabicSingleDatePickerModal({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
}) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(currentDate || todayISO);

  // Parse initial date
  const parseYearMonth = (dStr) => {
    try {
      if (dStr) {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          return {
            year: parseInt(parts[0], 10),
            month: parseInt(parts[1], 10) - 1,
          };
        }
      }
    } catch {}
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  };

  const initialYM = parseYearMonth(currentDate || todayISO);
  const [viewYear, setViewYear] = useState(initialYM.year);
  const [viewMonth, setViewMonth] = useState(initialYM.month);

  useEffect(() => {
    if (isOpen) {
      const validDate = currentDate || todayISO;
      setSelectedDate(validDate);
      const ym = parseYearMonth(validDate);
      setViewYear(ym.year);
      setViewMonth(ym.month);
    }
  }, [isOpen, currentDate, todayISO]);

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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handleSelectDay = (day) => {
    playHapticSound('success');
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateFormatted = `${viewYear}-${mStr}-${dStr}`;
    setSelectedDate(dateFormatted);
    onSelectDate(dateFormatted);
    onClose();
  };

  const handleApply = () => {
    playHapticSound('success');
    onSelectDate(selectedDate);
    onClose();
  };

  const handleSetQuick = (daysAgo) => {
    playHapticSound('success');
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    onSelectDate(iso);
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
              <h3 className="text-base font-black text-slate-900">تحديد تاريخ الفاتورة</h3>
              <p className="text-[11px] text-slate-500 font-medium">التقويم المغربي المحلي</p>
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

        {/* Quick Date Presets */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleSetQuick(0)}
            className={`h-8 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
              selectedDate === todayISO
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => handleSetQuick(1)}
            className="h-8 rounded-xl text-xs font-bold transition-all active:scale-95 border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          >
            الأمس
          </button>
          <button
            type="button"
            onClick={() => handleSetQuick(2)}
            className="h-8 rounded-xl text-xs font-bold transition-all active:scale-95 border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          >
            قبل يومين
          </button>
        </div>

        {/* Selected Date Indicator */}
        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800">التاريخ المختار:</span>
          <span className="text-xs font-black text-emerald-950 font-mono">
            {formatMoroccanDate(selectedDate)}
          </span>
        </div>

        {/* Moroccan Month Navigator */}
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
            <span className="text-base font-black text-slate-900 block">
              {MOROCCAN_ARABIC_MONTHS[viewMonth]} {viewYear}
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

              const isSelected = selectedDate === cellDate;
              const isToday = cellDate === todayISO;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all tabular-nums relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs font-black scale-105 z-10'
                      : isToday
                      ? 'bg-slate-100 text-emerald-700 border border-emerald-300 font-black'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
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
            onClick={handleApply}
            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>تأكيد ومتابعة للسلع ({formatMoroccanDate(selectedDate)})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              onClose();
            }}
            className="h-12 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArabicSingleDatePickerModal;
