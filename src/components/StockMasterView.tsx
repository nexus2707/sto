import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ArrowRightLeft,
  AlertCircle,
  Download,
  Building2,
  Check
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockItem } from '../types';

interface StockMasterViewProps {
  onOpenNewTransfer: () => void;
}

export const StockMasterView: React.FC<StockMasterViewProps> = ({ onOpenNewTransfer }) => {
  const {
    stockItems,
    branches,
    company,
    selectedBranchId,
    setSelectedBranchId,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    sheetConfig,
    fetchStockMasterFromCloud,
    syncWithGoogleSheet,
    currentUser
  } = useInventory();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    category: 'General',
    unit: 'Pcs',
    unitCostFC: 0,
    unitPriceFC: 0,
    minAlertQty: 10,
    branchStocks: {} as Record<string, number>
  });

  // Extract categories
  const categories = Array.from(new Set(stockItems.map(i => i.category)));

  // Filter products
  const filteredItems = stockItems.filter(item => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleFetchFromSheet = async () => {
    if (!sheetConfig.isConnected && !sheetConfig.spreadsheetId) {
      alert('Please connect your Google Sheet first in the "Settings & Cloud Sync" tab.');
      return;
    }
    setIsFetchingSheet(true);
    try {
      await fetchStockMasterFromCloud();
      setActionSuccess('Successfully retrieved Stock Master records from Google Sheet!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch Stock Master from Google Sheet');
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleOpenAddModal = () => {
    const initialBranchStocks: Record<string, number> = {};
    branches.forEach(b => {
      initialBranchStocks[b.id] = 0;
    });

    setFormData({
      itemCode: `ITM-${String(stockItems.length + 1).padStart(3, '0')}`,
      name: '',
      category: categories[0] || 'General',
      unit: 'Pcs',
      unitCostFC: 0,
      unitPriceFC: 0,
      minAlertQty: 10,
      branchStocks: initialBranchStocks
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unitCostFC: item.unitCostFC,
      unitPriceFC: item.unitPriceFC,
      minAlertQty: item.minAlertQty,
      branchStocks: { ...item.branchStocks }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a product name.');
      return;
    }

    const totalStock = Object.values(formData.branchStocks).reduce((a: number, b: any) => a + Number(b || 0), 0);

    if (editingItem) {
      updateStockItem(editingItem.id, {
        ...formData,
        unitCostFC: Number(formData.unitCostFC),
        unitPriceFC: Number(formData.unitPriceFC),
        minAlertQty: Number(formData.minAlertQty),
        branchStocks: formData.branchStocks,
        totalStock
      });
      setActionSuccess(`Updated product "${formData.name}".`);
    } else {
      addStockItem({
        ...formData,
        unitCostFC: Number(formData.unitCostFC),
        unitPriceFC: Number(formData.unitPriceFC),
        minAlertQty: Number(formData.minAlertQty),
        branchStocks: formData.branchStocks,
        totalStock
      });
      setActionSuccess(`Added new product "${formData.name}".`);
    }

    setIsModalOpen(false);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from stock master?`)) {
      deleteStockItem(id);
      setActionSuccess(`Product deleted.`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-900" />
            <span>Stock Master Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized inventory database with multi-branch stock levels and Google Sheets synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Get Stock Master from Google Sheet button */}
          <button
            id="fetch-stock-master-sheet-btn"
            onClick={handleFetchFromSheet}
            disabled={isFetchingSheet}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
            title="Reload Stock Master directly from connected Google Sheet file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isFetchingSheet ? 'Reading Sheet...' : 'Get Stock Master from Google Sheet'}</span>
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Product Button */}
          <button
            id="add-stock-product-btn"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-stock-input"
            type="text"
            placeholder="Search by Item Code, Product Name, or Category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Stock View Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Branch Stock:</span>
            <select
              id="stock-branch-view-select"
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="all">All Branches (Total)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost (FC / USD)</th>
                <th className="py-3 px-4 text-right">Price (FC / USD)</th>
                <th className="py-3 px-4">Branch Stock Distribution</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const costUSD = item.unitCostFC / company.defaultExchangeRate;
                  const priceUSD = item.unitPriceFC / company.defaultExchangeRate;
                  const isLow = item.totalStock <= item.minAlertQty;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400">Unit: {item.unit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono text-slate-800">{item.unitCostFC.toLocaleString()} FC</div>
                        <div className="text-[11px] text-slate-500">${costUSD.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900">{item.unitPriceFC.toLocaleString()} FC</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">${priceUSD.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {branches.map(b => {
                            const qty = item.branchStocks[b.id] || 0;
                            const isSelected = selectedBranchId === b.id;
                            return (
                              <span
                                key={b.id}
                                title={`${b.name}: ${qty} ${item.unit}`}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {b.code.split('-')[0]}: <strong>{qty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-sm text-slate-900">
                          {item.totalStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </div>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            id={`edit-item-${item.id}`}
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`transfer-item-${item.id}`}
                            onClick={onOpenNewTransfer}
                            title="Create Transfer for this Item"
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-md"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              id={`delete-item-${item.id}`}
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Delete Product"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? `Edit Product: ${editingItem.itemCode}` : 'Add New Product to Stock Master'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.itemCode}
                    onChange={e => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900 focus:border-blue-900"
                    placeholder="e.g. ITM-SOL-009"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900 focus:border-blue-900"
                    placeholder="e.g. Solar & Energy, Electronics"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Description / Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900 focus:border-blue-900"
                  placeholder="e.g. 5KVA Hybrid Pure Sine Wave Inverter"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Pcs">Pieces (Pcs)</option>
                    <option value="Unit">Unit</option>
                    <option value="Pack">Pack</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Meter">Meter (m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (FC)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCostFC}
                    onChange={e => setFormData({ ...formData, unitCostFC: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~ ${(formData.unitCostFC / company.defaultExchangeRate).toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Selling Price (FC)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPriceFC}
                    onChange={e => setFormData({ ...formData, unitPriceFC: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                    ~ ${(formData.unitPriceFC / company.defaultExchangeRate).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minAlertQty}
                  onChange={e => setFormData({ ...formData, minAlertQty: Number(e.target.value) })}
                  className="w-full max-w-xs px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Branch Inventory Breakdown Setup */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Initial Stock Allocation by Branch Location:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches.map(b => (
                    <div key={b.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-slate-800">{b.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.code}</div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.branchStocks[b.id] ?? 0}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            branchStocks: {
                              ...formData.branchStocks,
                              [b.id]: Number(e.target.value)
                            }
                          })
                        }
                        className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-right font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="save-stock-product-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
