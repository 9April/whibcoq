import React, { useState } from 'react';
import { KeyRound, LogOut, Lock, ShieldCheck } from 'lucide-react';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { AnalyticsReports } from './components/AnalyticsReports';
import { InvoiceHistory } from './components/InvoiceHistory';
import { BottomNav } from './components/BottomNav';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AdminLogin } from './components/AdminLogin';
import { ChangePinModal } from './components/ChangePinModal';
import { BUSINESS_INFO } from './data/initialData';
import {
  getStoredClients,
  saveStoredClients,
  getStoredInvoices,
  saveStoredInvoices,
  isAdminAuthenticated,
  setAdminAuthenticated,
  playHapticSound,
} from './utils/storage';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'reports' | 'history'
  const [clients, setClients] = useState(() => getStoredClients());
  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const handleLoginSuccess = () => {
    setAdminAuthenticated(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    playHapticSound('tap');
    if (window.confirm('هل تريد قفل التطبيق والخروج من الجلسة الإدارية؟')) {
      setAdminAuthenticated(false);
      setIsAuthenticated(false);
    }
  };

  const handleAddClient = (newClient) => {
    const updated = [newClient, ...clients];
    setClients(updated);
    saveStoredClients(updated);
  };

  const handleSaveInvoice = (newInvoice) => {
    let updated;
    const existsIndex = invoices.findIndex((i) => i.id === newInvoice.id);

    if (existsIndex >= 0) {
      updated = [...invoices];
      updated[existsIndex] = newInvoice;
    } else {
      updated = [newInvoice, ...invoices];
    }

    setInvoices(updated);
    saveStoredInvoices(updated);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (invoiceId) => {
    const updated = invoices.filter((i) => i.id !== invoiceId);
    setInvoices(updated);
    saveStoredInvoices(updated);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setActiveTab('builder');
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
  };

  // If not authenticated, show Admin Login Screen
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Admin Header Bar (Hidden during print) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/wahibcoq.jpeg"
              alt="WAHIB COQ"
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-xs"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {BUSINESS_INFO.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                إدارة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Change PIN Button */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsChangePinOpen(true);
              }}
              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
              title="تغيير الرمز السري للإدارة"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">الرمز السري</span>
            </button>

            {/* Logout / Lock Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
              title="قفل التطبيق وتسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قفل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-First Container (Stacked Single Column) - Hidden during print */}
      <main className="no-print flex-1 max-w-lg w-full mx-auto p-3 sm:p-4">
        {activeTab === 'builder' && (
          <InvoiceBuilder
            key={editingInvoice ? editingInvoice.id : 'new-invoice-builder'}
            clients={clients}
            onAddClient={handleAddClient}
            onSaveInvoice={handleSaveInvoice}
            onOpenPrint={(inv) => setInvoiceToPrint(inv)}
            editingInvoice={editingInvoice}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === 'reports' && (
          <AnalyticsReports
            invoices={invoices}
            clients={clients}
          />
        )}

        {activeTab === 'history' && (
          <InvoiceHistory
            invoices={invoices}
            onDeleteInvoice={handleDeleteInvoice}
            onEditInvoice={handleEditInvoice}
            onOpenPrint={(inv) => setInvoiceToPrint(inv)}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (3 Large Thumb-Accessible Tabs) - Hidden during print */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invoicesCount={invoices.length}
      />

      {/* Official A4 / Receipt Print Modal - Rendered outside main so print isolates this exactly */}
      {invoiceToPrint && (
        <InvoicePrintModal
          isOpen={!!invoiceToPrint}
          onClose={() => setInvoiceToPrint(null)}
          invoice={invoiceToPrint}
          onNewInvoice={() => {
            setInvoiceToPrint(null);
            setEditingInvoice(null);
            setActiveTab('builder');
          }}
        />
      )}

      {/* Change Admin PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />
    </div>
  );
}

export default App;
