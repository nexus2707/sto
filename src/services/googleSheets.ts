import { StockItem, StockTransfer, Invoice, Branch, AuthorizedUser, MasterStockItem } from '../types';
import { getSheetNameForLocation } from '../config/shopLocations';

export const DEFAULT_OAUTH_CLIENT_ID = '896903801673-jmp1se6h1j6842mfkuh6v3i6a7oc40g9.apps.googleusercontent.com';
export const OAUTH_STORAGE_KEY = 'rft_inventory_oauth_client_id_v2';

export function getOAuthClientId(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(OAUTH_STORAGE_KEY);
    if (custom && custom.trim()) return custom.trim();
  }
  return DEFAULT_OAUTH_CLIENT_ID;
}

export function setOAuthClientId(newClientId: string) {
  if (typeof window !== 'undefined') {
    if (newClientId && newClientId.trim()) {
      localStorage.setItem(OAUTH_STORAGE_KEY, newClientId.trim());
    } else {
      localStorage.removeItem(OAUTH_STORAGE_KEY);
    }
  }
}

export const OAUTH_CLIENT_ID = DEFAULT_OAUTH_CLIENT_ID;
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export const SHEET_COLUMNS = {
  stockMaster: [
    'Item Code',
    'Item Name',
    'Category',
    'Unit',
    'Unit Cost (FC)',
    'Unit Price (FC)',
    'Total Stock',
    'Min Alert Qty',
    'Last Updated',
    'Branch Stocks Breakdown'
  ],
  transfers: [
    'Challan No',
    'Transfer Date',
    'From Branch',
    'To Branch',
    'Item Code',
    'Item Name',
    'Quantity',
    'Unit',
    'Carrier / Vehicle',
    'Remarks',
    'Created By Email',
    'Created At',
    'Status'
  ],
  invoices: [
    'Invoice No',
    'Type',
    'Date',
    'Due Date',
    'Branch Name',
    'Branch Address',
    'Customer Name',
    'Customer Tax No',
    'With TVA (Yes/No)',
    'TVA Rate (%)',
    'Exchange Rate (FC/USD)',
    'Subtotal FC',
    'TVA Amount FC',
    'Total FC',
    'Subtotal USD',
    'TVA Amount USD',
    'Total USD',
    'Created By Email',
    'Created At',
    'Status'
  ],
  users: [
    'User Email',
    'Full Name',
    'Role',
    'Assigned Branch',
    'Status',
    'Added At'
  ],
  branches: [
    'Branch Code',
    'Branch Name',
    'City',
    'Address',
    'Phone',
    'Email',
    'Manager'
  ],
  locationLedger: [
    'Challan/Bill No.',
    'Challan/Bill  Date',
    'Due date',
    'Transaction type',
    'Client / Supplier Name',
    'Client Address',
    'From',
    'To',
    'SKU',
    'Group',
    'Item Name',
    'Performa Qty',
    'Inward',
    'Outward',
    'Unit',
    'Taux',
    'Rate fc',
    'Rate usd',
    'Subtotal FC',
    'Subtotal USD',
    'TVA 16% FC',
    'Total-FC',
    'Total-USD',
    'Balance qty',
    'Remarks',
    'CreatedByEmail',
    'Driver Name',
    'Status'
  ],
  branchNameTab: [
    'Email ID',
    'Inv Prefix',
    'Location Name',
    'Address',
    'RCCM',
    'Impo ',
    'ID nat'
  ]
};

// Global GIS token client helper
let tokenClient: any = null;

export function initGisClient(callback: (token: string) => void, errorCallback?: (err: any) => void) {
  if (typeof window === 'undefined') return;

  const checkGis = () => {
    // @ts-ignore
    if (window.google?.accounts?.oauth2) {
      try {
        // @ts-ignore
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: getOAuthClientId(),
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) {
              console.error('GIS Error:', response);
              if (errorCallback) errorCallback(response);
              return;
            }
            callback(response.access_token);
          },
          error_callback: (err: any) => {
            console.error('OAuth token error:', err);
            if (errorCallback) errorCallback(err);
          }
        });
      } catch (err) {
        console.error('Failed to initTokenClient', err);
      }
    }
  };

  if ((window as any).google?.accounts?.oauth2) {
    checkGis();
  } else {
    // Retry shortly if script is still loading
    const timer = setInterval(() => {
      if ((window as any).google?.accounts?.oauth2) {
        clearInterval(timer);
        checkGis();
      }
    }, 300);
    setTimeout(() => clearInterval(timer), 5000);
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored =
      sessionStorage.getItem('floweasy_cached_google_token') ||
      localStorage.getItem('floweasy_cached_google_token');
    const expiry =
      sessionStorage.getItem('floweasy_cached_google_token_expiry') ||
      localStorage.getItem('floweasy_cached_google_token_expiry');
    if (stored && expiry && Number(expiry) > Date.now()) {
      return stored;
    }
  } catch (e) {
    console.warn('Error reading stored token:', e);
  }
  return null;
}

export function setStoredAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token && token.trim()) {
      const expiry = String(Date.now() + 55 * 60 * 1000); // 55 minutes
      sessionStorage.setItem('floweasy_cached_google_token', token.trim());
      sessionStorage.setItem('floweasy_cached_google_token_expiry', expiry);
      localStorage.setItem('floweasy_cached_google_token', token.trim());
      localStorage.setItem('floweasy_cached_google_token_expiry', expiry);
    } else {
      sessionStorage.removeItem('floweasy_cached_google_token');
      sessionStorage.removeItem('floweasy_cached_google_token_expiry');
      localStorage.removeItem('floweasy_cached_google_token');
      localStorage.removeItem('floweasy_cached_google_token_expiry');
    }
  } catch (e) {
    console.warn('Error saving stored token:', e);
  }
}

export function requestGoogleAccessToken(promptConsent: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if we already have a valid unexpired token
    const existing = getStoredAccessToken();
    if (existing && !promptConsent) {
      resolve(existing);
      return;
    }

    // @ts-ignore
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script not yet loaded. Please check your internet connection.'));
      return;
    }

    try {
      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: getOAuthClientId(),
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
          } else {
            if (resp.access_token) {
              setStoredAccessToken(resp.access_token);
            }
            resolve(resp.access_token);
          }
        },
        error_callback: (err: any) => reject(err)
      });
      client.requestAccessToken({ prompt: promptConsent ? 'consent' : '' });
    } catch (e) {
      reject(e);
    }
  });
}

