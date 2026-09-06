import React, { useState } from 'react';
import {
  Settings,
  FileSpreadsheet,
  Users,
  Building2,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lock,
  Key,
  DollarSign,
  Copy,
  HelpCircle,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { AuthorizedUser, Branch } from '../types';
import {
  getOAuthClientId,
  setOAuthClientId,
  DEFAULT_OAUTH_CLIENT_ID
} from '../services/googleSheets';

export const SettingsView: React.FC = () => {
  const {
    company,
    updateCompany,
    branches,
    setBranches,
    authorizedUsers,
    addAuthorizedUser,
    removeAuthorizedUser,
    sheetConfig,
    connectGoogleSheet,
    syncWithGoogleSheet,
    fetchStockMasterFromCloud,
    createNewCloudSpreadsheet,
    currentUser
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'sheet' | 'users' | 'company' | 'branches'>('sheet');

  // Google Sheet Form State
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(sheetConfig.spreadsheetId);
  const [oauthClientIdInput, setOauthClientIdInput] = useState(getOAuthClientId());
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingStock, setIsFetchingStock] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'storekeeper' | 'sales'>('storekeeper');
  const [newUserBranch, setNewUserBranch] = useState(branches[0]?.id || 'branch-1');

  // Company Form State
  const [companyForm, setCompanyForm] = useState({ ...company });

  // New Branch Form State
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // Handle Sheet Connection
  const handleSaveSheetId = () => {
    if (!spreadsheetIdInput.trim()) {
      alert('Please enter a valid Google Spreadsheet ID or URL');
      return;
    }

    // Extract ID if full URL pasted
    let id = spreadsheetIdInput.trim();
    const urlMatch = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      id = urlMatch[1];
      setSpreadsheetIdInput(id);
    }

    connectGoogleSheet(id);
    setStatusMessage('Google Spreadsheet ID updated & connected.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveOAuthClientId = () => {
    if (!oauthClientIdInput.trim()) {
      alert('Please enter a valid Google OAuth Client ID or reset to default.');
      return;
    }
    setOAuthClientId(oauthClientIdInput.trim());
    setStatusMessage('Google OAuth Client ID saved.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleResetOAuthClientId = () => {
    setOAuthClientId(DEFAULT_OAUTH_CLIENT_ID);
    setOauthClientIdInput(DEFAULT_OAUTH_CLIENT_ID);
    setStatusMessage('Reset OAuth Client ID to default.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCopyOrigin = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 3000);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const newId = await createNewCloudSpreadsheet();
      setSpreadsheetIdInput(newId);
      setStatusMessage('Created new pre-formatted Google Sheet and synced all data successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to auto-create Google Sheet.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      await syncWithGoogleSheet();
      setStatusMessage('Data synchronized to Google Sheet across all predefined tables!');
    } catch (err: any) {
      alert(err.message || 'Failed to sync with Google Sheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchStockNow = async () => {
    setIsFetchingStock(true);
    setStatusMessage(null);
    try {
      await fetchStockMasterFromCloud();
      setStatusMessage('Stock Master successfully pulled and updated from Google Sheet!');
    } catch (err: any) {
      alert(err.message || 'Failed to fetch Stock Master.');
    } finally {
      setIsFetchingStock(false);
    }
  };

  // User Management Handlers
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) {
      alert('Please enter user email and name');
      return;
    }

    const branch = branches.find(b => b.id === newUserBranch);
    addAuthorizedUser({
      email: newUserEmail.trim(),
      name: newUserName.trim(),
      role: newUserRole,
      assignedBranchId: newUserBranch,
      assignedBranchName: branch?.name || 'All Branches'
    });

    setNewUserEmail('');
    setNewUserName('');
    setStatusMessage(`User "${newUserName}" (${newUserEmail}) authorized.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Company Settings Update
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany({
      ...companyForm,
      defaultExchangeRate: Number(companyForm.defaultExchangeRate),
      defaultTvaRate: Number(companyForm.defaultTvaRate)
    });
    setStatusMessage('Company information and exchange rates saved successfully.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Branch Add
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) {
      alert('Please provide branch name and code');
      return;
    }

    const newB: Branch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      code: newBranchCode.trim().toUpperCase(),
      city: newBranchCity.trim() || 'Kinshasa',
      address: newBranchAddress.trim() || '',
      phone: newBranchPhone.trim() || company.phone,
      isHeadquarters: false
    };

    setBranches(prev => [...prev, newB]);
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchCity('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setStatusMessage(`Branch "${newB.name}" added successfully.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (branches.length <= 1) {
      alert('Cannot delete the last remaining branch.');
      return;
    }
    if (confirm(`Are you sure you want to delete branch "${name}"?`)) {
      setBranches(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-900" />
          <span>Settings & Cloud Integration</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure Google Sheets real-time synchronization, authorized user emails, branch locations, and fiscal settings.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sheet'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>User Email Authorization</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Company & Fiscal Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'branches'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Shop Branches ({branches.length})</span>
        </button>
      </div>

      {/* TAB 1: Google Sheets Real-Time Synchronization */}
      {activeTab === 'sheet' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Google Sheets Cloud Database
                  </h2>
                  <p className="text-xs text-slate-500">
                    Predefined structured columns for StockMaster, StockTransfers, Invoices, and Locations.
                  </p>
                </div>
              </div>

              {sheetConfig.spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-blue-900 hover:bg-slate-200 transition-colors"
                >
                  <span>Open Sheet in Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Security Isolation Notice requested by user */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Security Protection Architecture:</strong> Authorized users can only access this web application and record stock transfers and invoices through the system UI. They do <em>not</em> receive direct edit links or permission to open your master Google Sheet, keeping your raw cloud sheet completely protected from tampering.
              </div>
            </div>

            {/* Spreadsheet ID config */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Google Spreadsheet ID or Full URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="google-sheet-id-input"
                  type="text"
                  value={spreadsheetIdInput}
                  onChange={e => setSpreadsheetIdInput(e.target.value)}
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or paste full link"
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-blue-900 font-mono"
                />
                <button
                  id="connect-sheet-btn"
                  onClick={handleSaveSheetId}
                  className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shadow-xs"
                >
                  Connect Spreadsheet
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Connected Sheet: <code className="text-slate-700">{sheetConfig.spreadsheetId || 'None'}</code>
                {sheetConfig.lastSynced && (
                  <span className="ml-2">• Last Synced: {new Date(sheetConfig.lastSynced).toLocaleString()}</span>
                )}
              </p>
            </div>

            {/* Cloud Sync Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                id="create-cloud-sheet-btn"
                onClick={handleCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingSheet ? 'Creating Sheet...' : 'Auto-Generate Formatted Google Sheet'}</span>
              </button>

              <button
                id="sync-now-cloud-btn"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Tables...' : 'Sync All Data to Google Sheet'}</span>
              </button>

              <button
                id="get-stock-master-cloud-btn"
                onClick={handleFetchStockNow}
                disabled={isFetchingStock}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isFetchingStock ? 'Retrieving...' : 'Get Stock Master from Google Sheet'}</span>
              </button>
            </div>

            {/* Google OAuth & Error 400 Origin Mismatch Guide */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-bold text-amber-900 text-sm">
                    Fixing "Access blocked: Error 400: origin_mismatch"
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Google OAuth requires the exact web address (Origin URL) of this app to be registered in your Google Cloud Console project under <strong>Authorized JavaScript origins</strong>. When you open the app on a new URL or preview domain that isn't on that list, Google blocks the sign-in popup with this error.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800">Your Current App Origin:</span>
                    <code className="px-2.5 py-1 bg-white border border-amber-300 rounded-md font-mono text-[11px] text-blue-900 font-bold select-all">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://...'}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-semibold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedOrigin ? 'Copied to Clipboard!' : 'Copy Origin URL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* OAuth Client ID customizer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Google Cloud OAuth 2.0 Client ID:
                  </label>
                  <button
                    type="button"
                    onClick={handleResetOAuthClientId}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="google-oauth-client-id-input"
                    type="text"
                    value={oauthClientIdInput}
                    onChange={e => setOauthClientIdInput(e.target.value)}
                    placeholder="Enter your Google OAuth Client ID (.apps.googleusercontent.com)"
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-blue-900 font-mono bg-white"
                  />
                  <button
                    id="save-oauth-client-id-btn"
                    onClick={handleSaveOAuthClientId}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                  >
                    Save Client ID
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 leading-relaxed">
                  <p>
                    <strong>How to register your origin in Google Cloud Console:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600 pl-1">
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">Google Cloud Console &gt; Credentials</a>.</li>
                    <li>Click on your <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
                    <li>Under <strong>Authorized JavaScript origins</strong>, click <strong>+ ADD URI</strong> and paste your origin URL (<code className="text-slate-800 bg-slate-200 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}</code>).</li>
                    <li>Click <strong>Save</strong>. (Note: Google changes take 1 to 5 minutes to propagate worldwide).</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Predefined Columns Schema Documentation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Unified 28-Column Branch Location Ledger Format</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Standard header structure for individual branch/location sheets (e.g. <code>KIN</code>, <code>BRC</code>, <code>LUSI</code>) tracking Transfers, Factures, Proformas, and Purchases.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
              <div className="text-[11px] font-mono text-slate-700 whitespace-nowrap leading-relaxed">
                <div className="font-bold text-blue-900 pb-2 mb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>28 Columns Sequence (Copy to Sheet Row 1):</span>
                  <span className="text-[10px] text-slate-500 font-sans font-normal">A to AB</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
                  <span className="p-1.5 bg-white rounded border border-slate-200">A: Challan/Bill No.</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">B: Challan/Bill Date</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">C: Due date</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">D: Transaction type</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">E: Client / Supplier Name</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">F: Client Address</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">G: From</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">H: To</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">I: SKU</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">J: Group</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">K: Item Name</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">L: Performa Qty</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">M: Inward</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">N: Outward</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">O: Unit</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">P: Taux</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">Q: Rate fc</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">R: Rate usd</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">S: Subtotal FC</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">T: Subtotal USD</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">U: TVA 16% FC</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">V: Total-FC</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">W: Total-USD</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">X: Balance qty</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">Y: Remarks</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">Z: CreatedByEmail</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">AA: Driver Name</span>
                  <span className="p-1.5 bg-white rounded border border-slate-200">AB: Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: User Email Authorization */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Authorized User Email Access Control
                </h2>
                <p className="text-xs text-slate-500">
                  Strictly authorize user emails who can access this webapp and make entries. Only creator can alter/delete entries.
                </p>
              </div>
            </div>

            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Authorize New Staff User Email
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">User Email *</label>
                  <input
                    id="new-user-email-input"
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="user@rftglobal.com"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    id="new-user-name-input"
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. John Kasongo"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="storekeeper">Storekeeper</option>
                    <option value="sales">Sales Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Branch</label>
                  <select
                    value={newUserBranch}
                    onChange={e => setNewUserBranch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="add-authorized-user-btn"
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Authorize Email Access
                </button>
              </div>
            </form>

            {/* List of Authorized Users */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Authorized Email</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Assigned Branch</th>
                    <th className="py-2.5 px-4 text-center">Creator Alter Rights</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authorizedUsers.map(user => {
                    const isSelf = user.email.toLowerCase() === currentUser.email.toLowerCase();

                    return (
                      <tr key={user.email} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {user.email}
                          {isSelf && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-sans">
                              Current Session
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{user.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'sales'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{user.assignedBranchName}</td>
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">
                          Can alter & delete entries created by {user.email}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isSelf && user.role !== 'admin' && (
                            <button
                              onClick={() => removeAuthorizedUser(user.email)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Revoke access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Company & Fiscal Setup */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Company Fiscal & Invoicing Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Tax ID numbers, company legal identity, and default currency conversion rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                value={companyForm.companyName}
                onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax Number (NIF) *</label>
              <input
                type="text"
                required
                value={companyForm.taxNumber}
                onChange={e => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RCCM Registration No</label>
              <input
                type="text"
                value={companyForm.rccm}
                onChange={e => setCompanyForm({ ...companyForm, rccm: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">National ID (ID NAT)</label>
              <input
                type="text"
                value={companyForm.nationalId}
                onChange={e => setCompanyForm({ ...companyForm, nationalId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Currency Exchange Rate (1 USD = ___ FC) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={companyForm.defaultExchangeRate}
                onChange={e => setCompanyForm({ ...companyForm, defaultExchangeRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default TVA Tax Rate (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={companyForm.defaultTvaRate}
                onChange={e => setCompanyForm({ ...companyForm, defaultTvaRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Invoice Terms & Bank Details</label>
            <textarea
              rows={3}
              value={companyForm.footerNotes}
              onChange={e => setCompanyForm({ ...companyForm, footerNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              id="save-company-settings-btn"
              type="submit"
              className="px-5 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
            >
              Save Company Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Shop Branches */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Multi-Branch & Shop Address Configuration
              </h2>
              <p className="text-xs text-slate-500">
                "Company name and tax number are same but the shops address are differ need each shop branch format of invoice and stock transfer."
              </p>
            </div>

            {/* Add Branch Form */}
            <form onSubmit={handleAddBranch} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Add New Shop Branch Location
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={e => setNewBranchName(e.target.value)}
                    placeholder="e.g. Kolwezi Mining Depot"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={newBranchCode}
                    onChange={e => setNewBranchCode(e.target.value)}
                    placeholder="e.g. KLZ-01"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newBranchCity}
                    onChange={e => setNewBranchCity(e.target.value)}
                    placeholder="e.g. Kolwezi"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Specific Shop Address (Prints on this branch's invoices & challans) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchAddress}
                    onChange={e => setNewBranchAddress(e.target.value)}
                    placeholder="e.g. 144 Avenue Laurent Désiré Kabila, Kolwezi"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Direct Phone</label>
                  <input
                    type="text"
                    value={newBranchPhone}
                    onChange={e => setNewBranchPhone(e.target.value)}
                    placeholder="+243 99 777 6655"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Add Branch Location
                </button>
              </div>
            </form>

            {/* List of Branches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map(b => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-900" />
                      <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {b.code}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>📍 <strong>Shop Address:</strong> {b.address}</p>
                    <p>City: {b.city} | Tel: {b.phone || 'N/A'}</p>
                  </div>

                  {b.isHeadquarters ? (
                    <span className="inline-block text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      Headquarters (Main Hub)
                    </span>
                  ) : (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleDeleteBranch(b.id, b.name)}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Branch
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
