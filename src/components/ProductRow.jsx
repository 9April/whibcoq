import React, { useRef } from 'react';
import { Check, Plus, Minus, X } from 'lucide-react';
import { formatDh, playHapticSound } from '../utils/storage';

// Normalize Arabic/Persian digits and comma decimal separators
function normalizeDecimalInput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[,،]/g, '.');
}

export function ProductRow({
  product,
  weight,
  price,
  onWeightChange,
  onPriceChange,
}) {
  const weightInputRef = useRef(null);
  const priceInputRef = useRef(null);

  const numWeight = parseFloat(weight) || 0;
  const numPrice = parseFloat(price) || 0;
  const rowTotal = numWeight * numPrice;
  const isActive = numWeight > 0;

  const handleWeightStep = (delta) => {
    playHapticSound('tap');
    const next = Math.max(0, Math.round((numWeight + delta) * 10) / 10);
    onWeightChange(product.id, next === 0 ? '' : next);
  };

  const handlePriceStep = (delta) => {
    playHapticSound('tap');
    const next = Math.max(0, Math.round((numPrice + delta) * 10) / 10);
    onPriceChange(product.id, next);
  };

  const handleClear = () => {
    playHapticSound('tap');
    onWeightChange(product.id, '');
  };

  return (
    <div
      className={`w-full bg-white rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 shadow-xs flex flex-col gap-2.5 ${
        isActive
          ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Bar: Product Name + Code/Category + Checkmark & Row Total */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0 tabular-nums">
            {product.number}
          </span>

          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {product.name}
            </h3>
          </div>
        </div>

        {/* Total & Active Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive ? (
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black font-mono text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg border border-emerald-300/60 tabular-nums">
                {formatDh(rowTotal)}
              </span>

              <button
                type="button"
                onClick={handleClear}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                title="إلغاء الكمية"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              0,00 درهم
            </span>
          )}
        </div>
      </div>

      {/* Inputs Bar: Side-by-side Large Height Inputs (52px) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* 1. Weight Input (الوزن بالكيلوغرام) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
            <span>الوزن (kg)</span>
            {numWeight > 0 && (
              <span className="text-emerald-700 text-[11px] font-mono font-bold tabular-nums" dir="ltr">
                {numWeight} kg
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            {/* Decrement Button */}
            <button
              type="button"
              onClick={() => handleWeightStep(-1)}
              className="absolute right-1 w-9 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all text-base z-10 cursor-pointer"
              aria-label="إنقاص 1 kg"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Large 52px Decimal Input */}
            <input
              ref={weightInputRef}
              type="text"
              inputMode="decimal"
              value={weight === 0 || weight === '' ? '' : weight}
              placeholder="0.0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = normalizeDecimalInput(e.target.value);
                if (/^\d*\.?\d*$/.test(val)) {
                  onWeightChange(product.id, val);
                }
              }}
              className={`w-full h-[52px] px-11 text-center font-mono font-black text-2xl rounded-xl border-2 transition-all outline-none tabular-nums ${
                isActive
                  ? 'border-emerald-500 bg-white text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 focus:bg-white'
              }`}
            />

            {/* Increment Button */}
            <button
              type="button"
              onClick={() => handleWeightStep(1)}
              className="absolute left-1 w-9 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center active:scale-95 transition-all text-base z-10 cursor-pointer"
              aria-label="زيادة 1 kg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. Price Input (الثمن بالدرهم) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
            <span>الثمن (درهم/kg)</span>
            <span className="text-slate-400 text-[11px] font-mono" dir="ltr">درهم/kg</span>
          </div>

          <div className="relative flex items-center">
            {/* Decrement Button */}
            <button
              type="button"
              onClick={() => handlePriceStep(-1)}
              className="absolute right-1 w-9 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all text-base z-10 cursor-pointer"
              aria-label="إنقاص درهم"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Large 52px Decimal Input */}
            <input
              ref={priceInputRef}
              type="text"
              inputMode="decimal"
              value={price === undefined || price === null ? 0 : price}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (price === '' || price === undefined || price === null) {
                  onPriceChange(product.id, 0);
                }
              }}
              onChange={(e) => {
                const val = normalizeDecimalInput(e.target.value);
                if (/^\d*\.?\d*$/.test(val)) {
                  onPriceChange(product.id, val);
                }
              }}
              className="w-full h-[52px] px-11 text-center font-mono font-black text-2xl rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 focus:bg-white transition-all outline-none tabular-nums"
            />

            {/* Increment Button */}
            <button
              type="button"
              onClick={() => handlePriceStep(1)}
              className="absolute left-1 w-9 h-10 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center active:scale-95 transition-all text-base z-10 cursor-pointer"
              aria-label="زيادة درهم"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