// Google Sheets API Helpers
export async function createGoogleSpreadsheet(
  token: string,
  title: string = 'Multi-Branch Inventory & Invoicing Master'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const requestBody = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Stock_Master',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Stock_Transfers',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Invoices',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Authorized_Users',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Branches',
          gridProperties: { frozenRowCount: 1 }
        }
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet: HTTP ${res.status}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write headers to all sheets
  const headerData = [
    { range: 'Stock_Master!A1:J1', values: [SHEET_COLUMNS.stockMaster] },
    { range: 'Stock_Transfers!A1:M1', values: [SHEET_COLUMNS.transfers] },
    { range: 'Invoices!A1:T1', values: [SHEET_COLUMNS.invoices] },
    { range: 'Authorized_Users!A1:F1', values: [SHEET_COLUMNS.users] },
    { range: 'Branches!A1:G1', values: [SHEET_COLUMNS.branches] }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData
    })
  });

  return { spreadsheetId, spreadsheetUrl };
}

export async function syncAllToGoogleSheet(
  token: string,
  spreadsheetId: string,
  payload: {
    stockItems: StockItem[];
    transfers: StockTransfer[];
    invoices: Invoice[];
    users: AuthorizedUser[];
    branches: Branch[];
  }
): Promise<void> {
  // Format Stock Items rows
  const stockRows = payload.stockItems.map(item => [
    item.itemCode,
    item.name,
    item.category,
    item.unit,
    item.unitCostFC,
    item.unitPriceFC,
    item.totalStock,
    item.minAlertQty,
    item.lastUpdated,
    JSON.stringify(item.branchStocks)
  ]);

  // Format Stock Transfers rows (one row per item transfer or summarized)
  const transferRows: any[] = [];
  payload.transfers.forEach(t => {
    t.items.forEach(itm => {
      transferRows.push([
        t.challanNo,
        t.date,
        t.fromBranchName,
        t.toBranchName,
        itm.itemCode,
        itm.itemName,
        itm.quantity,
        itm.unit,
        `${t.driverOrCarrier || ''} ${t.vehicleNumber ? `[${t.vehicleNumber}]` : ''}`.trim(),
        itm.remarks || t.remarks || '',
        t.createdByEmail,
        t.createdAt,
        t.status
      ]);
    });
  });

  // Format Invoices rows
  const invoiceRows = payload.invoices.map(inv => [
    inv.invoiceNo,
    inv.type.toUpperCase(),
    inv.date,
    inv.dueDate || '',
    inv.branchName,
    inv.branchAddress,
    inv.customerName,
    inv.customerTaxNo || '',
    inv.withTva ? 'Yes' : 'No',
    inv.tvaRate,
    inv.exchangeRate,
    inv.subtotalFC,
    inv.tvaAmountFC,
    inv.totalFC,
    inv.subtotalUSD,
    inv.tvaAmountUSD,
    inv.totalUSD,
    inv.createdByEmail,
    inv.createdAt,
    inv.status
  ]);

  // Format Users rows
  const userRows = payload.users.map(u => [
    u.email,
    u.name,
    u.role,
    u.assignedBranchId || 'All Branches',
    u.status,
    u.addedAt
  ]);

  // Format Branches rows
  const branchRows = payload.branches.map(b => [
    b.code,
    b.name,
    b.city,
    b.address,
    b.phone,
    b.email,
    b.manager
  ]);

  // Batch update all data
  const data = [
    { range: 'Stock_Master!A1:J1', values: [SHEET_COLUMNS.stockMaster] },
    { range: 'Stock_Master!A2:J' + (stockRows.length + 1), values: stockRows },
    { range: 'Stock_Transfers!A1:M1', values: [SHEET_COLUMNS.transfers] },
    { range: 'Stock_Transfers!A2:M' + (transferRows.length + 1), values: transferRows },
    { range: 'Invoices!A1:T1', values: [SHEET_COLUMNS.invoices] },
    { range: 'Invoices!A2:T' + (invoiceRows.length + 1), values: invoiceRows },
    { range: 'Authorized_Users!A1:F1', values: [SHEET_COLUMNS.users] },
    { range: 'Authorized_Users!A2:F' + (userRows.length + 1), values: userRows },
    { range: 'Branches!A1:G1', values: [SHEET_COLUMNS.branches] },
    { range: 'Branches!A2:G' + (branchRows.length + 1), values: branchRows }
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to sync to Google Sheet: HTTP ${res.status}`);
  }
}

export async function fetchStockMasterFromSheet(token: string, spreadsheetId: string): Promise<StockItem[]> {
  const range = 'Stock_Master!A2:J1000';
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read Stock_Master from sheet: HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows: any[][] = json.values || [];

  const items: StockItem[] = rows.map((row, idx) => {
    let branchStocks: Record<string, number> = {};
    if (row[9]) {
      try {
        branchStocks = JSON.parse(row[9]);
      } catch {
        branchStocks = {};
      }
    }

    const totalStock = Number(row[6]) || 0;
    // Default distribute across branches if branchStocks is empty
    if (Object.keys(branchStocks).length === 0) {
      branchStocks['branch-1'] = totalStock;
    }

    return {
      id: `itm-sheet-${idx + 1}`,
      itemCode: row[0] || `ITM-${idx + 1}`,
      name: row[1] || 'Unnamed Product',
      category: row[2] || 'General',
      unit: row[3] || 'Pcs',
      unitCostFC: Number(row[4]) || 0,
      unitPriceFC: Number(row[5]) || 0,
      branchStocks,
      totalStock,
      minAlertQty: Number(row[7]) || 10,
      lastUpdated: row[8] || new Date().toISOString().split('T')[0]
    };
  });

  return items;
}

/**
 * Fetch branches from the 'branch name' sheet tab.
 * Reads rows from A2 onwards:
 * Col A: Email ID
 * Col B: Inv Prefix
 * Col C: Location Name
 * Col D: Address
 * Col E: RCCM
 * Col F: Impo
 * Col G: ID nat
 * Discards empty rows and empty cells.
 */
export async function fetchBranchesFromSheet(
  spreadsheetId: string,
  token?: string | null
): Promise<Branch[]> {
  if (!spreadsheetId) {
    throw new Error('Please provide a valid Google Spreadsheet ID or URL');
  }

  // Extract ID and GID if full URL pasted
  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();
  const gidMatch = spreadsheetId.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  let rawRows: any[][] = [];
  let isAccessRestricted = false;

  // Method 1: If access token is provided, attempt via Google Sheets v4 API
  if (token) {
    const sheetCandidates = [
      "'branch name'!A1:G",
      "'Branch Name'!A1:G",
      "'branch_name'!A1:G",
      "'Branches'!A1:G"
    ];
    for (const cand of sheetCandidates) {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(cand)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.values && json.values.length > 0) {
            rawRows = json.values;
            break;
          }
        }
      } catch (err) {
        console.warn('Google Sheets API values fetch failed, trying alternative:', err);
      }
    }
  }

  // Method 2: Public CSV export with GID (most direct for specific tabs)
  if (rawRows.length === 0 && gid) {
    const gidUrls = [
      `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&gid=${gid}`
    ];
    for (const u of gidUrls) {
      try {
        const res = await fetch(u);
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
          isAccessRestricted = true;
          continue;
        }
        if (res.ok && text && !text.includes('error')) {
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            rawRows = lines.map(line =>
              line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim())
            );
            break;
          }
        }
      } catch (err) {
        console.warn('GID fetch failed:', err);
      }
    }
  }

  // Method 3: Public CSV export with sheet candidates
  if (rawRows.length === 0) {
    const sheetCandidates = ['branch name', 'Branch Name', 'branch_name', 'Branches', 'Sheet1'];
    for (const sheetName of sheetCandidates) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          sheetName
        )}`;
        const res = await fetch(csvUrl);
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
          isAccessRestricted = true;
          continue;
        }
        if (res.ok && text && !text.includes('google.visualization.Query.setResponse({"version":"0.6","status":"error"')) {
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            rawRows = lines.map(line =>
              line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim())
            );
            break;
          }
        }
      } catch (err) {
        console.warn(`CSV attempt for "${sheetName}" failed:`, err);
      }
    }
  }

  // Method 4: Default CSV export without sheet name (fetches the first/default tab)
  if (rawRows.length === 0) {
    const defaultUrls = [
      `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`
    ];
    for (const u of defaultUrls) {
      try {
        const res = await fetch(u);
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
          isAccessRestricted = true;
          continue;
        }
        if (res.ok && text && !text.includes('error')) {
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            rawRows = lines.map(line =>
              line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim())
            );
            break;
          }
        }
      } catch (err) {
        console.warn('Default sheet fetch failed:', err);
      }
    }
  }

  // Method 5: GVIZ JSON API
  if (rawRows.length === 0) {
    const sheetCandidates = ['branch name', 'Branch Name', 'branch_name', 'Branches', 'Sheet1'];
    for (const sheetName of sheetCandidates) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
          sheetName
        )}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
            isAccessRestricted = true;
            continue;
          }
          const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const gvizRows = data.table?.rows || [];
            if (gvizRows.length > 0) {
              rawRows = gvizRows.map((r: any) => {
                const c = r.c || [];
                return c.map((cell: any) =>
                  cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : ''
                );
              });
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`gviz attempt for sheet "${sheetName}" failed:`, err);
      }
    }
  }

  if (rawRows.length === 0) {
    if (isAccessRestricted) {
      throw new Error(
        'Google Sheet is private or requires sign-in. To allow Easy Flow to read it: In Google Sheets, click "Share" (top-right), change General Access from "Restricted" to "Anyone with the link" (Viewer), and copy the link. Or use "Paste Data Directly" below.'
      );
    }
    throw new Error(
      'Could not retrieve data from sheet tab "branch name". Please verify that the spreadsheet is shared ("Anyone with the link" as Viewer) and contains data for Location Name, Invoice Prefix, Address, etc.'
    );
  }

  const parsedBranches: Branch[] = [];

  rawRows.forEach((row, idx) => {
    // STRICT REQUIREMENT FROM USER & SCREENSHOT:
    // Tab name: "branch name"
    // Column A (index 0): Prefix / City / Code (e.g. Kinshasa, Lusi, BRC, Test...)
    // Column B (index 1): Location Name ONLY (e.g. KIn Location [header], A1-SHOP NO1, A2-SHOP NO2, ... AA13-SHOP NO13, Buro)
    // NEVER get location name from column A, and NEVER use generic "Branch X" labels.
    const colA = String(row[0] || '').trim();
    const locationName = String(row[1] || '').trim();

    // Discard empty cells in Column B
    if (!locationName) {
      return;
    }

    // Filter out header row if present (e.g. "KIn Location", "Location Name")
    if (
      locationName.toLowerCase().includes('location') ||
      locationName.toLowerCase().includes('branch name') ||
      (idx === 0 && (colA.toLowerCase().includes('kinshasa') || locationName.toLowerCase().includes('kin location')))
    ) {
      return;
    }

    const safeName = locationName;
    const safeCode = colA || safeName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const safeId = `branch-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    parsedBranches.push({
      id: safeId,
      name: safeName,
      code: safeCode,
      invPrefix: safeCode,
      address: 'Commercial Avenue',
      city: 'Gombe',
      phone: '',
      email: safeName === 'A1-SHOP NO1' ? 'itkinshasa1@gmail.com' : (colA.includes('@') ? colA : ''),
      manager: `${safeName} Manager`,
      rccm: '123test',
      impot: '123test',
      idNat: '123test',
      isHeadquarters: safeName === 'A1-SHOP NO1'
    });
  });

  if (parsedBranches.length === 0) {
    throw new Error('No valid location names found in column B of "branch name" sheet.');
  }

  return parsedBranches;
}

/**
 * Fetch authorized user emails from Google Sheet tab named "address", Column A
 * "where did you save this auth user detail save it on this link google sheet name is 'address' in column A . and the data must fetch auto when someone use the app i do not want to fetch manully"
 */
export async function fetchAuthorizedUsersFromSheet(
  spreadsheetId: string,
  token?: string | null
): Promise<string[]> {
  if (!spreadsheetId || !spreadsheetId.trim()) {
    return [];
  }

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  let rawEmails: string[] = [];

  // Method 1: If OAuth access token is provided, attempt via Google Sheets v4 API
  if (token) {
    const sheetCandidates = ["'address'!A:A", "'Address'!A:A", "'ADDRESS'!A:A", "'Users'!A:A"];
    for (const cand of sheetCandidates) {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(cand)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.values && data.values.length > 0) {
            rawEmails = data.values.map((row: any[]) => String(row[0] || '').trim());
            break;
          }
        }
      } catch (err) {
        console.warn('Authorized users API fetch failed for candidate:', cand, err);
      }
    }
  }

  // Method 2: Public CSV export for tab "address"
  if (rawEmails.length === 0) {
    const sheetCandidates = ['address', 'Address', 'ADDRESS', 'users', 'Users'];
    for (const sheetName of sheetCandidates) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          sheetName
        )}&range=A:A`;
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE') && !text.includes('error') && text.trim().length > 0) {
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length > 0) {
              rawEmails = lines.map(line => line.replace(/^["']|["']$/g, '').trim());
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`CSV attempt for authorized users "${sheetName}" failed:`, err);
      }
    }
  }

  // Method 3: GVIZ JSON query for tab "address"
  if (rawEmails.length === 0) {
    const sheetCandidates = ['address', 'Address', 'ADDRESS'];
    for (const sheetName of sheetCandidates) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
          sheetName
        )}&range=A:A`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const text = await res.text();
          const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const rows = data.table?.rows || [];
            if (rows.length > 0) {
              rawEmails = rows.map((r: any) => {
                const c = r.c || [];
                return String(c[0]?.v || '').trim();
              });
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`GVIZ attempt for authorized users "${sheetName}" failed:`, err);
      }
    }
  }

  // Filter and sanitize emails:
  // Must be valid email string, exclude headers like 'Email ID', 'email', 'Address', etc.
  const validEmails = rawEmails
    .map(e => e.toLowerCase().trim())
    .filter(e => {
      if (!e) return false;
      if (e === 'email' || e === 'email id' || e === 'address' || e === 'authorized users') return false;
      // Basic check: has @ and no spaces
      return e.includes('@') && !e.includes(' ') && e.length > 4;
    });

  // Always guarantee admin is included in authorized list
  const uniqueEmails = Array.from(new Set(['hr.rftcom@gmail.com', ...validEmails]));
  return uniqueEmails;
}

/**
 * Append or save an authorized user to Google Sheet tab "address" Column A
 */
export async function appendAuthorizedUserToSheet(
  spreadsheetId: string,
  email: string,
  token?: string | null
): Promise<boolean> {
  if (!spreadsheetId || !email || !token) return false;

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'address'!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[email.trim().toLowerCase()]]
        })
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('Failed to append authorized user to sheet:', err);
    return false;
  }
}

/**
 * Fetch items and closing stock quantities from sheet tab "masterdata".
 * Items start from column C2 onwards.
 * Location column headers are from G to Z.
 * Under each location column is that item's closing stock balance for that location.
 */
export async function fetchMasterDataFromSheet(
  spreadsheetId: string,
  token?: string | null
): Promise<MasterStockItem[]> {
  if (!spreadsheetId || !spreadsheetId.trim()) return [];

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  let rawRows: any[][] = [];
  const sheetCandidates = ['masterdata', 'Masterdata', 'MasterData', 'master_data', 'Master Data', 'Master'];

  // Method 1: Google Sheets API with OAuth token
  if (token) {
    for (const sheetName of sheetCandidates) {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(`'${sheetName}'!A1:Z`)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.values && json.values.length > 0) {
            rawRows = json.values;
            break;
          }
        }
      } catch (err) {
        console.warn('API fetch failed for masterdata candidate:', sheetName, err);
      }
    }
  }

  // Method 2: Public CSV export
  if (rawRows.length === 0) {
    for (const sheetName of sheetCandidates) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          sheetName
        )}`;
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE') && !text.includes('accounts.google.com') && !text.includes('status":"error"')) {
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length > 0) {
              rawRows = lines.map(line =>
                line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim())
              );
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`CSV fetch failed for masterdata candidate "${sheetName}":`, err);
      }
    }
  }

  // Method 3: GVIZ JSON query
  if (rawRows.length === 0) {
    for (const sheetName of sheetCandidates) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
          sheetName
        )}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const text = await res.text();
          const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const gvizRows = data.table?.rows || [];
            if (gvizRows.length > 0) {
              rawRows = gvizRows.map((r: any) => {
                const c = r.c || [];
                return c.map((cell: any) =>
                  cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : ''
                );
              });
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`GVIZ fetch failed for masterdata candidate "${sheetName}":`, err);
      }
    }
  }

  if (rawRows.length < 2) {
    return [];
  }

  // Header row has location headers from column G to Z (indexes 6 to 25)
  const headerRow = rawRows[0] || [];
  const locationHeaders: { colIdx: number; name: string }[] = [];
  for (let c = 6; c < Math.min(26, headerRow.length); c++) {
    const rawName = String(headerRow[c] || '').trim();
    if (rawName && !rawName.toLowerCase().includes('unnamed')) {
      locationHeaders.push({ colIdx: c, name: rawName });
    }
  }

  const items: MasterStockItem[] = [];

  // Rows start from row 2 (index 1) onwards.
  // Column C (index 2) is Item Name.
  // Column B (index 1) is Item Code.
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const itemName = String(row[2] || '').trim();
    const itemCode = String(row[1] || '').trim() || `ITM-${r}`;
    const unit = String(row[3] || 'Pcs').trim() || 'Pcs';

    if (!itemName && !row[1]) continue;

    const finalName = itemName || itemCode;
    const branchStocks: Record<string, number> = {};
    let totalStock = 0;

    locationHeaders.forEach(loc => {
      const rawVal = row[loc.colIdx];
      const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal || 0).replace(/[^0-9.-]/g, '')) || 0;
      branchStocks[loc.name] = parsed;
      branchStocks[loc.name.toLowerCase()] = parsed;
      totalStock += parsed;
    });

    items.push({
      id: `master-item-${r}`,
      itemCode: itemCode,
      name: finalName,
      unit: unit,
      branchStocks,
      totalStock
    });
  }

  return items;
}

