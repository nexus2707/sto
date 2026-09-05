import React, { useState } from 'react';
import {
  FileBarChart2,
  Filter,
  Play,
  Printer,
  Download,
  Calendar,
  Building2,
  Boxes,
  ArrowRightLeft,
  Truck,
  Eye
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockTransfer } from '../types';
import { exportTransfersReportPDF, exportTransferChallanPDF } from '../services/pdfExport';

export const StockTransferReportView: React.FC = () => {
  const { transfers, branches, company } = useInventory();

  // Filter Form State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fromBranchId, setFromBranchId] = useState('all');
  const [toBranchId, setToBranchId] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Report Execution Results State
  const [hasRun, setHasRun] = useState(true);
  const [reportResults, setReportResults] = useState<StockTransfer[]>(transfers);

  const handleRunReport = () => {
    const filtered = transfers.filter(t => {
      // Date From filter
      if (dateFrom && t.date < dateFrom) return false;
      // Date To filter
      if (dateTo && t.date > dateTo) return false;
      // From Branch filter
      if (fromBranchId !== 'all' && t.fromBranchId !== fromBranchId) return false;
      // To Branch filter
      if (toBranchId !== 'all' && t.toBranchId !== toBranchId) return false;
      // Keyword search
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const matchesChallan = t.challanNo.toLowerCase().includes(query);
        const matchesEmail = t.createdByEmail.toLowerCase().includes(query);
        const matchesItem = t.items.some(
          i => i.itemCode.toLowerCase().includes(query) || i.itemName.toLowerCase().includes(query)
        );
        if (!matchesChallan && !matchesEmail && !matchesItem) return false;
      }
      return true;
    });

    setReportResults(filtered);
    setHasRun(true);
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFromBranchId('all');
    setToBranchId('all');
    setSearchKeyword('');
    setReportResults(transfers);
  };

  const totalChallans = reportResults.length;
  const totalUnits = reportResults.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const fromBranchName = branches.find(b => b.id === fromBranchId)?.name || 'All Branches';
  const toBranchName = branches.find(b => b.id === toBranchId)?.name || 'All Branches';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-blue-900" />
            <span>Stock Transfer & Challans Report</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter by date, source, and destination branch to run itemized reports for each challan separately.
          </p>
        </div>

        {reportResults.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              id="export-transfers-pdf-btn"
              onClick={() =>
                exportTransfersReportPDF(reportResults, {
                  dateFrom,
                  dateTo,
                  fromBranch: fromBranchName,
                  toBranch: toBranchName
                })
              }
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report to PDF</span>
            </button>
            <button
              id="print-transfers-report-btn"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Options & Run Action Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Transfer Report Filters & Run Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date From:</label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date To:</label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* From Branch */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From Branch (Source):</label>
            <select
              id="filter-from-branch"
              value={fromBranchId}
              onChange={e => setFromBranchId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-blue-600 font-medium"
            >
              <option value="all">All Source Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* To Branch */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To Branch (Destination):</label>
            <select
              id="filter-to-branch"
              value={toBranchId}
              onChange={e => setToBranchId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-blue-600 font-medium"
            >
              <option value="all">All Destination Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Search Keyword / Challan #:</label>
            <input
              id="filter-keyword"
              type="text"
              placeholder="Challan #, item, email..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:border-blue-600"
            />
          </div>
        </div>

        {/* Action Buttons: Run Option */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset Filters
          </button>

          <div className="flex items-center space-x-2">
            <button
              id="run-transfer-report-btn"
              type="button"
              onClick={handleRunReport}
              className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>RUN REPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      {hasRun && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Challans Found</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalChallans}</div>
            <div className="text-xs text-slate-400 mt-0.5">Matching current filter criteria</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Units Transferred</span>
            <div className="text-2xl font-bold text-blue-900 mt-1">{totalUnits.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Across all selected items</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Filter Scope</span>
            <div className="text-xs font-bold text-slate-800 mt-2 truncate">
              {fromBranchName.split(' ')[0]} → {toBranchName.split(' ')[0]}
            </div>
            <div className="text-[11px] text-slate-400">
              {dateFrom || 'Earliest'} to {dateTo || 'Latest'}
            </div>
          </div>
        </div>
      )}

      {/* Separated Challan Data Cards (As explicitly requested by user) */}
      <div className="space-y-6 printable-area">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Itemized Challan Reports ({reportResults.length} Challans)
          </h2>
          <span className="text-xs text-slate-500">Each Challan Data Displayed Separately</span>
        </div>

        {reportResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No stock transfers found matching the selected dates and branches. Click "Reset Filters" or adjust criteria and click "Run Report".
          </div>
        ) : (
          reportResults.map(challan => (
            <div
              key={challan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300 page-break-inside-avoid"
            >
              {/* Challan Card Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                        {challan.challanNo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          challan.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {challan.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Date: <strong className="text-slate-700">{challan.date}</strong></span>
                      <span>•</span>
                      <span>Created by: <strong className="text-slate-700">{challan.createdByEmail}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => exportTransferChallanPDF(challan, company)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Routing & Logistics Info */}
              <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Source (From):</span>
                  <div className="font-bold text-slate-900 mt-0.5">{challan.fromBranchName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Destination (To):</span>
                  <div className="font-bold text-slate-900 mt-0.5">{challan.toBranchName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Carrier / Vehicle:</span>
                  <div className="text-slate-800 mt-0.5 font-medium">
                    {challan.driverOrCarrier || 'N/A'}{' '}
                    {challan.vehicleNumber ? `[${challan.vehicleNumber}]` : ''}
                  </div>
                </div>
              </div>

              {/* Items Table for this Challan */}
              <div className="px-6 py-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Product Name & Specifications</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-center">Unit</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {challan.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-900">{item.itemCode}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.itemName}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                        <td className="py-2 px-3 text-slate-500">{item.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="py-2 px-3 text-right">Challan Total Units:</td>
                      <td className="py-2 px-3 text-right text-blue-900 font-mono text-sm">{challan.totalQuantity}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {challan.remarks && (
                <div className="px-6 pb-4 text-xs text-slate-600">
                  <span className="font-bold">Challan Remarks:</span> {challan.remarks}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
