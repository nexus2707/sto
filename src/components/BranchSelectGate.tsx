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
  Layers,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  X,
  Check,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Branch, AuthorizedUser, UserRole } from '../types';

export const BranchSelectGate: React.FC = () => {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    confirmBranchSelection,
    loadBranchesFromGoogleSheet,
    loadAuthorizedUsersFromGoogleSheet,
    sheetConfig,
    currentUser,
    isAdmin,
    authorizedUsers,
    addAuthorizedUser,
    updateAuthorizedUser,
    removeAuthorizedUser,
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

  // User Management Modal State (for hr.rftcom@gmail.com)
  const [showUserMgmtModal, setShowUserMgmtModal] = useState<boolean>(false);
  const [userMgmtTab, setUserMgmtTab] = useState<'list' | 'add'>('list');
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);
  const [userFeedback, setUserFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Add User Form State
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newBranchId, setNewBranchId] = useState<string>(branches[0]?.id || '');
  const [newRole, setNewRole] = useState<UserRole>('creator');

  // Edit User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('creator');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Keep local branch selection synced if branches list changes
  useEffect(() => {
    if (!isAdmin && currentUser.assignedBranchId) {
      setLocalBranchId(currentUser.assignedBranchId);
    } else if (branches.length > 0 && !branches.some(b => b.id === localBranchId)) {
      const matchingBranch = branches.find(
        b => b.email && b.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      setLocalBranchId(matchingBranch ? matchingBranch.id : branches[0].id);
    }
  }, [branches, currentUser.email, currentUser.assignedBranchId, isAdmin]);

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

  // User Management Actions
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback({ type: null, message: '' });

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setUserFeedback({
        type: 'error',
        message: 'Please provide a valid email address (e.g. staff@gmail.com).'
      });
      return;
    }

    // Strictly enforce: only hr.rftcom@gmail.com is admin
    const assignedRole: UserRole = cleanEmail === 'hr.rftcom@gmail.com' ? 'admin' : (newRole === 'admin' ? 'creator' : newRole);

    addAuthorizedUser({
      email: cleanEmail,
      name: newName.trim() || cleanEmail.split('@')[0],
      assignedBranchId: newBranchId || branches[0]?.id || 'branch-kin',
      role: assignedRole,
      status: 'active'
    });

    setUserFeedback({
      type: 'success',
      message: `User ${cleanEmail} successfully authorized and saved! Synced to Google Sheet tab "address" (Col A).`
    });

    setNewEmail('');
    setNewName('');
    setUserMgmtTab('list');
  };

  const handleStartEdit = (user: AuthorizedUser) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditBranchId(user.assignedBranchId || branches[0]?.id || '');
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = (userId: string) => {
    const targetUser = authorizedUsers.find(u => u.id === userId);
    if (!targetUser) return;

    // Enforce that only hr.rftcom@gmail.com is admin
    const cleanRole: UserRole = targetUser.email.toLowerCase() === 'hr.rftcom@gmail.com' ? 'admin' : (editRole === 'admin' ? 'creator' : editRole);

    updateAuthorizedUser(userId, {
      name: editName.trim() || targetUser.name,
      assignedBranchId: editBranchId,
      role: cleanRole,
      status: editStatus
    });

    setEditingUserId(null);
    setUserFeedback({
      type: 'success',
      message: `Updated profile for ${targetUser.email}.`
    });
  };

  const handleRemoveUser = (userId: string, email: string) => {
    if (email.toLowerCase() === 'hr.rftcom@gmail.com') {
      alert('The primary administrator account (hr.rftcom@gmail.com) cannot be removed.');
      return;
    }

    if (window.confirm(`Are you sure you want to revoke access for ${email}?`)) {
      removeAuthorizedUser(userId);
      setUserFeedback({
        type: 'success',
        message: `Revoked authorization for ${email}.`
      });
    }
  };

  const handleSyncUsersFromSheet = async () => {
    setIsFetchingUsers(true);
    setUserFeedback({ type: null, message: '' });
    try {
      const target = (customSheetUrl || sheetConfig.spreadsheetId || '').trim();
      if (!target) {
        setUserFeedback({
          type: 'error',
          message: 'Please connect a Google Sheet URL first in the Synchronizer section below.'
        });
        setIsFetchingUsers(false);
        return;
      }

      const res = await loadAuthorizedUsersFromGoogleSheet(target);
      if (res.success) {
        setUserFeedback({
          type: 'success',
          message: `Successfully loaded ${res.count} authorized user(s) from sheet tab "address" (Column A)!`
        });
      } else {
        setUserFeedback({
          type: 'error',
          message: res.error || 'Could not find authorized emails in sheet tab "address" Column A.'
        });
      }
    } catch (err: any) {
      setUserFeedback({
        type: 'error',
        message: err.message || 'Error fetching users from sheet.'
      });
    } finally {
      setIsFetchingUsers(false);
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
              {company.companyName || 'Easy Flow'}
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
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="gate-branch-select"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Operating Branch / Location <span className="text-red-500">*</span>
                </label>
                {!isAdmin && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Locked to your profile
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  id="gate-branch-select"
                  value={localBranchId}
                  disabled={!isAdmin}
                  onChange={e => setLocalBranchId(e.target.value)}
                  className={`w-full h-12 border border-slate-300 rounded-lg px-4 pr-10 text-sm sm:text-base font-semibold text-slate-800 transition-all shadow-xs ${
                    !isAdmin
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed opacity-90'
                      : 'bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer'
                  }`}
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
              {!isAdmin && (
                <p className="text-[11px] text-slate-500 mt-1.5 italic">
                  Branch switching is restricted exclusively to Administrator <strong className="font-mono text-slate-700">hr.rftcom@gmail.com</strong>.
                </p>
              )}
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

            {/* Option to Add/Edit Users for hr.rftcom@gmail.com */}
            {isAdmin ? (
              <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        Authorized Personnel & User Directory
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-200 text-purple-900 uppercase">
                        Admin Access
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {authorizedUsers.length} authorized user(s) &bull; Auto-synced with sheet <strong>"address" (Col A)</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="gate-manage-users-btn"
                  onClick={() => {
                    setShowUserMgmtModal(true);
                    setUserFeedback({ type: null, message: '' });
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-purple-200" />
                  <span>Add / Edit Users</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Verified Session:</span> {currentUser.email} ({currentUser.role}). Branch permissions are managed exclusively by Administrator <strong>hr.rftcom@gmail.com</strong>.
                </div>
              </div>
            )}

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

      {/* Admin User Management Modal (hr.rftcom@gmail.com only) */}
      {showUserMgmtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Authorized Users & Access Control
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase">
                      Admin: hr.rftcom@gmail.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Manage authorized staff &bull; Automatically synchronized with Google Sheet tab <strong>"address" (Column A)</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-user-mgmt-modal-btn"
                onClick={() => {
                  setShowUserMgmtModal(false);
                  setEditingUserId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync & Auto-Fetch Status Bar */}
            <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-purple-900">
                <Database className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  Auto-sync active: Data is fetched on app startup from sheet tab <strong>"address" (Col A)</strong>.
                </span>
              </div>
              <button
                type="button"
                id="sync-users-from-sheet-btn"
                onClick={handleSyncUsersFromSheet}
                disabled={isFetchingUsers}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingUsers ? 'animate-spin' : ''}`} />
                <span>{isFetchingUsers ? 'Syncing...' : 'Refresh from Sheet Tab "address"'}</span>
              </button>
            </div>

            {/* Feedback Alert */}
            {userFeedback.type && (
              <div
                className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  userFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {userFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{userFeedback.message}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 pt-3 gap-2">
              <button
                type="button"
                id="user-tab-list"
                onClick={() => setUserMgmtTab('list')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  userMgmtTab === 'list'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Authorized Users ({authorizedUsers.length})</span>
              </button>
              <button
                type="button"
                id="user-tab-add"
                onClick={() => setUserMgmtTab('add')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  userMgmtTab === 'add'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New User</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: LIST USERS */}
              {userMgmtTab === 'list' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>
                      Registered accounts authorized to access the system:
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Total: {authorizedUsers.length}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {authorizedUsers.map(user => {
                      const isSoleAdmin = user.email.toLowerCase() === 'hr.rftcom@gmail.com';
                      const isEditing = editingUserId === user.id;
                      const userBranch = branches.find(b => b.id === user.assignedBranchId);

                      if (isEditing) {
                        return (
                          <div key={user.id} className="p-4 bg-purple-50/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 font-mono">
                                Editing: {user.email}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {isSoleAdmin ? 'Admin Role Protected' : 'Role & Branch Settings'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Display Name:
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Assigned Branch:
                                </label>
                                <select
                                  value={editBranchId}
                                  onChange={e => setEditBranchId(e.target.value)}
                                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                                >
                                  {branches.map(b => (
                                    <option key={b.id} value={b.id}>
                                      {b.name} ({b.address || b.id})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Role:
                                </label>
                                <select
                                  value={isSoleAdmin ? 'admin' : editRole}
                                  disabled={isSoleAdmin}
                                  onChange={e => setEditRole(e.target.value as UserRole)}
                                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-600 disabled:bg-slate-100 disabled:text-slate-500"
                                >
                                  {isSoleAdmin ? (
                                    <option value="admin">Administrator (Exclusive)</option>
                                  ) : (
                                    <>
                                      <option value="creator">Creator (Can Create & Edit Transfers)</option>
                                      <option value="staff">Staff (General Access)</option>
                                    </>
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Account Status:
                                </label>
                                <select
                                  value={editStatus}
                                  onChange={e => setEditStatus(e.target.value as 'active' | 'inactive')}
                                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(user.id)}
                                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={user.id}
                          className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                {user.name}
                              </span>
                              {isSoleAdmin ? (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 rounded border border-purple-200">
                                  Sole Admin (Protected)
                                </span>
                              ) : (
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                    user.role === 'creator'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                  user.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {user.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>{user.email}</span>
                              <span>&bull;</span>
                              <span className="font-sans text-slate-600">
                                Location: {userBranch ? userBranch.name : (user.assignedBranchId || 'All Branches')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(user)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            {!isSoleAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(user.id, user.email)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded flex items-center gap-1 transition-colors cursor-pointer"
                                title="Revoke user authorization"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: ADD NEW USER */}
              {userMgmtTab === 'add' && (
                <form onSubmit={handleAddUser} className="space-y-4 max-w-lg mx-auto">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                    <span className="font-bold">Google Sheet Auto-Sync:</span> Adding a user here saves them to local storage and syncs the email to Google Sheet tab <strong>"address" in Column A</strong>. Only <strong>hr.rftcom@gmail.com</strong> has administrator privilege.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      User Email Address <span className="text-red-500">*</span>:
                    </label>
                    <input
                      id="new-user-email-input"
                      type="email"
                      required
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="e.g. itkinshasa1@gmail.com"
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      This email must match the Chrome/Google account used by the staff member.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name / Staff Title:
                    </label>
                    <input
                      id="new-user-name-input"
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Kinshasa Warehouse Manager"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Operating Branch:
                      </label>
                      <select
                        value={newBranchId}
                        onChange={e => setNewBranchId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.address || b.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Role:
                      </label>
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value as UserRole)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="creator">Creator (Can Create & Manage Stock Transfers)</option>
                        <option value="staff">Staff (Standard Access)</option>
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Admin role is exclusively held by hr.rftcom@gmail.com
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="submit-add-user-btn"
                      type="submit"
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Authorize User & Save</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Sole Admin: <strong>hr.rftcom@gmail.com</strong></span>
              <button
                type="button"
                onClick={() => setShowUserMgmtModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