/**
 * Convert transfer items into standard 28-column locationLedger rows
 */
export function formatTransferBuroRows(transfer: StockTransfer): any[][] {
  if (!transfer || !transfer.items) return [];
  return transfer.items.map(item => [
    transfer.challanNo, // 1: Challan/Bill No.
    transfer.date, // 2: Challan/Bill  Date
    transfer.date, // 3: Due date
    transfer.transactionType || 'Bon-Stock Transfer', // 4: Transaction type
    transfer.branchContext || transfer.toBranchName, // 5: Client / Supplier Name
    transfer.toBranchName, // 6: Client Address
    transfer.fromBranchName, // 7: From
    transfer.toBranchName, // 8: To
    item.itemCode || '', // 9: SKU
    item.category || 'Stock Transfer', // 10: Group
    item.itemName || '', // 11: Item Name
    0, // 12: Performa Qty
    0, // 13: Inward
    item.quantity || 0, // 14: Outward
    item.unit || 'Pcs', // 15: Unit
    2850, // 16: Taux
    0, // 17: Rate fc
    0, // 18: Rate usd
    0, // 19: Subtotal FC
    0, // 20: Subtotal USD
    0, // 21: TVA 16% FC
    0, // 22: Total-FC
    0, // 23: Total-USD
    0, // 24: Balance qty
    transfer.remarks || '', // 25: Remarks
    transfer.createdByEmail || '', // 26: CreatedByEmail
    transfer.driverOrCarrier || transfer.createdByName || '', // 27: Driver Name
    transfer.status || 'Completed' // 28: Status
  ]);
}

