import { INITIAL_PRODUCTS, INITIAL_CLIENTS, generateSampleInvoices } from '../data/initialData';

const CLIENTS_STORAGE_KEY = 'wahib_coq_clients_v2';
const INVOICES_STORAGE_KEY = 'wahib_coq_invoices_v2';
const CLIENT_PRICES_KEY = 'wahib_coq_client_prices_v2';

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
  } catch (e) {}
};
