import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Edit3,
  Trash2,
  FilePlus,
  Check,
  X,
  Tag,
  Receipt,
  User,
  AlertTriangle
} from 'lucide-react';
import { ClientModal } from './ClientModal';
import { formatDh, formatKg, formatPhone, playHapticSound, getStoredClientCategories, saveCustomClientCategory } from '../utils/storage';

export function ClientsManager({
  clients,
  invoices,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onStartInvoiceForClient,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Edit Client Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Calculate purchases per client from invoices
  const clientStats = React.useMemo(() => {
    const stats = {};
    clients.forEach((c) => {
      stats[c.id] = { invoiceCount: 0, totalAmount: 0, totalWeight: 0 };
    });

    invoices.forEach((inv) => {
      if (inv.clientId && stats[inv.clientId]) {
        stats[inv.clientId].invoiceCount += 1;
        stats[inv.clientId].totalAmount += Number(inv.totalAmount) || 0;
        stats[inv.clientId].totalWeight += Number(inv.totalWeight) || 0;
      }
    });
    return stats;
  }, [clients, invoices]);

  // Unique categories list (Default presets + Saved Custom Categories + Client Categories)
  const categories = React.useMemo(() => {
    const set = new Set();
    const stored = getStoredClientCategories();
    stored.forEach((cat) => set.add(cat));
    clients.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [clients]);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTermDigits = term.replace(/\D/g, '');
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    const matchPhone = cleanTermDigits.length > 0 && cleanPhone.includes(cleanTermDigits);

    const matchTerm =
      !term ||
      c.name.toLowerCase().includes(term) ||
      matchPhone ||
      (c.phone && c.phone.includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term));

    const matchCategory =
      selectedCategory === 'all' || c.category === selectedCategory;

    return matchTerm && matchCategory;
  });

  const handleOpenEdit = (client, e) => {
    e.stopPropagation();
    playHapticSound('tap');
    setEditingClient(client);
    setEditName(client.name);
    setEditPhone(client.phone || '');
    setEditAddress(client.address || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingClient) return;

    playHapticSound('success');

    const updated = {
      ...editingClient,
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    };

    onUpdateClient(updated);
    setEditingClient(null);
  };

  const handleDelete = (client, e) => {
    e.stopPropagation();
    playHapticSound('warning');
    setClientToDelete(client);
  };

  const handleConfirmDeleteClient = () => {
    if (!clientToDelete) return;
    playHapticSound('tap');
    onDeleteClient(clientToDelete.id);
    setClientToDelete(null);
  };

  const handleStartInvoice = (client, e) => {
    e.stopPropagation();
    playHapticSound('tap');
    onStartInvoiceForClient(client);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">إدارة الزبائن التجاريين</h2>
              <p className="text-xs text-slate-500">سجل الزبائن، التعديل، الاتصال، وبدء الفواتير</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setIsAddModalOpen(true);
            }}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ زبون جديد</span>
          </button>
        </div>

        {/* Search Bar (Auto-detects phone number typing LTR & opens scrollable clients list) */}
        <div className="relative" ref={searchRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="بحث عن زبون بالاسم أو الهاتف..."
            dir={/^[0-9+]/.test(searchTerm.trim()) ? 'ltr' : 'rtl'}
            className={`w-full h-11 pr-10 pl-9 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all ${
              /^[0-9+]/.test(searchTerm.trim()) ? 'text-left font-mono tracking-wider' : 'text-right'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setIsDropdownOpen((prev) => !prev);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-slate-100 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
            title={isDropdownOpen ? 'إغلاق القائمة' : 'عرض قائمة الزبائن'}
          >
            <Search className="w-4 h-4" />
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Scrollable Dropdown List */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>قائمة الزبائن ({filteredClients.length})</span>
                <span className="text-[10px] text-slate-400">اضغط للاختيار أو بدء فاتورة</span>
              </div>
              <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const stats = clientStats[client.id] || { invoiceCount: 0, totalAmount: 0 };
                    return (
                      <div
                        key={client.id}
                        onClick={() => {
                          playHapticSound('tap');
                          setSearchTerm(client.name);
                          setIsDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 truncate">
                                {client.name}
                              </span>
                              {client.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 flex-shrink-0">
                                  {client.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {client.phone ? (
                                <span className="font-mono text-slate-600" dir="ltr">
                                  {formatPhone(client.phone)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">بدون رقم</span>
                              )}
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-400">
                                {stats.invoiceCount} فواتير
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              playHapticSound('tap');
                              setIsDropdownOpen(false);
                              if (onStartInvoiceForClient) {
                                onStartInvoiceForClient(client);
                              }
                            }}
                            className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-[11px] font-bold border border-emerald-200 hover:border-emerald-600 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                            title="إنشاء فاتورة جديدة لهذا الزبون"
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span>+ فاتورة</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    لا يوجد زبائن مطابقة للبحث
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
              الكل ({clients.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  playHapticSound('tap');
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${selectedCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clients Cards List (Full-width vertical list, one under one) */}
      <div className="flex flex-col gap-2.5 w-full">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const stats = clientStats[client.id] || { invoiceCount: 0, totalAmount: 0 };

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-3.5 sm:px-5 sm:py-3.5 shadow-sm flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 transition-all w-full"
              >
                {/* Info (5 cols on desktop) */}
                <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {client.name}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        {client.category || 'زبون تجاري'}
                      </span>
                    </div>

                    {client.phone ? (
                      <a
                        href={`tel:${client.phone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-mono font-bold text-emerald-700 hover:underline inline-flex items-center gap-1.5 mt-0.5"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <bdi
                          dir="ltr"
                          className="font-mono tabular-nums tracking-wide inline-block"
                          style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                        >
                          {formatPhone(client.phone)}
                        </bdi>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        بدون هاتف
                      </span>
                    )}
                  </div>
                </div>

                {/* Center / Stats (4 cols on desktop, perfectly aligned across list) */}
                <div className="md:col-span-4 flex items-center justify-between md:justify-center gap-3 lg:gap-4 text-xs font-semibold py-2 md:py-0 border-t md:border-t-0 border-slate-100 md:px-2">
                  <span className="text-slate-500 whitespace-nowrap min-w-[95px] text-right">
                    عدد الفواتير:{' '}
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {stats.invoiceCount}
                    </strong>
                  </span>

                  <span className="text-slate-300 hidden md:inline">•</span>

                  <span className="text-slate-500 whitespace-nowrap min-w-[130px] text-right">
                    المشتريات:{' '}
                    <strong className="text-emerald-700 font-mono font-bold tabular-nums">
                      {formatDh(stats.totalAmount)}
                    </strong>
                  </span>
                </div>

                {/* Quick Action Icons (3 cols on desktop, aligned to end) */}
                <div className="md:col-span-3 flex items-center gap-1.5 flex-shrink-0 justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                  {/* Start Invoice for this Client */}
                  <button
                    type="button"
                    onClick={(e) => handleStartInvoice(client, e)}
                    className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 active:scale-95 transition-all cursor-pointer"
                    title="إنشاء فاتورة جديدة لهذا الزبون"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>فاتورة</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(client, e)}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 active:scale-95 transition-colors cursor-pointer"
                    title="تعديل بيانات الزبون"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(client, e)}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center border border-slate-200 active:scale-95 transition-colors cursor-pointer"
                    title="حذف الزبون"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs font-bold">
            لا يوجد زبائن مطابقون لعملية البحث
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={onAddClient}
      />

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                </span>
                <h3 className="text-base font-black text-slate-900">تعديل بيانات الزبون</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم الزبون أو المحل *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\s+/g, ''))}
                  placeholder="06XXXXXXXX"
                  dir="ltr"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-left outline-none focus:border-emerald-600 tabular-nums"
                  style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">العنوان (اختياري)</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="مثال: حي السلام، شارع محمد الخامس..."
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Warning Popup Modal (Matching Invoices Historic) */}
      {clientToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setClientToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header with Warning Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تأكيد حذف الزبون</h3>
                <p className="text-xs text-rose-600 font-bold">تحذير: هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              </div>
            </div>

            {/* Warning Message & Client Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">اسم الزبون:</span>
                <span className="font-black text-slate-900 truncate max-w-[180px]">
                  {clientToDelete.name}
                </span>
              </div>
              {clientToDelete.address && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">العنوان:</span>
                  <span className="font-bold text-slate-700">
                    {clientToDelete.address}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                <span className="font-mono text-slate-700" dir="ltr">
                  {formatPhone(clientToDelete.phone) || 'بدون هاتف'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                <span className="text-slate-500 font-medium">عدد الفواتير المسجلة:</span>
                <span className="font-mono font-bold text-slate-900">
                  {clientStats[clientToDelete.id]?.invoiceCount || 0} فواتير
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">إجمالي المشتريات:</span>
                <span className="font-mono font-black text-emerald-700">
                  {formatDh(clientStats[clientToDelete.id]?.totalAmount || 0)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف هذا الزبون؟ سيتم حذفه من سجل الزبائن وقاعدة البيانات.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteClient}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الزبون</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
