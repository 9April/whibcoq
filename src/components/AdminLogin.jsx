import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Delete, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';
import { verifyAdminPin, playHapticSound } from '../utils/storage';

export function AdminLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Handle digit press
  const handleDigit = (digit) => {
    playHapticSound('tap');
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      // Auto-submit if reaches 4 digits and matches
      if (nextPin.length >= 4) {
        if (verifyAdminPin(nextPin)) {
          playHapticSound('success');
          onLoginSuccess();
        } else if (nextPin.length === 4) {
          // Trigger shake if 4 digits entered and wrong
          setTimeout(() => {
            if (!verifyAdminPin(nextPin)) {
              handleError();
            }
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    playHapticSound('tap');
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    playHapticSound('tap');
    setPin('');
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin('');
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    if (verifyAdminPin(pin)) {
      playHapticSound('success');
      onLoginSuccess();
    } else {
      handleError();
    }
  };

  // Keyboard support for desktop/laptops
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleManualSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center p-4 py-8 select-none" dir="rtl">
      {/* Top Branding */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md mb-3 ring-4 ring-emerald-100">
          W
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {BUSINESS_INFO.name}
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          {BUSINESS_INFO.frenchSubtitle}
        </p>

        <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>بوابة الدخول الإداري المحمية</span>
        </div>
      </div>

      {/* PIN Dots Display */}
      <div className="w-full max-w-xs flex flex-col items-center my-6">
        <div className={`flex items-center justify-center gap-4 py-4 transition-transform ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-emerald-600 scale-125 ring-4 ring-emerald-100'
                    : 'bg-slate-200 border-2 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {error ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 animate-fadeIn mt-1">
            <AlertCircle className="w-4 h-4" />
            <span>الرمز السري غير صحيح، حاول ثانية</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-semibold mt-1">
            أدخل الرمز السري المكوّن من 4 أرقام
          </p>
        )}
      </div>

      {/* Numeric Keypad (Fintech Style) */}
      <div className="w-full max-w-xs flex flex-col gap-2.5">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(String(digit))}
              className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-200 shadow-sm text-slate-900 font-mono font-black text-2xl flex items-center justify-center transition-all active:scale-95 tabular-nums"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            مسح
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-200 border border-slate-200 shadow-sm text-slate-900 font-mono font-black text-2xl flex items-center justify-center transition-all active:scale-95 tabular-nums"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all active:scale-95"
            aria-label="مسح رقم"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Submit if typed */}
        {pin.length >= 4 && (
          <button
            type="button"
            onClick={handleManualSubmit}
            className="w-full h-12 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 animate-fadeIn"
          >
            <span>دخول النظام</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* Footer Info & Default PIN reminder */}
      <div className="w-full max-w-xs text-center mt-6 text-xs text-slate-400">
        <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200">
          <span className="font-bold text-slate-700 block">الرمز السري الافتراضي: </span>
          <span className="font-mono font-black text-emerald-700 text-sm tracking-widest tabular-nums">1234</span>
        </div>
      </div>
    </div>
  );
}
