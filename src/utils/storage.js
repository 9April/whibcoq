import { INITIAL_PRODUCTS, INITIAL_CLIENTS, generateSampleInvoices } from '../data/initialData';
import {
  checkDbConnection,
  apiSaveClient,
  apiDeleteClient,
  apiSaveInvoice,
  apiDeleteInvoice,
  apiSavePrice,
  apiSaveAdminPin,
  apiSaveSetting,
  apiSyncAll,
} from './api';

const CLIENTS_STORAGE_KEY = 'wahib_coq_clients_v2';
const INVOICES_STORAGE_KEY = 'wahib_coq_invoices_v2';
const CLIENT_PRICES_KEY = 'wahib_coq_client_prices_v2';
const ADMIN_USER_KEY = 'wahib_coq_admin_user_v2';
const ADMIN_PASSWORD_KEY = 'wahib_coq_admin_password_v2';
const ADMIN_PIN_KEY = 'wahib_coq_admin_pin_v2';
const ADMIN_AUTH_STATE_KEY = 'wahib_coq_admin_auth_state_v2';

// Format Moroccan Dirham (e.g., "1 240,00 Dh")
export const formatDh = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0,00 Dh';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart},${parts[1]} Dh`;
};

// Format Weight in Kg (e.g., "45,5 Kg")
export const formatKg = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0,0 Kg';
  const val = Number(num);
  const parts = val.toFixed(1).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart},${parts[1]} Kg`;
};

// Format Date in Clear Moroccan Arabic (e.g., "الثلاثاء، 17 نونبر 2026")
export const formatArabicDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-MA-u-nu-latn', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

// Format Phone Number (Ensures Moroccan 06 XX XX XX XX format with strict Left-to-Right protection)
export const formatPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let str = String(phoneStr).trim();
  let digits = str.replace(/\D/g, '');

  // Auto-correct RTL inverted prefix: e.g. 6072118844 -> 0672118844
  if (
    digits.length === 10 &&
    (digits.startsWith('60') || digits.startsWith('70') || digits.startsWith('50'))
  ) {
    digits = '0' + digits[0] + digits.slice(2);
  }

  // 9 digits without leading 0 (e.g. 672118844 -> 0672118844)
  if (
    digits.length === 9 &&
    (digits.startsWith('6') || digits.startsWith('7') || digits.startsWith('5'))
  ) {
    digits = '0' + digits;
  }

  // Format 10-digit Moroccan number: 06 XX XX XX XX with Unicode LTR mark
  if (digits.length === 10) {
    return (
      '\u200E' +
      digits.slice(0, 2) +
      ' ' +
      digits.slice(2, 4) +
      ' ' +
      digits.slice(4, 6) +
      ' ' +
      digits.slice(6, 8) +
      ' ' +
      digits.slice(8, 10) +
      '\u200E'
    );
  }

  return '\u200E' + str + '\u200E';
};

// Subtitle sound feedback (haptic-like click)
export const playHapticSound = (type = 'tap') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(587, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Ignore audio context errors before user interaction
  }
};

// Persistent Clients
export const getStoredClients = () => {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_CLIENTS;
  }
};

export const saveStoredClients = (clients) => {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {}
};

// Save a single client with background MySQL sync
export const persistClientWithDb = async (client) => {
  const clients = getStoredClients();
  const index = clients.findIndex((c) => c.id === client.id);
  let updated;
  if (index >= 0) {
    updated = [...clients];
    updated[index] = client;
  } else {
    updated = [client, ...clients];
  }
  saveStoredClients(updated);

  // MySQL sync
  try {
    await apiSaveClient(client);
  } catch (e) {
    console.warn('MySQL client sync pending offline:', e);
  }
  return updated;
};

export const deleteClientWithDb = async (clientId) => {
  const clients = getStoredClients().filter((c) => c.id !== clientId);
  saveStoredClients(clients);

  // MySQL delete
  try {
    await apiDeleteClient(clientId);
  } catch (e) {
    console.warn('MySQL client delete pending offline:', e);
  }
  return clients;
};

// Persistent Invoices
export const getStoredInvoices = () => {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      const sample = generateSampleInvoices();
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveStoredInvoices = (invoices) => {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {}
};

// Save a single invoice with background MySQL sync
export const persistInvoiceWithDb = async (invoice) => {
  const invoices = getStoredInvoices();
  const index = invoices.findIndex((inv) => inv.id === invoice.id);
  let updated;
  if (index >= 0) {
    updated = [...invoices];
    updated[index] = invoice;
  } else {
    updated = [invoice, ...invoices];
  }
  saveStoredInvoices(updated);

  // MySQL sync
  try {
    await apiSaveInvoice(invoice);
  } catch (e) {
    console.warn('MySQL invoice sync pending offline:', e);
  }
  return updated;
};

export const deleteInvoiceWithDb = async (invoiceId) => {
  const invoices = getStoredInvoices().filter((inv) => inv.id !== invoiceId);
  saveStoredInvoices(invoices);

  // MySQL delete
  try {
    await apiDeleteInvoice(invoiceId);
  } catch (e) {
    console.warn('MySQL invoice delete pending offline:', e);
  }
  return invoices;
};

// Remember custom price per client/product
export const getClientProductPrice = (clientId, productId, defaultPrice) => {
  try {
    const raw = localStorage.getItem(CLIENT_PRICES_KEY);
    if (!raw) return defaultPrice;
    const prices = JSON.parse(raw);
    const key = `${clientId || 'default'}_${productId}`;
    return prices[key] !== undefined ? Number(prices[key]) : defaultPrice;
  } catch (e) {
    return defaultPrice;
  }
};

export const saveClientProductPrice = (clientId, productId, price) => {
  try {
    const raw = localStorage.getItem(CLIENT_PRICES_KEY);
    const prices = raw ? JSON.parse(raw) : {};
    const key = `${clientId || 'default'}_${productId}`;
    prices[key] = Number(price);
    localStorage.setItem(CLIENT_PRICES_KEY, JSON.stringify(prices));

    // Background MySQL sync
    apiSavePrice(clientId || 'default', productId, price).catch((e) =>
      console.warn('MySQL price sync pending offline:', e)
    );
  } catch (e) {}
};

// Admin Authentication & Credentials (User: mohamed | Password: 12345)
export const getAdminUser = () => {
  return localStorage.getItem(ADMIN_USER_KEY) || 'mohamed';
};

export const setAdminUser = (username) => {
  if (username && username.trim()) {
    const clean = username.trim();
    localStorage.setItem(ADMIN_USER_KEY, clean);
    apiSaveSetting('admin_user', clean).catch((e) => console.warn('MySQL user sync:', e));
    return true;
  }
  return false;
};

export const getAdminPassword = () => {
  const saved = localStorage.getItem(ADMIN_PASSWORD_KEY);
  if (saved && saved !== '1234' && saved !== '1213') {
    return saved;
  }
  return '12345';
};

export const setAdminPassword = (newPass) => {
  if (newPass && newPass.length >= 4) {
    const passStr = String(newPass).trim();
    localStorage.setItem(ADMIN_PASSWORD_KEY, passStr);
    localStorage.setItem(ADMIN_PIN_KEY, passStr);
    apiSaveSetting('admin_password', passStr).catch((e) => console.warn('MySQL pass sync:', e));
    apiSaveSetting('admin_pin', passStr).catch((e) => console.warn('MySQL pin sync:', e));
    return true;
  }
  return false;
};

// Backwards compatibility alias
export const getAdminPin = getAdminPassword;
export const setAdminPin = setAdminPassword;

export const verifyAdminCredentials = (user, pass) => {
  const currentU = (getAdminUser() || 'mohamed').trim().toLowerCase();
  const currentP = String(getAdminPassword() || '12345').trim();

  const inputU = String(user || '').trim().toLowerCase();
  const inputP = String(pass || '').trim();

  // Allow login if user matches (case-insensitive) and password matches current OR 12345
  const userOk = inputU === currentU || inputU === 'mohamed';
  const passOk = inputP === currentP || inputP === '12345';

  return userOk && passOk;
};

export const verifyAdminPin = (inputPin) => {
  const currentPin = String(getAdminPassword() || '12345').trim();
  const pin = String(inputPin || '').trim();
  return pin === currentPin || pin === '12345';
};

export const isAdminAuthenticated = () => {
  return sessionStorage.getItem(ADMIN_AUTH_STATE_KEY) === 'true';
};

export const setAdminAuthenticated = (status) => {
  if (status) {
    sessionStorage.setItem(ADMIN_AUTH_STATE_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_AUTH_STATE_KEY);
  }
};

// Full Bidirectional Database Synchronization
export const performDatabaseSync = async () => {
  try {
    const localClients = getStoredClients();
    const localInvoices = getStoredInvoices();
    const localPricesRaw = localStorage.getItem(CLIENT_PRICES_KEY);
    const localPrices = localPricesRaw ? JSON.parse(localPricesRaw) : {};
    const localUser = getAdminUser();
    const localPass = getAdminPassword();

    const result = await apiSyncAll({
      clients: localClients,
      invoices: localInvoices,
      prices: localPrices,
      adminUser: localUser,
      adminPin: localPass,
      adminPassword: localPass,
    });

    if (result && result.ok) {
      if (Array.isArray(result.clients) && result.clients.length > 0) {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(result.clients));
      }
      if (Array.isArray(result.invoices) && result.invoices.length > 0) {
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(result.invoices));
      }
      if (result.prices && typeof result.prices === 'object') {
        localStorage.setItem(CLIENT_PRICES_KEY, JSON.stringify(result.prices));
      }
      if (result.adminUser) {
        localStorage.setItem(ADMIN_USER_KEY, String(result.adminUser));
      }
      if (result.adminPassword || result.adminPin) {
        const pass = String(result.adminPassword || result.adminPin);
        localStorage.setItem(ADMIN_PASSWORD_KEY, pass);
        localStorage.setItem(ADMIN_PIN_KEY, pass);
      }

      // Notify window listeners
      window.dispatchEvent(
        new CustomEvent('wahib_db_synced', {
          detail: {
            success: true,
            database: result.database || 'u895506237_wahib',
            timestamp: result.syncedAt || Date.now(),
          },
        })
      );

      return {
        success: true,
        database: result.database || 'u895506237_wahib',
        clients: result.clients,
        invoices: result.invoices,
      };
    }
  } catch (err) {
    console.warn('Sync failed (offline mode active):', err);
    window.dispatchEvent(
      new CustomEvent('wahib_db_synced', {
        detail: { success: false, error: err.message },
      })
    );
    return { success: false, error: err.message };
  }
  return { success: false };
};
