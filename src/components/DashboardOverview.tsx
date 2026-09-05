import React, { useState } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  FileText,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Printer,
  Download
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
    selectedBranchId
  } = useInventory();

  // Quick console state
  const [quickCurrency, setQuickCurrency] = useState<'USD' | 'FC'>('USD');
  const [quickWithTva, setQuickWithTva] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  // Filter items by branch if selected
  const filteredStock = selectedBranchId === 'all'
    ? stockItems
    : stockItems.map(item => ({
        ...item,
        totalStock: item.branchStocks[selectedBranchId] || 0
      }));

  const totalUnits = filteredStock.reduce((acc, curr) => acc + curr.totalStock, 0);
  const totalValuationFC = filteredStock.reduce((acc, curr) => acc + curr.totalStock * curr.unitCostFC, 0);
  const totalValuationUSD = totalValuationFC / (company.defaultExchangeRate || 2850);

  const lowStockItems = filteredStock.filter(item => item.totalStock <= item.minAlertQty);

  const factures = invoices.filter(i => i.type === 'facture');
  const proformas = invoices.filter(i => i.type === 'proforma');
  const totalInvoicedUSD = factures.reduce((acc, curr) => acc + curr.totalUSD, 0);

  // Active branch object
  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Combined high density activity list (Transfers + Invoices)
  const unifiedActivity = [
    ...transfers.map(t => ({
      id: t.id,
      code: t.challanNo,
      type: 'Transfer',
      typeBadge: 'bg-orange-100 text-orange-700',
      route: `${t.fromBranchName.split(' ')[0]} → ${t.toBranchName.split(' ')[0]}`,
      creator: t.createdByEmail,
      valueUSD: (t.totalQuantity * 15).toFixed(2), // Estimated units valuation
      date: t.date,
      actionTab: 'transfers'
    })),
    ...invoices.map(inv => ({
      id: inv.id,
      code: inv.invoiceNo,
      type: inv.type === 'facture' ? (inv.withTva ? 'Invoice +TVA' : 'Invoice USD') : 'Proforma',
      typeBadge: inv.type === 'facture' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700',
      route: inv.customerName,
      creator: inv.createdByEmail,
      valueUSD: inv.totalUSD.toFixed(2),
      date: inv.date,
      actionTab: 'invoices'
    }))
  ].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 8);

  return (
    <div className="space-y-5">
      {/* High Density KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Units */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Inventory</span>
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">
              {totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{stockItems.length} Products</span>
              <button
                id="kpi-view-stock"
                onClick={() => onNavigateTab('stock')}
                className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</span>
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-900">
              ${totalValuationUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-semibold text-slate-500">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {totalValuationFC.toLocaleString()} FC
            </div>
          </div>
        </div>

        {/* Stock Transfers */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Internal Transfers</span>
            <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">
              {transfers.length} <span className="text-xs font-normal text-slate-500">challans</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{transfers.filter(t => t.status === 'Completed').length} Done</span>
              <button
                id="kpi-view-transfers"
                onClick={() => onNavigateTab('transfers')}
                className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoices & Sales */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Facture & Invoicing</span>
            <div className="w-7 h-7 rounded bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">
              ${totalInvoicedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-500">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{factures.length} Factures • {proformas.length} Proformas</span>
              <button
                id="kpi-view-invoices"
                onClick={() => onNavigateTab('invoices')}
                className="text-purple-600 font-bold hover:underline flex items-center gap-0.5"
              >
                View <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left High-Density Activity Table (Col-8) & Right Console (Col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: High Density Report & Activity Table */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {/* Stock Transfer & Invoices Report Table Container */}
          <div className="bg-white rounded-lg shadow-xs border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Stock Transfer & Invoices Activity
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  id="dash-run-report-btn"
                  onClick={() => onNavigateTab('reports')}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  RUN REPORT
                </button>
                <button
                  id="dash-export-pdf-btn"
                  onClick={() => onNavigateTab('reports')}
                  className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  EXPORT PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-xs">
                  <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <th className="px-4 py-2.5">ID</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">From/To</th>
                    <th className="px-4 py-2.5">Creator</th>
                    <th className="px-4 py-2.5">Value (USD)</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-slate-100">
                  {unifiedActivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    unifiedActivity.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-blue-50/70 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-blue-600 font-semibold">
                          {item.code}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.typeBadge}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 truncate max-w-[150px]">
                          {item.route}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px] truncate max-w-[130px]" title={item.creator}>
                          {item.creator}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                          ${item.valueUSD}
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-2">
                          <button
                            onClick={() => onNavigateTab(item.actionTab)}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alerts (High Density) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Low Stock Inventory Thresholds
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                {lowStockItems.length} Critical
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                All stock levels are above threshold limits.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-right">Current Stock</th>
                      <th className="py-2 px-3 text-right">Min Alert</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockItems.slice(0, 4).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">{item.itemCode}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[160px]">{item.name}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-700">{item.totalStock} {item.unit}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{item.minAlertQty} {item.unit}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={onOpenNewTransfer}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            Transfer
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

        {/* Right Column: Quick Invoice Console & Branch Preview */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Quick Invoice Console Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase mb-3 text-slate-600 border-b border-slate-100 pb-2">
              Quick Invoice Console
            </h3>

            <div className="space-y-3">
              {/* Currency Mode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Currency Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickCurrency('USD')}
                    className={`text-[11px] py-1.5 rounded font-bold transition-colors cursor-pointer ${
                      quickCurrency === 'USD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    USD (Fixed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCurrency('FC')}
                    className={`text-[11px] py-1.5 rounded font-bold transition-colors cursor-pointer ${
                      quickCurrency === 'FC'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    FC (Local)
                  </button>
                </div>
              </div>

              {/* Tax Profile */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Tax Profile
                </label>
                <div
                  onClick={() => setQuickWithTva(!quickWithTva)}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800">
                    Include TVA ({company.defaultTvaRate || 16}%)
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full relative transition-colors shadow-inner ${
                      quickWithTva ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                        quickWithTva ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 italic">
                  *This will print Branch Address and Tax ID
                </p>
              </div>

              {/* Stock Item Lookup */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Stock Item Lookup
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={e => setQuickSearch(e.target.value)}
                    placeholder="Search Master List..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:outline-hidden focus:border-blue-600 pr-8"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <button
              id="dash-quick-generate-invoice-btn"
              type="button"
              onClick={onOpenNewInvoice}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
            >
              GENERATE INVOICE
            </button>
          </div>

          {/* Branch Preview (Dark Card from Design HTML) */}
          <div className="bg-slate-900 text-white rounded-lg p-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Branch Preview
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {activeBranch?.code || 'HQ'}
              </span>
            </div>
            <div className="space-y-1 text-[11px] font-mono leading-relaxed">
              <p className="text-blue-400 font-bold uppercase truncate">
                {activeBranch?.name || company.companyName}
              </p>
              <p className="text-slate-300 text-[10px]">{activeBranch?.address || 'Av. Lukusa No 12, Gombe'}</p>
              <p className="text-slate-400 text-[10px]">RCCM: {company.taxNumber ? `CD/KIN/12-B-${company.taxNumber.slice(-4)}` : 'CD/KIN/12-B-9921'}</p>
              <p className="text-slate-400 text-[10px]">NIF: {company.taxNumber || 'A0912345Z'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

