/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { StockMasterView } from './components/StockMasterView';
import { StockTransfersView } from './components/StockTransfersView';
import { InvoicesView } from './components/InvoicesView';
import { StockTransferReportView } from './components/StockTransferReportView';
import { SettingsView } from './components/SettingsView';
import { AuthGate } from './components/AuthGate';
import { BranchSelectGate } from './components/BranchSelectGate';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isEmailAuthorized,
    isBranchConfirmed,
    activeBranch
  } = useInventory();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stock' | 'transfers' | 'invoices' | 'reports' | 'settings'
  >('dashboard');

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Trigger modal creation from external tabs
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  const isUserValid = isEmailAuthorized(currentUser.email);

  // 1. If the user is not authenticated or email is not authorized, show security AuthGate
  if (!isAuthenticated || !isUserValid) {
    return <AuthGate unauthorizedEmail={!isUserValid ? currentUser.email : undefined} />;
  }

  // User requested: "Operating Branch / Location * remove this option , direct get into app dashboard"
  // Direct entry into app dashboard without BranchSelectGate prompt.

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden antialiased">
      {/* High Density Dark Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Column: Header + Scrollable View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* High Density Top Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewTransfer={() => {
            setActiveTab('transfers');
            setIsNewTransferOpen(true);
          }}
          onOpenNewInvoice={() => {
            setActiveTab('invoices');
            setIsNewInvoiceOpen(true);
          }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigateTab={(tab: any) => {
                setActiveTab(tab);
              }}
              onOpenNewTransfer={() => {
                setActiveTab('transfers');
                setIsNewTransferOpen(true);
              }}
              onOpenNewInvoice={() => {
                setActiveTab('invoices');
                setIsNewInvoiceOpen(true);
              }}
            />
          )}

          {activeTab === 'stock' && (
            <StockMasterView
              onOpenNewTransfer={() => {
                setActiveTab('transfers');
                setIsNewTransferOpen(true);
              }}
            />
          )}

          {activeTab === 'transfers' && (
            <StockTransfersView
              isCreateOpen={isNewTransferOpen}
              onCloseCreate={() => setIsNewTransferOpen(false)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              isCreateOpen={isNewInvoiceOpen}
              onCloseCreate={() => setIsNewInvoiceOpen(false)}
            />
          )}

          {activeTab === 'reports' && <StockTransferReportView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainAppContent />
    </InventoryProvider>
  );
}
