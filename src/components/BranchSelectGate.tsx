import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  FileText,
  Mail,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Database,
  Layers
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Branch } from '../types';

export const BranchSelectGate: React.FC = () => {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    confirmBranchSelection,
    loadBranchesFromGoogleSheet,
    sheetConfig,
    currentUser,
    logout,
    company
  } = useInventory();

  // Local state for dropdown selection and Google Sheet fetcher
  const [localBranchId, setLocalBranchId] = useState<string>(() => {
    // If current user email matches a branch's email, auto-select it
    const matchingBranch = branches.find(
      b => b.email && b.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (matchingBranch) return matchingBranch.id;
    return selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id || '');
  });

  const [customSheetUrl, setCustomSheetUrl] = useState<string>(
    sheetConfig.spreadsheetUrl || sheetConfig.spreadsheetId || ''
  );
  const [syncMode, setSyncMode] = useState<'link' | 'paste'>('link');
  const [pastedCsv, setPastedCsv] = useState<string>(
    'Email ID,Inv Prefix,Location Name,Address,RCCM,Impo ,ID nat\nitkinshasa1@gmail.com,Test,KIn,Gombe,123test,123test,123test'
  );
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [sheetFeedback, setSheetFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showSheetConfig, setShowSheetConfig] = useState<boolean>(false);

  // Keep local branch selection synced if branches list changes
  useEffect(() => {
    if (branches.length > 0 && !branches.some(b => b.id === localBranchId)) {
      const matchingBranch = branches.find(
        b => b.email && b.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      setLocalBranchId(matchingBranch ? matchingBranch.id : branches[0].id);
    }
  }, [branches, currentUser.email]);

  const selectedBranch: Branch | undefined = branches.find(b => b.id === localBranchId) || branches[0];

  const handleConfirm = () => {
    if (!localBranchId && branches.length > 0) {
      confirmBranchSelection(branches[0].id);
      return;
    }
    confirmBranchSelection(localBranchId);
  };

  const handleFetchFromSheet = async (overrideValue?: string) => {
    setIsFetchingSheet(true);
    setSheetFeedback({ type: null, message: '' });
    try {
      const target = (overrideValue !== undefined ? overrideValue : customSheetUrl).trim();
      if (!target) {
        setSheetFeedback({
          type: 'error',
          message: 'Please enter your Google Sheet link or paste branch data.'
        });
        setIsFetchingSheet(false);
        return;
      }

      const res = await loadBranchesFromGoogleSheet(target);
      if (res.success) {
        setSheetFeedback({
          type: 'success',
          message: `Successfully loaded ${res.count} active branch location(s)! Ready to enter.`
        });
      } else {
        setSheetFeedback({
          type: 'error',
          message: res.error || 'Failed to read branches from "branch name" tab.'
        });
      }
    } catch (err: any) {
      setSheetFeedback({
        type: 'error',
        message: err.message || 'Error communicating with Google Sheets.'
      });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900">
      {/* Top Bar with User Info & Logout */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {company.companyName || 'Flow Easy'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Multi-Branch Inventory & Location Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500">{currentUser.email}</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-blue-100 text-blue-800 tracking-wide">
            {currentUser.role}
          </span>
          <button
            id="gate-logout-btn"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
            title="Sign Out / Switch Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-900 text-white px-6 py-5 sm:px-8 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Location Access Gate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Select Your Operating Branch Location
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              To prevent cross-location errors and ensure staff enter records exclusively into their designated shop/warehouse, please choose your active branch before entering the dashboard.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Branch Selection Dropdown */}
            <div>
              <label
                htmlFor="gate-branch-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Operating Branch / Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="gate-branch-select"
                  value={localBranchId}
                  onChange={e => setLocalBranchId(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-300 rounded-lg px-4 pr-10 text-sm sm:text-base font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer shadow-xs"
                >
                  {branches.length === 0 ? (
                    <option value="">No branches configured</option>
                  ) : (
                    branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.address ? `— ${b.address}` : ''} {b.invPrefix ? `[Prefix: ${b.invPrefix}]` : ''} {b.email ? `(${b.email})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Confirm & Enter Button */}
            <div>
              <button
                id="gate-confirm-enter-btn"
                onClick={handleConfirm}
                disabled={!selectedBranch}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <span>Confirm & Enter {selectedBranch?.name || 'Branch'} Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Google Sheets Tab 'branch name' Sync Section */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  id="toggle-sheet-sync-btn"
                  onClick={() => setShowSheetConfig(prev => !prev)}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 focus:outline-hidden"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {showSheetConfig
                      ? 'Hide Google Sheet Branch Synchronizer'
                      : 'Fetch Latest Branches from Google Sheet ("branch name")'}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {branches.length} Location(s) Ready
                </span>
              </div>

              {showSheetConfig && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  {/* Mode Selector Tabs */}
                  <div className="flex border-b border-slate-200 pb-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSyncMode('link')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        syncMode === 'link'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Google Sheet Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyncMode('paste')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        syncMode === 'paste'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Paste CSV Data Directly
                    </button>
                  </div>

                  {syncMode === 'link' ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded p-2">
                        <span className="font-bold text-amber-800">Important Sharing Step:</span> In your Google Sheet, click{' '}
                        <strong>Share</strong> (top right) &rarr; set <em>General Access</em> to{' '}
                        <strong>"Anyone with the link" (Viewer)</strong>. Otherwise Google blocks external apps from reading it.
                      </div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Google Sheet Link or Spreadsheet ID:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={customSheetUrl}
                          onChange={e => setCustomSheetUrl(e.target.value)}
                          placeholder="Paste Google Sheet URL (e.g. https://docs.google.com/spreadsheets/d/...)"
                          className="flex-1 text-xs bg-white border border-slate-300 rounded px-3 py-2 font-mono text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          id="gate-fetch-sheet-btn"
                          onClick={() => handleFetchFromSheet()}
                          disabled={isFetchingSheet}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                          <span>{isFetchingSheet ? 'Fetching...' : 'Fetch Branches'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600">
                        Paste your branch rows directly (comma-separated). No Google permissions needed:
                      </p>
                      <textarea
                        rows={3}
                        value={pastedCsv}
                        onChange={e => setPastedCsv(e.target.value)}
                        placeholder="Email ID,Inv Prefix,Location Name,Address,RCCM,Impo ,ID nat&#10;itkinshasa1@gmail.com,Test,KIn,Gombe,123test,123test,123test"
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded p-2 text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleFetchFromSheet(pastedCsv)}
                          disabled={isFetchingSheet || !pastedCsv.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply Branch Data Directly</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {sheetFeedback.type && (
                    <div
                      className={`p-2.5 rounded text-xs flex flex-col gap-1.5 ${
                        sheetFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {sheetFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        )}
                        <span className="leading-relaxed">{sheetFeedback.message}</span>
                      </div>
                      {sheetFeedback.type === 'error' && syncMode === 'link' && (
                        <button
                          type="button"
                          onClick={() => setSyncMode('paste')}
                          className="self-start text-[11px] font-bold text-blue-700 underline hover:text-blue-900 mt-1 cursor-pointer"
                        >
                          Click here to paste your CSV rows directly instead &rarr;
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-3 text-xs text-slate-400">
        Flow Easy &copy; {new Date().getFullYear()} &bull; Multi-Branch Multi-Location Ledger
      </footer>
    </div>
  );
};
