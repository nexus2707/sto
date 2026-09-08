import React, { useState } from 'react';
import {
  Menu,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  ExternalLink,
  Plus,
  RefreshCw,
  LogOut,
  MapPin
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenNewTransfer: () => void;
  onOpenNewInvoice: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  onOpenNewTransfer,
  onOpenNewInvoice,
  onToggleSidebar
}) => {
  const {
    currentUser,
    isAdmin,
    authorizedUsers,
    switchUser,
    logout,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    activeBranch,
    resetBranchSelection,
    sheetConfig,
    syncWithGoogleSheet,
    company
  } = useInventory();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithGoogleSheet();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 no-print">
      {/* Left side: Mobile Hamburger & Active Branch Selector */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600 focus:outline-hidden"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-2 bg-blue-50/80 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg shadow-2xs">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 hidden sm:inline">
                Location:
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                {activeBranch?.name || 'Main Location'}
              </span>
              {activeBranch?.invPrefix && (
                <span className="text-[10px] bg-white border border-blue-300 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                  Prefix: {activeBranch.invPrefix}
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              id="navbar-switch-branch-btn"
              onClick={resetBranchSelection}
              className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-2.5 py-1.5 rounded border border-slate-200 transition-colors cursor-pointer"
              title="Change active operating branch location (Admin only)"
            >
              Switch Location
            </button>
          )}
        </div>
      </div>

      {/* Right side: Exchange Rate Badge, Quick Action Buttons, G-Sheets Sync, Profile Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Exchange Rate Badge */}
        <div className="hidden md:flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
          1 USD = {company.defaultExchangeRate.toLocaleString()} FC
        </div>

        {/* Quick Transfer Button */}
        <button
          id="quick-transfer-btn"
          onClick={onOpenNewTransfer}
          className="bg-slate-900 text-white px-3 sm:px-3.5 py-1.5 rounded text-xs font-medium hover:bg-slate-800 transition-colors flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Transfer</span>
          <span className="sm:hidden">Transfer</span>
        </button>

        {/* Quick Invoice Button */}
        <button
          id="quick-invoice-btn"
          onClick={onOpenNewInvoice}
          className="bg-blue-600 text-white px-3 sm:px-3.5 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">Invoice</span>
        </button>

        {/* Google Sheet Sync Trigger */}
        <button
          id="google-sheet-sync-button"
          onClick={handleManualSync}
          disabled={isSyncing || sheetConfig.syncStatus === 'syncing'}
          title={
            sheetConfig.isConnected
              ? `Connected to Google Sheets. Last synced: ${sheetConfig.lastSyncTime || 'Never'}`
              : 'Google Sheet not connected. Click Settings to link.'
          }
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
            sheetConfig.isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden lg:inline font-mono">
            {sheetConfig.isConnected ? 'Synced' : 'Connect'}
          </span>
          <RefreshCw
            className={`w-3 h-3 ${
              isSyncing || sheetConfig.syncStatus === 'syncing' ? 'animate-spin text-emerald-700' : 'text-slate-400'
            }`}
          />
        </button>

        {sheetConfig.spreadsheetUrl && (
          <a
            id="open-google-sheet-link"
            href={sheetConfig.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Master Google Sheet in new tab"
            className="hidden sm:flex p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* User Authorization & Switch Profile Dropdown */}
        <div className="relative">
          <button
            id="user-profile-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-100 text-left border border-slate-200"
          >
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-xs leading-tight">
              <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                {currentUser.name}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu: Authorized Users Switcher */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Current Session
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{currentUser.name}</div>
                <div className="text-xs text-blue-800 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Role: {currentUser.role.toUpperCase()}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px] truncate">{currentUser.email}</span>
                </div>
              </div>

              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Authorized User (Testing)
              </div>

              <div className="max-h-56 overflow-y-auto">
                {authorizedUsers.map(u => (
                  <button
                    key={u.id}
                    id={`switch-user-${u.id}`}
                    onClick={() => {
                      switchUser(u.email);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      u.email.toLowerCase() === currentUser.email.toLowerCase()
                        ? 'bg-blue-50 font-bold text-blue-900'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 px-4 pt-2 mt-1 space-y-1">
                {isAdmin && (
                  <button
                    id="nav-switch-branch-location-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      resetBranchSelection();
                    }}
                    className="w-full text-left text-xs font-medium text-slate-700 hover:text-blue-700 py-1 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Switch Operating Location</span>
                  </button>
                )}

                {setActiveTab && (
                  <button
                    id="nav-to-settings-btn"
                    onClick={() => {
                      setActiveTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left text-xs font-medium text-blue-700 hover:text-blue-900 py-1 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Manage Authorized Emails</span>
                  </button>
                )}

                <button
                  id="nav-logout-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left text-xs font-medium text-rose-600 hover:text-rose-800 py-1 flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out & Lock Portal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

