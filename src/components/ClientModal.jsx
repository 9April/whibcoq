import React, { useState, useRef } from 'react';
import { X, UserPlus, Phone, User, Check, Tag } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

export function ClientModal({ isOpen, onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('مطعم');
  const customInputRef = useRef(null);

  if (!isOpen) return null;

  const presetCategories = [
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
      category: category.trim() || 'عام',
    };

    onAddClient(newClient);
    setName('');
    setPhone('');
    setCategory('مطعم');
    onClose();
  };

  const handleSelectPreset = (cat) => {
    playHapticSound('tap');
    setCategory(cat);
  };

  const handleSelectOther = () => {
    playHapticSound('tap');
    setCategory('');
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 50);
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
          {/* Client Name */}
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

          {/* Activity Type with Blank Input to Add Another Manually */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>نوع النشاط التجاري:</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                (اختر أو اكتب نشاطاً يدوياً)
              </span>
            </label>

            {/* Blank/Editable Input for Activity Type */}
            <div className="relative">
              <input
                ref={customInputRef}
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="اكتب نوع النشاط هنا (مثال: فندق، مقهى، جزار، مخبزة...)"
                className="w-full h-12 pr-10 pl-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick preset pills + "آخر" option */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {presetCategories.map((cat) => {
                const isSelected = category.trim() === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectPreset(cat)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleSelectOther}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                  !presetCategories.includes(category.trim()) && category.trim() !== ''
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 text-emerald-800 border-dashed border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                + نشاط يدوي آخر
              </button>
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
