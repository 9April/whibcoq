import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  KeyRound,
  Check,
  AlertCircle,
  Phone,
  MapPin,
  FileSpreadsheet,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  getAdminUser,
  setAdminUser,
  getAdminPassword,
  setAdminPassword,
  verifyAdminCredentials,
  verifyAdminPin,
  getBusinessInfo,
  saveBusinessInfo,
  playHapticSound
} from '../utils/storage';

export function CompanySettingsModal({ isOpen, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'security'

  // Company Data State
  const [companyData, setCompanyData] = useState(() => getBusinessInfo());

  // Credentials State
  const [username, setUsername] = useState(() => getAdminUser() || 'wahib');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleCompanyChange = (field, val) => {
    setCompanyData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // 1. Validation for username
      const cleanUser = username.trim();
      if (!cleanUser) {
        setError('اسم المستخدم لا يمكن أن يكون فارغاً');
        playHapticSound('tap');
        setIsSaving(false);
        return;
      }

      // 2. Validation if changing password
      const wantToChangePass = newPassword.trim().length > 0;
      if (wantToChangePass) {
        if (!currentPassword) {
          setError('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير');
          playHapticSound('tap');
          setIsSaving(false);
          return;
        }

        if (!verifyAdminPin(currentPassword)) {
          setError('كلمة المرور الحالية غير صحيحة');
          playHapticSound('tap');
          setIsSaving(false);
          return;
        }

        if (newPassword.length < 4) {
          setError('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل');
          playHapticSound('tap');
          setIsSaving(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('تأكيد كلمة المرور الجديدة غير متطابق');
          playHapticSound('tap');
          setIsSaving(false);
          return;
        }
      }

      // 3. Save User & Password
      setAdminUser(cleanUser);
      if (wantToChangePass) {
        setAdminPassword(newPassword.trim());
      }

      // 4. Save Company Info
      const updatedBusiness = saveBusinessInfo({
        name: companyData.name?.trim() || 'WAHIB COQ',
        arabicTitle: companyData.arabicTitle?.trim() || '',
        frenchSubtitle: companyData.frenchSubtitle?.trim() || '',
        phone: companyData.phone?.trim() || '',
        address: companyData.address?.trim() || '',
        taxInfo: companyData.taxInfo?.trim() || '',
      });

      playHapticSound('success');
      setSuccess(true);

      if (onUpdated) {
        onUpdated({
          adminUser: cleanUser,
          businessInfo: updatedBusiness,
        });
      }

      setTimeout(() => {
        setSuccess(false);
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn select-none"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/wahibcoq.jpeg"
                alt="Logo"
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
              />
              <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -top-1 -left-1" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                إعدادات وهيب كوك (WAHIB COQ)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                تعديل بيانات الشركة، الفاتورة، اسم المستخدم وكلمة المرور
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setActiveTab('company');
            }}
            className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'company'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>بيانات الشركة والفاتورة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setActiveTab('security');
            }}
            className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>المستخدم وكلمة المرور</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>تم حفظ التعديلات ومزامنتها بنجاح!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {/* TAB 1: Company & Invoice Data */}
          {activeTab === 'company' && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              {/* Live Preview Card */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col gap-1 text-right">
                <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  معاينة فورية لرأس الفاتورة وشريط التطبيق
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <img
                    src="/wahibcoq.jpeg"
                    alt="Logo"
                    className="w-10 h-10 rounded-lg object-cover border border-emerald-300 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-black text-slate-900 block truncate">
                      {companyData.name || 'WAHIB COQ'}
                    </span>
                    <span className="text-[11px] text-slate-600 font-bold block truncate">
                      {companyData.arabicTitle || 'تجارة الدواجن بالجملة والتفصيل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم الشركة التجاري (Nom Commercial):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyData.name || ''}
                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                    placeholder="WAHIB COQ"
                    className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-black outline-none transition-all"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Arabic Subtitle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  العنوان العربي (على الفاتورة):
                </label>
                <input
                  type="text"
                  value={companyData.arabicTitle || ''}
                  onChange={(e) => handleCompanyChange('arabicTitle', e.target.value)}
                  placeholder="وهيب كوك - تجارة الدواجن بالجملة والتفصيل"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-bold outline-none transition-all"
                />
              </div>

              {/* French Subtitle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  العنوان الفرنسي (Sous-titre):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={companyData.frenchSubtitle || ''}
                  onChange={(e) => handleCompanyChange('frenchSubtitle', e.target.value)}
                  placeholder="Vente de poulets vivants et découpes"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-semibold outline-none transition-all text-left"
                />
              </div>

              {/* Phone numbers */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  أرقام الهاتف للتواصل (Téléphone):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={companyData.phone || ''}
                    onChange={(e) => handleCompanyChange('phone', e.target.value)}
                    placeholder="06 61 88 99 22 / 05 22 40 50 60"
                    className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-mono font-bold outline-none transition-all text-left"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان المقر (Adresse):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyData.address || ''}
                    onChange={(e) => handleCompanyChange('address', e.target.value)}
                    placeholder="سوق الجملة للدواجن، الدار البيضاء"
                    className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-bold outline-none transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tax & Commercial Info */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  المعلومات القانونية والضريبية (IF, ICE, Patente):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={companyData.taxInfo || ''}
                    onChange={(e) => handleCompanyChange('taxInfo', e.target.value)}
                    placeholder="IF: 45892011 • ICE: 002394819000045 • Patente: 36248910"
                    className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-mono outline-none transition-all text-left"
                  />
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Credentials (Username & Password) */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              {/* Username Field */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم المستخدم لتسجيل الدخول (Nom d'utilisateur):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="wahib"
                    className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-bold outline-none transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  اسم الحساب الذي يُطلب منك عند فتح التطبيق
                </p>
              </div>

              {/* Password change divider */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-black text-slate-800 block mb-2">
                  تغيير كلمة المرور (اختياري):
                </span>
                <p className="text-[11px] text-slate-500 mb-3">
                  إذا كنت ترغب فقط بتعديل الاسم أو بيانات الشركة، اترك حقول كلمة المرور فارغة.
                </p>

                {/* Current Password */}
                <div className="mb-2.5">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    كلمة المرور الحالية (Current Password):
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      inputMode="numeric"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="كلمة المرور الحالية للتأكيد"
                      className="w-full h-11 pr-9 pl-10 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-mono outline-none transition-all text-left"
                      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-2.5">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    كلمة المرور الجديدة (New Password):
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      inputMode="numeric"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="كلمة المرور الجديدة (4 أرقام فأكثر)"
                      className="w-full h-11 pr-9 pl-10 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-mono outline-none transition-all text-left"
                      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    تأكيد كلمة المرور الجديدة (Confirmer):
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      inputMode="numeric"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="إعادة كتابة كلمة المرور الجديدة"
                      className="w-full h-11 pr-9 pl-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs font-mono outline-none transition-all text-left"
                      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'جارٍ الحفظ والمزامنة...' : 'حفظ ومزامنة التغييرات'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                onClose();
              }}
              className="h-12 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanySettingsModal;
