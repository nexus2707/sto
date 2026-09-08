import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Lock,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Truck,
  UserCheck,
  RotateCw,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockTransfer, TransferItem } from '../types';
import { exportTransferChallanPDF } from '../services/pdfExport';
import { saveTransferToGoogleSheets, requestGoogleAccessToken, getStoredAccessToken } from '../services/googleSheets';
import { NewTransferModal } from './NewTransferModal';
import { ChallanPreviewModal } from './ChallanPreviewModal';

interface StockTransfersViewProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const StockTransfersView: React.FC<StockTransfersViewProps> = ({
  isCreateOpen = false,
  onCloseCreate
}) => {
  const {
    transfers,
    branches,
    stockItems,
    company,
    currentUser,
    activeBranch,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    canAlterTransfer,
    canDeleteTransfer,
    syncTransfersFromSheet,
    sheetConfig,
    setSheetConfig,
    isTransferSyncedToSheet,
    syncTransferToSheets,
    authorizeGoogleAndSyncAll
  } = useInventory();

  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshingSheet, setIsRefreshingSheet] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [syncingTransferId, setSyncingTransferId] = useState<string | null>(null);
  const [isSyncingAllPending, setIsSyncingAllPending] = useState(false);

  const unsyncedTransfers = transfers.filter(t => !isTransferSyncedToSheet(t.id));

  const handleSyncSingleTransfer = async (t: StockTransfer) => {
    setSyncingTransferId(t.id);
    try {
      const res = await syncTransferToSheets(t);
      if (res.success) {
        setRefreshNotice(`Challan #${t.challanNo} successfully saved to Google Sheet tabs "buro" and "club"!`);
      } else {
        alert(`Could not save Challan #${t.challanNo} to Google Sheets: ${res.error || 'Please re-authorize Google Sheets.'}`);
      }
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setSyncingTransferId(null);
    }
  };

  const handleSyncAllPending = async () => {
    setIsSyncingAllPending(true);
    try {
      const res = await authorizeGoogleAndSyncAll();
      if (res.success) {
        setRefreshNotice(`Successfully saved ${res.syncedCount} pending transfer(s) to Google Sheet tabs "buro" and "club"!`);
      } else {
        alert(`Sync failed: ${res.error || 'Please re-authorize Google Sheets in Settings.'}`);
      }
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingAllPending(false);
    }
  };

  const handleRefreshFromSheet = async () => {
    setIsRefreshingSheet(true);
    setRefreshNotice(null);
    try {
      const res = await syncTransfersFromSheet();
      if (res.success) {
        setRefreshNotice(`Successfully loaded ${res.count} transfer(s) from your Google Sheet.`);
      } else {
        setRefreshNotice(res.error || 'Failed to fetch from sheet.');
      }
    } catch (err: any) {
      setRefreshNotice(err.message || 'Error fetching transfers.');
    } finally {
      setIsRefreshingSheet(false);
      setTimeout(() => setRefreshNotice(null), 6000);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpen);
  const [viewChallan, setViewChallan] = useState<StockTransfer | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);

  useEffect(() => {
    if (isCreateOpen) {
      setIsModalOpen(true);
    }
  }, [isCreateOpen]);

  // Form State
  const defaultFromId = activeBranch?.id || branches[0]?.id || 'branch-1';
  const defaultToId = branches.find(b => b.id !== defaultFromId)?.id || branches[1]?.id || 'branch-2';

  const [fromBranchId, setFromBranchId] = useState(defaultFromId);
  const [toBranchId, setToBranchId] = useState(defaultToId);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [carrier, setCarrier] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'Completed' | 'In Transit'>('Completed');

  const [items, setItems] = useState<TransferItem[]>([
    {
      itemCode: stockItems[0]?.itemCode || '',
      itemName: stockItems[0]?.name || '',
      quantity: 1,
      unit: stockItems[0]?.unit || 'Pcs',
      remarks: ''
    }
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch =
      t.challanNo.toLowerCase().includes(search.toLowerCase()) ||
      t.createdByEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.fromBranchName.toLowerCase().includes(search.toLowerCase()) ||
      t.toBranchName.toLowerCase().includes(search.toLowerCase());

    const matchesBranch =
      filterBranch === 'all' || t.fromBranchId === filterBranch || t.toBranchId === filterBranch;

    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingTransfer(null);
    const initialFromId = activeBranch?.id || branches[0]?.id || '';
    const initialToId = branches.find(b => b.id !== initialFromId)?.id || branches[1]?.id || '';
    setFromBranchId(initialFromId);
    setToBranchId(initialToId);
    setTransferDate(new Date().toISOString().split('T')[0]);
    setCarrier('');
    setVehicleNumber('');
    setRemarks('');
    setStatus('Completed');
    setItems([
      {
        itemCode: stockItems[0]?.itemCode || '',
        itemName: stockItems[0]?.name || '',
        quantity: 1,
        unit: stockItems[0]?.unit || 'Pcs',
        remarks: ''
      }
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: StockTransfer) => {
    if (!canAlterTransfer(t)) {
      alert(`Access Restricted: Only the creator (${t.createdByEmail}) is authorized to alter this stock transfer.`);
      return;
    }

    setEditingTransfer(t);
    setFromBranchId(t.fromBranchId);
    setToBranchId(t.toBranchId);
    setTransferDate(t.date);
    setCarrier(t.driverOrCarrier || '');
    setVehicleNumber(t.vehicleNumber || '');
    setRemarks(t.remarks || '');
    setStatus(t.status as any);
    setItems([...t.items]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProduct = stockItems[0];
    setItems(prev => [
      ...prev,
      {
        itemCode: defaultProduct?.itemCode || '',
        itemName: defaultProduct?.name || '',
        quantity: 1,
        unit: defaultProduct?.unit || 'Pcs',
        remarks: ''
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'itemCode') {
        const found = stockItems.find(p => p.itemCode === value);
        if (found) {
          updated[index] = {
            ...updated[index],
            itemCode: found.itemCode,
            itemName: found.name,
            unit: found.unit
          };
          return updated;
        }
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fromBranchId === toBranchId) {
      setFormError('Source branch and Destination branch cannot be the same location.');
      return;
    }

    if (items.length === 0) {
      setFormError('Please add at least one item to transfer.');
      return;
    }

    // Validate quantities against source branch stock if new transfer
    if (!editingTransfer) {
      for (const item of items) {
        const product = stockItems.find(p => p.itemCode === item.itemCode);
        const availableInSource = product?.branchStocks[fromBranchId] || 0;
        if (item.quantity <= 0) {
          setFormError(`Item ${item.itemCode} must have a quantity greater than zero.`);
          return;
        }
        if (item.quantity > availableInSource) {
          setFormError(
            `Insufficient stock for "${item.itemName}" in source branch. Available: ${availableInSource} ${item.unit}, Requested: ${item.quantity} ${item.unit}.`
          );
          return;
        }
      }
    }

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);
    const totalQuantity = items.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);

    setIsSubmittingTransfer(true);
    try {
      let token = sheetConfig.accessToken || getStoredAccessToken();
      const sheetId = sheetConfig.spreadsheetId || localStorage.getItem('floweasy_saved_sheet_id_v2') || '';

      // If connected but no token yet, attempt token request directly on this user click
      if (sheetId && !token && !localStorage.getItem('floweasy_apps_script_url')) {
        try {
          token = await requestGoogleAccessToken(true);
          if (token) {
            setSheetConfig(prev => ({
              ...prev,
              accessToken: token,
              isConnected: true
            }));
          }
        } catch (authErr) {
          console.warn('Google Sheets token request during save skipped or declined:', authErr);
        }
      }

      if (editingTransfer) {
        const res = updateTransfer(editingTransfer.id, {
          date: transferDate,
          driverOrCarrier: carrier,
          vehicleNumber,
          remarks,
          status,
          items,
          totalQuantity,
          totalItems: items.length
        });

        if (!res.success) {
          setFormError(res.error || 'Failed to update transfer.');
          setIsSubmittingTransfer(false);
          return;
        }

        // Save alterations directly to both sheets
        if (sheetId) {
          const updatedTransferObj = {
            ...editingTransfer,
            date: transferDate,
            driverOrCarrier: carrier,
            vehicleNumber,
            remarks,
            status,
            items,
            totalQuantity,
            totalItems: items.length
          };
          saveTransferToGoogleSheets(sheetId, updatedTransferObj, token).catch(err => {
            console.warn('Sheet update error:', err);
          });
        }
      } else {
        const newTransfer = createTransfer(
          {
            date: transferDate,
            fromBranchId,
            fromBranchName: fromBranch?.name || 'Unknown Branch',
            toBranchId,
            toBranchName: toBranch?.name || 'Unknown Branch',
            items,
            totalItems: items.length,
            totalQuantity,
            driverOrCarrier: carrier,
            vehicleNumber,
            remarks,
            status
          },
          token
        );

        setIsModalOpen(false);
        if (onCloseCreate) onCloseCreate();
        if (newTransfer) {
          setViewChallan(newTransfer);
          if (token || localStorage.getItem('floweasy_apps_script_url')) {
            setRefreshNotice(`Challan #${newTransfer.challanNo} created and saving to Google Sheet tabs "buro" and "club"!`);
          } else {
            setRefreshNotice(`Challan #${newTransfer.challanNo} saved in app! Note: Google write authorization pending. Click "Sync" to push to tabs "buro" & "club".`);
          }
        }
        return;
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save transfer.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleDeleteTransfer = (transfer: StockTransfer) => {
    if (!canDeleteTransfer(transfer)) {
      alert(`Access Restricted: Only the creator of this entry (${transfer.createdByEmail}) is authorized to delete this stock transfer.`);
      return;
    }

    if (confirm(`Are you sure you want to delete Challan ${transfer.challanNo}? This will restore transferred inventory back to ${transfer.fromBranchName}.`)) {
      const res = deleteTransfer(transfer.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-900" />
            <span>Internal Stock Transfers (Challans)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inter-branch stock transfer challans with strict creator-only alter/delete authorization and branch-formatted printouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-sheet-transfers-btn"
            type="button"
            onClick={handleRefreshFromSheet}
            disabled={isRefreshingSheet}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
            title="Fetch and display all transfers directly from connected Google Sheet"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingSheet ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
            <span>{isRefreshingSheet ? 'Fetching...' : 'Fetch from Sheet'}</span>
          </button>

          <button
            id="new-transfer-modal-btn"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Transfer Challan</span>
          </button>
        </div>
      </div>

      {refreshNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{refreshNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Security Banner: Explicit creator rule explanation */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong>Creator Email Authorization Policy:</strong> Under system security rules, only the original creator of a transfer challan (or Administrator) is permitted to <em>Alter</em> or <em>Delete</em> it. Authorized staff users can create entries and view reports without having raw access to the Google Sheet.
        </div>
      </div>

      {/* Unsynced Transfers Alert Banner */}
      {unsyncedTransfers.length > 0 && (
        <div className="p-4 bg-amber-50/95 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 text-sm">
                {unsyncedTransfers.length} Transfer{unsyncedTransfers.length > 1 ? 's' : ''} Pending Google Sheet Sync
                {unsyncedTransfers.some(t => t.challanNo === '1042') ? ' (including Challan #1042)' : ''}
              </div>
              <div className="text-amber-800 mt-0.5 text-xs">
                These entries are safely saved in Easy Flow ERP, but require Google write authorization (OAuth) to append rows to your Google Sheet tabs <strong>"buro"</strong> and <strong>"club"</strong>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="sync-all-pending-btn"
              onClick={handleSyncAllPending}
              disabled={isSyncingAllPending}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isSyncingAllPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing & Syncing...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Authorize & Sync to Sheets Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-transfers-input"
            type="text"
            placeholder="Search Challan No, Branch name, or Creator Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Branch:</span>
            <select
              id="transfer-branch-filter"
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Locations</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              id="transfer-status-filter"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Challan No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Source (From)</th>
                <th className="py-3 px-4">Destination (To)</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Units</th>
                <th className="py-3 px-4">Created By (Email)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Google Sheets</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No stock transfers recorded matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(t => {
                  const userIsCreator = canAlterTransfer(t);
                  const isOwnEntry = t.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {t.challanNo}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {t.fromBranchName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {t.toBranchName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {t.items.map(i => `${i.itemCode} (${i.quantity} ${i.unit})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {t.totalQuantity}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700">{t.createdByEmail}</span>
                          {isOwnEntry && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isTransferSyncedToSheet(t.id) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>buro & club</span>
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              Pending
                            </span>
                            <button
                              type="button"
                              id={`sync-transfer-${t.id}`}
                              onClick={() => handleSyncSingleTransfer(t)}
                              disabled={syncingTransferId === t.id}
                              title="Authorize & save transfer into Google Sheet tabs 'buro' and 'club'"
                              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                            >
                              {syncingTransferId === t.id ? 'Syncing...' : 'Sync Now'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Challan button */}
                          <button
                            id={`view-challan-${t.id}`}
                            onClick={() => setViewChallan(t)}
                            title="View & Print Challan"
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Alter / Edit Button (Creator Only Check) */}
                          {userIsCreator ? (
                            <button
                              id={`alter-challan-${t.id}`}
                              onClick={() => handleOpenEditModal(t)}
                              title="Alter Stock Transfer (Creator Authorized)"
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-md"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title={`Locked: Only creator (${t.createdByEmail}) can alter this entry`}
                              className="p-1.5 text-slate-300 cursor-not-allowed rounded-md"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button (Creator Only Check) */}
                          {userIsCreator ? (
                            <button
                              id={`delete-challan-${t.id}`}
                              onClick={() => handleDeleteTransfer(t)}
                              title="Delete Stock Transfer (Creator Authorized)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title={`Locked: Only creator (${t.createdByEmail}) can delete this entry`}
                              className="p-1.5 text-slate-300 cursor-not-allowed rounded-md"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Export PDF */}
                          <button
                            id={`pdf-challan-${t.id}`}
                            onClick={() => exportTransferChallanPDF(t, company)}
                            title="Download Challan PDF"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      <NewTransferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseCreate) onCloseCreate();
        }}
        onSuccess={(created) => {
          setIsModalOpen(false);
          if (onCloseCreate) onCloseCreate();
          setViewChallan(created);
        }}
      />

      {/* Legacy Modal (Disabled) */}
      {false && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingTransfer
                    ? `Alter Stock Transfer Challan: ${editingTransfer.challanNo}`
                    : 'Issue New Internal Stock Transfer Challan'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseCreate) onCloseCreate();
                }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Branch Source & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From Branch (Source Location) *
                  </label>
                  <select
                    required
                    disabled={!!editingTransfer}
                    value={fromBranchId}
                    onChange={e => setFromBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500">
                    Inventory will be deducted from this location.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To Branch (Destination Location) *
                  </label>
                  <select
                    required
                    disabled={!!editingTransfer}
                    value={toBranchId}
                    onChange={e => setToBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500">
                    Inventory will be added to this location.
                  </span>
                </div>
              </div>

              {/* Date, Carrier, Vehicle, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Carrier / Driver</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="e.g. Trans-Katanga / Patrick"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Plate No</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KN-8472-BG"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Completed">Completed (Received)</option>
                    <option value="In Transit">In Transit (Dispatched)</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Transfer Items List:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Select Product / Item</th>
                        <th className="py-2 px-3 text-center">Available Stock</th>
                        <th className="py-2 px-3 text-right">Transfer Qty</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Item Remarks</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const product = stockItems.find(p => p.itemCode === item.itemCode);
                        const available = product?.branchStocks[fromBranchId] || 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <select
                                value={item.itemCode}
                                onChange={e => handleItemChange(idx, 'itemCode', e.target.value)}
                                className="w-full p-1.5 text-xs border border-slate-200 rounded"
                              >
                                {stockItems.map(p => (
                                  <option key={p.id} value={p.itemCode}>
                                    {p.itemCode} - {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-slate-700">
                              {available} {item.unit}
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                className="w-20 p-1.5 text-xs border border-slate-300 rounded text-right font-bold"
                              />
                            </td>
                            <td className="p-2 text-slate-600">{item.unit}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.remarks || ''}
                                onChange={e => handleItemChange(idx, 'remarks', e.target.value)}
                                placeholder="e.g. For project inspection"
                                className="w-full p-1.5 text-xs border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  ✕
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

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  General Remarks / Instructions
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Urgent transport approved by management. Inspect serial numbers upon arrival."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Creator Tag Notice */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  Entry will be locked to creator: <strong className="text-slate-800">{currentUser.email}</strong>
                </span>
                <span className="font-semibold text-slate-700">{currentUser.name}</span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseCreate) onCloseCreate();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="submit-transfer-form-btn"
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingTransfer ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Sheets...</span>
                    </>
                  ) : (
                    editingTransfer ? 'Save Alterations' : 'Generate & Issue Challan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter Stock Transfer Previews Dialog */}
      <ChallanPreviewModal
        isOpen={!!viewChallan}
        transfer={viewChallan}
        onClose={() => setViewChallan(null)}
        onDeleteSuccess={() => setViewChallan(null)}
      />

      {/* Legacy Modal: View & Print Challan Preview (Disabled) */}
      {false && viewChallan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6">
            {/* Top Toolbar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <span>Challan Preview: {viewChallan.challanNo}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportTransferChallanPDF(viewChallan, company)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Challan</span>
                </button>
                <button
                  onClick={() => setViewChallan(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Challan Document */}
            <div className="p-8 sm:p-12 printable-area bg-white text-slate-900 font-sans">
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      {company.companyName}
                    </h1>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <p>
                        <strong>NIF / TAX ID:</strong> {company.taxNumber} | <strong>RCCM:</strong> {company.rccm} | <strong>ID NAT:</strong> {company.nationalId}
                      </p>
                      <p>
                        Phone: {company.phone} | Email: {company.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-slate-900 text-white font-mono font-bold text-sm px-3 py-1 rounded">
                      TRANSFER CHALLAN
                    </div>
                    <div className="font-mono text-sm font-bold text-blue-900 mt-2">
                      {viewChallan.challanNo}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Date: <strong>{viewChallan.date}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Routing Info Grid */}
              <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Source Dispatch Branch:
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {viewChallan.fromBranchName}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {branches.find(b => b.id === viewChallan.fromBranchId)?.address}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tel: {branches.find(b => b.id === viewChallan.fromBranchId)?.phone}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Destination Receiving Branch:
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {viewChallan.toBranchName}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {branches.find(b => b.id === viewChallan.toBranchId)?.address}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tel: {branches.find(b => b.id === viewChallan.toBranchId)?.phone}
                  </div>
                </div>
              </div>

              {/* Carrier & Creator Details */}
              <div className="grid grid-cols-3 gap-4 text-xs border-y border-slate-200 py-3 mb-6">
                <div>
                  <span className="text-slate-500">Carrier / Driver:</span>{' '}
                  <strong className="text-slate-900">{viewChallan.driverOrCarrier || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Vehicle Number:</span>{' '}
                  <strong className="text-slate-900">{viewChallan.vehicleNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Authorized Creator:</span>{' '}
                  <strong className="text-slate-900">{viewChallan.createdByEmail}</strong>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-6 border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 border-b">#</th>
                    <th className="py-2.5 px-3 border-b">Item Code</th>
                    <th className="py-2.5 px-3 border-b">Description</th>
                    <th className="py-2.5 px-3 border-b text-right">Quantity</th>
                    <th className="py-2.5 px-3 border-b text-center">Unit</th>
                    <th className="py-2.5 px-3 border-b">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewChallan.items.map((itm, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{itm.itemCode}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{itm.itemName}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{itm.quantity}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{itm.unit}</td>
                      <td className="py-2 px-3 text-slate-500">{itm.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right">Total Transferred Units:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-blue-900">{viewChallan.totalQuantity}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>

              {/* Remarks */}
              {viewChallan.remarks && (
                <div className="text-xs text-slate-600 mb-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong>Notes & Handling Instructions:</strong> {viewChallan.remarks}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 text-center font-bold text-slate-800">
                    Dispatched By (Storekeeper)
                  </div>
                  <div className="text-center text-slate-500 mt-1">{viewChallan.createdByName}</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-2 text-center font-bold text-slate-800">
                    Carrier / Driver Signature
                  </div>
                  <div className="text-center text-slate-500 mt-1">Date & Signature</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-2 text-center font-bold text-slate-800">
                    Received & Verified By (Recipient)
                  </div>
                  <div className="text-center text-slate-500 mt-1">Date & Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
