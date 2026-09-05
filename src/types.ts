export type UserRole = 'admin' | 'creator' | 'staff';

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedBranchId?: string;
  status: 'active' | 'inactive';
  addedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  manager?: string;
  isHeadquarters?: boolean;
}

export interface CompanyProfile {
  companyName: string;
  taxNumber: string; // NIF / VAT / TVA number (same across all branches)
  nationalId: string;
  rccm: string;
  defaultCurrency: 'FC' | 'USD';
  defaultExchangeRate: number; // e.g., 2850 FC per 1 USD
  defaultTvaRate: number; // e.g., 16%
  phone: string;
  email: string;
  website?: string;
  footerNotes?: string;
}

export interface StockItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  unitCostFC: number;
  unitPriceFC: number;
  branchStocks: Record<string, number>; // branchId -> quantity
  totalStock: number;
  minAlertQty: number;
  lastUpdated: string;
}

export interface TransferItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCostFC?: number;
  remarks?: string;
}

export interface StockTransfer {
  id: string;
  challanNo: string;
  date: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  items: TransferItem[];
  totalItems: number;
  totalQuantity: number;
  driverOrCarrier?: string;
  vehicleNumber?: string;
  remarks?: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
  status: 'Completed' | 'In Transit' | 'Cancelled';
}

export interface InvoiceItem {
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceFC: number;
  unitPriceUSD: number;
  totalFC: number;
  totalUSD: number;
}

export type InvoiceType = 'facture' | 'proforma';

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: InvoiceType;
  date: string;
  dueDate?: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchEmail: string;
  customerName: string;
  customerTaxNo?: string;
  customerAddress?: string;
  customerPhone?: string;
  withTva: boolean; // With TVA vs Without TVA
  tvaRate: number; // percentage, e.g. 16
  exchangeRate: number; // FC to 1 USD
  items: InvoiceItem[];
  subtotalFC: number;
  tvaAmountFC: number;
  totalFC: number;
  subtotalUSD: number;
  tvaAmountUSD: number;
  totalUSD: number;
  notes?: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
  status: 'Paid' | 'Pending' | 'Draft' | 'Cancelled';
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncError: string | null;
  autoSync: boolean;
  accessToken: string | null;
}

export interface ReportFilter {
  dateFrom: string;
  dateTo: string;
  fromBranchId: string;
  toBranchId: string;
  searchKeyword: string;
}

export interface InvoiceReportFilter {
  dateFrom: string;
  dateTo: string;
  branchId: string;
  type: 'all' | 'facture' | 'proforma';
  tvaStatus: 'all' | 'with_tva' | 'without_tva';
  searchKeyword: string;
}
