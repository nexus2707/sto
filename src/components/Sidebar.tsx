import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  FileText,
  FileBarChart2,
  Building2,
  ShieldCheck,
  RefreshCw,
  X,
  LogOut,
  MapPin
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    company,
    sheetConfig,
    syncWithGoogleSheet,
    logout,
    activeBranch,
    resetBranchSelection
  } = useInventory();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithGoogleSheet();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* High Density Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } no-print`}
      >
        {/* Brand / Company Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                R
              </div>
              <h1 className="text-white font-bold text-base tracking-tight truncate max-w-[170px]" title={company.companyName}>
                {company.companyName || 'V-STOCK CLOUD'}
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
              Inventory & Invoicing v2.4
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Branch Location Indicator */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Operating Branch
              </div>
              <div className="text-xs font-bold text-white truncate" title={activeBranch?.name}>
                {activeBranch?.name || 'Main Location'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              resetBranchSelection();
              if (window.innerWidth < 1024) onClose();
            }}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Switch Operating Branch Location"
          >
            Switch
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-2 mt-1">
            Main Operations
          </div>

          <button
            id="sidebar-nav-dashboard"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'dashboard' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Dashboard</span>
          </button>

          <button
            id="sidebar-nav-stock"
            onClick={() => handleNavClick('stock')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'stock'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'stock' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <Boxes className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Stock Master</span>
          </button>

          <button
            id="sidebar-nav-transfers"
            onClick={() => handleNavClick('transfers')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'transfers'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'transfers' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Internal Transfers</span>
          </button>

          <button
            id="sidebar-nav-invoices"
            onClick={() => handleNavClick('invoices')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'invoices' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Invoicing (Tax/USD)</span>
          </button>

          <button
            id="sidebar-nav-reports"
            onClick={() => handleNavClick('reports')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'reports' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <FileBarChart2 className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Transfer Reports</span>
          </button>

          {/* Settings Section */}
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-5 mb-2 ml-2">
            Settings & Config
          </div>

          <button
            id="sidebar-nav-branches"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === 'settings' ? (
              <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
            ) : (
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>Branch Config</span>
          </button>

          <button
            id="sidebar-nav-auth"
            onClick={() => handleNavClick('settings')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-300 hover:text-red-200 font-medium">Email Auth</span>
          </button>
        </nav>

        {/* Footer / Status Card */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Authorized:</span>
            <div className="flex items-center space-x-1.5 min-w-0">
              <span
                className="text-green-400 font-mono text-[11px] truncate max-w-[110px]"
                title={currentUser.email}
              >
                {currentUser.email}
              </span>
              <button
                id="sidebar-logout-btn"
                onClick={logout}
                title="Log Out & Lock Portal"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 italic flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  sheetConfig.isConnected ? 'bg-green-400' : 'bg-amber-400'
                }`}
              />
              G-Sheets Sync: {sheetConfig.isConnected ? 'Active' : 'Offline'}
            </span>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Sync with Google Sheets"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
