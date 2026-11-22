import mysql from 'mysql2/promise';

export function mysqlApiPlugin() {
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

  let pool;
  try {
    pool = mysql.createPool(dbConfig);
  } catch (e) {
    console.error('Failed to create MySQL pool in Vite plugin:', e);
  }

  const parseJsonBody = (req) => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendJson = (res, statusCode, data) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  };

  return {
    name: 'vite-mysql-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname.replace(/\.php$/, ''); // normalize /api/clients.php -> /api/clients

        if (!pool) {
          return sendJson(res, 500, { ok: false, error: 'MySQL pool not initialized' });
        }

        try {
          // Status
          if (pathname === '/api/status') {
            const [clients] = await pool.query('SELECT COUNT(*) as count FROM clients');
            const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices');
            const [prices] = await pool.query('SELECT COUNT(*) as count FROM client_prices');
            return sendJson(res, 200, {
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
          }

          // Clients
          if (pathname === '/api/clients') {
            if (req.method === 'GET') {
              const [rows] = await pool.query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC');
              return sendJson(res, 200, rows);
            }
            if (req.method === 'POST') {
              const body = await parseJsonBody(req);
              if (!body.name) return sendJson(res, 400, { ok: false, error: 'Name is required' });
              const clientId = body.id || `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              const phone = body.phone || '';
              const category = body.category || 'عام';
              await pool.query(
                `INSERT INTO clients (id, name, phone, category) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), category = VALUES(category)`,
                [clientId, body.name, phone, category]
              );
              return sendJson(res, 200, { ok: true, client: { id: clientId, name: body.name, phone, category } });
            }
            if (req.method === 'DELETE') {
              const id = url.searchParams.get('id') || (await parseJsonBody(req)).id;
              if (!id) return sendJson(res, 400, { ok: false, error: 'Client ID required' });
              await pool.query('DELETE FROM clients WHERE id = ?', [id]);
              await pool.query('DELETE FROM client_prices WHERE client_id = ?', [id]);

              try {
                const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'deleted_clients'");
                const stored = rows[0]?.setting_value ? JSON.parse(rows[0].setting_value) : [];
                if (!stored.includes(id)) {
                  stored.push(id);
                  await pool.query(
                    `INSERT INTO settings (setting_key, setting_value) VALUES ('deleted_clients', ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [JSON.stringify(stored)]
                  );
                }
              } catch {}

              return sendJson(res, 200, { ok: true, deleted_id: id });
            }
          }

          // Invoices
          if (pathname === '/api/invoices') {
            if (req.method === 'GET') {
              const [rows] = await pool.query(
                'SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC'
              );
              const invoices = rows.map((r) => ({
                ...r,
                totalWeight: Number(r.totalWeight),
                totalAmount: Number(r.totalAmount),
                timestamp: Number(r.timestamp),
                items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : r.items,
              }));
              return sendJson(res, 200, invoices);
            }
            if (req.method === 'POST') {
              const body = await parseJsonBody(req);
              if (!body.id) return sendJson(res, 400, { ok: false, error: 'Invoice ID is required' });
              const itemsStr = typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []);
              const ts = body.timestamp || Date.now();
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
                  body.id,
                  body.clientId || 'c_default',
                  body.clientName || 'زبون عام',
                  body.clientPhone || '',
                  body.date || new Date().toISOString().split('T')[0],
                  body.totalWeight || 0,
                  body.totalAmount || 0,
                  itemsStr,
                  ts,
                ]
              );
              return sendJson(res, 200, { ok: true, id: body.id });
            }
            if (req.method === 'DELETE') {
              const id = url.searchParams.get('id') || (await parseJsonBody(req)).id;
              if (!id) return sendJson(res, 400, { ok: false, error: 'Invoice ID required' });
              await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
              return sendJson(res, 200, { ok: true, deleted_id: id });
            }
          }

          // Custom Prices
          if (pathname === '/api/prices') {
            if (req.method === 'GET') {
              const [rows] = await pool.query('SELECT client_id, product_id, price FROM client_prices');
              const pricesMap = {};
              rows.forEach((r) => (pricesMap[`${r.client_id}_${r.product_id}`] = Number(r.price)));
              return sendJson(res, 200, pricesMap);
            }
            if (req.method === 'POST') {
              const body = await parseJsonBody(req);
              const { clientId, productId, price } = body;
              if (!clientId || !productId || price === undefined) {
                return sendJson(res, 400, { ok: false, error: 'Missing parameters' });
              }
              await pool.query(
                `INSERT INTO client_prices (client_id, product_id, price)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                [clientId, productId, Number(price)]
              );
              return sendJson(res, 200, { ok: true, key: `${clientId}_${productId}`, price: Number(price) });
            }
          }

          // Settings / PIN
          if (pathname === '/api/settings') {
            if (req.method === 'GET') {
              const key = url.searchParams.get('key');
              if (key) {
                const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
                return sendJson(res, 200, { key, value: rows[0]?.setting_value || null });
              }
              const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
              const obj = {};
              rows.forEach((r) => (obj[r.setting_key] = r.setting_value));
              return sendJson(res, 200, obj);
            }
            if (req.method === 'POST') {
              const body = await parseJsonBody(req);
              const { key, value } = body;
              if (!key) return sendJson(res, 400, { ok: false, error: 'Key is required' });
              await pool.query(
                `INSERT INTO settings (setting_key, setting_value)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [key, String(value)]
              );
              return sendJson(res, 200, { ok: true, key, value: String(value) });
            }
          }

          // Batch Sync
          if (pathname === '/api/sync' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { clients, invoices, prices, adminPin, deletedClientIds, deletedInvoiceIds } = body;

            // 0. Process deleted client tombstones
            let storedDeletedClients = [];
            try {
              const [delRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'deleted_clients'");
              storedDeletedClients = delRows[0]?.setting_value ? JSON.parse(delRows[0].setting_value) : [];
            } catch {}

            if (Array.isArray(deletedClientIds)) {
              for (const id of deletedClientIds) {
                if (id && !storedDeletedClients.includes(id)) {
                  storedDeletedClients.push(id);
                }
              }
            }

            if (storedDeletedClients.length > 0) {
              await pool.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('deleted_clients', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [JSON.stringify(storedDeletedClients)]
              );
              await pool.query('DELETE FROM clients WHERE id IN (?)', [storedDeletedClients]);
              await pool.query('DELETE FROM client_prices WHERE client_id IN (?)', [storedDeletedClients]);
            }

            // 0b. Process deleted invoice tombstones
            let storedDeletedInvoices = [];
            try {
              const [delInvRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'deleted_invoices'");
              storedDeletedInvoices = delInvRows[0]?.setting_value ? JSON.parse(delInvRows[0].setting_value) : [];
            } catch {}

            const activeInvoiceIds = Array.isArray(invoices) ? invoices.map((inv) => String(inv.id).trim()) : [];

            if (Array.isArray(deletedInvoiceIds)) {
              for (const id of deletedInvoiceIds) {
                const idStr = String(id).trim();
                if (idStr && !storedDeletedInvoices.map((x) => String(x).trim()).includes(idStr) && !activeInvoiceIds.includes(idStr)) {
                  storedDeletedInvoices.push(idStr);
                }
              }
            }

            if (activeInvoiceIds.length > 0) {
              storedDeletedInvoices = storedDeletedInvoices.filter((x) => !activeInvoiceIds.includes(String(x).trim()));
            }

            if (storedDeletedInvoices.length > 0) {
              await pool.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('deleted_invoices', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [JSON.stringify(storedDeletedInvoices)]
              );
              await pool.query('DELETE FROM invoices WHERE id IN (?)', [storedDeletedInvoices]);
            }

            // 1. Sync clients (skip any in storedDeletedClients)
            if (Array.isArray(clients)) {
              for (const c of clients) {
                if (c.id && c.name && !storedDeletedClients.includes(c.id)) {
                  await pool.query(
                    `INSERT INTO clients (id, name, phone, category) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), category = VALUES(category)`,
                    [c.id, c.name, c.phone || '', c.category || 'عام']
                  );
                }
              }
            }

            // 2. Sync invoices (skip any in storedDeletedInvoices)
            if (Array.isArray(invoices)) {
              for (const inv of invoices) {
                if (inv.id && !storedDeletedInvoices.includes(inv.id)) {
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
                if (parts.length === 2 && !storedDeletedClients.includes(parts[0])) {
                  await pool.query(
                    `INSERT INTO client_prices (client_id, product_id, price)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                    [parts[0], parts[1], Number(price)]
                  );
                }
              }
            }

            const newPass = body.adminPassword || body.adminPin;
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

            if (body.adminUser) {
              await pool.query(
                `INSERT INTO settings (setting_key, setting_value)
                 VALUES ('admin_user', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [String(body.adminUser)]
              );
            }

            const [cRows] = await pool.query('SELECT id, name, phone, category FROM clients ORDER BY created_at ASC');
            const [iRows] = await pool.query(
              'SELECT id, client_id as clientId, client_name as clientName, client_phone as clientPhone, date, total_weight as totalWeight, total_amount as totalAmount, items, timestamp FROM invoices ORDER BY timestamp DESC'
            );
            const [pRows] = await pool.query('SELECT client_id, product_id, price FROM client_prices');
            const [uRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_user'");
            const [sRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");

            const activeClients = cRows.filter((c) => !storedDeletedClients.includes(c.id));

            const parsedInvoices = iRows
              .filter((r) => !storedDeletedInvoices.includes(r.id))
              .map((r) => ({
                ...r,
                totalWeight: Number(r.totalWeight),
                totalAmount: Number(r.totalAmount),
                timestamp: Number(r.timestamp),
                items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : r.items,
              }));

            const pricesMap = {};
            pRows.forEach((r) => {
              if (!storedDeletedClients.includes(r.client_id)) {
                pricesMap[`${r.client_id}_${r.product_id}`] = Number(r.price);
              }
            });

            const currentAdminUser = uRows[0]?.setting_value || 'wahib';
            const currentAdminPass = sRows[0]?.setting_value || '12345';

            return sendJson(res, 200, {
              ok: true,
              database: dbConfig.database,
              clients: activeClients,
              deletedClientIds: storedDeletedClients,
              invoices: parsedInvoices,
              deletedInvoiceIds: storedDeletedInvoices,
              prices: pricesMap,
              adminUser: currentAdminUser,
              adminPassword: currentAdminPass,
              adminPin: currentAdminPass,
              syncedAt: Date.now(),
            });
          }

          next();
        } catch (err) {
          console.error('API Error:', err);
          return sendJson(res, 500, { ok: false, error: err.message });
        }
      });
    },
  };
}
