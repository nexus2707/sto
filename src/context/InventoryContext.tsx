import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthorizedUser,
  Branch,
  CompanyProfile,
  GoogleSheetConfig,
  Invoice,
  StockItem,
  StockTransfer,
  UserRole,
  MasterStockItem
} from '../types';
import {
  INITIAL_AUTHORIZED_USERS,
  INITIAL_BRANCHES,
  INITIAL_COMPANY,
  INITIAL_INVOICES,
  INITIAL_STOCK_ITEMS,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_MASTER_ITEMS
} from '../data/mockData';
import {
  createGoogleSpreadsheet,
  fetchBranchesFromSheet,
  fetchStockMasterFromSheet,
  fetchAuthorizedUsersFromSheet,
  appendAuthorizedUserToSheet,
  appendTransferToBuroSheet,
  appendTransferToClubSheet,
  saveTransferToGoogleSheets,
  deleteTransferFromGoogleSheet,
  fetchTransfersFromGoogleSheet,
  requestGoogleAccessToken,
  syncAllToGoogleSheet,
  fetchMasterDataFromSheet,
  getStoredAccessToken
} from '../services/googleSheets';

interface InventoryContextType {
  currentUser: AuthorizedUser;
  isAdmin: boolean;
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
  masterItems: MasterStockItem[];
  loadMasterDataFromGoogleSheet: (sheetIdOrUrl?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  loadBranchesFromGoogleSheet: (sheetIdOrUrl?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  loadAuthorizedUsersFromGoogleSheet: (sheetIdOrUrl?: string) => Promise<{ success: boolean; count: number; users: string[]; error?: string }>;
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
  createTransfer: (data: Omit<StockTransfer, 'id' | 'createdByEmail' | 'createdByName' | 'createdAt'> & { challanNo?: string }, tokenOverride?: string) => StockTransfer;
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
  // Sheet Syncing (buro & club)
  syncedTransferIds: string[];
  isTransferSyncedToSheet: (transferId: string) => boolean;
  syncTransferToSheets: (transfer: StockTransfer, tokenOverride?: string) => Promise<{ success: boolean; unauthorized?: boolean; error?: string }>;
  syncTransferToBuro: (transfer: StockTransfer, tokenOverride?: string) => Promise<{ success: boolean; unauthorized?: boolean; error?: string }>;
  syncTransfersFromSheet: (sheetIdOrUrl?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  authorizeGoogleAndSyncAll: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;
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
    branchConfirmed: 'floweasy_branch_confirmed_v5',
    sheetId: 'floweasy_saved_sheet_id_v2',
    masterItems: 'floweasy_master_items_v1',
    syncedTransfers: 'floweasy_synced_transfers_v1'
  };

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track transfers synced to Google Sheet tab "buro"
  const [syncedTransferIds, setSyncedTransferIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('floweasy_synced_transfers_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load initial states from LocalStorage or fall back to defaults
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    let list: AuthorizedUser[] = saved ? JSON.parse(saved) : INITIAL_AUTHORIZED_USERS;

    // Enforce that only hr.rftcom@gmail.com can ever have admin role
    list = list.map(u => ({
      ...u,
      role: u.email.toLowerCase() === 'hr.rftcom@gmail.com' ? 'admin' : (u.role === 'admin' ? 'creator' : u.role)
    }));

    // Ensure hr.rftcom@gmail.com is always present
    if (!list.some(u => u.email.toLowerCase() === 'hr.rftcom@gmail.com')) {
      list.unshift({
        id: 'user-admin',
        email: 'hr.rftcom@gmail.com',
        name: 'Easy Flow Administrator',
        role: 'admin',
        assignedBranchId: 'branch-kin',
        status: 'active',
        addedAt: new Date().toISOString()
      });
    }

    return list;
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
        parsed.companyName = 'Easy Flow';
        parsed.taxNumber = 'CD-KIN-TVA-00984218-A';
        parsed.taxId = 'CD-KIN-TVA-00984218-A';
        parsed.rccm = 'CD/KIN/RCCM/20-B-08412';
        parsed.nationalId = '01-83-N45209P';
        parsed.email = 'contact@rftcom-trading.com';
        parsed.phone = '+243 81 000 9876 / +243 99 555 4321';
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
    if (saved) {
      try {
        const parsed: StockTransfer[] = JSON.parse(saved);
        return parsed.filter(
          t => !t.id?.startsWith('trf-001') && !t.id?.startsWith('trf-002') && !t.id?.startsWith('trf-003')
        );
      } catch {
        return [];
      }
    }
    return [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.invoices);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.selectedBranch);
    return saved || 'branch-kin';
  });

  const [masterItems, setMasterItems] = useState<MasterStockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.masterItems);
    return saved ? JSON.parse(saved) : INITIAL_MASTER_ITEMS;
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
    // Only the administrator (hr.rftcom@gmail.com) is permitted to switch branches
    if (currentUserEmail.toLowerCase().trim() !== 'hr.rftcom@gmail.com') {
      return;
    }
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
        // Column B (parts[1]) is strictly Location Name; Column A (parts[0]) is prefix/code/city
        const colA = parts[0] || '';
        const locationName = parts[1] || parts[2] || '';

