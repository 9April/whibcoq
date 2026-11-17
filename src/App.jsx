import React, { useState } from 'react';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { AnalyticsReports } from './components/AnalyticsReports';
import { InvoiceHistory } from './components/InvoiceHistory';
import { BottomNav } from './components/BottomNav';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import {
  getStoredClients,
  saveStoredClients,
  getStoredInvoices,
  saveStoredInvoices,
} from './utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'reports' | 'history'
  const [clients, setClients] = useState(() => getStoredClients());
  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Mobile-First Container (Stacked Single Column) - Hidden during print */}
      <main className="no-print flex-1 max-w-lg w-full mx-auto p-3 sm:p-4">
        {activeTab === 'builder' && (
          <InvoiceBuilder
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
    </div>
  );
}

export default App;
