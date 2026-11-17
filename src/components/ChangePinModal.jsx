import React, { useState } from 'react';
import { X, KeyRound, Check, AlertCircle } from 'lucide-react';
import { verifyAdminPin, setAdminPin, playHapticSound } from '../utils/storage';

export function ChangePinModal({ isOpen, onClose }) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!verifyAdminPin(oldPin)) {
      setError('الرمز السري الحالي غير صحيح');
      playHapticSound('tap');
      return;
    }

    if (newPin.length < 4) {
      setError('الرمز الجديد يجب أن يتكون من 4 أرقام على الأقل');
      playHapticSound('tap');
      return;
    }

    if (newPin !== confirmPin) {
      setError('الرمز الجديد وتأكيده غير متطابقين');
      playHapticSound('tap');
      return;
    }

    setAdminPin(newPin);
    setSuccess(true);
    playHapticSound('success');

    setTimeout(() => {
      setSuccess(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn" dir="rtl">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-600" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">تغيير الرمز السري</h2>
              <p className="text-xs text-slate-500">حماية الدخول الإداري للتطبيق</p>
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

        {success ? (
          <div className="py-6 text-center flex flex-col items-center gap-2 text-emerald-700 font-black animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <span>تم تغيير الرمز السري بنجاح!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الرمز الحالي:</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="****"
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الرمز الجديد (4 أرقام):</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="****"
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">تأكيد الرمز الجديد:</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="****"
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>تحديث الرمز السري</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
