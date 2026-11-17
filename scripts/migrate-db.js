import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'srv898.hstgr.io',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u895506237_wahib',
  password: process.env.DB_PASSWORD || '9uMCumV/',
  database: process.env.DB_NAME || 'u895506237_wahib',
};

async function migrate() {
  console.log('Connecting to database:', dbConfig.database, 'at', dbConfig.host);
  const conn = await mysql.createConnection(dbConfig);

  console.log('Connected! Creating tables...');

  // 1. Clients table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) DEFAULT '',
      category VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ clients table ready');

  // 2. Client custom prices table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS client_prices (
      client_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ client_prices table ready');

  // 3. Invoices table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      client_id VARCHAR(64) NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      client_phone VARCHAR(64) DEFAULT '',
      date VARCHAR(32) NOT NULL,
      total_weight DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      items LONGTEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ invoices table ready');

  // 4. Settings table (for PIN & store configs)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(64) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ settings table ready');

  // Insert default PIN '1234' if not exists
  await conn.query(`
    INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('admin_pin', '1234');
  `);

  // Seed initial clients if empty
  const [existingClients] = await conn.query('SELECT COUNT(*) as count FROM clients');
  if (existingClients[0].count === 0) {
    const initialClients = [
      ['c1', 'مطعم ومشاوي السلام', '06 61 24 58 90', 'مطعم'],
      ['c2', 'سناك الأندلس', '06 72 11 88 44', 'سناك'],
      ['c3', 'شواية الرياض', '06 63 90 22 15', 'شواية'],
      ['c4', 'سوق الجملة - حميد', '06 50 33 44 55', 'تاجر جملة'],
      ['c5', 'طباخة الحاجة زهور', '06 65 77 99 11', 'تموين حفلات'],
      ['c6', 'زبون نقدي', '', 'مباشر'],
    ];

    for (const [id, name, phone, category] of initialClients) {
      await conn.query(
        'INSERT INTO clients (id, name, phone, category) VALUES (?, ?, ?, ?)',
        [id, name, phone, category]
      );
    }
    console.log(`✅ Seeded ${initialClients.length} initial clients`);
  }

  // Seed initial invoices if empty
  const [existingInvoices] = await conn.query('SELECT COUNT(*) as count FROM invoices');
  if (existingInvoices[0].count === 0) {
    const today = new Date();
    const formatDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const sampleInvoices = [
      {
        id: '1042',
        clientId: 'c1',
        clientName: 'مطعم ومشاوي السلام',
        clientPhone: '06 61 24 58 90',
        date: formatDate(0),
        items: [
          { productId: 'chicken', productName: 'الدجاج', weight: 85.5, price: 22.0, total: 1881.0 },
          { productId: 'fillet', productName: 'فيلي', weight: 25.0, price: 65.0, total: 1625.0 },
          { productId: 'thighs', productName: 'فخاد', weight: 35.0, price: 30.0, total: 1050.0 },
        ],
        totalWeight: 145.5,
        totalAmount: 4556.0,
        timestamp: Date.now() - 3600000 * 3,
      },
      {
        id: '1041',
        clientId: 'c2',
        clientName: 'سناك الأندلس',
        clientPhone: '06 72 11 88 44',
        date: formatDate(0),
        items: [
          { productId: 'shawarma', productName: 'شوارما', weight: 40.0, price: 68.0, total: 2720.0 },
          { productId: 'fillet', productName: 'فيلي', weight: 30.0, price: 65.0, total: 1950.0 },
          { productId: 'kefta', productName: 'كفتة', weight: 15.0, price: 52.0, total: 780.0 },
        ],
        totalWeight: 85.0,
        totalAmount: 5450.0,
        timestamp: Date.now() - 3600000 * 6,
      },
      {
        id: '1040',
        clientId: 'c3',
        clientName: 'شواية الرياض',
        clientPhone: '06 63 90 22 15',
        date: formatDate(1),
        items: [
          { productId: 'chicken', productName: 'الدجاج', weight: 120.0, price: 22.0, total: 2640.0 },
          { productId: 'thighs', productName: 'فخاد', weight: 45.0, price: 30.0, total: 1350.0 },
          { productId: 'wings', productName: 'جناح', weight: 30.0, price: 26.0, total: 780.0 },
        ],
        totalWeight: 195.0,
        totalAmount: 4770.0,
        timestamp: Date.now() - 86400000 * 1,
      },
    ];

    for (const inv of sampleInvoices) {
      await conn.query(
        'INSERT INTO invoices (id, client_id, client_name, client_phone, date, total_weight, total_amount, items, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          inv.id,
          inv.clientId,
          inv.clientName,
          inv.clientPhone,
          inv.date,
          inv.totalWeight,
          inv.totalAmount,
          JSON.stringify(inv.items),
          inv.timestamp,
        ]
      );
    }
    console.log(`✅ Seeded ${sampleInvoices.length} initial invoices`);
  }

  const [tables] = await conn.query('SHOW TABLES');
  console.log('Migration finished successfully! Tables:', tables);
  await conn.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