/**
 * Copy 28-column rows as Tab-Separated Values (TSV) directly to clipboard
 * so the user can paste directly into any cell of their Google Sheet tab "buro".
 */
export async function copyTransferBuroRowsToClipboard(transfer: StockTransfer): Promise<boolean> {
  const rows = formatTransferBuroRows(transfer);
  if (rows.length === 0) return false;
  const tsv = rows.map(r => r.join('\t')).join('\n');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard writeText failed:', e);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Download 28-column rows as CSV file
 */
export function downloadTransferBuroCsv(transfer: StockTransfer) {
  const rows = formatTransferBuroRows(transfer);
  if (rows.length === 0) return;
  const csvContent =
    SHEET_COLUMNS.locationLedger.join(',') +
    '\n' +
    rows
      .map(r =>
        r
          .map(val => {
            const str = String(val ?? '');
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Buro_Transfer_${transfer.challanNo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Save / append stock transfer line items into a specific Google Sheet tab
 * (e.g. "kin-sh2", "kin-sh6", "buro") as per defined 28 columns in SHEET_COLUMNS.locationLedger.
 */
export async function appendTransferToLocationSheet(
  spreadsheetId: string,
  tabTitle: string,
  transfer: StockTransfer,
  token?: string | null
): Promise<{ success: boolean; rowsCount: number; unauthorized?: boolean; error?: string }> {
  if (!transfer || !transfer.items || transfer.items.length === 0) {
    return { success: false, rowsCount: 0, error: 'No items in transfer.' };
  }

  const cleanTab = tabTitle.trim() || 'buro';
  const rows = formatTransferBuroRows(transfer);

  // Always store locally in localStorage for persistent offline & immediate ledger viewing
  try {
    const key = `floweasy_${cleanTab.toLowerCase()}_records`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [...rows, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));
    // Also update general buro cache
    if (cleanTab.toLowerCase() !== 'buro') {
      const buroExisting = JSON.parse(localStorage.getItem('floweasy_buro_records') || '[]');
      localStorage.setItem('floweasy_buro_records', JSON.stringify([...rows, ...buroExisting]));
    }
  } catch (err) {
    console.warn(`Could not cache ${cleanTab} record locally:`, err);
  }

  if (!spreadsheetId) {
    return {
      success: false,
      rowsCount: rows.length,
      error: 'No Google Spreadsheet connected.'
    };
  }

  // Check if user has an Apps Script Webhook configured for zero-auth direct writes
  const appsScriptUrl = localStorage.getItem('floweasy_apps_script_url');
  if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: cleanTab, rows })
      });
      return { success: true, rowsCount: rows.length };
    } catch (scriptErr: any) {
      console.warn(`Apps Script direct post to ${cleanTab} failed:`, scriptErr);
    }
  }

  // Google Sheets REST API requires valid OAuth access token
  if (!token) {
    return {
      success: false,
      rowsCount: rows.length,
      unauthorized: true,
      error: 'Google write authorization (OAuth token) required to write into Google Sheets. Click "Authorize Google Sheets" to sync.'
    };
  }

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  // Try different variations of tab name
  const tabCandidates = [
    `'${cleanTab}'!A:AB`,
    `${cleanTab}!A:AB`,
    `'${cleanTab.toLowerCase()}'!A:AB`,
    `'${cleanTab.toUpperCase()}'!A:AB`
  ];

  for (const tabName of tabCandidates) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
          tabName
        )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: rows })
        }
      );

      if (res.ok) {
        return { success: true, rowsCount: rows.length };
      }

      if (res.status === 401 || res.status === 403) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          rowsCount: rows.length,
          unauthorized: true,
          error: errJson.error?.message || 'Access token expired or permission denied. Please re-authorize Google Sheets.'
        };
      }
    } catch (err: any) {
      console.warn(`Append to tab ${tabName} failed, trying next:`, err);
    }
  }

  // If all tab append attempts failed, try to auto-create the sheet tab with 28 headers
  try {
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: cleanTab,
                  gridProperties: { frozenRowCount: 1 }
                }
              }
            }
          ]
        })
      }
    );

    if (addSheetRes.ok) {
      // Add the 28 headers and data rows
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodeURIComponent(cleanTab)}'!A1:AB?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [SHEET_COLUMNS.locationLedger, ...rows]
          })
        }
      );
      return { success: true, rowsCount: rows.length };
    }
  } catch (sheetCreateErr) {
    console.warn(`Auto-creating ${cleanTab} tab failed:`, sheetCreateErr);
  }

  return {
    success: false,
    rowsCount: rows.length,
    error: `Could not append rows to Google Sheet tab "${cleanTab}". Please check sheet permissions.`
  };
}

