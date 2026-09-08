import { Branch, CompanyProfile, StockItem, StockTransfer, Invoice, AuthorizedUser, MasterStockItem } from '../types';

export const INITIAL_COMPANY: CompanyProfile = {
  companyName: 'Easy Flow',
  taxNumber: 'CD-KIN-TVA-00984218-A',
  nationalId: '01-83-N45209P',
  rccm: 'CD/KIN/RCCM/20-B-08412',
  defaultCurrency: 'USD',
  defaultExchangeRate: 2850, // 2850 FC = 1 USD
  defaultTvaRate: 16, // 16% TVA standard
  phone: '+243 81 000 9876 / +243 99 555 4321',
  email: 'contact@rftcom-trading.com',
  website: 'www.rftcom-trading.com',
  footerNotes: 'Bank details: Rawbank USD 0102938475-USD / FC 0102938475-CDF. Goods once sold are not returnable without inspection certificate.'
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-a1',
    name: 'A1-SHOP NO1',
    code: 'Lusi',
    invPrefix: 'Lusi',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: 'itkinshasa1@gmail.com',
    manager: 'Shop Manager 1',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: true
  },
  {
    id: 'branch-a2',
    name: 'A2-SHOP NO2',
    code: 'BRC',
    invPrefix: 'BRC',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 2',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a3',
    name: 'A3-SHOP NO3',
    code: 'Test',
    invPrefix: 'Test',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 3',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a4',
    name: 'A4-SHOP NO4',
    code: 'A4',
    invPrefix: 'A4',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 4',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a5',
    name: 'A5-SHOP NO5',
    code: 'A5',
    invPrefix: 'A5',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 5',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a6',
    name: 'A6-SHOP NO6',
    code: 'A6',
    invPrefix: 'A6',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 6',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a7',
    name: 'A7-SHOP NO7',
    code: 'A7',
    invPrefix: 'A7',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 7',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a8',
    name: 'A8-SHOP NO8',
    code: 'A8',
    invPrefix: 'A8',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 8',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-a9',
    name: 'A9-SHOP-KFK9',
    code: 'A9',
    invPrefix: 'A9',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 9',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-aa10',
    name: 'AA10SHOP NO-10',
    code: 'AA10',
    invPrefix: 'AA10',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 10',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-aa11',
    name: 'AA11-SHOP NO11',
    code: 'AA11',
    invPrefix: 'AA11',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 11',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-aa12',
    name: 'AA12-SHOP NO12',
    code: 'AA12',
    invPrefix: 'AA12',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 12',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-aa13',
    name: 'AA13-SHOP NO13',
    code: 'AA13',
    invPrefix: 'AA13',
    address: 'Commercial Avenue',
    city: 'Gombe',
    phone: '',
    email: '',
    manager: 'Shop Manager 13',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  },
  {
    id: 'branch-buro',
    name: 'Buro',
    code: 'BUR',
    invPrefix: 'BUR',
    address: 'Central Depot',
    city: 'Gombe',
    phone: '',
    email: 'buro@floweasy.com',
    manager: 'Buro Depot Manager',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: false
  }
];

export const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: 'user-admin',
    email: 'hr.rftcom@gmail.com',
    name: 'Easy Flow Administrator',
    role: 'admin',
    assignedBranchId: 'branch-a1',
    assignedBranchName: 'A1-SHOP NO1',
    status: 'active',
    addedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-kin',
    email: 'itkinshasa1@gmail.com',
    name: 'A1 Operations',
    role: 'creator',
    assignedBranchId: 'branch-a1',
    assignedBranchName: 'A1-SHOP NO1',
    status: 'active',
    addedAt: '2026-02-01T08:00:00Z'
  }
];

