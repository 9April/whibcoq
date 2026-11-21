import React, { useState, useRef, useEffect } from 'react';
import { X, UserPlus, Phone, User, Check, Tag, Sparkles, MapPin } from 'lucide-react';
import { playHapticSound, getStoredClientCategories, saveCustomClientCategory } from '../utils/storage';

export function ClientModal({ isOpen, onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('مطعم');
  const [categoriesList, setCategoriesList] = useState(() => getStoredClientCategories());
  const customInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCategoriesList(getStoredClientCategories());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    playHapticSound('success');
    const cleanCategory = category.trim() || 'عام';

    // Persist new category as a suggestion if provided
    if (cleanCategory && cleanCategory !== 'عام') {
      const updatedCats = saveCustomClientCategory(cleanCategory);
      setCategoriesList(updatedCats);
    }

    const newClient = {
      id: 'c_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      category: cleanCategory,
    };

    onAddClient(newClient);
    setName('');
    setPhone('');
    setAddress('');
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
              <h2 className="text-xl font-black text-slate-900">إضافة زبون جديد</h2>
              <p className="text-xs text-slate-500">تسجيل بيانات الزبون لطباعتها في الفاتورة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* 1. Client Name (Required) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>الاسم أو اسم المحل (ضروري) *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطعم الأطلس، سناك السعادة، المعلم كريم..."
              className="w-full h-12 px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-base font-bold text-slate-900 outline-none transition-all"
            />
          </div>

          {/* 2. Phone (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>رقم الهاتف (اختياري)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ''))}
              placeholder="06XXXXXXXX"
              dir="ltr"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-base font-bold font-mono text-slate-900 outline-none text-left transition-all tabular-nums"
              style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
            />
          </div>

          {/* 3. Address (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>العنوان (اختياري)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: حي السلام، شارع محمد الخامس..."
              className="w-full h-12 px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Activity Category */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>النشاط:</span>
              </span>
              <span className="text-[10px] text-slate-400">
                (اختياري)
              </span>
            </label>

            <div className="flex items-center gap-1.5 flex-wrap">
              {categoriesList.slice(0, 5).map((cat) => {
                const isSelected = category.trim() === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectPreset(cat)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-13 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>حفظ الزبون والمتابعة</span>
          </button>
        </form>
      </div>
    </div>
  );
}
