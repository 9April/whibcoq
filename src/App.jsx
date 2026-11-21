import React, { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Lock,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Users,
  Receipt,
  BarChart3,
  Layers,
  Settings,
  Home,
} from 'lucide-react';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { HomeDashboard } from './components/HomeDashboard';
import { ClientsManager } from './components/ClientsManager';
import { AnalyticsReports } from './components/AnalyticsReports';
import { InvoiceHistory } from './components/InvoiceHistory';
import { ReportsHistoryDrawer } from './components/ReportsHistoryDrawer';
import { BottomNav } from './components/BottomNav';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AdminLogin } from './components/AdminLogin';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { BUSINESS_INFO } from './data/initialData';
import {
  getStoredClients,
  getStoredInvoices,
  getStoredProducts,
  persistClientWithDb,
  deleteClientWithDb,
  persistInvoiceWithDb,
  deleteInvoiceWithDb,
  persistProductWithDb,
  deleteProductWithDb,
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
  const [settingsInitialTab, setSettingsInitialTab] = useState('company');
  const [businessInfo, setBusinessInfo] = useState(() => getBusinessInfo());

  const [isReportsDrawerOpen, setIsReportsDrawerOpen] = useState(false);

  const [clients, setClients] = useState(() => getStoredClients());
  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [products, setProducts] = useState(() => getStoredProducts());
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
      setProducts(getStoredProducts());
      if (e.detail?.timestamp) {
        setLastSyncTime(new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }));
      }
    };
    const onProductsSynced = (e) => {
      if (e.detail) setProducts(e.detail);
      else setProducts(getStoredProducts());
    };
    window.addEventListener('wahib_db_synced', onSynced);
    window.addEventListener('wahib_products_synced', onProductsSynced);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('wahib_db_synced', onSynced);
      window.removeEventListener('wahib_products_synced', onProductsSynced);
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

  const handleAddProduct = async (newProduct) => {
    const updated = await persistProductWithDb(newProduct);
    setProducts(updated);
    handleSync(true);
    return updated;
  };

  const handleDeleteProduct = async (productId) => {
    const updated = await deleteProductWithDb(productId);
    setProducts(updated);
    handleSync(true);
    return updated;
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
    setPreselectedClientId(null);
    handleSync(true);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const updated = await deleteInvoiceWithDb(invoiceId);
    setInvoices(updated);
    handleSync(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setIsReportsDrawerOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
    setPreselectedClientId(null);
  };

  const handleGoHome = () => {
    playHapticSound('tap');
    setPreselectedClientId(null);
    setEditingInvoice(null);
  };

  const handleOpenProductsManage = () => {
    playHapticSound('tap');
    setSettingsInitialTab('products');
    setIsCompanySettingsOpen(true);
  };

  // If not authenticated, show Admin Login Screen
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white" dir="rtl">
      {/* Top Admin Header Bar (Hidden during print) */}
      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Company Title (Brand Header - Button leading to Home) */}
          <button
            type="button"
            onClick={handleGoHome}
            className="flex items-center gap-2.5 p-1 -mr-1 text-right shrink-0 select-none hover:opacity-85 active:scale-95 transition-all cursor-pointer group bg-transparent border-0"
            title="الرئيسية - إعداد الفاتورة"
          >
            <div className="relative">
              <img
                src="/wahibcoq.jpeg"
                alt={businessInfo.name || BUSINESS_INFO.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:border-emerald-400 transition-colors"
              />
              <span className={`w-2.5 h-2.5 border border-white rounded-full absolute -top-0.5 -left-0.5 ${
                dbStatus.connected ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                {businessInfo.name || BUSINESS_INFO.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                {businessInfo.frenchSubtitle || 'Vente de poulets vivants et découpes'}
              </span>
            </div>
          </button>

          {/* Action Tools in Header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent Reports & History Drawer Button */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsReportsDrawerOpen(true);
              }}
              className="h-10 px-3.5 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="فتح التقارير وسجل الفواتير السابقة"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>التقارير والسجل</span>
              {invoices.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-emerald-500 text-slate-950 tabular-nums">
                  {invoices.length}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setSettingsInitialTab('company');
                setIsCompanySettingsOpen(true);
              }}
              className="h-10 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
              title="إعدادات وهيب كوك (المستخدم، كلمة المرور، وبيانات الشركة)"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            {/* Logout / Lock Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-10 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
              title="قفل التطبيق وتسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">قفل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Main Container: Unified Guided Single-Page Flow */}
      <main className="no-print flex-1 max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-12">
        <InvoiceBuilder
          key={editingInvoice ? editingInvoice.id : (preselectedClientId ? `client-${preselectedClientId}` : 'new-invoice-builder')}
          clients={clients}
          invoices={invoices}
          products={products}
          onAddProduct={handleAddProduct}
          initialClientId={preselectedClientId}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onSaveInvoice={handleSaveInvoice}
          onOpenPrint={(inv) => setInvoiceToPrint(inv)}
          editingInvoice={editingInvoice}
          onCancelEdit={handleCancelEdit}
        />
      </main>

      {/* Reports & Invoice History Drawer */}
      <ReportsHistoryDrawer
        isOpen={isReportsDrawerOpen}
        onClose={() => setIsReportsDrawerOpen(false)}
        invoices={invoices}
        clients={clients}
        products={products}
        onDeleteInvoice={handleDeleteInvoice}
        onEditInvoice={handleEditInvoice}
        onOpenPrint={(inv) => setInvoiceToPrint(inv)}
      />

      {/* Official Print Modal (Isolated for @media print) */}
      {invoiceToPrint && (
        <InvoicePrintModal
          isOpen={!!invoiceToPrint}
          onClose={() => setInvoiceToPrint(null)}
          invoice={invoiceToPrint}
          onNewInvoice={() => {
            setInvoiceToPrint(null);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* Wahib Coq Info & Company Settings Modal */}
      <CompanySettingsModal
        isOpen={isCompanySettingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => setIsCompanySettingsOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdated={({ businessInfo: newB, products: newP }) => {
          if (newB) setBusinessInfo(newB);
          if (newP) setProducts(newP);
        }}
      />
    </div>
  );
}

export default App;
