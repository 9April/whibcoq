import React, { useState } from 'react';
import { X, UserPlus, Phone, User, Check } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

export function ClientModal({ isOpen, onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('مطعم');

  if (!isOpen) return null;

  const categories = [
    'مطعم',
    'سناك',
    'شواية',
    'تاجر جملة',
    'تموين حفلات',
    'زبون نقدي',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    playHapticSound('success');
    const newClient = {
      id: 'c_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      category: category,
    };

    onAddClient(newClient);
    setName('');
    setPhone('');
    setCategory('مطعم');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">إضافة زبون تجاري</h2>
              <p className="text-xs text-slate-500">تسجيل زبون في قاعدة البيانات المحلية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>اسم الزبون أو المحل التجاري *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطعم الأطلس، سناك السعادة، المعلم كريم..."
              className="w-full h-[52px] px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-lg font-bold text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>رقم الهاتف (اختياري)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 XX XX XX XX"
              dir="ltr"
              className="w-full h-[52px] px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-lg font-bold font-mono text-slate-900 outline-none text-right transition-all tabular-nums"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">نوع النشاط:</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playHapticSound('tap');
                    setCategory(cat);
                  }}
                  className={`h-11 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                    category === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-[52px] mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>حفظ الزبون</span>
          </button>
        </form>
      </div>
    </div>
  );
}
