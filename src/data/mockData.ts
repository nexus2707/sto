import { Branch, CompanyProfile, StockItem, StockTransfer, Invoice, AuthorizedUser } from '../types';

export const INITIAL_COMPANY: CompanyProfile = {
  companyName: 'Flow Easy',
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
    id: 'branch-kin',
    name: 'KIn',
    code: 'KIN',
    invPrefix: 'Test',
    address: 'Gombe',
    city: 'Kinshasa',
    phone: '',
    email: 'itkinshasa1@gmail.com',
    manager: '',
    rccm: '123test',
    impot: '123test',
    idNat: '123test',
    isHeadquarters: true
  }
];

export const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: 'user-1',
    email: 'hr.rftcom@gmail.com',
    name: 'Flow Easy Administrator',
    role: 'admin',
    assignedBranchId: 'branch-1',
    status: 'active',
    addedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-2',
    email: 'manager.kin@rftcom.com',
    name: 'Michel Kabongo (Kinshasa Manager)',
    role: 'creator',
    assignedBranchId: 'branch-1',
    status: 'active',
    addedAt: '2026-01-15T09:30:00Z'
  },
  {
    id: 'user-3',
    email: 'sarah.lub@rftcom.com',
    name: 'Sarah Ilunga (Lubumbashi Lead)',
    role: 'creator',
    assignedBranchId: 'branch-2',
    status: 'active',
    addedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'user-4',
    email: 'warehouse.clerk@rftcom.com',
    name: 'Antoine Mwamba (Warehouse Clerk)',
    role: 'staff',
    assignedBranchId: 'branch-1',
    status: 'active',
    addedAt: '2026-02-01T14:15:00Z'
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

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [
  {
    id: 'trf-001',
    challanNo: 'CHL-B01-2026-0081',
    date: '2026-09-01',
    fromBranchId: 'branch-1',
    fromBranchName: 'Kinshasa Central Depot & Showroom',
    toBranchId: 'branch-2',
    toBranchName: 'Lubumbashi Industrial Hub',
    items: [
      {
        itemCode: 'ITM-ELEC-001',
        itemName: 'Industrial Solar Inverter 5KVA 48V Hybrid',
        quantity: 4,
        unit: 'Unit',
        unitCostFC: 2280000,
        remarks: 'Priority replenishment for mining client order'
      },
      {
        itemCode: 'ITM-CAB-003',
        itemName: 'Heavy Duty Armoured Power Cable 4x16mm (100m Roll)',
        quantity: 10,
        unit: 'Roll',
        unitCostFC: 997500,
        remarks: 'Direct warehouse transfer'
      }
    ],
    totalItems: 2,
    totalQuantity: 14,
    driverOrCarrier: 'Trans-Katanga Express (Driver: Patrick)',
    vehicleNumber: 'KN-8472-BG',
    remarks: 'Approved by Logistics Director. Urgent dispatch.',
    createdByEmail: 'hr.rftcom@gmail.com',
    createdByName: 'Flow Easy Administrator',
    createdAt: '2026-09-01T10:30:00Z',
    status: 'Completed'
  },
  {
    id: 'trf-002',
    challanNo: 'CHL-B04-2026-0044',
    date: '2026-09-02',
    fromBranchId: 'branch-4',
    fromBranchName: 'Matadi Port Transit Warehouse',
    toBranchId: 'branch-1',
    toBranchName: 'Kinshasa Central Depot & Showroom',
    items: [
      {
        itemCode: 'ITM-ELEC-002',
        itemName: 'Lithium LiFePO4 Battery Bank 48V 100Ah',
        quantity: 12,
        unit: 'Pack',
        unitCostFC: 3420000,
        remarks: 'Customs cleared container arrival'
      }
    ],
    totalItems: 1,
    totalQuantity: 12,
    driverOrCarrier: 'Matadi Logistics Fleet 03 (Driver: Joseph)',
    vehicleNumber: 'KC-1209-AB',
    remarks: 'Port shipment reception transfer to Kinshasa central store.',
    createdByEmail: 'manager.kin@rftcom.com',
    createdByName: 'Michel Kabongo',
    createdAt: '2026-09-02T15:45:00Z',
    status: 'Completed'
  },
  {
    id: 'trf-003',
    challanNo: 'CHL-B02-2026-0019',
    date: '2026-09-03',
    fromBranchId: 'branch-2',
    fromBranchName: 'Lubumbashi Industrial Hub',
    toBranchId: 'branch-3',
    toBranchName: 'Kolwezi Mining Logistics Branch',
    items: [
      {
        itemCode: 'ITM-SAF-005',
        itemName: 'Mining Safety High-Vis Helmet with Ear Defenders',
        quantity: 50,
        unit: 'Pcs',
        unitCostFC: 85500,
        remarks: 'Stock transfer for Kolwezi open pit contract'
      },
      {
        itemCode: 'ITM-HYD-006',
        itemName: 'Submersible Borehole Deep Water Pump 2.2KW',
        quantity: 2,
        unit: 'Unit',
        unitCostFC: 1425000,
        remarks: 'Urgent pumping installation'
      }
    ],
    totalItems: 2,
    totalQuantity: 52,
    driverOrCarrier: 'Lualaba Fast Freight',
    vehicleNumber: 'HK-9941-CD',
    remarks: 'Stock transfer to Kolwezi regional hub',
    createdByEmail: 'sarah.lub@rftcom.com',
    createdByName: 'Sarah Ilunga',
    createdAt: '2026-09-03T11:20:00Z',
    status: 'In Transit'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNo: 'FAC-B01-2026-0142',
    type: 'facture',
    date: '2026-09-02',
    dueDate: '2026-09-16',
    branchId: 'branch-1',
    branchName: 'Kinshasa Central Depot & Showroom',
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
    createdByName: 'Flow Easy Administrator',
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
    branchName: 'Kinshasa Central Depot & Showroom',
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
    createdByName: 'Flow Easy Administrator',
    createdAt: '2026-09-04T08:30:00Z',
    status: 'Paid'
  }
];
