import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MasterStockItem, StockTransfer, TransferItem } from '../types';
import {
  getShopMappingByEmail,
  getSheetNameForLocation,
  generateNextChallanNo
} from '../config/shopLocations';

interface TransferRowState {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number | '';
  stockBalance: number;
}

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transfer: StockTransfer) => void;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    branches,
    masterItems,
    currentUser,
    activeBranch,
    createTransfer,
    loadBranchesFromGoogleSheet,
    loadMasterDataFromGoogleSheet,
    transfers
  } = useInventory();

  // Auto update on modal mount without requiring manual clicks
  useEffect(() => {
    if (isOpen) {
      loadBranchesFromGoogleSheet().catch(() => {});
      loadMasterDataFromGoogleSheet().catch(() => {});
    }
  }, [isOpen]);

  // 1. Determine Source (From) location dynamically from predefined email mapping or "branch name" sheet:
  const predefinedSourceName = useMemo(() => {
    const cleanEmail = currentUser.email.trim().toLowerCase();
    const mapped = getShopMappingByEmail(cleanEmail);
    if (mapped?.locationName) {
      return mapped.locationName;
    }

    // Check if a branch in "branch name" sheet matches the user's logged in email
    const matchingBranchByEmail = branches.find(
      b => b.email && b.email.trim().toLowerCase() === cleanEmail
    );
    if (matchingBranchByEmail?.name) {
      return matchingBranchByEmail.name;
    }
    // Check user assigned branch
    if (currentUser.assignedBranchName && currentUser.assignedBranchName !== 'Kinshasa Central') {
      return currentUser.assignedBranchName;
    }
    const matchingBranchById = branches.find(b => b.id === currentUser.assignedBranchId);
    if (matchingBranchById?.name && matchingBranchById.name !== 'Kinshasa Central') {
      return matchingBranchById.name;
    }
    if (activeBranch?.name && activeBranch.name !== 'Kinshasa Central') {
      return activeBranch.name;
    }
    // Fallback to first branch name from sheet (e.g. A1-SHOP NO1)
    return branches[0]?.name || 'A1-SHOP NO1';
  }, [currentUser, activeBranch, branches]);

  const [sourceLocation, setSourceLocation] = useState<string>(predefinedSourceName);
  const [destinationLocation, setDestinationLocation] = useState<string>('');
  const [transactionType, setTransactionType] = useState<string>('Bon-Stock Transfer');
  
  // Sequential Challan Number with location-based prefix (e.g. Shop08/01)
  const initialChallanNo = useMemo(() => {
    return generateNextChallanNo(predefinedSourceName, transfers.map(t => t.challanNo));
  }, [predefinedSourceName, transfers]);

  const [challanNo, setChallanNo] = useState<string>(initialChallanNo);

  // Predefined current date: YYYY-MM-DD
  const todayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  const [transferDate, setTransferDate] = useState<string>(todayDate);

  const [branchContext, setBranchContext] = useState<string>(
    currentUser.name ? `${currentUser.name} (${predefinedSourceName})` : `Operations (${predefinedSourceName})`
  );
  const [remarks, setRemarks] = useState<string>('');

  // Maximum 20 line rows
  const [rows, setRows] = useState<TransferRowState[]>([
    { id: 'row-1', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 },
    { id: 'row-2', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 },
    { id: 'row-3', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 },
    { id: 'row-4', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 },
    { id: 'row-5', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 }
  ]);

  // Active combobox dropdown search query per row
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize sourceLocation and challanNo whenever predefinedSourceName or transfers change
  useEffect(() => {
    setSourceLocation(predefinedSourceName);
    setChallanNo(generateNextChallanNo(predefinedSourceName, transfers.map(t => t.challanNo)));
  }, [predefinedSourceName, transfers]);

  // Destination branch options extracted strictly from sheet "branch name"
  const destinationOptions = useMemo(() => {
    const names = new Set<string>();
    branches.forEach(b => {
      const trimmed = b.name?.trim();
      if (
        trimmed &&
        !trimmed.toLowerCase().includes('location') &&
        !trimmed.toLowerCase().includes('branch name') &&
        trimmed.toLowerCase() !== sourceLocation.toLowerCase()
      ) {
        names.add(trimmed);
      }
    });

    // Strip out any non-existent 'Kinshasa' or 'Kinshasa Central' locations
    names.delete('Kinshasa');
    names.delete('Kinshasa Central');
    names.delete('Kinshasa Central Depot & Showroom');

    // Default fallback from attached sheet data if empty
    if (names.size === 0) {
      [
        'A1-SHOP NO1',
        'A2-SHOP NO2',
        'A3-SHOP NO3',
        'A4-SHOP NO4',
        'A5-SHOP NO5',
        'A6-SHOP NO6',
        'A7-SHOP NO7',
        'A8-SHOP NO8',
        'A9-SHOP-KFK9',
        'AA10SHOP NO-10',
        'AA11-SHOP NO11',
        'AA12-SHOP NO12',
        'AA13-SHOP NO13',
        'Buro'
      ].forEach(loc => {
        if (loc.toLowerCase() !== sourceLocation.toLowerCase()) {
          names.add(loc);
        }
      });
    }

    return Array.from(names);
  }, [branches, sourceLocation]);

  // Helper to compute stock balance for a given item in current source location
  const getItemStockForSource = (item: MasterStockItem, sourceName: string): number => {
    if (!item.branchStocks) return 0;
    const direct = item.branchStocks[sourceName];
    if (direct !== undefined) return direct;
    const lower = item.branchStocks[sourceName.toLowerCase()];
    if (lower !== undefined) return lower;
    
    // Fuzzy matching
    for (const key of Object.keys(item.branchStocks)) {
      if (key.toLowerCase().includes(sourceName.toLowerCase()) || sourceName.toLowerCase().includes(key.toLowerCase())) {
        return item.branchStocks[key];
      }
    }
    return 0;
  };

  // Recompute stock balances for existing rows when sourceLocation changes
  useEffect(() => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (!row.itemName) return row;
        const matched = masterItems.find(
          m => m.name.toLowerCase() === row.itemName.toLowerCase() || m.itemCode === row.itemCode
        );
        if (matched) {
          const bal = getItemStockForSource(matched, sourceLocation);
          return { ...row, stockBalance: bal };
        }
        return row;
      })
    );
  }, [sourceLocation, masterItems]);

  // Add line row (up to 20 maximum)
  const handleAddRow = () => {
    if (rows.length >= 20) {
      alert('Maximum number of items reached (20 lines limit).');
      return;
    }
    const newId = `row-${Date.now()}-${rows.length + 1}`;
    setRows(prev => [
      ...prev,
      { id: newId, itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 }
    ]);
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      // Just clear the row
      setRows([{ id: 'row-1', itemCode: '', itemName: '', unit: 'Pcs', quantity: '', stockBalance: 0 }]);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Select item from masterdata dropdown
  const handleSelectItem = (rowId: string, item: MasterStockItem) => {
    const bal = getItemStockForSource(item, sourceLocation);
    setRows(prev =>
      prev.map(r => {
        if (r.id === rowId) {
          return {
            ...r,
            itemCode: item.itemCode,
            itemName: item.name,
            unit: item.unit || 'Pcs',
            stockBalance: bal,
            // If quantity not set, suggest 1 or 0
            quantity: r.quantity === '' ? 1 : r.quantity
          };
        }
        return r;
      })
    );
    setSearchQueries(prev => ({ ...prev, [rowId]: item.name }));
    setActiveDropdownRowId(null);
  };

  // Handle manual search query change in item input
  const handleItemInputChange = (rowId: string, text: string) => {
    setSearchQueries(prev => ({ ...prev, [rowId]: text }));
    setActiveDropdownRowId(rowId);

    // If text matches exactly an item name
    const exactMatch = masterItems.find(m => m.name.toLowerCase() === text.trim().toLowerCase());
    if (exactMatch) {
      const bal = getItemStockForSource(exactMatch, sourceLocation);
      setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, itemName: exactMatch.name, itemCode: exactMatch.itemCode, stockBalance: bal } : r))
      );
    } else {
      setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, itemName: text, itemCode: r.itemCode || `ITM-${Date.now()}` } : r))
      );
    }
  };

  // Handle quantity change
  const handleQuantityChange = (rowId: string, val: string) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, quantity: num } : r))
    );
  };

  // Summary calculations with safe numeric parsing
  const validRows = rows
    .map(r => ({
      ...r,
      parsedQty: typeof r.quantity === 'number' ? r.quantity : parseInt(String(r.quantity || '0').trim(), 10) || 0
    }))
    .filter(r => r.itemName && r.itemName.trim() !== '' && r.parsedQty > 0);

  const totalQuantity = validRows.reduce((acc, r) => acc + r.parsedQty, 0);

  // Process and Save Transaction
  const handleProcessAndSave = () => {
    setFormError(null);

    if (!destinationLocation || destinationLocation === '-- Choose Location --' || !destinationLocation.trim()) {
      setFormError('Please select a Destination (TO) location from the dropdown.');
      return;
    }

    if (sourceLocation.trim().toLowerCase() === destinationLocation.trim().toLowerCase()) {
      setFormError('Source (FROM) and Destination (TO) locations cannot be the same.');
      return;
    }

    if (validRows.length === 0) {
      setFormError('Please select at least one item from the masterdata list with transfer quantity of 1 or more.');
      return;
    }

    try {
      // Find source and destination branch IDs
      const fromBranchObj = branches.find(
        b => b.name.toLowerCase().trim() === sourceLocation.toLowerCase().trim()
      );
      const toBranchObj = branches.find(
        b => b.name.toLowerCase().trim() === destinationLocation.toLowerCase().trim()
      );

      const fromBranchId = fromBranchObj?.id || `branch-${sourceLocation.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const toBranchId = toBranchObj?.id || `branch-${destinationLocation.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const transferItems: TransferItem[] = validRows.map(r => ({
        itemCode: r.itemCode || `ITM-${r.itemName.slice(0, 8)}`,
        itemName: r.itemName,
        quantity: r.parsedQty,
        unit: r.unit || 'Pcs',
        remarks: ''
      }));

      // Generate Challan via context
      const created = createTransfer({
        challanNo: challanNo.trim() || `CHL-${Date.now().toString().slice(-4)}`,
        date: transferDate || todayDate,
        fromBranchId,
        fromBranchName: sourceLocation,
        toBranchId,
        toBranchName: destinationLocation,
        transactionType: transactionType || 'Bon-Stock Transfer',
        branchContext: branchContext.trim() || `Operations (${sourceLocation})`,
        items: transferItems,
        totalItems: transferItems.length,
        totalQuantity,
        remarks: remarks.trim() || `Transfer from ${sourceLocation} to ${destinationLocation}`,
        status: 'Completed'
      });

      // Notify success and open ChallanPreviewModal
      onSuccess(created);
    } catch (err: any) {
      console.error('Failed to save transfer:', err);
      setFormError(err?.message || 'Failed to process and save transaction.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Header matching user's visual identity */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">
                  Internal Goods Transfer Bon
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Issue New Internal Stock Transfer Challan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Branch Standardized Business Entry Desk • Auto-updating from Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 space-y-5">
          {/* Top Form Grid matching the screenshot */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            {/* Row 1: Transaction Entry Type, Challan / Bon No., Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  TRANSACTION ENTRY TYPE
                </label>
                <select
                  value={transactionType}
                  onChange={e => setTransactionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bon-Stock Transfer">Bon-Stock Transfer</option>
                  <option value="Inter-Branch Movement">Inter-Branch Movement</option>
                  <option value="Depot Re-allocation">Depot Re-allocation</option>
                  <option value="Store Issue Voucher">Store Issue Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  CHALLAN / BON NO.
                </label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={e => setChallanNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1045"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>DATE</span>
                  <span className="text-[10px] text-blue-600 font-medium lowercase">predefined current</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Source (From) & Destination (To) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* SOURCE (FROM) - AUTO SELECTED AND READONLY */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    SOURCE (FROM)
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Predefined & Readonly
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sourceLocation}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-black text-slate-900 cursor-not-allowed select-none flex items-center shadow-inner"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                  <span>✓ Sender:</span>
                  <span className="font-bold text-blue-700">{sourceLocation}</span>
                  <span className="text-slate-400">• Saves to:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {getSheetNameForLocation(sourceLocation)}
                  </span>
                  <span className="text-slate-400">&</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    club
                  </span>
                </p>
              </div>

              {/* DESTINATION (TO) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    DESTINATION (TO)
                  </span>
                  <span className="text-[10px] text-slate-500">From 'branch name' sheet</span>
                </label>
                <select
                  value={destinationLocation}
                  onChange={e => setDestinationLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-blue-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  <option value="">-- Choose Location --</option>
                  {destinationOptions.map(loc => (
                    <option
                      key={loc}
                      value={loc}
                      disabled={loc.toLowerCase() === sourceLocation.toLowerCase()}
                    >
                      {loc} {loc.toLowerCase() === sourceLocation.toLowerCase() ? '(Current Source)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Select target receiving branch or sales shop from 'branch name'
                </p>
              </div>
            </div>

            {/* Row 3: SIGN / BRANCH CONTEXT & REMARKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  SIGN / BRANCH CONTEXT
                </label>
                <input
                  type="text"
                  value={branchContext}
                  onChange={e => setBranchContext(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Operations / Logistics"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  REMARKS / MOTIF
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Urgent shop restock for weekend sales"
                />
              </div>
            </div>
          </div>

          {/* Items Table matching screenshot: Sr., Qty, Item Name (Type to search), Shop-Stock Bal. */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Transfer Line Items
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {rows.length} / 20 Max Rows
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Stock Balances fetched for Source: <strong className="text-emerald-400">{sourceLocation}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">Sr.</th>
                    <th className="py-2.5 px-3 w-28 border-r border-slate-200">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Item Name (Type to search)</th>
                    <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">Shop-Stock Bal.</th>
                    <th className="py-2.5 px-3 w-12 text-center">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, idx) => {
                    const currentQuery = searchQueries[row.id] !== undefined ? searchQueries[row.id] : row.itemName;
                    
                    // Filter matching master items
                    const matchingItems = masterItems.filter(item => {
                      if (!currentQuery) return true;
                      const q = currentQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.itemCode.toLowerCase().includes(q)
                      );
                    });

                    const isOverdraft = typeof row.quantity === 'number' && row.quantity > row.stockBalance;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Sr. */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 border-r border-slate-200">
                          {idx + 1}
                        </td>

                        {/* Qty */}
                        <td className="py-2 px-3 border-r border-slate-200">
                          <input
                            type="number"
                            min="0"
                            value={row.quantity}
                            onChange={e => handleQuantityChange(row.id, e.target.value)}
                            placeholder="0"
                            className={`w-full px-2.5 py-1.5 text-xs font-bold font-mono text-slate-900 border rounded-md focus:outline-hidden focus:ring-2 ${
                              isOverdraft
                                ? 'border-amber-500 bg-amber-50/50 focus:ring-amber-500 text-amber-900'
                                : 'border-slate-300 bg-white focus:ring-blue-500'
                            }`}
                          />
                        </td>

                        {/* Item Name (Type to search) with Combobox Dropdown */}
                        <td className="py-2 px-3 border-r border-slate-200 relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={currentQuery}
                              onFocus={() => setActiveDropdownRowId(row.id)}
                              onChange={e => handleItemInputChange(row.id, e.target.value)}
                              placeholder="Type to search master item..."
                              className="w-full px-3 py-1.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                          </div>

                          {/* Dropdown Menu showing Item Name alongside closing stock qty in green badge */}
                          {activeDropdownRowId === row.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveDropdownRowId(null)}
                              />
                              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-30 divide-y divide-slate-100 animate-fadeIn">
                                {matchingItems.length === 0 ? (
                                  <div className="px-3 py-3 text-xs text-slate-500 text-center">
                                    No matching items found in 'masterdata' sheet.
                                  </div>
                                ) : (
                                  matchingItems.map(mItem => {
                                    const bal = getItemStockForSource(mItem, sourceLocation);
                                    return (
                                      <button
                                        key={mItem.id}
                                        type="button"
                                        onClick={() => handleSelectItem(row.id, mItem)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 group"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-slate-900 truncate group-hover:text-blue-700">
                                            {mItem.name}
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            Code: {mItem.itemCode} • Unit: {mItem.unit}
                                          </div>
                                        </div>

                                        {/* Green badge displaying closing stock quantity */}
                                        <div className="shrink-0 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-1">
                                          <span>Stk:</span>
                                          <span className="font-black text-emerald-900">{bal}</span>
                                        </div>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </>
                          )}
                        </td>

                        {/* Shop-Stock Bal. */}
                        <td className="py-2 px-3 text-center border-r border-slate-200">
                          <div
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-mono font-bold ${
                              row.stockBalance > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {row.stockBalance} {row.unit || 'Pcs'}
                          </div>
                          {isOverdraft && (
                            <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                              ⚠️ Exceeds Bal
                            </span>
                          )}
                        </td>

                        {/* Act */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Clear or remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Row Controls */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  disabled={rows.length >= 20}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 shadow-xs active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Add Line Row ({rows.length}/20)</span>
                </button>
                {rows.length >= 20 && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    Maximum 20 lines reached
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-slate-700 font-mono">
                <span>
                  Active Rows: <strong>{validRows.length}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Total Transfer Qty: <strong className="text-blue-600 text-sm">{totalQuantity}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer with Primary Process and Save Button */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {/* Primary Process and Save Transaction Button */}
          <button
            type="button"
            id="btn-process-save-transfer"
            onClick={handleProcessAndSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
          >
            <span>🚀 Process and Save Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
