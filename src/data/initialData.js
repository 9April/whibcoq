// 12 Exact Poultry Wholesale Products for WAHIB COQ
export const INITIAL_PRODUCTS = [
  {
    id: 'chicken',
    number: 1,
    name: 'الدجاج',
    subname: 'Poulet vif / découpé',
    defaultPrice: 22.0,
    category: 'كامل',
    code: 'P01',
  },
  {
    id: 'fillet',
    number: 2,
    name: 'فيلي',
    subname: 'Filet de poitrine',
    defaultPrice: 65.0,
    category: 'découpe',
    code: 'P02',
  },
  {
    id: 'thighs',
    number: 3,
    name: 'فخاد',
    subname: 'Cuisses de poulet',
    defaultPrice: 30.0,
    category: 'découpe',
    code: 'P03',
  },
  {
    id: 'wings',
    number: 4,
    name: 'جناح',
    subname: 'Ailes de poulet',
    defaultPrice: 26.0,
    category: 'découpe',
    code: 'P04',
  },
  {
    id: 'necks',
    number: 5,
    name: 'عناق',
    subname: 'Cous de poulet',
    defaultPrice: 14.0,
    category: 'abats',
    code: 'P05',
  },
  {
    id: 'shawarma',
    number: 6,
    name: 'شوارما',
    subname: 'Émincé Shawarma',
    defaultPrice: 68.0,
    category: 'préparé',
    code: 'P06',
  },
  {
    id: 'haut_de_cuisse',
    number: 7,
    name: 'هودوكويس',
    subname: 'Haut de cuisse',
    defaultPrice: 34.0,
    category: 'découpe',
    code: 'P07',
  },
  {
    id: 'liver',
    number: 8,
    name: 'كبدة',
    subname: 'Foie de volaille',
    defaultPrice: 42.0,
    category: 'abats',
    code: 'P08',
  },
  {
    id: 'gizzard',
    number: 9,
    name: 'قنصة',
    subname: 'Gésiers frais',
    defaultPrice: 28.0,
    category: 'abats',
    code: 'P09',
  },
  {
    id: 'kefta',
    number: 10,
    name: 'كفتة',
    subname: 'Viande hachée',
    defaultPrice: 52.0,
    category: 'préparé',
    code: 'P10',
  },
  {
    id: 'sausage',
    number: 11,
    name: 'صوصيص',
    subname: 'Saucisses fraîches',
    defaultPrice: 48.0,
    category: 'préparé',
    code: 'P11',
  },
  {
    id: 'carcass',
    number: 12,
    name: 'كركاس',
    subname: 'Carcasses / Os',
    defaultPrice: 7.0,
    category: 'dérivé',
    code: 'P12',
  },
];

// Commercial Wholesale Clients in Morocco
export const INITIAL_CLIENTS = [
  {
    id: 'c1',
    name: 'مطعم ومشاوي السلام',
    phone: '06 61 24 58 90',
    category: 'مطعم',
  },
  {
    id: 'c2',
    name: 'سناك الأندلس',
    phone: '06 72 11 88 44',
    category: 'سناك',
  },
  {
    id: 'c3',
    name: 'شواية الرياض',
    phone: '06 63 90 22 15',
    category: 'شواية',
  },
  {
    id: 'c4',
    name: 'سوق الجملة - حميد',
    phone: '06 50 33 44 55',
    category: 'تاجر جملة',
  },
  {
    id: 'c5',
    name: 'طباخة الحاجة زهور',
    phone: '06 65 77 99 11',
    category: 'تموين حفلات',
  },
  {
    id: 'c6',
    name: 'زبون نقدي',
    phone: '',
    category: 'مباشر',
  },
];

// Official Commercial Business Information
export const BUSINESS_INFO = {
  name: 'WAHIB COQ',
  frenchSubtitle: 'Vente de poulets vivants et découpes',
  arabicTitle: 'وهيب كوك - تجارة الدواجن بالجملة والتفصيل',
  address: 'سوق الجملة للدواجن، الدار البيضاء',
  phone: '06 61 88 99 22 / 05 22 40 50 60',
  taxInfo: 'IF: 45892011 • ICE: 002394819000045 • Patente: 36248910',
};

// Realistic initial sample invoices for rich instant reporting
export const generateSampleInvoices = () => {
  const today = new Date();
  const formatDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: '1042',
      clientId: 'c1',
      clientName: 'مطعم ومشاوي السلام',
      clientPhone: '06 61 24 58 90',
      date: formatDate(0), // Today
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
      date: formatDate(0), // Today
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
      date: formatDate(1), // Yesterday
      items: [
        { productId: 'chicken', productName: 'الدجاج', weight: 120.0, price: 22.0, total: 2640.0 },
        { productId: 'thighs', productName: 'فخاد', weight: 45.0, price: 30.0, total: 1350.0 },
        { productId: 'wings', productName: 'جناح', weight: 30.0, price: 26.0, total: 780.0 },
      ],
      totalWeight: 195.0,
      totalAmount: 4770.0,
      timestamp: Date.now() - 86400000 * 1,
    },
    {
      id: '1039',
      clientId: 'c4',
      clientName: 'سوق الجملة - حميد',
      clientPhone: '06 50 33 44 55',
      date: formatDate(3),
      items: [
        { productId: 'chicken', productName: 'الدجاج', weight: 280.0, price: 21.5, total: 6020.0 },
        { productId: 'carcass', productName: 'كركاس', weight: 80.0, price: 7.0, total: 560.0 },
      ],
      totalWeight: 360.0,
      totalAmount: 6580.0,
      timestamp: Date.now() - 86400000 * 3,
    },
    {
      id: '1038',
      clientId: 'c5',
      clientName: 'طباخة الحاجة زهور',
      clientPhone: '06 65 77 99 11',
      date: formatDate(5),
      items: [
        { productId: 'chicken', productName: 'الدجاج', weight: 180.0, price: 22.0, total: 3960.0 },
        { productId: 'liver', productName: 'كبدة', weight: 20.0, price: 42.0, total: 840.0 },
        { productId: 'gizzard', productName: 'قنصة', weight: 15.0, price: 28.0, total: 420.0 },
      ],
      totalWeight: 215.0,
      totalAmount: 5220.0,
      timestamp: Date.now() - 86400000 * 5,
    }
  ];
};
