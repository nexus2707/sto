import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthorizedUser,
  Branch,
  CompanyProfile,
  GoogleSheetConfig,
  Invoice,
  StockItem,
  StockTransfer,
  UserRole
} from '../types';
import {
  INITIAL_AUTHORIZED_USERS,
  INITIAL_BRANCHES,
  INITIAL_COMPANY,
  INITIAL_INVOICES,
  INITIAL_STOCK_ITEMS,
  INITIAL_STOCK_TRANSFERS
} from '../data/mockData';
import {
  createGoogleSpreadsheet,
  fetchBranchesFromSheet,
  fetchStockMasterFromSheet,
  requestGoogleAccessToken,
  syncAllToGoogleSheet
} from '../services/googleSheets';

interface InventoryContextType {
  currentUser: AuthorizedUser;
  authorizedUsers: AuthorizedUser[];
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  company: CompanyProfile;
  stockItems: StockItem[];
  transfers: StockTransfer[];
  invoices: Invoice[];
  sheetConfig: GoogleSheetConfig;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  // Branch location gate
  isBranchConfirmed: boolean;
  confirmBranchSelection: (branchId: string) => void;
  resetBranchSelection: () => void;
  activeBranch: Branch | null;
  loadBranchesFromGoogleSheet: (sheetIdOrUrl?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  // Auth & Session
  isAuthenticated: boolean;
  loginWithEmail: (email: string) => { success: boolean; message?: string };
  signupWithEmail: (name: string, email: string, assignedBranchId: string, role?: UserRole) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (email: string) => void;
  addAuthorizedUser: (user: Omit<AuthorizedUser, 'id' | 'addedAt'>) => void;
  updateAuthorizedUser: (id: string, user: Partial<AuthorizedUser>) => void;
  removeAuthorizedUser: (id: string) => void;
  isEmailAuthorized: (email: string) => boolean;
  // Transfer Creator permissions check
  canAlterTransfer: (transfer: StockTransfer) => boolean;
  canDeleteTransfer: (transfer: StockTransfer) => boolean;
  // Transfer operations
  createTransfer: (data: Omit<StockTransfer, 'id' | 'challanNo' | 'createdByEmail' | 'createdByName' | 'createdAt'>) => StockTransfer;
  updateTransfer: (id: string, data: Partial<StockTransfer>) => { success: boolean; error?: string };
  deleteTransfer: (id: string) => { success: boolean; error?: string };
  // Invoicing operations
  createInvoice: (data: Omit<Invoice, 'id' | 'invoiceNo' | 'createdByEmail' | 'createdByName' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  // Stock operations
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => void;
  updateStockItem: (id: string, item: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  // Company & Branch settings
  updateCompany: (profile: Partial<CompanyProfile>) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  // Google Sheets sync
  setSheetConfig: React.Dispatch<React.SetStateAction<GoogleSheetConfig>>;
  connectGoogleSheet: (id: string) => Promise<void>;
  createAndConnectNewSheet: () => Promise<string>;
  syncWithGoogleSheet: () => Promise<void>;
  fetchStockMasterFromCloud: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEYS = {
  users: 'rft_inventory_users_v2',
  branches: 'floweasy_branches_v5',
  company: 'rft_inventory_company_v3',
  stock: 'rft_inventory_stock_v2',
  transfers: 'rft_inventory_transfers_v2',
  invoices: 'rft_inventory_invoices_v2',
  sheetConfig: 'rft_inventory_sheet_v2',
  currentUserEmail: 'rft_inventory_cur_email_v2',
  authStatus: 'rft_inventory_auth_status_v2',
  selectedBranch: 'floweasy_selected_branch_v5',
  branchConfirmed: 'floweasy_branch_confirmed_v5'
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or fall back to defaults
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    return saved ? JSON.parse(saved) : INITIAL_AUTHORIZED_USERS;
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.currentUserEmail);
    return saved || 'hr.rftcom@gmail.com';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedStatus = localStorage.getItem(STORAGE_KEYS.authStatus);
    const savedEmail = localStorage.getItem(STORAGE_KEYS.currentUserEmail) || 'hr.rftcom@gmail.com';
    const users = localStorage.getItem(STORAGE_KEYS.users);
    const parsedUsers: AuthorizedUser[] = users ? JSON.parse(users) : INITIAL_AUTHORIZED_USERS;
    const isAuth =
      savedEmail === 'hr.rftcom@gmail.com' ||
      parsedUsers.some(u => u.email.toLowerCase() === savedEmail.toLowerCase() && u.status === 'active');
    return savedStatus === 'false' ? false : isAuth;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.branches);
    if (saved) {
      try {
        const parsed: Branch[] = JSON.parse(saved);
        // Clean out any old mock data containing BRC / Brazzaville / Centre-Ville
        const hasOldDemoData = parsed.some(
          b => b.email?.includes('brazza.depot') || b.id === 'branch-brc' || b.address?.includes('Centre-Ville')
        );
        if (!hasOldDemoData && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_BRANCHES;
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.company);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.companyName || parsed.companyName.includes('RFT')) {
          parsed.companyName = 'Flow Easy';
        }
        return parsed;
      } catch {
        return INITIAL_COMPANY;
      }
    }
    return INITIAL_COMPANY;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.stock);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
  });

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.transfers);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.invoices);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.selectedBranch);
    return saved || 'branch-kin';
  });

  const [isBranchConfirmed, setIsBranchConfirmed] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.branchConfirmed);
    return saved === 'true';
  });

  const confirmBranchSelection = (branchId: string) => {
    setSelectedBranchId(branchId);
    setIsBranchConfirmed(true);
    localStorage.setItem(STORAGE_KEYS.selectedBranch, branchId);
    localStorage.setItem(STORAGE_KEYS.branchConfirmed, 'true');
  };

  const resetBranchSelection = () => {
    setIsBranchConfirmed(false);
    localStorage.setItem(STORAGE_KEYS.branchConfirmed, 'false');
  };

  const activeBranch: Branch | null =
    branches.find(b => b.id === selectedBranchId) || (branches.length > 0 ? branches[0] : null);

  const loadBranchesFromGoogleSheet = async (
    sheetIdOrUrl?: string
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const rawInput = (sheetIdOrUrl || sheetConfig.spreadsheetId || '').trim();
    if (!rawInput) {
      return { success: false, count: 0, error: 'No Google Spreadsheet link or data provided' };
    }

    // 1. Direct CSV / Table detection: if input has commas and email/newline
    if (rawInput.includes(',') && (rawInput.includes('@') || rawInput.includes('\n'))) {
      const lines = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
      const rows: Branch[] = [];
      lines.forEach((line, idx) => {
        const parts = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const email = parts[0] || '';
        const invPrefix = parts[1] || '';
        const locationName = parts[2] || '';
        const address = parts[3] || '';
        const rccm = parts[4] || '';
        const impot = parts[5] || '';
        const idNat = parts[6] || '';

        // Skip header
        if (
          email.toLowerCase().includes('email') ||
          invPrefix.toLowerCase().includes('prefix') ||
          locationName.toLowerCase().includes('location') ||
          rccm.toLowerCase() === 'rccm'
        ) {
          return;
        }

        if (!locationName && !email && !invPrefix) return;

        const safeName = locationName || (email ? email.split('@')[0] : `Branch ${idx + 1}`);
        const safeCode = invPrefix || safeName.toUpperCase().slice(0, 4);
        const safeId = `branch-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-') || idx + 1}`;

        rows.push({
          id: safeId,
          name: safeName,
          code: safeCode,
          invPrefix: invPrefix || safeCode,
          address: address || '',
          city: locationName || '',
          phone: '',
          email: email || '',
          rccm: rccm || '',
          impot: impot || '',
          idNat: idNat || '',
          isHeadquarters: idx === 0
        });
      });

      if (rows.length > 0) {
        setBranches(rows);
        localStorage.setItem(STORAGE_KEYS.branches, JSON.stringify(rows));
        setSelectedBranchId(rows[0].id);
        return { success: true, count: rows.length };
      }
    }

    // 2. Google Sheets API / GVIZ fetch
    const urlMatch = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : rawInput;

    try {
      const fetched = await fetchBranchesFromSheet(cleanId, sheetConfig.accessToken);
      if (fetched && fetched.length > 0) {
        setBranches(fetched);
        localStorage.setItem(STORAGE_KEYS.branches, JSON.stringify(fetched));
        if (!fetched.some(b => b.id === selectedBranchId)) {
          setSelectedBranchId(fetched[0].id);
        }
        // Save sheet config
        setSheetConfig(prev => ({
          ...prev,
          spreadsheetId: cleanId,
          spreadsheetUrl: rawInput.startsWith('http') ? rawInput : `https://docs.google.com/spreadsheets/d/${cleanId}`,
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString()
        }));
        return { success: true, count: fetched.length };
      } else {
        return { success: false, count: 0, error: 'No non-empty branch records found in "branch name" tab' };
      }
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Failed to fetch branches from sheet' };
    }
  };

  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sheetConfig);
    return saved
      ? JSON.parse(saved)
      : {
          spreadsheetId: '',
          spreadsheetUrl: '',
          isConnected: false,
          lastSyncTime: null,
          syncStatus: 'idle',
          syncError: null,
          autoSync: true,
          accessToken: null
        };
  });

  // Current user derived from email
  const currentUser: AuthorizedUser = authorizedUsers.find(
    u => u.email.toLowerCase() === currentUserEmail.toLowerCase() && u.status === 'active'
  ) || {
    id: 'user-admin',
    email: currentUserEmail,
    name: currentUserEmail.split('@')[0] || 'Authorized User',
    role: currentUserEmail.toLowerCase() === 'hr.rftcom@gmail.com' ? 'admin' : 'staff',
    assignedBranchId: 'branch-1',
    status: 'active',
    addedAt: new Date().toISOString()
  };

  // Sync state to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentUserEmail, currentUserEmail);
  }, [currentUserEmail]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.branches, JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stock, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transfers, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sheetConfig, JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  // Auth helper
  const isEmailAuthorized = (email: string) => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (clean === 'hr.rftcom@gmail.com') return true;
    return authorizedUsers.some(u => u.email.toLowerCase() === clean && u.status === 'active');
  };

  const loginWithEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!isEmailAuthorized(clean)) {
      return {
        success: false,
        message: `Email "${email}" is not in the list of authorized users. Please contact the administrator (hr.rftcom@gmail.com) for authorization.`
      };
    }
    setCurrentUserEmail(clean);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.authStatus, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUserEmail, clean);
    return { success: true };
  };

  const signupWithEmail = (
    name: string,
    email: string,
    assignedBranchId: string,
    role: UserRole = 'creator'
  ) => {
    const clean = email.trim().toLowerCase();

    // STRICT USER REQUIREMENT:
    // "The system should verify the user's email against a list of authorized users before allowing access to the web application."
    const existingIndex = authorizedUsers.findIndex(u => u.email.toLowerCase() === clean);
    const isPreAuthorized = isEmailAuthorized(clean);

    if (!isPreAuthorized && existingIndex === -1) {
      return {
        success: false,
        message: `Authorization Verification Failed: The email "${email}" is not in the authorized users list. Access to this inventory portal is restricted to pre-authorized personnel. Please contact hr.rftcom@gmail.com.`
      };
    }

    if (existingIndex >= 0) {
      // User is in authorized list: activate and update name/branch
      setAuthorizedUsers(prev =>
        prev.map((u, i) =>
          i === existingIndex
            ? {
                ...u,
                name: name.trim() || u.name,
                assignedBranchId: assignedBranchId || u.assignedBranchId,
                role: role || u.role,
                status: 'active'
              }
            : u
        )
      );
    } else {
      // Pre-authorized administrator or whitelisted domain
      const newUser: AuthorizedUser = {
        id: `usr-${Date.now()}`,
        email: clean,
        name: name.trim(),
        role,
        assignedBranchId,
        status: 'active',
        addedAt: new Date().toISOString()
      };
      setAuthorizedUsers(prev => [...prev, newUser]);
    }

    setCurrentUserEmail(clean);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.authStatus, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUserEmail, clean);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsBranchConfirmed(false);
    localStorage.setItem(STORAGE_KEYS.authStatus, 'false');
    localStorage.setItem(STORAGE_KEYS.branchConfirmed, 'false');
  };

  const switchUser = (email: string) => {
    const clean = email.trim().toLowerCase();
    setCurrentUserEmail(clean);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.authStatus, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUserEmail, clean);
  };

  const addAuthorizedUser = (user: Omit<AuthorizedUser, 'id' | 'addedAt'>) => {
    const newUser: AuthorizedUser = {
      ...user,
      id: `usr-${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    setAuthorizedUsers(prev => [...prev, newUser]);
  };

  const updateAuthorizedUser = (id: string, updates: Partial<AuthorizedUser>) => {
    setAuthorizedUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  };

  const removeAuthorizedUser = (id: string) => {
    setAuthorizedUsers(prev => prev.filter(u => u.id !== id));
  };

  // STRICT USER REQUIREMENT:
  // "in stock transfer give option for alter and delete only for who is the creator of entry
  // so need each user email authorization when only auth email id user can use this webapp and make entry but cannot use my google sheet"
  const canAlterTransfer = (transfer: StockTransfer) => {
    if (currentUser.role === 'admin') return true;
    return transfer.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();
  };

  const canDeleteTransfer = (transfer: StockTransfer) => {
    if (currentUser.role === 'admin') return true;
    return transfer.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();
  };

  // Transfer creation
  const createTransfer = (data: Omit<StockTransfer, 'id' | 'challanNo' | 'createdByEmail' | 'createdByName' | 'createdAt'>) => {
    const fromBranch = branches.find(b => b.id === data.fromBranchId);
    const branchCode = fromBranch ? fromBranch.code.split('-')[0] : 'BR';
    const year = new Date().getFullYear();
    const count = transfers.length + 1;
    const challanNo = `CHL-${branchCode}-${year}-${String(count).padStart(4, '0')}`;

    const newTransfer: StockTransfer = {
      ...data,
      id: `trf-${Date.now()}`,
      challanNo,
      createdByEmail: currentUser.email,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    // Deduct stock from source and add to destination
    setStockItems(prev =>
      prev.map(item => {
        const transferItem = data.items.find(ti => ti.itemCode === item.itemCode);
        if (!transferItem) return item;

        const currentFromStock = item.branchStocks[data.fromBranchId] || 0;
        const currentToStock = item.branchStocks[data.toBranchId] || 0;
        const updatedBranchStocks = {
          ...item.branchStocks,
          [data.fromBranchId]: Math.max(0, currentFromStock - transferItem.quantity),
          [data.toBranchId]: currentToStock + transferItem.quantity
        };

        const totalStock = Object.values(updatedBranchStocks).reduce((a: number, b: any) => a + Number(b || 0), 0);

        return {
          ...item,
          branchStocks: updatedBranchStocks,
          totalStock,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      })
    );

    setTransfers(prev => [newTransfer, ...prev]);
    return newTransfer;
  };

  const updateTransfer = (id: string, updates: Partial<StockTransfer>) => {
    const existing = transfers.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Transfer not found.' };

    if (!canAlterTransfer(existing)) {
      return {
        success: false,
        error: `Permission Denied: Only the creator of this entry (${existing.createdByEmail}) is authorized to alter this stock transfer.`
      };
    }

    setTransfers(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    return { success: true };
  };

  const deleteTransfer = (id: string) => {
    const existing = transfers.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Transfer not found.' };

    if (!canDeleteTransfer(existing)) {
      return {
        success: false,
        error: `Permission Denied: Only the creator of this entry (${existing.createdByEmail}) is authorized to delete this stock transfer.`
      };
    }

    // Restore stock back
    setStockItems(prev =>
      prev.map(item => {
        const transferItem = existing.items.find(ti => ti.itemCode === item.itemCode);
        if (!transferItem) return item;

        const currentFromStock = item.branchStocks[existing.fromBranchId] || 0;
        const currentToStock = item.branchStocks[existing.toBranchId] || 0;

        const updatedBranchStocks = {
          ...item.branchStocks,
          [existing.fromBranchId]: currentFromStock + transferItem.quantity,
          [existing.toBranchId]: Math.max(0, currentToStock - transferItem.quantity)
        };
        const totalStock = Object.values(updatedBranchStocks).reduce((a: number, b: any) => a + Number(b || 0), 0);

        return {
          ...item,
          branchStocks: updatedBranchStocks,
          totalStock
        };
      })
    );

    setTransfers(prev => prev.filter(t => t.id !== id));
    return { success: true };
  };

  // Invoice creation
  const createInvoice = (data: Omit<Invoice, 'id' | 'invoiceNo' | 'createdByEmail' | 'createdByName' | 'createdAt'>) => {
    const branch = branches.find(b => b.id === data.branchId);
    const branchPrefix = branch?.invPrefix || (branch ? branch.code.split('-')[0] : 'INV');
    const prefix = data.type === 'facture' ? 'FAC' : 'PRO';
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.type === data.type).length + 1;
    const invoiceNo = `${branchPrefix}-${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNo,
      createdByEmail: currentUser.email,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    // Deduct stock for sold items from the branch
    if (data.type === 'facture') {
      setStockItems(prev =>
        prev.map(item => {
          const invItem = data.items.find(ii => ii.itemCode === item.itemCode);
          if (!invItem) return item;

          const currentStock = item.branchStocks[data.branchId] || 0;
          const updatedBranchStocks = {
            ...item.branchStocks,
            [data.branchId]: Math.max(0, currentStock - invItem.quantity)
          };
          const totalStock = Object.values(updatedBranchStocks).reduce((a: number, b: any) => a + Number(b || 0), 0);

          return {
            ...item,
            branchStocks: updatedBranchStocks,
            totalStock,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        })
      );
    }

    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv)));
  };

  const deleteInvoice = (id: string) => {
    const existing = invoices.find(i => i.id === id);
    if (!existing) return;

    // Restore stock if it was a facture invoice
    if (existing.type === 'facture') {
      setStockItems(prev =>
        prev.map(item => {
          const invItem = existing.items.find(ii => ii.itemCode === item.itemCode);
          if (!invItem) return item;

          const currentStock = item.branchStocks[existing.branchId] || 0;
          const updatedBranchStocks = {
            ...item.branchStocks,
            [existing.branchId]: currentStock + invItem.quantity
          };
          const totalStock = Object.values(updatedBranchStocks).reduce((a: number, b: any) => a + Number(b || 0), 0);

          return {
            ...item,
            branchStocks: updatedBranchStocks,
            totalStock
          };
        })
      );
    }

    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  // Stock operations
  const addStockItem = (item: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const newItem: StockItem = {
      ...item,
      id: `itm-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setStockItems(prev => [newItem, ...prev]);
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const updated = { ...i, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
        if (updates.branchStocks) {
          updated.totalStock = Object.values(updates.branchStocks).reduce((a, b) => a + b, 0);
        }
        return updated;
      })
    );
  };

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(i => i.id !== id));
  };

  // Company & Branches
  const updateCompany = (updates: Partial<CompanyProfile>) => {
    setCompany(prev => ({ ...prev, ...updates }));
  };

  const addBranch = (branch: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branch,
      id: `branch-${Date.now()}`
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  // Google Sheets Cloud Sync Engine
  const connectGoogleSheet = async (id: string) => {
    setSheetConfig(prev => ({ ...prev, syncStatus: 'syncing', syncError: null }));
    try {
      const token = await requestGoogleAccessToken();
      setSheetConfig(prev => ({
        ...prev,
        spreadsheetId: id,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        isConnected: true,
        accessToken: token,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleTimeString()
      }));

      // Initial push of data
      await syncAllToGoogleSheet(token, id, {
        stockItems,
        transfers,
        invoices,
        users: authorizedUsers,
        branches
      });
    } catch (err: any) {
      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        syncError: err.message || 'Failed to connect Google Sheet'
      }));
      throw err;
    }
  };

  const createAndConnectNewSheet = async (): Promise<string> => {
    setSheetConfig(prev => ({ ...prev, syncStatus: 'syncing', syncError: null }));
    try {
      const token = await requestGoogleAccessToken();
      const sheet = await createGoogleSpreadsheet(token, `${company.companyName} - Inventory & Invoicing Master`);
      setSheetConfig({
        spreadsheetId: sheet.spreadsheetId,
        spreadsheetUrl: sheet.spreadsheetUrl,
        isConnected: true,
        accessToken: token,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleTimeString(),
        syncError: null,
        autoSync: true
      });

      // Populate sheet with current data
      await syncAllToGoogleSheet(token, sheet.spreadsheetId, {
        stockItems,
        transfers,
        invoices,
        users: authorizedUsers,
        branches
      });

      return sheet.spreadsheetUrl;
    } catch (err: any) {
      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        syncError: err.message || 'Failed to auto-create Google Sheet'
      }));
      throw err;
    }
  };

  const syncWithGoogleSheet = async () => {
    if (!sheetConfig.spreadsheetId) return;
    setSheetConfig(prev => ({ ...prev, syncStatus: 'syncing', syncError: null }));

    try {
      let token = sheetConfig.accessToken;
      if (!token) {
        token = await requestGoogleAccessToken();
      }

      await syncAllToGoogleSheet(token, sheetConfig.spreadsheetId, {
        stockItems,
        transfers,
        invoices,
        users: authorizedUsers,
        branches
      });

      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleTimeString(),
        accessToken: token,
        syncError: null
      }));
    } catch (err: any) {
      console.error('Google Sheets sync error:', err);
      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        syncError: err.message || 'Sync failed'
      }));
    }
  };

  const fetchStockMasterFromCloud = async () => {
    if (!sheetConfig.spreadsheetId) return;
    setSheetConfig(prev => ({ ...prev, syncStatus: 'syncing', syncError: null }));

    try {
      let token = sheetConfig.accessToken;
      if (!token) {
        token = await requestGoogleAccessToken();
      }

      const items = await fetchStockMasterFromSheet(token, sheetConfig.spreadsheetId);
      if (items.length > 0) {
        setStockItems(items);
      }
      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleTimeString(),
        accessToken: token,
        syncError: null
      }));
    } catch (err: any) {
      console.error('Fetch Stock Master error:', err);
      setSheetConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        syncError: err.message || 'Failed to fetch Stock Master from Sheet'
      }));
      throw err;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        authorizedUsers,
        branches,
        setBranches,
        company,
        stockItems,
        transfers,
        invoices,
        sheetConfig,
        selectedBranchId,
        setSelectedBranchId,
        isBranchConfirmed,
        confirmBranchSelection,
        resetBranchSelection,
        activeBranch,
        loadBranchesFromGoogleSheet,
        isAuthenticated,
        loginWithEmail,
        signupWithEmail,
        logout,
        switchUser,
        addAuthorizedUser,
        updateAuthorizedUser,
        removeAuthorizedUser,
        isEmailAuthorized,
        canAlterTransfer,
        canDeleteTransfer,
        createTransfer,
        updateTransfer,
        deleteTransfer,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        updateCompany,
        addBranch,
        updateBranch,
        setSheetConfig,
        connectGoogleSheet,
        createAndConnectNewSheet,
        syncWithGoogleSheet,
        fetchStockMasterFromCloud
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
