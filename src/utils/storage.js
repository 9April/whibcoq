import { INITIAL_PRODUCTS, INITIAL_CLIENTS, generateSampleInvoices, BUSINESS_INFO } from '../data/initialData';
import {
  checkDbConnection,
  apiSaveClient,
  apiDeleteClient,
  apiSaveInvoice,
  apiDeleteInvoice,
  apiSavePrice,
  apiSaveAdminPin,
  apiSaveSetting,
  apiFetchSetting,
  apiSyncAll,
} from './api';

const CLIENTS_STORAGE_KEY = 'wahib_coq_clients_v2';
const PRODUCTS_STORAGE_KEY = 'wahib_coq_products_v2';
const INVOICES_STORAGE_KEY = 'wahib_coq_invoices_v2';
const CLIENT_PRICES_KEY = 'wahib_coq_client_prices_v2';
const ADMIN_USER_KEY = 'wahib_coq_admin_user_v2';
const ADMIN_PASSWORD_KEY = 'wahib_coq_admin_password_v2';
const ADMIN_PIN_KEY = 'wahib_coq_admin_pin_v2';
const ADMIN_AUTH_STATE_KEY = 'wahib_coq_admin_auth_state_v2';
const BUSINESS_INFO_KEY = 'wahib_coq_business_info_v2';
const CLIENT_CATEGORIES_KEY = 'wahib_coq_client_categories_v2';
const DELETED_CLIENTS_KEY = 'wahib_coq_deleted_clients_v2';
const DELETED_INVOICES_KEY = 'wahib_coq_deleted_invoices_v2';

export const getStoredDeletedClients = () => {
  try {
    const raw = localStorage.getItem(DELETED_CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const trackDeletedClientId = (id) => {
  if (!id) return;
  try {
    const list = getStoredDeletedClients();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(list));
    }
  } catch {}
};

export const getStoredDeletedInvoices = () => {
  try {
    const raw = localStorage.getItem(DELETED_INVOICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const trackDeletedInvoiceId = (id) => {
  if (!id) return;
  try {
    const list = getStoredDeletedInvoices();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_INVOICES_KEY, JSON.stringify(list));
    }
  } catch {}
};

export const DEFAULT_CLIENT_CATEGORIES = [
  'مطعم',
  'سناك',
  'شواية',
  'تاجر جملة',
  'تموين حفلات',
  'زبون نقدي',
];

// Get stored client activity categories (Defaults + Custom added + Existing Clients)
export const getStoredClientCategories = () => {
  try {
    const raw = localStorage.getItem(CLIENT_CATEGORIES_KEY);
    const customList = raw ? JSON.parse(raw) : [];

    const clientsRaw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    const existingClients = clientsRaw ? JSON.parse(clientsRaw) : [];
    const clientCats = existingClients
      .map((c) => (c.category || '').trim())
      .filter((cat) => cat && cat !== 'عام');

    const combined = [...DEFAULT_CLIENT_CATEGORIES];
    [...customList, ...clientCats].forEach((cat) => {
      const trimmed = cat.trim();
      if (trimmed && !combined.includes(trimmed)) {
        combined.push(trimmed);
      }
    });

    return combined;
  } catch (e) {
    return DEFAULT_CLIENT_CATEGORIES;
  }
};

// Save a new custom client category to storage & sync with MySQL
export const saveCustomClientCategory = (newCat) => {
  if (!newCat) return getStoredClientCategories();
  const trimmed = newCat.trim();
  if (!trimmed || trimmed === 'عام') return getStoredClientCategories();

  try {
    const raw = localStorage.getItem(CLIENT_CATEGORIES_KEY);
    const customList = raw ? JSON.parse(raw) : [];
    if (!customList.includes(trimmed)) {
      customList.push(trimmed);
      localStorage.setItem(CLIENT_CATEGORIES_KEY, JSON.stringify(customList));

      // Sync asynchronously to MySQL settings table
      apiSaveSetting('client_categories', JSON.stringify(customList)).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save custom category:', e);
  }

  return getStoredClientCategories();
};

// Format Moroccan Dirham (Strict Left-to-Right numeric protection with non-breaking space: e.g., "1 240,00 درهم")
export const formatDh = (num) => {
  if (num === null || num === undefined) return '\u200E0,00\u200E درهم';
  const val = Number(num);
  if (isNaN(val)) return '\u200E0,00\u200E درهم';
  const parts = val.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `\u200E${integerPart},${parts[1]}\u200E درهم`;
};

// Format Weight in Kg (Strict Left-to-Right protection: e.g., "45.5 kg")
export const formatKg = (num) => {
  if (num === null || num === undefined) return '\u200E0.0 kg\u200E';
  const val = Number(num);
  if (isNaN(val)) return '\u200E0.0 kg\u200E';
  const parts = val.toFixed(1).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `\u200E${integerPart}.${parts[1]} kg\u200E`;
};

const MOROCCAN_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'ماي',
  'يونيو',
  'يوليوز',
  'غشت',
  'شتنبر',
  'أكتوبر',
  'نونبر',
  'دجنبر',
];

const ARABIC_WEEKDAYS_MAP = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

// Format Date in Clear Moroccan Arabic (e.g., "الثلاثاء، 17 نونبر 2026")
export const formatArabicDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(dateStr + 'T00:00:00');
      const weekday = ARABIC_WEEKDAYS_MAP[d.getDay()] || '';
      if (mIdx >= 0 && mIdx < 12) {
        return `${weekday}، ${day} ${MOROCCAN_MONTHS[mIdx]} ${year}`;
      }
    }
  } catch (e) { }
  return dateStr;
};