        // Ignore empty location names
        if (!locationName) return;

        // Skip header row
        if (
          locationName.toLowerCase().includes('location') ||
          locationName.toLowerCase().includes('branch name') ||
          (idx === 0 && colA.toLowerCase().includes('kinshasa'))
        ) {
          return;
        }

        const safeName = locationName;
        const safeCode = colA || safeName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
        const safeId = `branch-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        rows.push({
          id: safeId,
          name: safeName,
          code: safeCode,
          invPrefix: safeCode,
          address: 'Commercial Avenue',
          city: 'Gombe',
          phone: '',
          email: safeName === 'A1-SHOP NO1' ? 'itkinshasa1@gmail.com' : (colA.includes('@') ? colA : ''),
          rccm: '123test',
          impot: '123test',
          idNat: '123test',
          isHeadquarters: safeName === 'A1-SHOP NO1' || idx === 0
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
        // Save sheet config and remembered ID
        setSheetConfig(prev => ({
          ...prev,
          spreadsheetId: cleanId,
          spreadsheetUrl: rawInput.startsWith('http') ? rawInput : `https://docs.google.com/spreadsheets/d/${cleanId}`,
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString()
        }));
        localStorage.setItem(STORAGE_KEYS.sheetId, cleanId);

        // Auto-authorize any branch email found (e.g. itkinshasa1@gmail.com)
        fetched.forEach(b => {
          if (b.email && b.email.includes('@')) {
            const clean = b.email.toLowerCase().trim();
            setAuthorizedUsers(prev => {
              if (!prev.some(u => u.email.toLowerCase() === clean)) {
                const isTargetAdmin = clean === 'hr.rftcom@gmail.com';
                const nextList = [
                  ...prev,
                  {
                    id: `usr-${clean.replace(/[^a-z0-9]/g, '-')}`,
                    email: clean,
                    name: isTargetAdmin ? 'Easy Flow Administrator' : (b.name || clean.split('@')[0]),
                    role: isTargetAdmin ? 'admin' : 'creator' as UserRole,
                    assignedBranchId: b.id,
                    status: 'active' as const,
                    addedAt: new Date().toISOString()
                  }
                ];
                localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(nextList));
                return nextList;
              }
              return prev;
            });
          }
        });

        // Also auto-fetch authorized users from tab "address" Column A
        loadAuthorizedUsersFromGoogleSheet(cleanId).catch(() => {});

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
    const parsed = saved ? JSON.parse(saved) : null;
    const cachedToken = getStoredAccessToken();
    const savedSheetId = localStorage.getItem(STORAGE_KEYS.sheetId) || '';

    return {
      spreadsheetId: parsed?.spreadsheetId || savedSheetId,
      spreadsheetUrl: parsed?.spreadsheetUrl || (savedSheetId ? `https://docs.google.com/spreadsheets/d/${savedSheetId}/edit` : ''),
      isConnected: Boolean(parsed?.isConnected || savedSheetId),
      lastSyncTime: parsed?.lastSyncTime || null,
      syncStatus: parsed?.syncStatus || 'idle',
      syncError: null,
      autoSync: true,
      accessToken: parsed?.accessToken || cachedToken || null
    };
  });

  // Current user derived from email: strictly enforce hr.rftcom@gmail.com as sole admin
  const isAdmin = currentUserEmail.toLowerCase().trim() === 'hr.rftcom@gmail.com';

  const currentUser: AuthorizedUser = (() => {
    const clean = currentUserEmail.toLowerCase().trim();
    const isUserAdmin = clean === 'hr.rftcom@gmail.com';
    let branchForUser = branches.find(
      b => b.email && b.email.trim().toLowerCase() === clean
    );
    // User Requirement: if user login as itkinshasa1@gmail.com, predefined location is "A1-SHOP NO1"
    if (clean === 'itkinshasa1@gmail.com') {
      const a1Branch = branches.find(b => b.name === 'A1-SHOP NO1');
      if (a1Branch) branchForUser = a1Branch;
    }

    const defaultBranch = branches.find(b => b.name === 'A1-SHOP NO1') || branches[0];
    const userBranchName = clean === 'itkinshasa1@gmail.com'
      ? 'A1-SHOP NO1'
      : (branchForUser?.name || defaultBranch?.name || 'A1-SHOP NO1');
    const userBranchId = branchForUser?.id || defaultBranch?.id || 'branch-a1';

    const found = authorizedUsers.find(
      u => u.email.toLowerCase() === clean && u.status === 'active'
    );
    if (found) {
      return {
        ...found,
        assignedBranchId: userBranchId,
        assignedBranchName: userBranchName,
        // STRICT ENFORCEMENT: ONLY hr.rftcom@gmail.com can ever have 'admin' role
        role: isUserAdmin ? 'admin' : (found.role === 'admin' ? 'creator' : found.role)
      };
    }
    return {
      id: isUserAdmin ? 'user-admin' : `usr-${Date.now()}`,
      email: clean,
      name: isUserAdmin ? 'Easy Flow Administrator' : (clean === 'itkinshasa1@gmail.com' ? 'A1 Operations' : (clean.split('@')[0] || 'Authorized User')),
      role: isUserAdmin ? 'admin' : 'creator',
      assignedBranchId: userBranchId,
      assignedBranchName: userBranchName,
      status: 'active',
      addedAt: new Date().toISOString()
    };
  })();

  // Load authorized users from Google Sheet tab "address" Column A
  const loadAuthorizedUsersFromGoogleSheet = async (
    sheetIdOrUrl?: string
  ): Promise<{ success: boolean; count: number; users: string[]; error?: string }> => {
    const rawInput = (
      sheetIdOrUrl ||
      sheetConfig.spreadsheetId ||
      localStorage.getItem(STORAGE_KEYS.sheetId) ||
      ''
    ).trim();

    if (!rawInput) {
      return { success: false, count: 0, users: [], error: 'No Google Sheet link or ID provided.' };
    }

    const urlMatch = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : rawInput;

    try {
      const emails = await fetchAuthorizedUsersFromSheet(cleanId, sheetConfig.accessToken);
      if (emails && emails.length > 0) {
        setAuthorizedUsers(prev => {
          const map = new Map<string, AuthorizedUser>(prev.map(u => [u.email.toLowerCase(), u]));

          emails.forEach(email => {
            const clean = email.toLowerCase().trim();
            if (!clean) return;
            const isTargetAdmin = clean === 'hr.rftcom@gmail.com';
            if (!map.has(clean)) {
              map.set(clean, {
                id: `usr-${clean.replace(/[^a-z0-9]/g, '-')}`,
                email: clean,
                name: isTargetAdmin ? 'Easy Flow Administrator' : clean.split('@')[0],
                role: isTargetAdmin ? 'admin' : 'creator',
                assignedBranchId: branches[0]?.id || 'branch-kin',
                assignedBranchName: branches[0]?.name || 'KIn',
                status: 'active',
                addedAt: new Date().toISOString()
              });
            } else {
              const existing = map.get(clean)!;
              map.set(clean, {
                ...existing,
                status: 'active',
                role: isTargetAdmin ? 'admin' : (existing.role === 'admin' ? 'creator' : existing.role)
              });
            }
          });

          // Always ensure hr.rftcom@gmail.com is present & admin
          if (!map.has('hr.rftcom@gmail.com')) {
            map.set('hr.rftcom@gmail.com', {
              id: 'user-admin',
              email: 'hr.rftcom@gmail.com',
              name: 'Easy Flow Administrator',
              role: 'admin',
              assignedBranchId: branches[0]?.id || 'branch-kin',
              status: 'active',
              addedAt: new Date().toISOString()
            });
          }

          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(merged));
          return merged;
        });

        localStorage.setItem(STORAGE_KEYS.sheetId, cleanId);
        return { success: true, count: emails.length, users: emails };
      }
      return { success: false, count: 0, users: [], error: 'No emails found in sheet tab "address" Column A' };
    } catch (err: any) {
      console.warn('loadAuthorizedUsersFromGoogleSheet error:', err);
      return { success: false, count: 0, users: [], error: err.message || 'Failed to fetch authorized users' };
    }
  };

  const loadMasterDataFromGoogleSheet = async (
    sheetIdOrUrl?: string
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const rawInput = (
      sheetIdOrUrl ||
      sheetConfig.spreadsheetId ||
      localStorage.getItem(STORAGE_KEYS.sheetId) ||
      ''
    ).trim();

    if (!rawInput) {
      return { success: false, count: 0, error: 'No Google Sheet configured' };
    }

    const urlMatch = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : rawInput;

    try {
      const items = await fetchMasterDataFromSheet(cleanId, sheetConfig.accessToken);
      if (items && items.length > 0) {
        setMasterItems(items);
        localStorage.setItem(STORAGE_KEYS.masterItems, JSON.stringify(items));
        return { success: true, count: items.length };
      }
      return { success: false, count: 0, error: 'No items found in tab "masterdata"' };
    } catch (err: any) {
      console.warn('loadMasterDataFromGoogleSheet error:', err);
      return { success: false, count: 0, error: err.message || 'Failed to fetch master data' };
    }
  };

  // Auto-fetch from Google Sheet on startup ("and the data must fetch auto when someone use the app i do not want to fetch manully")
  useEffect(() => {
    const autoFetchSheet = async () => {
      const target =
        sheetConfig.spreadsheetId ||
        localStorage.getItem(STORAGE_KEYS.sheetId) ||
        '';
      if (target) {
        try {
          await loadAuthorizedUsersFromGoogleSheet(target);
          await loadBranchesFromGoogleSheet(target);
          await loadMasterDataFromGoogleSheet(target);
          await syncTransfersFromSheet(target);
        } catch (e) {
          console.warn('Auto-sync on startup failed:', e);
        }
      }
    };
    autoFetchSheet();
  }, []);

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
        message: 'You are not an Authorized person to use it.'
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
        message: 'You are not an Authorized person to use it.'
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
                role: clean === 'hr.rftcom@gmail.com' ? 'admin' : (role === 'admin' ? 'creator' : role || u.role),
                status: 'active'
              }
            : u
        )
      );
    } else {
      // Pre-authorized administrator or whitelisted domain
      const isTargetAdmin = clean === 'hr.rftcom@gmail.com';
      const newUser: AuthorizedUser = {
        id: `usr-${Date.now()}`,
        email: clean,
        name: name.trim(),
        role: isTargetAdmin ? 'admin' : (role === 'admin' ? 'creator' : role),
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
    const cleanEmail = user.email.toLowerCase().trim();
    // Only hr.rftcom@gmail.com can ever have admin role
    const assignedRole: UserRole = cleanEmail === 'hr.rftcom@gmail.com' ? 'admin' : (user.role === 'admin' ? 'creator' : user.role);

    const newUser: AuthorizedUser = {
      ...user,
      email: cleanEmail,
      role: assignedRole,
      id: `usr-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
      addedAt: new Date().toISOString()
    };

    setAuthorizedUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== cleanEmail);
      const updated = [...filtered, newUser];
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updated));
      return updated;
    });

    // If Google Sheet is connected, append to Google Sheet tab "address" Column A
    const sheetId = sheetConfig.spreadsheetId || localStorage.getItem(STORAGE_KEYS.sheetId);
    if (sheetId && sheetConfig.accessToken) {
      appendAuthorizedUserToSheet(sheetId, cleanEmail, sheetConfig.accessToken).catch(err => {
        console.warn('Could not append user to Google Sheet tab address:', err);
      });
    }
  };

  const updateAuthorizedUser = (id: string, updates: Partial<AuthorizedUser>) => {
    setAuthorizedUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === id) {
          const cleanEmail = (updates.email || u.email).toLowerCase().trim();
          let nextRole = updates.role || u.role;
          if (cleanEmail !== 'hr.rftcom@gmail.com' && nextRole === 'admin') {
            nextRole = 'creator';
          }
          return {
            ...u,
            ...updates,
            role: nextRole
          };
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updated));
      return updated;
    });
  };

  const removeAuthorizedUser = (id: string) => {
    // Strictly prevent removing the admin hr.rftcom@gmail.com
    setAuthorizedUsers(prev => {
      const updated = prev.filter(u => {
        if (u.email.toLowerCase() === 'hr.rftcom@gmail.com') return true;
        return u.id !== id && u.email.toLowerCase() !== id.toLowerCase();
      });
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updated));
      return updated;
    });
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
  const createTransfer = (
    data: Omit<StockTransfer, 'id' | 'createdByEmail' | 'createdByName' | 'createdAt'> & { challanNo?: string },
    tokenOverride?: string
  ): StockTransfer => {
    const fromBranch = branches.find(b => b.id === data.fromBranchId);
    const branchCode = fromBranch ? fromBranch.code.split('-')[0] : 'BR';
    const year = new Date().getFullYear();
    const count = transfers.length + 1;
    const defaultChallanNo = `CHL-${branchCode}-${year}-${String(count).padStart(4, '0')}`;
    const challanNo = data.challanNo?.trim() || defaultChallanNo;

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

    // Update masterItems stock quantities dynamically
    setMasterItems(prevMaster => {
      const updated = prevMaster.map(mItem => {
        const transferLine = data.items.find(
          ti => ti.itemCode === mItem.itemCode || ti.itemName.toLowerCase() === mItem.name.toLowerCase()
        );
        if (!transferLine) return mItem;

        const fromName = data.fromBranchName;
        const toName = data.toBranchName;
        const curFromStock = mItem.branchStocks[fromName] ?? mItem.branchStocks[fromName.toLowerCase()] ?? 0;
        const curToStock = mItem.branchStocks[toName] ?? mItem.branchStocks[toName.toLowerCase()] ?? 0;

        const newFrom = Math.max(0, curFromStock - transferLine.quantity);
        const newTo = curToStock + transferLine.quantity;

        return {
          ...mItem,
          branchStocks: {
            ...mItem.branchStocks,
            [fromName]: newFrom,
            [fromName.toLowerCase()]: newFrom,
            [toName]: newTo,
            [toName.toLowerCase()]: newTo
          }
        };
      });
      localStorage.setItem(STORAGE_KEYS.masterItems, JSON.stringify(updated));
      return updated;
    });

    // Save directly to Google Sheets: BOTH tab "buro" and tab "club" (Consumption & Production entries)
    const effectiveToken = tokenOverride || sheetConfig.accessToken;
    const sheetId = sheetConfig.spreadsheetId || localStorage.getItem(STORAGE_KEYS.sheetId) || '';
    if (sheetId) {
      saveTransferToGoogleSheets(sheetId, newTransfer, effectiveToken)
        .then(res => {
          if (res.success) {
            setSyncedTransferIds(prev => {
              const next = Array.from(new Set([...prev, newTransfer.id]));
              localStorage.setItem(STORAGE_KEYS.syncedTransfers, JSON.stringify(next));
              return next;
            });
          }
        })
        .catch(err => {
          console.warn('Direct save to Google Sheets (buro & club) error:', err);
        });
    }

    return newTransfer;
  };

  const isTransferSyncedToSheet = (transferId: string): boolean => {
    return syncedTransferIds.includes(transferId);
  };

  const syncTransferToSheets = async (transfer: StockTransfer, tokenOverride?: string) => {
    const sheetId = sheetConfig.spreadsheetId || localStorage.getItem(STORAGE_KEYS.sheetId) || '';
    if (!sheetId) {
      return { success: false, error: 'No Google Sheet connected. Please configure your sheet in Settings.' };
    }

    let token = tokenOverride || sheetConfig.accessToken || getStoredAccessToken();
    if (!token && !localStorage.getItem('floweasy_apps_script_url')) {
      try {
        token = await requestGoogleAccessToken(true);
        if (token) {
          setSheetConfig(prev => ({
            ...prev,
            accessToken: token,
            isConnected: true
          }));
        }
      } catch (authErr: any) {
        return {
          success: false,
          unauthorized: true,
          error: authErr.message || 'Google write authorization is required to save rows into Google Sheets.'
        };
      }
    }

    const res = await saveTransferToGoogleSheets(sheetId, transfer, token);
    if (res.success) {
      setSyncedTransferIds(prev => {
        const next = Array.from(new Set([...prev, transfer.id]));
        localStorage.setItem(STORAGE_KEYS.syncedTransfers, JSON.stringify(next));
        return next;
      });
    }
    return res;
  };

  const syncTransferToBuro = syncTransferToSheets;

  const syncTransfersFromSheet = async (
    sheetIdOrUrl?: string
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const rawInput = (
      sheetIdOrUrl ||
      sheetConfig.spreadsheetId ||
      localStorage.getItem(STORAGE_KEYS.sheetId) ||
      ''
    ).trim();

    if (!rawInput) {
      return { success: false, count: 0, error: 'No Google Sheet link or ID provided.' };
    }

    const urlMatch = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : rawInput;

    try {
      const res = await fetchTransfersFromGoogleSheet(cleanId, sheetConfig.accessToken);
      if (res.success) {
        setTransfers(res.transfers);
        localStorage.setItem(STORAGE_KEYS.transfers, JSON.stringify(res.transfers));
        const ids = res.transfers.map(t => t.id);
        setSyncedTransferIds(ids);
        localStorage.setItem(STORAGE_KEYS.syncedTransfers, JSON.stringify(ids));
        return { success: true, count: res.transfers.length };
      } else {
        return { success: false, count: 0, error: res.error || 'Failed to fetch transfers from Google Sheet.' };
      }
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Error fetching transfers from sheet.' };
    }
  };

  const authorizeGoogleAndSyncAll = async (): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
    try {
      const token = await requestGoogleAccessToken();
      setSheetConfig(prev => ({
        ...prev,
        accessToken: token,
        isConnected: true
      }));

      const sheetId = sheetConfig.spreadsheetId || localStorage.getItem(STORAGE_KEYS.sheetId) || '';
      if (!sheetId) {
        return { success: false, syncedCount: 0, error: 'Please enter your Google Sheet link in Settings first.' };
      }

      const unsynced = transfers.filter(t => !syncedTransferIds.includes(t.id));
      let count = 0;
      for (const t of unsynced) {
        const res = await saveTransferToGoogleSheets(sheetId, t, token);
        if (res.success) {
          count++;
          setSyncedTransferIds(prev => {
            const next = Array.from(new Set([...prev, t.id]));
            localStorage.setItem(STORAGE_KEYS.syncedTransfers, JSON.stringify(next));
            return next;
          });
        }
      }

      return { success: true, syncedCount: count };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err.message || 'Google authorization failed.' };
    }
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

    setSyncedTransferIds(prev => {
      const next = prev.filter(tid => tid !== id);
      localStorage.setItem(STORAGE_KEYS.syncedTransfers, JSON.stringify(next));
      return next;
    });

    // Delete matching rows from connected Google Sheet (both buro and club tabs)
    const sheetId = sheetConfig.spreadsheetId || localStorage.getItem(STORAGE_KEYS.sheetId) || '';
    if (sheetId && existing.challanNo) {
      deleteTransferFromGoogleSheet(sheetId, existing.challanNo, sheetConfig.accessToken)
        .then(delRes => {
          if (delRes.success) {
            console.log(`Challan ${existing.challanNo} successfully deleted from Google Sheet (${delRes.deletedCount} rows removed).`);
          } else {
            console.warn(`Could not delete challan ${existing.challanNo} from Google Sheet:`, delRes.error);
          }
        })
        .catch(delErr => {
          console.warn('Error deleting transfer from Google Sheet:', delErr);
        });
    }

    // Restore stock in masterItems as well
    setMasterItems(prevMaster => {
      const updated = prevMaster.map(mItem => {
        const transferLine = existing.items.find(
          ti => ti.itemCode === mItem.itemCode || ti.itemName.toLowerCase() === mItem.name.toLowerCase()
        );
        if (!transferLine) return mItem;

        const fromName = existing.fromBranchName;
        const toName = existing.toBranchName;
        const curFromStock = mItem.branchStocks[fromName] ?? mItem.branchStocks[fromName.toLowerCase()] ?? 0;
        const curToStock = mItem.branchStocks[toName] ?? mItem.branchStocks[toName.toLowerCase()] ?? 0;

        const restoredFrom = curFromStock + transferLine.quantity;
        const restoredTo = Math.max(0, curToStock - transferLine.quantity);

        return {
          ...mItem,
          branchStocks: {
            ...mItem.branchStocks,
            [fromName]: restoredFrom,
            [fromName.toLowerCase()]: restoredFrom,
            [toName]: restoredTo,
            [toName.toLowerCase()]: restoredTo
          }
        };
      });
      localStorage.setItem(STORAGE_KEYS.masterItems, JSON.stringify(updated));
      return updated;
    });

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
        isAdmin,
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
        masterItems,
        loadMasterDataFromGoogleSheet,
        loadBranchesFromGoogleSheet,
        loadAuthorizedUsersFromGoogleSheet,
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
        fetchStockMasterFromCloud,
        syncedTransferIds,
        isTransferSyncedToSheet,
        syncTransferToSheets,
        syncTransferToBuro,
        syncTransfersFromSheet,
        authorizeGoogleAndSyncAll
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
