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

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'clients' | 'history' | 'reports'
  const [isBuildingInvoice, setIsBuildingInvoice] = useState(false); // Controls hiding steps until user clicks Add Invoice

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

  const handleGoHome = () => {
    playHapticSound('tap');
    setPreselectedClientId(null);
    setEditingInvoice(null);
    setIsBuildingInvoice(false);
    setActiveTab('builder');
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
          {/* Logo & Company Title (Brand Header - Button leading to Home) */}
          <button
            type="button"
            onClick={handleGoHome}
            className="flex items-center gap-2.5 p-1 -mr-1 text-right shrink-0 select-none hover:opacity-85 active:scale-95 transition-all cursor-pointer group bg-transparent border-0"
            title="الرئيسية - لوحة التحكم"
          >
            <div className="relative">
              <img
                src="/wahibcoq.jpeg"
                alt={businessInfo.name || BUSINESS_INFO.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:border-emerald-400 transition-colors"
              />
              <span className="w-2 h-2 bg-emerald-500 border border-white rounded-full absolute -top-0.5 -left-0.5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                {businessInfo.name || BUSINESS_INFO.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                منصة الفوترة والتوزيع
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs (Visible on tablet/desktop, hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                if (activeTab === 'builder' && !isBuildingInvoice) {
                  setIsBuildingInvoice(true);
                } else if (activeTab !== 'builder') {
                  setPreselectedClientId(null);
                  setEditingInvoice(null);
                  setIsBuildingInvoice(true);
                }
                setActiveTab('builder');
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${activeTab === 'builder'
                ? 'bg-white text-emerald-800 shadow-xs font-black border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              {isBuildingInvoice ? (
                <Layers className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              ) : (
                <PlusCircle className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              )}
              <span>{isBuildingInvoice ? 'إعداد الفاتورة' : 'فاتورة جديدة'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsBuildingInvoice(false);
                setActiveTab('clients');
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${activeTab === 'clients'
                ? 'bg-white text-emerald-800 shadow-xs font-black border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'clients' ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>الزبائن</span>
              {clients.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-white tabular-nums">
                  {clients.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsBuildingInvoice(false);
                setActiveTab('history');
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-xs font-black border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <Receipt className={`w-4 h-4 ${activeTab === 'history' ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>السجل</span>
              {invoices.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-white tabular-nums">
                  {invoices.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setIsBuildingInvoice(false);
                setActiveTab('reports');
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${activeTab === 'reports'
                ? 'bg-white text-emerald-800 shadow-xs font-black border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>التقارير</span>
            </button>
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Home Icon Only Button */}
            <button
              type="button"
              onClick={handleGoHome}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer ${activeTab === 'builder' && !isBuildingInvoice
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              title="الصفحة الرئيسية"
              aria-label="الرئيسية"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => {
                playHapticSound('tap');
                setSettingsInitialTab('company');
                setIsCompanySettingsOpen(true);
              }}
              className="h-8 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
              title="إعدادات وهيب كوك (المستخدم، كلمة المرور، وبيانات الشركة)"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            {/* Logout / Lock Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
              title="قفل التطبيق وتسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قفل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Main Container (Full-fit on desktop, mobile-first column on phone) - Hidden during print */}
      <main className="no-print flex-1 max-w-lg md:max-w-5xl lg:max-w-6xl xl:max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-12">
        {activeTab === 'builder' && (
          isBuildingInvoice ? (
            <InvoiceBuilder
              key={editingInvoice ? editingInvoice.id : (preselectedClientId ? `client-${preselectedClientId}` : 'new-invoice-builder')}
              clients={clients}
              products={products}
              onAddProduct={handleAddProduct}
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
              products={products}
              onStartNewInvoice={() => {
                setPreselectedClientId(null);
                setEditingInvoice(null);
                setIsBuildingInvoice(true);
              }}
              onViewClients={() => setActiveTab('clients')}
              onViewHistory={() => setActiveTab('history')}
              onManageProducts={handleOpenProductsManage}
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
            products={products}
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

      {/* Wahib Coq Info & Company Settings Modal (Opened by clicking Settings gear or logo) */}
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