// Format Phone Number (Clean continuous digits without spaces: e.g. "0672118844")
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

  // Return clean continuous digits without spaces
  if (digits.length >= 9) {
    return '\u200E' + digits + '\u200E';
  }

  return '\u200E' + str.replace(/\s+/g, '') + '\u200E';
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
    const deleted = getStoredDeletedClients();
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    let list;
    if (!raw) {
      const init = INITIAL_CLIENTS.filter((c) => !deleted.includes(c.id));
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(init));
      list = init;
    } else {
      list = JSON.parse(raw);
    }

    if (!Array.isArray(list)) {
      return [];
    }

    // Strictly exclude any client that was deleted
    const active = list.filter((c) => !deleted.includes(c.id));
    if (active.length !== list.length) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(active));
    }

    let needsUpdate = false;
    const enriched = active.map((c) => {
      let cat = c.category;
      if (!cat || cat === 'عام') {
        const init = INITIAL_CLIENTS.find((ic) => ic.id === c.id || ic.name?.trim() === c.name?.trim());
        if (init?.category) {
          cat = init.category;
          needsUpdate = true;
        } else {
          const name = (c.name || '').toLowerCase();
          if (name.includes('مطعم')) cat = 'مطعم';
          else if (name.includes('سناك')) cat = 'سناك';
          else if (name.includes('شواية')) cat = 'شواية';
          else if (name.includes('جملة')) cat = 'تاجر جملة';
          else if (name.includes('طباخ') || name.includes('حفل')) cat = 'تموين حفلات';
          else if (name.includes('نقدي') || name.includes('مباشر')) cat = 'مباشر';
          else cat = 'عام';

          if (cat !== c.category) {
            needsUpdate = true;
          }
        }
      }
      const cleanPhone = c.phone ? String(c.phone).replace(/\s+/g, '') : '';
      if (cleanPhone !== c.phone) {
        needsUpdate = true;
      }
      return { ...c, category: cat, phone: cleanPhone };
    });

    if (needsUpdate) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(enriched));
    }

    return enriched;
  } catch (e) {
    return [];
  }
};

export const saveStoredClients = (clients) => {
  try {
    const deleted = getStoredDeletedClients();
    const clean = Array.isArray(clients) ? clients.filter((c) => !deleted.includes(c.id)) : [];
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) { }
};

// Save a single client with background MySQL sync
export const persistClientWithDb = async (client) => {
  if (client?.category) {
    saveCustomClientCategory(client.category);
  }

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
  trackDeletedClientId(clientId);
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

// Products LocalStorage & MySQL Synchronization
export const getStoredProducts = () => {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return INITIAL_PRODUCTS;
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
};

export const saveStoredProducts = (products) => {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('wahib_products_synced', { detail: products }));
  } catch (e) { }
};

export const persistProductWithDb = async (product) => {
  const current = getStoredProducts();
  const id = product.id || `prod_${Date.now()}`;
  const number = product.number || current.length + 1;
  const normalized = {
    ...product,
    id,
    number,
    name: String(product.name || '').trim(),
    subname: String(product.subname || '').trim(),
    defaultPrice: Number(product.defaultPrice) || 0,
    category: product.category || 'découpe',
    code: product.code || `P${String(number).padStart(2, '0')}`,
  };

  const index = current.findIndex((p) => p.id === id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = normalized;
  } else {
    updated = [...current, normalized];
  }
  saveStoredProducts(updated);

  try {
    await apiSaveSetting('custom_products', JSON.stringify(updated));
  } catch (e) {
    console.warn('MySQL product sync pending offline:', e);
  }
  return updated;
};

export const deleteProductWithDb = async (productId) => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== productId);
  saveStoredProducts(updated);

  try {
    await apiSaveSetting('custom_products', JSON.stringify(updated));
  } catch (e) {
    console.warn('MySQL product delete pending offline:', e);
  }
  return updated;
};

