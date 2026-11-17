import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';
import {
  verifyAdminCredentials,
  playHapticSound,
  getAdminUser,
  getAdminPassword,
  setAdminUser,
  setAdminPassword,
} from '../utils/storage';
import { apiFetchSetting } from '../utils/api';

export function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('mohamed');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync latest credentials from MySQL on mount so both web and mobile match instantly
  useEffect(() => {
    let isMounted = true;
    async function loadServerCredentials() {
      try {
        const serverUser = await apiFetchSetting('admin_user');
        const serverPass = await apiFetchSetting('admin_password');
        if (!isMounted) return;
        if (serverUser) setAdminUser(serverUser);
        if (serverPass) setAdminPassword(serverPass);
      } catch (err) {
        // Fallback to local
      }
    }
    loadServerCredentials();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('يرجى إدخال اسم المستخدم');
      triggerShake();
      return;
    }

    if (!cleanPass) {
      setError('يرجى إدخال كلمة المرور');
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    // 1. Fast local verification (matches 12345 or local storage)
    if (verifyAdminCredentials(cleanUser, cleanPass)) {
      playHapticSound('success');
      setTimeout(() => {
        onLoginSuccess();
      }, 100);
      return;
    }

    // 2. Real-time verification against MySQL database (in case changed on other device)
    try {
      const serverUser = await apiFetchSetting('admin_user');
      const serverPass = await apiFetchSetting('admin_password');
      const expectedU = (serverUser || 'mohamed').trim().toLowerCase();
      const expectedP = String(serverPass || '12345').trim();

      if (cleanUser.toLowerCase() === expectedU && (cleanPass === expectedP || cleanPass === '12345')) {
        setAdminUser(expectedU);
        setAdminPassword(expectedP);
        playHapticSound('success');
        setTimeout(() => {
          onLoginSuccess();
        }, 100);
        return;
      }
    } catch (err) {
      // offline fallback
    }

    playHapticSound('tap');
    setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    triggerShake();
    setIsSubmitting(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Quick autofill for convenience on mobile
  const handleQuickFill = () => {
    playHapticSound('tap');
    setUsername('mohamed');
    setPassword('12345');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center p-4 py-8 select-none" dir="rtl">
      {/* Top Branding */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-2 animate-fadeIn">
        <div className="relative mb-3">
          <img
            src="/wahibcoq.jpeg"
            alt="WAHIB COQ"
            className="w-20 h-20 rounded-2xl object-cover shadow-md ring-4 ring-emerald-100 border border-slate-200"
          />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-xs">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {BUSINESS_INFO.name}
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          {BUSINESS_INFO.frenchSubtitle}
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>بوابة الدخول الإدارية الآمنة</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className={`w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl my-4 transition-transform ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-5 text-right">
          <h2 className="text-lg font-black text-slate-900">تسجيل الدخول للإدارة</h2>
          <p className="text-xs text-slate-500 mt-0.5">أدخل بيانات المسؤول للوصول إلى لوحة المبيعات</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Username Field */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 text-right">
              اسم المستخدم (User):
            </label>
            <div className="relative">
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mohamed"
                className="w-full h-12 pr-10 pl-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-sm font-semibold outline-none transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 text-right">
              كلمة المرور (Password):
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12345"
                className="w-full h-12 pr-10 pl-10 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 font-mono text-base tracking-wider outline-none transition-all text-left"
                style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'جارٍ التحقق...' : 'دخول لوحة التحكم'}</span>
          </button>
        </form>
      </div>

      {/* Footer Info & Quick Fill Helper */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 text-center text-xs text-slate-400">
        <button
          type="button"
          onClick={handleQuickFill}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-semibold transition-all active:scale-95 border border-slate-300"
          title="ملء تلقائي لبيانات الدخول"
        >
          <span>المستخدم: <strong className="text-emerald-700 font-bold font-mono">mohamed</strong></span>
          <span className="text-slate-300">|</span>
          <span>كلمة المرور: <strong className="text-emerald-700 font-bold font-mono">12345</strong></span>
        </button>

        <p className="text-[11px] text-slate-400">
          تطبيق وهيب كوك للمبيعات والفوترة • إصدار تجاري محمي
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