export const INITIAL_MASTER_ITEMS: MasterStockItem[] = [
  {
    id: 'm-1',
    itemCode: 'DS-K1T808MFWX',
    name: 'ACESS CONTROLR TERML-DS-K1T808MFWX',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 6,
      'buro': 6,
      'A1-SHOP NO1': 6,
      'a1-shop no1': 6,
      'KIn': 10,
      'kin': 10,
      'Gombe': 4,
      'gombe': 4
    },
    totalStock: 26
  },
  {
    id: 'm-2',
    itemCode: 'DS-K2602T',
    name: 'ACESS CONTROLR-2 DOOR-DS-K2602T',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 1,
      'buro': 1,
      'A1-SHOP NO1': 1,
      'a1-shop no1': 1,
      'KIn': 5,
      'kin': 5,
      'Gombe': 2,
      'gombe': 2
    },
    totalStock: 9
  },
  {
    id: 'm-3',
    itemCode: 'DS-KAS261',
    name: 'ACESS CONTROLR-DS-KAS261',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 7,
      'buro': 7,
      'A1-SHOP NO1': 7,
      'a1-shop no1': 7,
      'KIn': 12,
      'kin': 12,
      'Gombe': 8,
      'gombe': 8
    },
    totalStock: 34
  },
  {
    id: 'm-4',
    itemCode: 'DS-KAS808-STD',
    name: 'ACESS CONTROLR-DS-KAS808(O-STD)',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 2,
      'buro': 2,
      'A1-SHOP NO1': 2,
      'a1-shop no1': 2,
      'KIn': 8,
      'kin': 8,
      'Gombe': 3,
      'gombe': 3
    },
    totalStock: 15
  },
  {
    id: 'm-5',
    itemCode: 'ADP-12V',
    name: 'ADP AC TO DC-12V',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 27,
      'buro': 27,
      'A1-SHOP NO1': 27,
      'a1-shop no1': 27,
      'KIn': 45,
      'kin': 45,
      'Gombe': 30,
      'gombe': 30
    },
    totalStock: 129
  },
  {
    id: 'm-6',
    itemCode: 'CBL-CAT6-305M',
    name: 'CAT6 UTP NETWORK CABLE 305M',
    unit: 'Roll',
    branchStocks: {
      'Buro': 14,
      'buro': 14,
      'A1-SHOP NO1': 14,
      'a1-shop no1': 14,
      'KIn': 25,
      'kin': 25,
      'Gombe': 10,
      'gombe': 10
    },
    totalStock: 63
  },
  {
    id: 'm-7',
    itemCode: 'SW-POE-8P-GB',
    name: 'POE SWITCH 8 PORT GIGABIT',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 8,
      'buro': 8,
      'A1-SHOP NO1': 8,
      'a1-shop no1': 8,
      'KIn': 16,
      'kin': 16,
      'Gombe': 5,
      'gombe': 5
    },
    totalStock: 37
  },
  {
    id: 'm-8',
    itemCode: 'CAM-IP-4MP-DM',
    name: 'IP CAMERA 4MP DOME OUTDOOR',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 19,
      'buro': 19,
      'A1-SHOP NO1': 19,
      'a1-shop no1': 19,
      'KIn': 35,
      'kin': 35,
      'Gombe': 12,
      'gombe': 12
    },
    totalStock: 85
  },
  {
    id: 'm-9',
    itemCode: 'NVR-16CH-4K',
    name: 'NVR 16 CHANNEL 4K H.265+',
    unit: 'Unit',
    branchStocks: {
      'Buro': 4,
      'buro': 4,
      'A1-SHOP NO1': 4,
      'a1-shop no1': 4,
      'KIn': 9,
      'kin': 9,
      'Gombe': 3,
      'gombe': 3
    },
    totalStock: 20
  },
  {
    id: 'm-10',
    itemCode: 'LCK-MAG-280KG',
    name: 'MAGNETIC LOCK 280KG 600LBS',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 11,
      'buro': 11,
      'A1-SHOP NO1': 11,
      'a1-shop no1': 11,
      'KIn': 22,
      'kin': 22,
      'Gombe': 8,
      'gombe': 8
    },
    totalStock: 52
  },
  {
    id: 'm-11',
    itemCode: 'BTN-EXIT-NO-NC',
    name: 'STAINLESS STEEL EXIT BUTTON NO/NC',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 25,
      'buro': 25,
      'A1-SHOP NO1': 20,
      'a1-shop no1': 20,
      'KIn': 30,
      'kin': 30,
      'Gombe': 15,
      'gombe': 15
    },
    totalStock: 90
  },
  {
    id: 'm-12',
    itemCode: 'RDR-EM-RFID-125K',
    name: 'RFID CARD READER 125KHZ EM-ID',
    unit: 'Pcs',
    branchStocks: {
      'Buro': 15,
      'buro': 15,
      'A1-SHOP NO1': 12,
      'a1-shop no1': 12,
      'KIn': 18,
      'kin': 18,
      'Gombe': 9,
      'gombe': 9
    },
    totalStock: 54
  }
];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'item-1',
    itemCode: 'ITM-ELEC-001',
    name: 'Industrial Solar Inverter 5KVA 48V Hybrid',
    category: 'Solar & Energy',
    unit: 'Unit',
    unitCostFC: 2280000, // ~800 USD
    unitPriceFC: 2850000, // 1000 USD @ 2850
    branchStocks: {
      'branch-1': 18,
      'branch-2': 12,
      'branch-3': 7,
      'branch-4': 25
    },
    totalStock: 62,
    minAlertQty: 10,
    lastUpdated: '2026-09-01'
  },
  {
    id: 'item-2',
    itemCode: 'ITM-ELEC-002',
    name: 'Lithium LiFePO4 Battery Bank 48V 100Ah',
    category: 'Solar & Energy',
    unit: 'Pack',
    unitCostFC: 3420000, // ~1200 USD
    unitPriceFC: 4275000, // 1500 USD @ 2850
    branchStocks: {
      'branch-1': 24,
      'branch-2': 16,
      'branch-3': 9,
      'branch-4': 30
    },
    totalStock: 79,
    minAlertQty: 15,
    lastUpdated: '2026-09-02'
  },
  {
    id: 'item-3',
    itemCode: 'ITM-CAB-003',
    name: 'Heavy Duty Armoured Power Cable 4x16mm (100m Roll)',
    category: 'Cabling & Hardware',
    unit: 'Roll',
    unitCostFC: 997500, // ~350 USD
    unitPriceFC: 1368000, // 480 USD @ 2850
    branchStocks: {
      'branch-1': 35,
      'branch-2': 28,
      'branch-3': 14,
      'branch-4': 50
    },
    totalStock: 127,
    minAlertQty: 20,
    lastUpdated: '2026-09-03'
  },
  {
    id: 'item-4',
    itemCode: 'ITM-NET-004',
    name: 'Enterprise Dual-Band Wi-Fi 6 Access Point Pro',
    category: 'Networking & Telecom',
    unit: 'Pcs',
    unitCostFC: 427500, // ~150 USD
    unitPriceFC: 627000, // 220 USD @ 2850
    branchStocks: {
      'branch-1': 45,
      'branch-2': 30,
      'branch-3': 15,
      'branch-4': 60
    },
    totalStock: 150,
    minAlertQty: 25,
    lastUpdated: '2026-09-04'
  },
  {
    id: 'item-5',
    itemCode: 'ITM-SAF-005',
    name: 'Mining Safety High-Vis Helmet with Ear Defenders',
    category: 'Industrial Safety',
    unit: 'Pcs',
    unitCostFC: 85500, // ~30 USD
    unitPriceFC: 128250, // 45 USD @ 2850
    branchStocks: {
      'branch-1': 120,
      'branch-2': 210,
      'branch-3': 180,
      'branch-4': 95
    },
    totalStock: 605,
    minAlertQty: 100,
    lastUpdated: '2026-09-02'
  },
  {
    id: 'item-6',
    itemCode: 'ITM-HYD-006',
    name: 'Submersible Borehole Deep Water Pump 2.2KW',
    category: 'Hydraulics & Water',
    unit: 'Unit',
    unitCostFC: 1425000, // ~500 USD
    unitPriceFC: 1995000, // 700 USD @ 2850
    branchStocks: {
      'branch-1': 8,
      'branch-2': 14,
      'branch-3': 4,
      'branch-4': 18
    },
    totalStock: 44,
    minAlertQty: 8,
    lastUpdated: '2026-08-28'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNo: 'FAC-B01-2026-0142',
    type: 'facture',
    date: '2026-09-02',
    dueDate: '2026-09-16',
    branchId: 'branch-1',
    branchName: 'KIn',
    branchAddress: 'Av. du Commerce No. 142, Quartier Commercial, Gombe, Kinshasa',
    branchPhone: '+243 81 222 3344',
    branchEmail: 'kinshasa.central@rftcom-trading.com',
    customerName: 'CONGO TELECOM & INFRASTRUCTURE SA',
    customerTaxNo: 'CD-KIN-TVA-7740192-K',
    customerAddress: 'Boulevard du 30 Juin, Immeuble Future, Gombe, Kinshasa',
    customerPhone: '+243 82 999 1234',
    withTva: true,
    tvaRate: 16,
    exchangeRate: 2850,
    items: [
      {
        itemCode: 'ITM-ELEC-001',
        description: 'Industrial Solar Inverter 5KVA 48V Hybrid',
        quantity: 2,
        unit: 'Unit',
        unitPriceFC: 2850000,
        unitPriceUSD: 1000,
        totalFC: 5700000,
        totalUSD: 2000
      },
      {
        itemCode: 'ITM-ELEC-002',
        description: 'Lithium LiFePO4 Battery Bank 48V 100Ah',
        quantity: 2,
        unit: 'Pack',
        unitPriceFC: 4275000,
        unitPriceUSD: 1500,
        totalFC: 8550000,
        totalUSD: 3000
      }
    ],
    subtotalFC: 14250000,
    tvaAmountFC: 2280000,
    totalFC: 16530000,
    subtotalUSD: 5000,
    tvaAmountUSD: 800,
    totalUSD: 5800,
    notes: 'Payment by bank transfer within 14 days. Official tax receipt included.',
    createdByEmail: 'hr.rftcom@gmail.com',
    createdByName: 'Easy Flow Administrator',
    createdAt: '2026-09-02T14:10:00Z',
    status: 'Paid'
  },
  {
    id: 'inv-002',
    invoiceNo: 'PRO-B02-2026-0056',
    type: 'proforma',
    date: '2026-09-03',
    dueDate: '2026-09-17',
    branchId: 'branch-2',
    branchName: 'Lubumbashi Industrial Hub',
    branchAddress: 'Route Kipushi Km 4, Zone Industrielle, Lubumbashi, Haut-Katanga',
    branchPhone: '+243 97 111 8899',
    branchEmail: 'lubumbashi.hub@rftcom-trading.com',
    customerName: 'KATANGA MINING ENTERPRISE SARL',
    customerTaxNo: 'CD-LUB-TVA-4481023-M',
    customerAddress: 'Avenue Kasavubu No. 410, Lubumbashi',
    customerPhone: '+243 99 888 7766',
    withTva: true,
    tvaRate: 16,
    exchangeRate: 2850,
    items: [
      {
        itemCode: 'ITM-CAB-003',
        description: 'Heavy Duty Armoured Power Cable 4x16mm (100m Roll)',
        quantity: 5,
        unit: 'Roll',
        unitPriceFC: 1368000,
        unitPriceUSD: 480,
        totalFC: 6840000,
        totalUSD: 2400
      },
      {
        itemCode: 'ITM-SAF-005',
        description: 'Mining Safety High-Vis Helmet with Ear Defenders',
        quantity: 30,
        unit: 'Pcs',
        unitPriceFC: 128250,
        unitPriceUSD: 45,
        totalFC: 3847500,
        totalUSD: 1350
      }
    ],
    subtotalFC: 10687500,
    tvaAmountFC: 1710000,
    totalFC: 12397500,
    subtotalUSD: 3750,
    tvaAmountUSD: 600,
    totalUSD: 4350,
    notes: 'Proforma quotation valid for 30 calendar days.',
    createdByEmail: 'sarah.lub@rftcom.com',
    createdByName: 'Sarah Ilunga',
    createdAt: '2026-09-03T16:00:00Z',
    status: 'Pending'
  },
  {
    id: 'inv-003',
    invoiceNo: 'FAC-EXP-2026-0012',
    type: 'facture',
    date: '2026-09-04',
    branchId: 'branch-1',
    branchName: 'KIn',
    branchAddress: 'Av. du Commerce No. 142, Quartier Commercial, Gombe, Kinshasa',
    branchPhone: '+243 81 222 3344',
    branchEmail: 'kinshasa.central@rftcom-trading.com',
    customerName: 'CROSS-BORDER TRADING PARTNERS LTD',
    withTva: false, // WITHOUT TVA -> strictly USD value, no shop name/address/tax on print
    tvaRate: 0,
    exchangeRate: 2850,
    items: [
      {
        itemCode: 'ITM-NET-004',
        description: 'Enterprise Dual-Band Wi-Fi 6 Access Point Pro',
        quantity: 10,
        unit: 'Pcs',
        unitPriceFC: 627000,
        unitPriceUSD: 220,
        totalFC: 6270000,
        totalUSD: 2200
      }
    ],
    subtotalFC: 6270000,
    tvaAmountFC: 0,
    totalFC: 6270000,
    subtotalUSD: 2200,
    tvaAmountUSD: 0,
    totalUSD: 2200,
    notes: 'Export commercial invoice - tax exempt. Direct USD settlement.',
    createdByEmail: 'hr.rftcom@gmail.com',
    createdByName: 'Easy Flow Administrator',
    createdAt: '2026-09-04T08:30:00Z',
    status: 'Paid'
  }
];