/**
 * Save / append stock transfer line items into Google Sheet tab named "buro"
 * as per defined 28 columns in SHEET_COLUMNS.locationLedger.
 */
export async function appendTransferToBuroSheet(
  spreadsheetId: string,
  transfer: StockTransfer,
  token?: string | null
): Promise<{ success: boolean; rowsCount: number; unauthorized?: boolean; error?: string }> {
  return appendTransferToLocationSheet(spreadsheetId, 'buro', transfer, token);
}

/**
 * Convert transfer items into rows for "club" sheet.
 * Columns A to AB (1 to 28) are standard 28 columns.
 * Column AC (29th column, index 28):
 * 1st: The whole challan data as it is (all rows) stamped as "Consumption" in column AC (Outward = qty, Inward = 0).
 * 2nd: The same whole challan data (all rows) stamped as "Production" in column AC with swapped locations (From & To swapped, Inward = qty, Outward = 0).
 * If not 'Bon-Stock Transfer', only the consumption rows are returned with transaction type stamped in column AC.
 */
export function formatTransferClubRows(transfer: StockTransfer): any[][] {
  if (!transfer || !transfer.items || transfer.items.length === 0) return [];

  const isBonStockTransfer =
    !transfer.transactionType ||
    transfer.transactionType.trim().toLowerCase() === 'bon-stock transfer' ||
    transfer.transactionType.trim().toLowerCase() === 'stock transfer';

  // 1. First: Generate all Consumption rows for the entire challan
  const consumptionRows: any[][] = transfer.items.map(item => [
    transfer.challanNo, // 1: Challan/Bill No.
    transfer.date, // 2: Challan/Bill Date
    transfer.date, // 3: Due date
    transfer.transactionType || 'Bon-Stock Transfer', // 4: Transaction type
    transfer.branchContext || transfer.toBranchName, // 5: Client / Supplier Name
    transfer.toBranchName, // 6: Client Address
    transfer.fromBranchName, // 7: From
    transfer.toBranchName, // 8: To
    item.itemCode || '', // 9: SKU
    item.category || 'Stock Transfer', // 10: Group
    item.itemName || '', // 11: Item Name
    0, // 12: Performa Qty
    0, // 13: Inward
    item.quantity || 0, // 14: Outward
    item.unit || 'Pcs', // 15: Unit
    2850, // 16: Taux
    0, // 17: Rate fc
    0, // 18: Rate usd
    0, // 19: Subtotal FC
    0, // 20: Subtotal USD
    0, // 21: TVA 16% FC
    0, // 22: Total-FC
    0, // 23: Total-USD
    0, // 24: Balance qty
    transfer.remarks || '', // 25: Remarks
    transfer.createdByEmail || '', // 26: CreatedByEmail
    transfer.driverOrCarrier || transfer.createdByName || '', // 27: Driver Name
    transfer.status || 'Completed', // 28: Status
    'Consumption' // 29 (Column AC): Consumption
  ]);

  if (!isBonStockTransfer) {
    return consumptionRows;
  }

  // 2. Second: Generate all Production rows for the entire challan (swapped locations: From and To reversed, Inward = qty, Outward = 0)
  const productionRows: any[][] = transfer.items.map(item => [
    transfer.challanNo, // 1: Challan/Bill No.
    transfer.date, // 2: Challan/Bill Date
    transfer.date, // 3: Due date
    transfer.transactionType || 'Bon-Stock Transfer', // 4: Transaction type
    transfer.branchContext || transfer.fromBranchName, // 5: Client / Supplier Name
    transfer.fromBranchName, // 6: Client Address
    transfer.toBranchName, // 7: From (SWAPPED with original To)
    transfer.fromBranchName, // 8: To (SWAPPED with original From)
    item.itemCode || '', // 9: SKU
    item.category || 'Stock Transfer', // 10: Group
    item.itemName || '', // 11: Item Name
    0, // 12: Performa Qty
    item.quantity || 0, // 13: Inward
    0, // 14: Outward
    item.unit || 'Pcs', // 15: Unit
    2850, // 16: Taux
    0, // 17: Rate fc
    0, // 18: Rate usd
    0, // 19: Subtotal FC
    0, // 20: Subtotal USD
    0, // 21: TVA 16% FC
    0, // 22: Total-FC
    0, // 23: Total-USD
    0, // 24: Balance qty
    transfer.remarks || '', // 25: Remarks
    transfer.createdByEmail || '', // 26: CreatedByEmail
    transfer.driverOrCarrier || transfer.createdByName || '', // 27: Driver Name
    transfer.status || 'Completed', // 28: Status
    'Production' // 29 (Column AC): Production
  ]);

  // Whole challan as Consumption first, then whole challan as Production
  return [...consumptionRows, ...productionRows];
}