export const normalizeInvoiceData = (inv) => {
  if (!inv || typeof inv !== 'object') return null;
  const items = Array.isArray(inv.items)
    ? inv.items.map((it) => {
        const w = Number(it.weight) || 0;
        const p = Number(it.price) || 0;
        const t =
          it.total !== undefined && !isNaN(Number(it.total)) && Number(it.total) !== 0
            ? Number(it.total)
            : w * p;
        return {
          ...it,
          weight: w,
          price: p,
          total: t,
        };
      })
    : [];

  const computedWeight = items.reduce((sum, it) => sum + it.weight, 0);
  const computedAmount = items.reduce((sum, it) => sum + it.total, 0);

  return {
    ...inv,
    totalWeight: items.length > 0 ? computedWeight : Number(inv.totalWeight) || 0,
    totalAmount: items.length > 0 ? computedAmount : Number(inv.totalAmount) || 0,
    timestamp: Number(inv.timestamp) || Date.now(),
    items,
  };
};

// Persistent Invoices
export const getStoredInvoices = () => {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    let list;
    if (!raw) {
      return [];
    }
    list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map(normalizeInvoiceData).filter(Boolean);
  } catch (e) {
    return [];
  }
};

export const saveStoredInvoices = (invoices) => {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) { }
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
  trackDeletedInvoiceId(invoiceId);
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

// Calculate next auto-incrementing invoice number starting from 1, filling any gaps/deleted slots
export const getNextInvoiceNumber = (invoices = getStoredInvoices()) => {
  const existingSet = new Set();
  if (Array.isArray(invoices)) {
    invoices.forEach((inv) => {
      if (!inv || inv.id === undefined || inv.id === null) return;
      const clean = String(inv.id).trim();
      const match = clean.match(/^\d+$/) || clean.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > 0) {
          existingSet.add(num);
        }
      }
    });
  }

  // Start from num 1 and find the first available (unfilled/deleted) positive integer
  let candidate = 1;
  while (existingSet.has(candidate)) {
    candidate++;
  }

  return String(candidate);
};

// Validate if an invoice number is already used in history
export const isInvoiceNumberTaken = (number, currentEditingId, invoices = getStoredInvoices()) => {
  if (!number) return false;
  const clean = String(number).trim();
  const cleanNum = parseInt(clean, 10);
  return (invoices || []).some((inv) => {
    if (currentEditingId && String(inv.id).trim() === String(currentEditingId).trim()) {
      return false;
    }
    const invId = String(inv.id).trim();
    if (invId === clean) return true;
    const invNum = parseInt(invId, 10);
    return !isNaN(cleanNum) && !isNaN(invNum) && cleanNum === invNum;
  });
};

// Remember custom price per client/product
export const getClientProductPrice = (clientId, productId, defaultPrice = 0) => {
  try {
    const raw = localStorage.getItem(CLIENT_PRICES_KEY);
    if (!raw) return defaultPrice;
    const prices = JSON.parse(raw);
    const key = `${clientId || 'default'}_${productId}`;
    if (prices[key] !== undefined && prices[key] !== null && prices[key] !== '') {
      return Number(prices[key]);
    }
    // Also check generic default key if client-specific is not set
    const fallbackKey = `default_${productId}`;
    if (prices[fallbackKey] !== undefined && prices[fallbackKey] !== null && prices[fallbackKey] !== '') {
      return Number(prices[fallbackKey]);
    }
    return defaultPrice;
  } catch (e) {
    return defaultPrice;
  }
};

export const saveClientProductPrice = (clientId, productId, price) => {
  try {
    const raw = localStorage.getItem(CLIENT_PRICES_KEY);
    const prices = raw ? JSON.parse(raw) : {};
    const key = `${clientId || 'default'}_${productId}`;
    const fallbackKey = `default_${productId}`;

    if (price === '' || price === null || price === undefined || isNaN(Number(price))) {
      delete prices[key];
    } else {
      const numVal = Number(price);
      prices[key] = numVal;
      // Also remember this price as default for next times
      prices[fallbackKey] = numVal;
    }
    localStorage.setItem(CLIENT_PRICES_KEY, JSON.stringify(prices));

    // Background MySQL sync
    if (price !== '' && price !== null && price !== undefined && !isNaN(Number(price))) {
      apiSavePrice(clientId || 'default', productId, Number(price)).catch((e) =>
        console.warn('MySQL price sync pending offline:', e)
      );
    }
  } catch (e) { }
};

