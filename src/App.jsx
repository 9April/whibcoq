import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Lock, ShieldCheck, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { HomeDashboard } from './components/HomeDashboard';
import { ClientsManager } from './components/ClientsManager';
import { AnalyticsReports } from './components/AnalyticsReports';
import { InvoiceHistory } from './components/InvoiceHistory';
import { BottomNav } from './components/BottomNav';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AdminLogin } from './components/AdminLogin';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { BUSINESS_INFO } from './data/initialData';
import {
  getStoredClients,
  getStoredInvoices,
  persistClientWithDb,
  deleteClientWithDb,
  persistInvoiceWithDb,
  deleteInvoiceWithDb,
  performDatabaseSync,
  isAdminAuthenticated,
  setAdminAuthenticated,
  getBusinessInfo,
  playHapticSound,
} from './utils/storage';
import { checkDbConnection } from './utils/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(() => getBusinessInfo());

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'clients' | 'history' | 'reports'
  const [isBuildingInvoice, setIsBuildingInvoice] = useState(false); // Controls hiding steps until user clicks Add Invoice

  const [clients, setClients] = useState(() => getStoredClients());
  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const [preselectedClientId, setPreselectedClientId] = useState(null);

  // Database Connection & Sync States
  const [dbStatus, setDbStatus] = useState({ connected: false, checking: true, name: 'u895506237_wahib' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Trigger sync with Hostinger MySQL
  const handleSync = useCallback(async (isSilent = false) => {
    if (!isSilent) playHapticSound('tap');
    setIsSyncing(true);
    try {
      const conn = await checkDbConnection();
      setDbStatus({
        connected: conn.connected,
        checking: false,
        name: conn.database || 'u895506237_wahib',
      });

      if (conn.connected) {
        const syncRes = await performDatabaseSync();
        if (syncRes && syncRes.success) {
          setClients(getStoredClients());
          setInvoices(getStoredInvoices());
          setLastSyncTime(new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }));
          if (!isSilent) playHapticSound('success');
        }
      }
    } catch (e) {
      console.warn('Sync failed:', e);
      setDbStatus((prev) => ({ ...prev, connected: false, checking: false }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Automatic real-time cross-device auto-sync (Web <-> Phone)
  useEffect(() => {
    // 1. Initial sync immediately
    handleSync(true);

    // 2. Background polling interval every 8 seconds so phone & web mirror each other live
    const intervalId = setInterval(() => {
      handleSync(true);
    }, 8000);

    // 3. Auto-sync immediately when phone screen unlocks or user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSync(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Auto-sync when window gains focus
    const handleFocus = () => {
      handleSync(true);
    };
    window.addEventListener('focus', handleFocus);

    // 5. Auto-sync when device comes online
    const handleOnline = () => {
      handleSync(true);
    };
    window.addEventListener('online', handleOnline);

    // 6. Listen for custom sync events
    const onSynced = (e) => {
      setClients(getStoredClients());
      setInvoices(getStoredInvoices());
      if (e.detail?.timestamp) {
        setLastSyncTime(new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }));
      }
    };
    window.addEventListener('wahib_db_synced', onSynced);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('wahib_db_synced', onSynced);
    };
  }, [handleSync]);

  const handleLoginSuccess = () => {
    setAdminAuthenticated(true);
    setIsAuthenticated(true);
    handleSync(true);
  };

  const handleLogout = () => {
    playHapticSound('tap');
    if (window.confirm('هل تريد قفل التطبيق والخروج من الجلسة الإدارية؟')) {
      setAdminAuthenticated(false);
      setIsAuthenticated(false);
    }
  };

  const handleAddClient = async (newClient) => {
    const updated = await persistClientWithDb(newClient);
    setClients(updated);
    handleSync(true);
  };

  const handleUpdateClient = async (updatedClient) => {
    const updated = await persistClientWithDb(updatedClient);
    setClients(updated);
    handleSync(true);
  };

  const handleDeleteClient = async (clientId) => {
    const updated = await deleteClientWithDb(clientId);
    setClients(updated);
    handleSync(true);
  };

  const handleStartInvoiceForClient = (client) => {
    setPreselectedClientId(client.id);
    setEditingInvoice(null);
    setIsBuildingInvoice(true);
    setActiveTab('builder');
  };

  const handleSaveInvoice = async (newInvoice) => {
    const updated = await persistInvoiceWithDb(newInvoice);
    setInvoices(updated);
    setEditingInvoice(null);
    setIsBuildingInvoice(false);
    handleSync(true);
    setIsBuildingInvoice(false);
    handleSync(true);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const updated = await deleteInvoiceWithDb(invoiceId);
    setInvoices(updated);
    handleSync(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setIsBuildingInvoice(true);
    setActiveTab('builder');
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
    setPreselectedClientId(null);
    setIsBuildingInvoice(false);
  };

  // If not authenticated, show Admin Login Screen
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white" dir="rtl">
      {/* Top Admin Header Bar (Hidden during print) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
          {/* Clickable Logo & Company Title to open Company/Account Settings */}
          <button
            type="button"
            onClick={() => {
              playHapticSound('tap');
              setIsCompanySettingsOpen(true);
            }}
            className="flex items-center gap-2 group p-1 -mr-1 rounded-xl hover:bg-slate-100/80 active:scale-95 transition-all text-right cursor-pointer"
            title="إعدادات وهيب كوك (المستخدم، كلمة المرور، وبيانات الشركة)"
          >
            <div className="relative">
              <img
                src="/wahibcoq.jpeg"
                alt={businessInfo.name || BUSINESS_INFO.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:border-emerald-500 group-hover:ring-2 group-hover:ring-emerald-200 transition-all"
              />
              <span className="w-2 h-2 bg-emerald-500 border border-white rounded-full absolute -top-0.5 -left-0.5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                {businessInfo.name || BUSINESS_INFO.name}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
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
      <main className="no-print flex-1 max-w-lg w-full mx-auto p-3 sm:p-4 pb-24 sm:pb-28">
        {activeTab === 'builder' && (
          isBuildingInvoice ? (
            <InvoiceBuilder
              key={editingInvoice ? editingInvoice.id : (preselectedClientId ? `client-${preselectedClientId}` : 'new-invoice-builder')}
              clients={clients}
              initialClientId={preselectedClientId}
              onAddClient={handleAddClient}
              onSaveInvoice={handleSaveInvoice}
              onOpenPrint={(inv) => setInvoiceToPrint(inv)}
              editingInvoice={editingInvoice}
              onCancelEdit={handleCancelEdit}
            />
          ) : (
            <HomeDashboard
              clients={clients}
              invoices={invoices}
              onStartNewInvoice={() => {
                setPreselectedClientId(null);
                setEditingInvoice(null);
                setIsBuildingInvoice(true);
              }}
              onViewClients={() => setActiveTab('clients')}
              onViewHistory={() => setActiveTab('history')}
            />
          )
        )}

        {activeTab === 'clients' && (
          <ClientsManager
            clients={clients}
            invoices={invoices}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onStartInvoiceForClient={handleStartInvoiceForClient}
          />
        )}

        {activeTab === 'history' && (
          <InvoiceHistory
            invoices={invoices}
            clients={clients}
            onDeleteInvoice={handleDeleteInvoice}
            onEditInvoice={handleEditInvoice}
            onOpenPrint={(inv) => setInvoiceToPrint(inv)}
          />
        )}

        {activeTab === 'reports' && (
          <AnalyticsReports
            invoices={invoices}
            clients={clients}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (4 Large Thumb-Accessible Tabs) - Hidden during print */}
      <BottomNav
        activeTab={activeTab}
        isBuildingInvoice={isBuildingInvoice}
        setActiveTab={(tab) => {
          if (tab === 'builder') {
            if (activeTab === 'builder' && !isBuildingInvoice) {
              // Clicking "فاتورة جديدة" from dashboard opens the steps!
              setIsBuildingInvoice(true);
            } else if (activeTab !== 'builder') {
              // Clicking from another tab opens the steps!
              setPreselectedClientId(null);
              setEditingInvoice(null);
              setIsBuildingInvoice(true);
            }
          } else {
            setIsBuildingInvoice(false);
          }
          setActiveTab(tab);
        }}
        invoicesCount={invoices.length}
        clientsCount={clients.length}
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
            setIsBuildingInvoice(true);
            setActiveTab('builder');
          }}
        />
      )}

      {/* Wahib Coq Info & Company Settings Modal (Opened by clicking logo) */}
      <CompanySettingsModal
        isOpen={isCompanySettingsOpen}
        onClose={() => setIsCompanySettingsOpen(false)}
        onUpdated={({ businessInfo: newB }) => {
          if (newB) setBusinessInfo(newB);
        }}
      />
    </div>
  );
}

export default App;