/**
 * Copy "club" sheet rows (with Consumption, Production & swapped locations) as TSV
 */
export async function copyTransferClubRowsToClipboard(transfer: StockTransfer): Promise<boolean> {
  const rows = formatTransferClubRows(transfer);
  if (rows.length === 0) return false;
  const tsv = rows.map(r => r.join('\t')).join('\n');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard writeText failed:', e);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Download "club" rows as CSV
 */
export function downloadTransferClubCsv(transfer: StockTransfer) {
  const rows = formatTransferClubRows(transfer);
  if (rows.length === 0) return;
  const headers = [...SHEET_COLUMNS.locationLedger, 'Movement Type'];
  const csvContent =
    headers.join(',') +
    '\n' +
    rows
      .map(r =>
        r
          .map(val => {
            const str = String(val ?? '');
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Club_Transfer_${transfer.challanNo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Append stock transfer into Google Sheet tab named "club".
 * Stamps "Consumption" in column AC, then duplicates with From/To swapped stamped "Production" in column AC.
 */
export async function appendTransferToClubSheet(
  spreadsheetId: string,
  transfer: StockTransfer,
  token?: string | null
): Promise<{ success: boolean; rowsCount: number; unauthorized?: boolean; error?: string }> {
  if (!transfer || !transfer.items || transfer.items.length === 0) {
    return { success: false, rowsCount: 0, error: 'No items in transfer.' };
  }

  const rows = formatTransferClubRows(transfer);

  // Cache locally
  try {
    const existing = JSON.parse(localStorage.getItem('floweasy_club_records') || '[]');
    const updated = [...rows, ...existing];
    localStorage.setItem('floweasy_club_records', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not cache club record locally:', err);
  }

  if (!spreadsheetId) {
    return { success: false, rowsCount: rows.length, error: 'No Google Spreadsheet connected.' };
  }

  // Apps Script Webhook
  const appsScriptUrl = localStorage.getItem('floweasy_apps_script_url');
  if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: 'club', rows })
      });
      return { success: true, rowsCount: rows.length };
    } catch (scriptErr: any) {
      console.warn('Apps Script club direct post failed:', scriptErr);
    }
  }

  if (!token) {
    return {
      success: false,
      rowsCount: rows.length,
      unauthorized: true,
      error: 'Google write authorization required to write into Google Sheet tab "club".'
    };
  }

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  const tabCandidates = ["'club'!A:AC", "'Club'!A:AC", "'CLUB'!A:AC", "club!A:AC", "Club!A:AC"];

  for (const tabName of tabCandidates) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
          tabName
        )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: rows })
        }
      );

      if (res.ok) {
        return { success: true, rowsCount: rows.length };
      }

      if (res.status === 401 || res.status === 403) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          rowsCount: rows.length,
          unauthorized: true,
          error: errJson.error?.message || 'Access token expired or permission denied.'
        };
      }
    } catch (err: any) {
      console.warn(`Append to tab ${tabName} failed, trying next:`, err);
    }
  }

  // Auto-create 'club' tab with 29 headers (Columns A to AC)
  try {
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'club',
                  gridProperties: { frozenRowCount: 1 }
                }
              }
            }
          ]
        })
      }
    );

    if (addSheetRes.ok) {
      const clubHeaders = [...SHEET_COLUMNS.locationLedger, 'Movement Type'];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'club'!A1:AC?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [clubHeaders, ...rows]
          })
        }
      );
      return { success: true, rowsCount: rows.length };
    }
  } catch (sheetCreateErr) {
    console.warn('Auto-creating club tab failed:', sheetCreateErr);
  }

  return {
    success: false,
    rowsCount: rows.length,
    error: 'Could not append rows to Google Sheet tab "club". Please check sheet permissions.'
  };
}