// Admin Authentication & Credentials (User: wahib | Password: 12345)
export const getAdminUser = () => {
  const saved = localStorage.getItem(ADMIN_USER_KEY);
  if (saved && saved !== 'mohamed') return saved;
  return 'wahib';
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
  const currentU = (getAdminUser() || 'wahib').trim().toLowerCase();
  const currentP = String(getAdminPassword() || '12345').trim();

  const inputU = String(user || '').trim().toLowerCase();
  const inputP = String(pass || '').trim();

  // Allow login if user matches wahib or current, and password matches current OR 12345
  const userOk = inputU === currentU || inputU === 'wahib' || inputU === 'mohamed';
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

// Company & Business Information Management
export const getBusinessInfo = () => {
  try {
    const saved = localStorage.getItem(BUSINESS_INFO_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...BUSINESS_INFO, ...parsed };
    }
  } catch (e) { }
  return BUSINESS_INFO;
};

export const saveBusinessInfo = (newInfo) => {
  try {
    const current = getBusinessInfo();
    const merged = { ...current, ...newInfo };
    localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(merged));
    apiSaveSetting('business_info', JSON.stringify(merged)).catch((e) =>
      console.warn('MySQL business_info sync:', e)
    );
    return merged;
  } catch (e) {
    return BUSINESS_INFO;
  }
};

// Full Bidirectional Database Synchronization
export const performDatabaseSync = async () => {
  try {
    const localDeletedClients = getStoredDeletedClients();
    const localDeletedInvoices = getStoredDeletedInvoices();
    const localClients = getStoredClients().filter((c) => !localDeletedClients.includes(c.id));
    const localInvoices = getStoredInvoices().filter((inv) => !localDeletedInvoices.includes(inv.id));
    const localPricesRaw = localStorage.getItem(CLIENT_PRICES_KEY);
    const localPrices = localPricesRaw ? JSON.parse(localPricesRaw) : {};
    const localUser = getAdminUser();
    const localPass = getAdminPassword();

    const result = await apiSyncAll({
      clients: localClients,
      deletedClientIds: localDeletedClients,
      invoices: localInvoices,
      deletedInvoiceIds: localDeletedInvoices,
      prices: localPrices,
      adminUser: localUser,
      adminPin: localPass,
      adminPassword: localPass,
    });

    if (result && result.ok) {
      if (Array.isArray(result.deletedClientIds)) {
        result.deletedClientIds.forEach((id) => trackDeletedClientId(id));
      }
      if (Array.isArray(result.deletedInvoiceIds)) {
        result.deletedInvoiceIds.forEach((id) => trackDeletedInvoiceId(id));
      }

      const allDeletedClients = getStoredDeletedClients();
      const allDeletedInvoices = getStoredDeletedInvoices();

      if (Array.isArray(result.clients)) {
        const enriched = result.clients
          .filter((c) => !allDeletedClients.includes(c.id))
          .map((c) => {
            let cat = c.category;
            if (!cat || cat === 'عام') {
              const init = INITIAL_CLIENTS.find((ic) => ic.id === c.id || ic.name?.trim() === c.name?.trim());
              if (init?.category) cat = init.category;
              else {
                const name = (c.name || '').toLowerCase();
                if (name.includes('مطعم')) cat = 'مطعم';
                else if (name.includes('سناك')) cat = 'سناك';
                else if (name.includes('شواية')) cat = 'شواية';
                else if (name.includes('جملة')) cat = 'تاجر جملة';
                else if (name.includes('طباخ') || name.includes('حفل')) cat = 'تموين حفلات';
                else if (name.includes('نقدي') || name.includes('مباشر')) cat = 'مباشر';
                else cat = 'عام';
              }
            }
            return { ...c, category: cat };
          });
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(enriched));
      }

      if (Array.isArray(result.invoices)) {
        const normalizedInvoices = result.invoices
          .filter((inv) => !allDeletedInvoices.includes(inv.id))
          .map(normalizeInvoiceData)
          .filter(Boolean);
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(normalizedInvoices));
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

      // Sync custom products from MySQL settings
      try {
        const prodSetting = await apiFetchSetting('custom_products');
        if (prodSetting) {
          const parsed = JSON.parse(prodSetting);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(parsed));
          }
        } else {
          // If not in db yet, save local products to MySQL setting
          const currentProds = getStoredProducts();
          await apiSaveSetting('custom_products', JSON.stringify(currentProds));
        }
      } catch (pe) {
        // Continue silently if products setting fetch fails
      }

      // Sync custom client categories from MySQL settings
      try {
        const catSetting = await apiFetchSetting('client_categories');
        if (catSetting) {
          const parsed = JSON.parse(catSetting);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const raw = localStorage.getItem(CLIENT_CATEGORIES_KEY);
            const current = raw ? JSON.parse(raw) : [];
            const merged = Array.from(new Set([...current, ...parsed]));
            localStorage.setItem(CLIENT_CATEGORIES_KEY, JSON.stringify(merged));
          }
        }
      } catch (ce) {
        // Continue silently
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
