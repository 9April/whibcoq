// WAHIB COQ - Database API Client
// Connected to Hostinger MySQL: u895506237_wahib

const API_BASE = ''; // Same origin (works in dev via Vite proxy and prod via Hostinger PHP/Node)

// Try endpoint with automatic fallback to .php if needed
async function fetchWithFallback(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // network or CORS error, try .php fallback
  }

  // If mod_rewrite is not active or direct URL failed, try with .php
  if (!endpoint.includes('.php')) {
    const phpEndpoint = endpoint.replace(/(\/api\/[a-zA-Z0-9_-]+)/, '$1.php');
    try {
      const resPhp = await fetch(`${API_BASE}${phpEndpoint}`, { ...options, headers });
      if (resPhp.ok) {
        return await resPhp.json();
      }
    } catch (err2) {
      // failed both
    }
  }

  throw new Error(`Request failed for ${endpoint}`);
}

export const checkDbConnection = async () => {
  try {
    const data = await fetchWithFallback('/api/status');
    return {
      connected: data?.ok === true,
      database: data?.database || 'u895506237_wahib',
      stats: data?.stats || {},
    };
  } catch (e) {
    return {
      connected: false,
      database: 'u895506237_wahib',
      error: e.message,
    };
  }
};

export const apiFetchClients = async () => {
  return await fetchWithFallback('/api/clients');
};

export const apiSaveClient = async (client) => {
  return await fetchWithFallback('/api/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
};

export const apiDeleteClient = async (id) => {
  return await fetchWithFallback(`/api/clients?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

export const apiFetchInvoices = async () => {
  return await fetchWithFallback('/api/invoices');
};

export const apiSaveInvoice = async (invoice) => {
  return await fetchWithFallback('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice),
  });
};

export const apiDeleteInvoice = async (id) => {
  return await fetchWithFallback(`/api/invoices?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

export const apiFetchPrices = async () => {
  return await fetchWithFallback('/api/prices');
};

export const apiSavePrice = async (clientId, productId, price) => {
  return await fetchWithFallback('/api/prices', {
    method: 'POST',
    body: JSON.stringify({ clientId, productId, price }),
  });
};

export const apiFetchAdminPin = async () => {
  const data = await fetchWithFallback('/api/settings?key=admin_password');
  return data?.value || null;
};

export const apiSaveAdminPin = async (pin) => {
  return await fetchWithFallback('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ key: 'admin_password', value: pin }),
  });
};

export const apiSaveSetting = async (key, value) => {
  return await fetchWithFallback('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
};

export const apiFetchSetting = async (key) => {
  const data = await fetchWithFallback(`/api/settings?key=${encodeURIComponent(key)}`);
  return data?.value || null;
};

export const apiSyncAll = async (payload) => {
  return await fetchWithFallback('/api/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