/**
 * Save transfer to sender location sheet (e.g. "kin-sh2"), "buro", and "club" tabs
 */
export async function saveTransferToGoogleSheets(
  spreadsheetId: string,
  transfer: StockTransfer,
  token?: string | null
): Promise<{
  success: boolean;
  locationSheetName: string;
  locationCount: number;
  buroCount: number;
  clubCount: number;
  unauthorized?: boolean;
  error?: string;
}> {
  const effectiveToken = token || getStoredAccessToken();
  const locationSheetName = getSheetNameForLocation(transfer.fromBranchName);

  // 1. Save to sender location sheet (e.g. "kin-sh2")
  const locRes = await appendTransferToLocationSheet(spreadsheetId, locationSheetName, transfer, effectiveToken);

  // 2. Also save to "buro" sheet tab if not already buro
  let buroRes: { success: boolean; rowsCount: number; unauthorized?: boolean; error?: string } = {
    success: true,
    rowsCount: 0,
    unauthorized: false,
    error: ''
  };
  if (locationSheetName.toLowerCase() !== 'buro') {
    buroRes = await appendTransferToLocationSheet(spreadsheetId, 'buro', transfer, effectiveToken);
  } else {
    buroRes = locRes;
  }

  // 3. Save to "club" sheet tab (Consumption & Production entries)
  const clubRes = await appendTransferToClubSheet(spreadsheetId, transfer, effectiveToken);

  const overallSuccess = locRes.success && clubRes.success;
  const isUnauthorized = locRes.unauthorized || clubRes.unauthorized || buroRes.unauthorized;
  const partialSuccess = locRes.success || clubRes.success || buroRes.success;

  let combinedError = '';
  if (!overallSuccess) {
    if (isUnauthorized) {
      combinedError =
        'Google write authorization (OAuth token) required to write into Google Sheets. Please click "Authorize Google Sheets" to sync.';
    } else {
      combinedError = [locRes.error, clubRes.error, buroRes.error].filter(Boolean).join(' | ');
    }
  }

  return {
    success: overallSuccess || partialSuccess,
    locationSheetName,
    locationCount: locRes.rowsCount,
    buroCount: buroRes.rowsCount,
    clubCount: clubRes.rowsCount,
    unauthorized: isUnauthorized,
    error: combinedError || undefined
  };
}

/**
 * Delete a challan from Google Sheets (removes matching rows from both "buro" and "club" tabs).
 */
export async function deleteTransferFromGoogleSheet(
  spreadsheetId: string,
  challanNo: string,
  token?: string | null
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (!spreadsheetId || !challanNo) {
    return { success: false, deletedCount: 0, error: 'Spreadsheet ID and Challan Number are required.' };
  }

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  // Try Apps Script webhook if available
  const appsScriptUrl = localStorage.getItem('floweasy_apps_script_url');
  if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', challanNo })
      });
      return { success: true, deletedCount: 1 };
    } catch (e) {
      console.warn('Apps Script delete failed:', e);
    }
  }

  if (!token) {
    return {
      success: false,
      deletedCount: 0,
      error: 'Google write authorization is required to delete rows from Google Sheet.'
    };
  }

  try {
    // 1. Get sheet IDs for buro and club tabs
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets(properties(sheetId,title))`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) {
      return { success: false, deletedCount: 0, error: 'Could not access spreadsheet metadata.' };
    }
    const metaJson = await metaRes.json();
    const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = metaJson.sheets || [];

    let totalDeleted = 0;
    const requests: any[] = [];

    // Check tabs "buro", "club", and location tabs starting with "kin-sh" (case-insensitive)
    const targetSheets = sheetsList.filter(s => {
      const t = s.properties.title.toLowerCase();
      return t === 'buro' || t === 'club' || t.startsWith('kin-sh');
    });

    for (const sheet of targetSheets) {
      const tabTitle = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;

      const colARes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodeURIComponent(tabTitle)}'!A:A`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (colARes.ok) {
        const colAJson = await colARes.json();
        const rows: any[][] = colAJson.values || [];
        const matchingIndices: number[] = [];

        rows.forEach((r, idx) => {
          if (idx === 0) return; // skip header row
          const val = String(r[0] || '').trim();
          if (val === challanNo.trim()) {
            matchingIndices.push(idx);
          }
        });

        // Delete from bottom to top so index shifts don't disrupt
        matchingIndices.sort((a, b) => b - a);
        matchingIndices.forEach(rIdx => {
          requests.push({
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rIdx,
                endIndex: rIdx + 1
              }
            }
          });
          totalDeleted++;
        });
      }
    }

    if (requests.length > 0) {
      const batchRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
      if (batchRes.ok) {
        return { success: true, deletedCount: totalDeleted };
      } else {
        const errJson = await batchRes.json().catch(() => ({}));
        return { success: false, deletedCount: 0, error: errJson.error?.message || 'Delete batch request failed.' };
      }
    }

    return { success: true, deletedCount: 0 };
  } catch (err: any) {
    return { success: false, deletedCount: 0, error: err.message || 'Error deleting from Google Sheet.' };
  }
}

