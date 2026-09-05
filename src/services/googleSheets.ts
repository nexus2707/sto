import { StockItem, StockTransfer, Invoice, Branch, AuthorizedUser } from '../types';

export const OAUTH_CLIENT_ID = '896903801673-jmp1se6h1j6842mfkuh6v3i6a7oc40g9.apps.googleusercontent.com';
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
          client_id: OAUTH_CLIENT_ID,
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
        client_id: OAUTH_CLIENT_ID,
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
