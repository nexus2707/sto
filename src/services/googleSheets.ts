import { StockItem, StockTransfer, Invoice, Branch, AuthorizedUser } from '../types';

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
    'Challan/Bill Date',
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

export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
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
            resolve(resp.access_token);
          }
        },
        error_callback: (err: any) => reject(err)
      });
      client.requestAccessToken({ prompt: 'consent' });
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
        'Google Sheet is private or requires sign-in. To allow Flow Easy to read it: In Google Sheets, click "Share" (top-right), change General Access from "Restricted" to "Anyone with the link" (Viewer), and copy the link. Or use "Paste Data Directly" below.'
      );
    }
    throw new Error(
      'Could not retrieve data from sheet tab "branch name". Please verify that the spreadsheet is shared ("Anyone with the link" as Viewer) and contains data for Location Name, Invoice Prefix, Address, etc.'
    );
  }

  const parsedBranches: Branch[] = [];

  rawRows.forEach((row, idx) => {
    // Columns:
    // 0: Email ID
    // 1: Inv Prefix
    // 2: Location Name
    // 3: Address
    // 4: RCCM
    // 5: Impo
    // 6: ID nat
    const email = String(row[0] || '').trim();
    const invPrefix = String(row[1] || '').trim();
    const locationName = String(row[2] || '').trim();
    const address = String(row[3] || '').trim();
    const rccm = String(row[4] || '').trim();
    const impot = String(row[5] || '').trim();
    const idNat = String(row[6] || '').trim();

    // Do not show empty cells/rows where locationName, email, and invPrefix are all blank
    if (!locationName && !email && !invPrefix) {
      return;
    }

    // Filter out header row if present
    if (
      email.toLowerCase().includes('email') ||
      invPrefix.toLowerCase().includes('prefix') ||
      locationName.toLowerCase().includes('location') ||
      rccm.toLowerCase() === 'rccm'
    ) {
      return;
    }

    const safeName = locationName || (email ? email.split('@')[0] : `Branch ${idx + 1}`);
    const safeCode = invPrefix || safeName.toUpperCase().slice(0, 4);
    const safeId = `branch-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-') || idx + 1}`;

    parsedBranches.push({
      id: safeId,
      name: safeName,
      code: safeCode,
      invPrefix: invPrefix || safeCode,
      address: address || 'Main Branch Address',
      city: locationName || 'Main City',
      phone: '',
      email: email || '',
      rccm: rccm || '',
      impot: impot || '',
      idNat: idNat || '',
      isHeadquarters: idx === 0
    });
  });

  if (parsedBranches.length === 0) {
    throw new Error('No valid non-empty branch records found in the sheet.');
  }

  return parsedBranches;
}