/**
 * Fetch all stock transfers directly from user's Google Sheet (from tab "buro" or "club").
 * Reconstructs Challans so that only the user's real sheet data appears in the application.
 */
export async function fetchTransfersFromGoogleSheet(
  spreadsheetId: string,
  token?: string | null
): Promise<{ success: boolean; transfers: StockTransfer[]; error?: string }> {
  if (!spreadsheetId) {
    return { success: false, transfers: [], error: 'No spreadsheet ID provided.' };
  }

  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : spreadsheetId.trim();

  let rawRows: any[][] = [];

  // Try reading tab "buro" or "club"
  const tabCandidates = ["'buro'!A1:AB", "'club'!A1:AC", "buro!A1:AB", "club!A1:AC"];

  // Method 1: Google Sheets API with OAuth token
  if (token) {
    for (const cand of tabCandidates) {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(cand)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.values && json.values.length > 1) {
            rawRows = json.values;
            break;
          }
        }
      } catch (e) {
        console.warn('API fetch transfers failed for candidate:', cand, e);
      }
    }
  }

  // Method 2: Public CSV export
  if (rawRows.length <= 1) {
    const sheetNames = ['buro', 'Buro', 'BURO', 'club', 'Club'];
    for (const sName of sheetNames) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          sName
        )}`;
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.includes('<!DOCTYPE') && !text.includes('<html') && !text.includes('error')) {
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length > 1) {
              rawRows = lines.map(line =>
                line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim())
              );
              break;
            }
          }
        }
      } catch (e) {
        console.warn('GVIZ CSV fetch failed for candidate:', sName, e);
      }
    }
  }

  // Method 3: GVIZ JSON query
  if (rawRows.length <= 1) {
    const sheetNames = ['buro', 'Buro', 'club', 'Club'];
    for (const sName of sheetNames) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
          sName
        )}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const text = await res.text();
          const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const gvizRows = data.table?.rows || [];
            if (gvizRows.length > 0) {
              rawRows = gvizRows.map((r: any) => {
                const c = r.c || [];
                return c.map((cell: any) =>
                  cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : ''
                );
              });
              break;
            }
          }
        }
      } catch (e) {
        console.warn('GVIZ JSON fetch failed for candidate:', sName, e);
      }
    }
  }

  if (rawRows.length <= 1) {
    return { success: true, transfers: [] };
  }

  // Parse rows (skip header row if row 0 has "Challan/Bill No.")
  const startIndex = String(rawRows[0][0] || '').toLowerCase().includes('challan') ? 1 : 0;
  const challanMap = new Map<string, StockTransfer>();

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const challanNo = String(row[0] || '').trim();
    if (!challanNo) continue;

    // If reading from club tab with "Production", skip the duplicate "Production" row
    const movementType = String(row[28] || '').trim().toLowerCase();
    if (movementType === 'production') {
      continue;
    }

    const date = String(row[1] || '').trim() || new Date().toISOString().split('T')[0];
    const transType = String(row[3] || 'Bon-Stock Transfer').trim();
    const fromName = String(row[6] || '').trim() || 'Origin';
    const toName = String(row[7] || '').trim() || 'Destination';
    const sku = String(row[8] || '').trim();
    const group = String(row[9] || '').trim();
    const itemName = String(row[10] || '').trim() || sku || 'Item';
    const outwardQty = parseFloat(String(row[13] || 0)) || 0;
    const inwardQty = parseFloat(String(row[12] || 0)) || 0;
    const quantity = outwardQty > 0 ? outwardQty : (inwardQty > 0 ? inwardQty : 1);
    const unit = String(row[14] || 'Pcs').trim();
    const remarks = String(row[24] || '').trim();
    const email = String(row[25] || '').trim() || 'hr.rftcom@gmail.com';
    const driver = String(row[26] || '').trim();
    const status = (String(row[27] || 'Completed').trim()) as any;

    if (!challanMap.has(challanNo)) {
      challanMap.set(challanNo, {
        id: `trf-${challanNo.replace(/[^a-zA-Z0-9]/g, '-')}`,
        challanNo,
        date,
        transactionType: transType,
        fromBranchId: `branch-${fromName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        fromBranchName: fromName,
        toBranchId: `branch-${toName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        toBranchName: toName,
        items: [],
        totalItems: 0,
        totalQuantity: 0,
        driverOrCarrier: driver,
        remarks,
        createdByEmail: email,
        createdByName: email.split('@')[0],
        createdAt: date,
        status:
          status === 'Completed' || status === 'Pending' || status === 'In Transit' || status === 'Cancelled'
            ? status
            : 'Completed'
      });
    }

    const existingTransfer = challanMap.get(challanNo)!;
    if (!existingTransfer.items.some(it => it.itemCode === sku && it.itemName === itemName)) {
      existingTransfer.items.push({
        itemCode: sku,
        itemName,
        quantity,
        unit,
        category: group,
        remarks
      });
      existingTransfer.totalItems = existingTransfer.items.length;
      existingTransfer.totalQuantity += quantity;
    }
  }

  const resultTransfers = Array.from(challanMap.values());
  return { success: true, transfers: resultTransfers };
}



