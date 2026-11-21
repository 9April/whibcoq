import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, Check, MapPin, Edit3 } from 'lucide-react';
import { playHapticSound } from '../utils/storage';

export function ClientModal({ isOpen, onClose, onAddClient, clientToEdit = null, onUpdateClient }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setPhone(clientToEdit.phone || '');
      setAddress(clientToEdit.address || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    playHapticSound('success');

    if (clientToEdit) {
      const updated = {
        ...clientToEdit,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      if (onUpdateClient) {
        onUpdateClient(updated);
      }
    } else {
      const newClient = {
        id: 'c_' + Date.now(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      if (onAddClient) {
        onAddClient(newClient);
      }
    }

    setName('');
    setPhone('');
    setAddress('');
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
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${clientToEdit ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {clientToEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {clientToEdit ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                {clientToEdit ? `تعديل معلومات ${clientToEdit.name}` : 'تسجيل بيانات الزبون لطباعتها في الفاتورة'}
              </p>
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

        {/* Form: 3 Clean Fields */}
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-13 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{clientToEdit ? 'حفظ التعديلات' : 'حفظ الزبون والمتابعة'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
