import React from 'react';
import {
  Boxes,
  ArrowRightLeft,
  FileText,
  Building2,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  MapPin,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewTransfer: () => void;
  onOpenNewInvoice: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenNewTransfer,
  onOpenNewInvoice
}) => {
  const {
    stockItems,
    transfers,
    invoices,
    branches,
    company,
    sheetConfig,
    currentUser,
    selectedBranchId,
    isAdmin
  } = useInventory();

  // Filter items by branch if selected
  const filteredStock = selectedBranchId === 'all'
    ? stockItems
    : stockItems.map(item => ({
        ...item,
        totalStock: item.branchStocks[selectedBranchId] || 0
      }));

  const totalUnits = filteredStock.reduce((acc, curr) => acc + curr.totalStock, 0);

  const factures = invoices.filter(i => i.type === 'facture');
  const proformas = invoices.filter(i => i.type === 'proforma');
  const totalInvoicedUSD = factures.reduce((acc, curr) => acc + curr.totalUSD, 0);

  // Active branch object
  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Transactions done by login user only
  const userEmailClean = (currentUser.email || '').toLowerCase().trim();
  const userTransfers = transfers.filter(
    t => (t.createdByEmail || '').toLowerCase().trim() === userEmailClean
  );
  const userInvoices = invoices.filter(
    i => (i.createdByEmail || '').toLowerCase().trim() === userEmailClean
  );
  const userTransactionsCount = userTransfers.length + userInvoices.length;

  // Unified list of user-only transactions (ordered by date descending)
  const userActivityList = [
    ...userTransfers.map(t => ({
      id: t.id,
      code: t.challanNo,
      category: 'transfer' as const,
      typeLabel: 'Stock Transfer',
      typeBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: `${t.fromBranchName.split(' ')[0]} → ${t.toBranchName.split(' ')[0]}`,
      meta: `${t.totalQuantity} items dispatched`,
      date: t.date,
      status: t.status,
      actionTab: 'transfers'
    })),
    ...userInvoices.map(inv => ({
      id: inv.id,
      code: inv.invoiceNo,
      category: 'invoice' as const,
      typeLabel: inv.type === 'facture' ? 'Facture (Invoice)' : 'Proforma Quote',
      typeBadge: inv.type === 'facture' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: inv.customerName || 'Customer Invoice',
      meta: `$${inv.totalUSD.toFixed(2)} USD`,
      date: inv.date,
      status: inv.status || 'Active',
      actionTab: 'invoices'
    }))
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Row: Streamlined KPI Metric Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Total Stock Inventory Card with User Transactions Added */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Stock Inventory
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>{stockItems.length} Products Cataloged</span>
                <button
                  id="kpi-view-stock"
                  onClick={() => onNavigateTab('stock')}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 text-xs cursor-pointer"
                >
                  View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* User's Transactions Breakdown on this card */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Done by you:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 font-mono border border-blue-200">
                {userTransactionsCount} {userTransactionsCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{userTransfers.length} transfers &bull; {userInvoices.length} invoices</span>
              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]" title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Internal Transfers Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Internal Transfers
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {transfers.length} <span className="text-xs font-normal text-slate-500">challans</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>{transfers.filter(t => t.status === 'Completed').length} Completed</span>
                <button
                  id="kpi-view-transfers"
                  onClick={() => onNavigateTab('transfers')}
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5 text-xs cursor-pointer"
                >
                  View Transfers <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 px-5 py-3 rounded-b-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Your created transfers:</span>
            <span className="font-bold text-indigo-700 font-mono">
              {userTransfers.length} challan{userTransfers.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* 3. Facture & Invoicing Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Facture & Invoicing
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                ${totalInvoicedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-semibold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>{factures.length} Factures &bull; {proformas.length} Proformas</span>
                <button
                  id="kpi-view-invoices"
                  onClick={() => onNavigateTab('invoices')}
                  className="text-purple-600 font-bold hover:underline flex items-center gap-0.5 text-xs cursor-pointer"
                >
                  View Invoices <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 px-5 py-3 rounded-b-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Your created invoices:</span>
            <span className="font-bold text-purple-700 font-mono">
              {userInvoices.length} document{userInvoices.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Operating Location & User Session Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  {activeBranch?.name || 'Main Location'}
                </h2>
                {activeBranch?.invPrefix && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Prefix: {activeBranch.invPrefix}
                  </span>
                )}
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    Administrator
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Authorized Staff
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeBranch?.address || 'Gombe Commercial District'} &bull; Currency Rate: 1 USD = {company.defaultExchangeRate.toLocaleString()} FC
              </p>
              {!isAdmin && (
                <p className="text-[11px] text-slate-400 mt-0.5 italic">
                  Branch switching is restricted exclusively to Administrator <strong className="font-mono text-slate-600">hr.rftcom@gmail.com</strong>.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="dash-launch-transfer-btn"
              onClick={onOpenNewTransfer}
              className="inline-flex items-center justify-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Transfer
            </button>
            <button
              id="dash-launch-invoice-btn"
              onClick={onOpenNewInvoice}
              className="inline-flex items-center justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Launchpad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Boxes className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            Stock Master List
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Manage multi-branch stock levels, SKU codes, cost & sale prices.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('transfers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
            Internal Transfers
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Dispatch stock between branches and generate official printable challans.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('invoices')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
            Factures & Invoicing
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Generate commercial invoices and proformas with automatic 16% TVA.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Reports & Summaries
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            View branch transfer balances and export formatted PDF reports.
          </p>
        </div>
      </div>

      {/* User's Personal Transactions Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Transactions Done by You ({currentUser.name || currentUser.email})
              </h2>
              <p className="text-xs text-slate-500">
                Personal activity ledger of all transfers and invoices created under your login account ({currentUser.email}).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto font-mono">
            {userTransactionsCount} {userTransactionsCount === 1 ? 'record' : 'records'}
          </span>
        </div>

        {userActivityList.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No personal transactions recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You have not created any stock transfers or invoices in this session. Use the buttons below to create your first transaction.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={onOpenNewTransfer}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                + Create Transfer
              </button>
              <button
                onClick={onOpenNewInvoice}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                + Create Invoice
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Details / Route</th>
                  <th className="py-2.5 px-3">Value / Volume</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userActivityList.slice(0, 8).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {item.code}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.typeBadge}`}>
                        {item.typeLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 truncate max-w-[200px]">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {item.meta}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {item.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab(item.actionTab)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
