import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { ClientModal } from './ClientModal';
import { formatDh, formatKg, formatPhone, playHapticSound } from '../utils/storage';

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

  // Edit Client Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Calculate purchases per client from invoices
  const clientStats = React.useMemo(() => {
    const stats = {};
    clients.forEach((c) => {
      stats[c.id] = { invoiceCount: 0, totalAmount: 0, totalWeight: 0 };
    });

    invoices.forEach((inv) => {
      if (inv.clientId && stats[inv.clientId]) {
        stats[inv.clientId].invoiceCount += 1;
        stats[inv.clientId].totalAmount += inv.totalAmount || 0;
        stats[inv.clientId].totalWeight += inv.totalWeight || 0;
      }
    });
    return stats;
  }, [clients, invoices]);

  // Unique categories list
  const categories = React.useMemo(() => {
    const set = new Set();
    clients.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [clients]);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchTerm =
      !term ||
      c.name.toLowerCase().includes(term) ||
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
    setEditCategory(client.category || 'عام');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingClient) return;

    playHapticSound('success');
    const updated = {
      ...editingClient,
      name: editName.trim(),
      phone: editPhone.trim(),
      category: editCategory.trim() || 'عام',
    };

    onUpdateClient(updated);
    setEditingClient(null);
  };

  const handleDelete = (client, e) => {
    e.stopPropagation();
    playHapticSound('tap');
    if (window.confirm(`هل أنت متأكد من حذف الزبون "${client.name}" من قائمة الزبائن؟`)) {
      onDeleteClient(client.id);
    }
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

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث عن زبون بالاسم، الهاتف، أو نوع النشاط..."
            className="w-full h-11 pr-9 pl-4 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === 'all'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat
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

      {/* Clients Cards List */}
      <div className="flex flex-col gap-2.5">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const stats = clientStats[client.id] || { invoiceCount: 0, totalAmount: 0 };

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-3.5 shadow-sm flex flex-col gap-3 transition-all"
              >
                {/* Top: Info & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {client.name}
                        </h3>
                        {client.category && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                            {client.category}
                          </span>
                        )}
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

                  {/* Quick Action Icons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Start Invoice for this Client */}
                    <button
                      type="button"
                      onClick={(e) => handleStartInvoice(client, e)}
                      className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 active:scale-95 transition-all"
                      title="إنشاء فاتورة جديدة لهذا الزبون"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>فاتورة</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(client, e)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 active:scale-95 transition-colors"
                      title="تعديل بيانات الزبون"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(client, e)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center border border-slate-200 active:scale-95 transition-colors"
                      title="حذف الزبون"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom: Invoices Summary */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-slate-500">
                    عدد الفواتير:{' '}
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {stats.invoiceCount}
                    </strong>
                  </span>

                  <span className="text-slate-500">
                    مجموع المشتريات:{' '}
                    <strong className="text-emerald-700 font-mono font-bold tabular-nums">
                      {formatDh(stats.totalAmount)}
                    </strong>
                  </span>
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
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="06 XX XX XX XX"
                  dir="ltr"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-left outline-none focus:border-emerald-600 tabular-nums"
                  style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نوع النشاط التجاري</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="مثال: مطعم، سناك، شواية، جزار، فندق..."
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
    </div>
  );
}
