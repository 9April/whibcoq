import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'srv898.hstgr.io',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u895506237_wahib',
  password: process.env.DB_PASSWORD || '9uMCumV/',
  database: process.env.DB_NAME || 'u895506237_wahib',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Health check / DB Status
app.get(['/api/status', '/api/status.php'], async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT COUNT(*) as count FROM clients');
    const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices');
    const [prices] = await pool.query('SELECT COUNT(*) as count FROM client_prices');

    res.json({
      ok: true,
      database: dbConfig.database,
      status: 'connected',
      stats: {
        clients: clients[0].count,
        invoices: invoices[0].count,
        prices: prices[0].count,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Clients API
app.get(['/api/clients', '/api/clients.php'], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post(['/api/clients', '/api/clients.php'], async (req, res) => {
  try {
    const { id, name, phone, category } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: 'Name is required' });

    const clientId = id || `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const clientPhone = phone || '';
    const clientCategory = category || 'عام';

    await pool.query(
      `INSERT INTO clients (id, name, phone, category) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), category = VALUES(category)`,
      [clientId, name, clientPhone, clientCategory]
    );

    res.json({
      ok: true,
      client: { id: clientId, name, phone: clientPhone, category: clientCategory },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete(['/api/clients', '/api/clients.php', '/api/clients/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body?.id;
    if (!id) return res.status(400).json({ ok: false, error: 'Client ID is required' });

    await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    await pool.query('DELETE FROM client_prices WHERE client_id = ?', [id]);

    res.json({ ok: true, deleted_id: id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Invoices API
app.get(['/api/invoices', '/api/invoices.php'], async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC'
    );

    const invoices = rows.map((r) => {
      const rawItems = typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []);
      const parsedItems = Array.isArray(rawItems)
        ? rawItems.map((it) => ({
            ...it,
            weight: Number(it.weight) || 0,
            price: Number(it.price) || 0,
            total:
              it.total !== undefined && !isNaN(Number(it.total))
                ? Number(it.total)
                : (Number(it.weight) || 0) * (Number(it.price) || 0),
          }))
        : [];
      const computedWeight = parsedItems.reduce((sum, it) => sum + it.weight, 0);
      const computedAmount = parsedItems.reduce((sum, it) => sum + it.total, 0);

      return {
        ...r,
        totalWeight: parsedItems.length > 0 ? computedWeight : Number(r.totalWeight) || 0,
        totalAmount: parsedItems.length > 0 ? computedAmount : Number(r.totalAmount) || 0,
        timestamp: Number(r.timestamp) || Date.now(),
        items: parsedItems,
      };
    });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post(['/api/invoices', '/api/invoices.php'], async (req, res) => {
  try {
    const { id, clientId, clientName, clientPhone, date, totalWeight, totalAmount, items, timestamp } = req.body;
    if (!id) return res.status(400).json({ ok: false, error: 'Invoice ID is required' });

    const itemsStr = typeof items === 'string' ? items : JSON.stringify(items || []);
    const ts = timestamp || Date.now();

    await pool.query(
      `INSERT INTO invoices (id, client_id, client_name, client_phone, date, total_weight, total_amount, items, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         client_id = VALUES(client_id),
         client_name = VALUES(client_name),
         client_phone = VALUES(client_phone),
         date = VALUES(date),
         total_weight = VALUES(total_weight),
         total_amount = VALUES(total_amount),
         items = VALUES(items),
         timestamp = VALUES(timestamp)`,
      [id, clientId || 'c_default', clientName || 'زبون عام', clientPhone || '', date, totalWeight || 0, totalAmount || 0, itemsStr, ts]
    );

    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete(['/api/invoices', '/api/invoices.php', '/api/invoices/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body?.id;
    if (!id) return res.status(400).json({ ok: false, error: 'Invoice ID is required' });

    await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
    res.json({ ok: true, deleted_id: id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Custom Prices API
app.get(['/api/prices', '/api/prices.php'], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT client_id, product_id, price FROM client_prices');
    const pricesMap = {};
    for (const r of rows) {
      pricesMap[`${r.client_id}_${r.product_id}`] = Number(r.price);
    }
    res.json(pricesMap);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post(['/api/prices', '/api/prices.php'], async (req, res) => {
  try {
    const { clientId, productId, price } = req.body;
    if (!clientId || !productId || price === undefined) {
      return res.status(400).json({ ok: false, error: 'Missing parameters' });
    }

    await pool.query(
      `INSERT INTO client_prices (client_id, product_id, price)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price)`,
      [clientId, productId, Number(price)]
    );

    res.json({ ok: true, key: `${clientId}_${productId}`, price: Number(price) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Settings & PIN API
app.get(['/api/settings', '/api/settings.php'], async (req, res) => {
  try {
    const key = req.query.key;
    if (key) {
      const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
      return res.json({ key, value: rows[0]?.setting_value || null });
    }
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const obj = {};
    rows.forEach((r) => (obj[r.setting_key] = r.setting_value));
    res.json(obj);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post(['/api/settings', '/api/settings.php'], async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ ok: false, error: 'Key is required' });

    await pool.query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, String(value)]
    );

    res.json({ ok: true, key, value: String(value) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Full Batch Sync API
app.post(['/api/sync', '/api/sync.php'], async (req, res) => {
  try {
    const { clients, invoices, prices, adminPin } = req.body || {};

    if (Array.isArray(clients)) {
      for (const c of clients) {
        if (c.id && c.name) {
          await pool.query(
            `INSERT INTO clients (id, name, phone, category) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), category = VALUES(category)`,
            [c.id, c.name, c.phone || '', c.category || 'عام']
          );
        }
      }
    }

    if (Array.isArray(invoices)) {
      for (const inv of invoices) {
        if (inv.id) {
          const itemsStr = typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items || []);
          await pool.query(
            `INSERT INTO invoices (id, client_id, client_name, client_phone, date, total_weight, total_amount, items, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               client_id = VALUES(client_id),
               client_name = VALUES(client_name),
               client_phone = VALUES(client_phone),
               date = VALUES(date),
               total_weight = VALUES(total_weight),
               total_amount = VALUES(total_amount),
               items = VALUES(items),
               timestamp = VALUES(timestamp)`,
            [
              inv.id,
              inv.clientId || 'c_default',
              inv.clientName || 'زبون عام',
              inv.clientPhone || '',
              inv.date || new Date().toISOString().split('T')[0],
              inv.totalWeight || 0,
              inv.totalAmount || 0,
              itemsStr,
              inv.timestamp || Date.now(),
            ]
          );
        }
      }
    }

    if (prices && typeof prices === 'object') {
      for (const [key, price] of Object.entries(prices)) {
        const parts = key.split('_');
        if (parts.length === 2) {
          await pool.query(
            `INSERT INTO client_prices (client_id, product_id, price)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
            [parts[0], parts[1], Number(price)]
          );
        }
      }
    }

    const newPass = req.body?.adminPassword || req.body?.adminPin;
    if (newPass && newPass !== '1234') {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES ('admin_password', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [String(newPass)]
      );
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES ('admin_pin', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [String(newPass)]
      );
    }

    if (req.body?.adminUser) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES ('admin_user', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [String(req.body.adminUser)]
      );
    }

    // Return fresh state
    const [cRows] = await pool.query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC');
    const [iRows] = await pool.query(
      'SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC'
    );
    const [pRows] = await pool.query('SELECT client_id, product_id, price FROM client_prices');
    const [uRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_user'");
    const [sRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");

    const parsedInvoices = iRows.map((r) => {
      const rawItems = typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []);
      const parsedItems = Array.isArray(rawItems)
        ? rawItems.map((it) => ({
            ...it,
            weight: Number(it.weight) || 0,
            price: Number(it.price) || 0,
            total:
              it.total !== undefined && !isNaN(Number(it.total))
                ? Number(it.total)
                : (Number(it.weight) || 0) * (Number(it.price) || 0),
          }))
        : [];
      const computedWeight = parsedItems.reduce((sum, it) => sum + it.weight, 0);
      const computedAmount = parsedItems.reduce((sum, it) => sum + it.total, 0);

      return {
        ...r,
        totalWeight: parsedItems.length > 0 ? computedWeight : Number(r.totalWeight) || 0,
        totalAmount: parsedItems.length > 0 ? computedAmount : Number(r.totalAmount) || 0,
        timestamp: Number(r.timestamp) || Date.now(),
        items: parsedItems,
      };
    });

    const pricesMap = {};
    pRows.forEach((r) => (pricesMap[`${r.client_id}_${r.product_id}`] = Number(r.price)));

    const currentAdminUser = uRows[0]?.setting_value || 'wahib';
    const currentAdminPass = sRows[0]?.setting_value || '12345';

    res.json({
      ok: true,
      database: dbConfig.database,
      clients: cRows,
      invoices: parsedInvoices,
      prices: pricesMap,
      adminUser: currentAdminUser,
      adminPassword: currentAdminPass,
      adminPin: currentAdminPass,
      syncedAt: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`WAHIB COQ API Server listening on port ${PORT}`);
  console.log(`Connected to MySQL: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
});
