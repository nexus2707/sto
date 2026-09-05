import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Eye,
  Trash2,
  Building2,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Invoice, InvoiceItem, InvoiceType } from '../types';
import { exportInvoicePDF } from '../services/pdfExport';

interface InvoicesViewProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  isCreateOpen = false,
  onCloseCreate
}) => {
  const {
    invoices,
    branches,
    stockItems,
    company,
    currentUser,
    createInvoice,
    deleteInvoice
  } = useInventory();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'facture' | 'proforma'>('all');
  const [filterTva, setFilterTva] = useState<'all' | 'with_tva' | 'without_tva'>('all');
  const [filterBranch, setFilterBranch] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpen);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Form State
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('facture');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'branch-1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerTaxNo, setCustomerTaxNo] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [withTva, setWithTva] = useState(true);
  const [tvaRate, setTvaRate] = useState(company.defaultTvaRate || 16);
  const [exchangeRate, setExchangeRate] = useState(company.defaultExchangeRate || 2850);
  const [notes, setNotes] = useState(company.footerNotes || '');

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      itemCode: stockItems[0]?.itemCode || 'CUSTOM-01',
      description: stockItems[0]?.name || 'Industrial Equipment',
      quantity: 1,
      unit: stockItems[0]?.unit || 'Pcs',
      unitPriceFC: stockItems[0]?.unitPriceFC || 2850000,
      unitPriceUSD: (stockItems[0]?.unitPriceFC || 2850000) / (company.defaultExchangeRate || 2850),
      totalFC: stockItems[0]?.unitPriceFC || 2850000,
      totalUSD: (stockItems[0]?.unitPriceFC || 2850000) / (company.defaultExchangeRate || 2850)
    }
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.branchName.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || inv.type === filterType;

    const matchesTva =
      filterTva === 'all' ||
      (filterTva === 'with_tva' && inv.withTva) ||
      (filterTva === 'without_tva' && !inv.withTva);

    const matchesBranch = filterBranch === 'all' || inv.branchId === filterBranch;

    return matchesSearch && matchesType && matchesTva && matchesBranch;
  });

  const handleOpenCreate = (type: InvoiceType = 'facture') => {
    setInvoiceType(type);
    setSelectedBranchId(branches[0]?.id || 'branch-1');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setCustomerName('');
    setCustomerTaxNo('');
    setCustomerAddress('');
    setCustomerPhone('');
    setWithTva(true);
    setTvaRate(company.defaultTvaRate || 16);
    setExchangeRate(company.defaultExchangeRate || 2850);
    setNotes(company.footerNotes || '');

    const defaultProd = stockItems[0];
    const unitPriceFC = defaultProd?.unitPriceFC || 2850000;
    const unitPriceUSD = unitPriceFC / (company.defaultExchangeRate || 2850);

    setItems([
      {
        itemCode: defaultProd?.itemCode || 'CUSTOM-01',
        description: defaultProd?.name || 'Custom Product',
        quantity: 1,
        unit: defaultProd?.unit || 'Pcs',
        unitPriceFC,
        unitPriceUSD,
        totalFC: unitPriceFC,
        totalUSD: unitPriceUSD
      }
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProd = stockItems[0];
    const unitPriceFC = defaultProd?.unitPriceFC || 2850000;
    const unitPriceUSD = unitPriceFC / exchangeRate;

    setItems(prev => [
      ...prev,
      {
        itemCode: defaultProd?.itemCode || `ITM-${prev.length + 1}`,
        description: defaultProd?.name || 'New Item',
        quantity: 1,
        unit: defaultProd?.unit || 'Pcs',
        unitPriceFC,
        unitPriceUSD,
        totalFC: unitPriceFC,
        totalUSD: unitPriceUSD
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Convert FC <-> USD synchronously when price or rate updates
  const handleItemPriceChange = (
    index: number,
    field: 'fc' | 'usd' | 'qty' | 'code' | 'desc',
    val: any
  ) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'code') {
        const found = stockItems.find(p => p.itemCode === val);
        if (found) {
          item.itemCode = found.itemCode;
          item.description = found.name;
          item.unit = found.unit;
          item.unitPriceFC = found.unitPriceFC;
          item.unitPriceUSD = found.unitPriceFC / exchangeRate;
          item.totalFC = item.quantity * item.unitPriceFC;
          item.totalUSD = item.quantity * item.unitPriceUSD;
        }
      } else if (field === 'desc') {
        item.description = val;
      } else if (field === 'qty') {
        item.quantity = Math.max(1, Number(val) || 1);
        item.totalFC = item.quantity * item.unitPriceFC;
        item.totalUSD = item.quantity * item.unitPriceUSD;
      } else if (field === 'fc') {
        const fc = Number(val) || 0;
        item.unitPriceFC = fc;
        item.unitPriceUSD = fc / exchangeRate;
        item.totalFC = item.quantity * fc;
        item.totalUSD = item.quantity * item.unitPriceUSD;
      } else if (field === 'usd') {
        const usd = Number(val) || 0;
        item.unitPriceUSD = usd;
        item.unitPriceFC = usd * exchangeRate;
        item.totalUSD = item.quantity * usd;
        item.totalFC = item.quantity * item.unitPriceFC;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Update line items whenever exchange rate changes
  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate);
    if (newRate <= 0) return;
    setItems(prev =>
      prev.map(i => {
        const unitPriceUSD = i.unitPriceFC / newRate;
        return {
          ...i,
          unitPriceUSD,
          totalUSD: i.quantity * unitPriceUSD
        };
      })
    );
  };

  // Calculate totals
  const subtotalFC = items.reduce((acc, curr) => acc + curr.totalFC, 0);
  const subtotalUSD = items.reduce((acc, curr) => acc + curr.totalUSD, 0);

  const effectiveTvaRate = withTva ? tvaRate : 0;
  const tvaAmountFC = withTva ? (subtotalFC * effectiveTvaRate) / 100 : 0;
  const totalFC = subtotalFC + tvaAmountFC;

  const tvaAmountUSD = withTva ? (subtotalUSD * effectiveTvaRate) / 100 : 0;
  const totalUSD = subtotalUSD + tvaAmountUSD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Please provide a customer name.');
      return;
    }

    if (items.length === 0) {
      setFormError('Invoice must contain at least one line item.');
      return;
    }

    const branch = branches.find(b => b.id === selectedBranchId);

    const newInv = createInvoice({
      type: invoiceType,
      date,
      dueDate: dueDate || undefined,
      branchId: selectedBranchId,
      branchName: branch?.name || 'Central Store',
      branchAddress: branch?.address || '',
      branchPhone: branch?.phone || '',
      branchEmail: branch?.email || '',
      customerName,
      customerTaxNo: customerTaxNo || undefined,
      customerAddress: customerAddress || undefined,
      customerPhone: customerPhone || undefined,
      withTva,
      tvaRate: effectiveTvaRate,
      exchangeRate,
      items,
      subtotalFC,
      tvaAmountFC,
      totalFC,
      subtotalUSD,
      tvaAmountUSD,
      totalUSD,
      notes,
      status: invoiceType === 'facture' ? 'Paid' : 'Pending'
    });

    setIsModalOpen(false);
    if (onCloseCreate) onCloseCreate();
    setViewInvoice(newInv);
  };

  const handleConvertProformaToFacture = (proforma: Invoice) => {
    if (confirm(`Convert Proforma ${proforma.invoiceNo} into an official Facture invoice?`)) {
      const newFacture = createInvoice({
        ...proforma,
        type: 'facture',
        date: new Date().toISOString().split('T')[0],
        notes: `Converted from Proforma ${proforma.invoiceNo}. ${proforma.notes || ''}`
      });
      setViewInvoice(newFacture);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-900" />
            <span>Facture & Proforma Invoices</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official commercial invoices and proforma quotes with shop-branch header formatting, local FC to USD conversion, and TVA customization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="create-proforma-btn"
            onClick={() => handleOpenCreate('proforma')}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-300"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Proforma</span>
          </button>
          <button
            id="create-facture-btn"
            onClick={() => handleOpenCreate('facture')}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Facture Invoice</span>
          </button>
        </div>
      </div>

      {/* Rules callout box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
          <strong>With TVA Mode:</strong> Prints shop branch address, company tax ID, customer tax info, and <em>both currencies</em> (Local FC & USD) with complete tax calculation.
        </div>
        <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-800">
          <strong>Without TVA Mode:</strong> Strictly prints <em>only USD value</em> without shop name, branch address, or tax numbers (as requested for tax-exempt export/commercial slips).
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-invoices-input"
            type="text"
            placeholder="Search Invoice #, Customer name, or Branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-blue-900 focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Type Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              id="invoice-type-filter"
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Types</option>
              <option value="facture">Facture (Tax Invoice)</option>
              <option value="proforma">Proforma Quote</option>
            </select>
          </div>

          {/* TVA Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">TVA:</span>
            <select
              id="invoice-tva-filter"
              value={filterTva}
              onChange={e => setFilterTva(e.target.value as any)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Tax Status</option>
              <option value="with_tva">With TVA</option>
              <option value="without_tva">Without TVA (Exempt)</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Branch:</span>
            <select
              id="invoice-branch-filter"
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Branch Shop</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">TVA Option</th>
                <th className="py-3 px-4 text-right">Total FC</th>
                <th className="py-3 px-4 text-right">Total USD</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices or proformas found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          inv.type === 'facture'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{inv.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {inv.branchName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {inv.withTva ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          With TVA ({inv.tvaRate}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Without Tax (USD Only)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {inv.withTva ? (
                        <span className="text-slate-800">{inv.totalFC.toLocaleString()} FC</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${inv.totalUSD.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          id={`view-invoice-${inv.id}`}
                          onClick={() => setViewInvoice(inv)}
                          title="View & Print Document"
                          className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-md"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`pdf-invoice-${inv.id}`}
                          onClick={() => exportInvoicePDF(inv, company)}
                          title="Export to PDF"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {inv.type === 'proforma' && (
                          <button
                            id={`convert-proforma-${inv.id}`}
                            onClick={() => handleConvertProformaToFacture(inv)}
                            title="Convert to Official Facture"
                            className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-md"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {currentUser.role === 'admin' && (
                          <button
                            id={`delete-invoice-${inv.id}`}
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNo}?`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            title="Delete Invoice"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Facture or Proforma Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">
                  Create New {invoiceType === 'facture' ? 'Facture (Official Tax Invoice)' : 'Proforma Invoice / Quote'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher & TVA Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Document Type:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('facture')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        invoiceType === 'facture'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Facture (Official)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType('proforma')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        invoiceType === 'proforma'
                          ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Proforma (Devis)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tax (TVA) Setting:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWithTva(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        withTva
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      With TVA (16% + Both Currencies)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithTva(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        !withTva
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Without Tax (USD Only)
                    </button>
                  </div>
                </div>
              </div>

              {/* Branch Selector & Currency Converter Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing Shop Branch (Address format will match this branch) *
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={e => setSelectedBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-blue-900"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    📍 {branches.find(b => b.id === selectedBranchId)?.address}
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-950">
                      Exchange Rate (1 USD = ___ FC):
                    </label>
                    <span className="text-[11px] font-bold text-blue-800 font-mono">
                      Live Converter
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={exchangeRate}
                      onChange={e => handleExchangeRateChange(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 text-xs border border-blue-300 rounded-md bg-white font-mono font-bold"
                    />
                    <span className="text-xs text-blue-900">Franc Congolais (FC) per 1 USD</span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Congo Mining Corp"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Tax No (NIF/TVA)</label>
                  <input
                    type="text"
                    value={customerTaxNo}
                    onChange={e => setCustomerTaxNo(e.target.value)}
                    placeholder="e.g. CD-KIN-TVA-99120"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Boulevard du 30 Juin, Gombe, Kinshasa"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Invoice Items (Live Dual-Currency Synchronized):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Item / Description</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2">Unit</th>
                        <th className="py-2 px-2 text-right">Price (FC)</th>
                        <th className="py-2 px-2 text-right">Price (USD)</th>
                        <th className="py-2 px-2 text-right">Total (FC)</th>
                        <th className="py-2 px-2 text-right">Total (USD)</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 min-w-[200px]">
                            <select
                              value={item.itemCode}
                              onChange={e => handleItemPriceChange(idx, 'code', e.target.value)}
                              className="w-full p-1 text-xs border border-slate-200 rounded mb-1"
                            >
                              {stockItems.map(p => (
                                <option key={p.id} value={p.itemCode}>
                                  {p.itemCode} - {p.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => handleItemPriceChange(idx, 'desc', e.target.value)}
                              placeholder="Description"
                              className="w-full p-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleItemPriceChange(idx, 'qty', e.target.value)}
                              className="w-14 p-1 text-xs border border-slate-300 rounded text-right font-bold"
                            />
                          </td>
                          <td className="p-2 text-slate-600">{item.unit}</td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPriceFC}
                              onChange={e => handleItemPriceChange(idx, 'fc', e.target.value)}
                              className="w-24 p-1 text-xs border border-slate-300 rounded text-right font-mono"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={Number(item.unitPriceUSD.toFixed(2))}
                              onChange={e => handleItemPriceChange(idx, 'usd', e.target.value)}
                              className="w-20 p-1 text-xs border border-slate-300 rounded text-right font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono text-slate-700 whitespace-nowrap">
                            {item.totalFC.toLocaleString()} FC
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ${item.totalUSD.toFixed(2)}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500 max-w-sm">
                  {withTva ? (
                    <span>
                      Standard TVA of <strong>{tvaRate}%</strong> is calculated on subtotal. Output will print both FC and USD.
                    </span>
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      Without TVA selected. Output prints strictly in USD without shop name, address, or tax details.
                    </span>
                  )}
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{subtotalFC.toLocaleString()} FC / ${subtotalUSD.toFixed(2)}</span>
                  </div>

                  {withTva && (
                    <div className="flex justify-between text-slate-600">
                      <span>TVA ({tvaRate}%):</span>
                      <span>{tvaAmountFC.toLocaleString()} FC / ${tvaAmountUSD.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <div className="text-right">
                      {withTva && <div className="text-xs font-mono">{totalFC.toLocaleString()} FC</div>}
                      <div className="text-emerald-800 text-base">${totalUSD.toFixed(2)} USD</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Footer Notes & Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
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
                  id="submit-invoice-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-xs"
                >
                  Save & Generate {invoiceType === 'facture' ? 'Facture' : 'Proforma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Print Invoice Preview */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6">
            {/* Top Toolbar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <span>{viewInvoice.type.toUpperCase()}: {viewInvoice.invoiceNo}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({viewInvoice.withTva ? 'With TVA' : 'Without Tax - USD Only'})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportInvoicePDF(viewInvoice, company)}
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
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="p-8 sm:p-12 printable-area bg-white text-slate-900 font-sans">
              {viewInvoice.withTva ? (
                /* === WITH TVA FORMAT: Shop address, Company Tax No, Both Currencies === */
                <div>
                  <div className="border-b-2 border-slate-900 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {company.companyName}
                        </h1>
                        <div className="text-xs font-bold text-blue-900 mt-1">
                          BRANCH: {viewInvoice.branchName}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                          <p>📍 Shop Address: {viewInvoice.branchAddress}</p>
                          <p>
                            <strong>TAX ID (NIF):</strong> {company.taxNumber} | <strong>RCCM:</strong> {company.rccm}
                          </p>
                          <p>
                            Tel: {viewInvoice.branchPhone || company.phone} | Email: {viewInvoice.branchEmail || company.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-block bg-blue-900 text-white font-mono font-bold text-xs sm:text-sm px-3 py-1 rounded">
                          {viewInvoice.type === 'facture' ? 'FACTURE COMMERCIALE & FISCALE' : 'FACTURE PROFORMA'}
                        </div>
                        <div className="font-mono text-sm font-bold text-slate-900 mt-2">
                          {viewInvoice.invoiceNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Date: <strong>{viewInvoice.date}</strong>
                        </div>
                        <div className="text-xs text-slate-500">
                          Rate: 1 USD = <strong>{viewInvoice.exchangeRate.toLocaleString()} FC</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Grid */}
                  <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Facturé à (Client):
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {viewInvoice.customerName}
                      </div>
                      {viewInvoice.customerTaxNo && (
                        <div className="text-slate-700 mt-0.5">
                          <strong>NIF / TVA Client:</strong> {viewInvoice.customerTaxNo}
                        </div>
                      )}
                      {viewInvoice.customerAddress && (
                        <div className="text-slate-600 mt-0.5">
                          Adresse: {viewInvoice.customerAddress}
                        </div>
                      )}
                      {viewInvoice.customerPhone && (
                        <div className="text-slate-600 mt-0.5">
                          Téléphone: {viewInvoice.customerPhone}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Détails de la transaction:
                      </div>
                      <div className="text-slate-700">
                        Date d'émission: <strong>{viewInvoice.date}</strong>
                      </div>
                      {viewInvoice.dueDate && (
                        <div className="text-slate-700">
                          Date d'échéance: <strong>{viewInvoice.dueDate}</strong>
                        </div>
                      )}
                      <div className="text-slate-700">
                        Régime fiscal: <strong>Assujetti TVA ({viewInvoice.tvaRate}%)</strong>
                      </div>
                      <div className="text-slate-700">
                        Établi par: <strong>{viewInvoice.createdByName}</strong> ({viewInvoice.createdByEmail})
                      </div>
                    </div>
                  </div>

                  {/* Line items table with BOTH CURRENCIES */}
                  <table className="w-full text-left text-xs mb-6 border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-b">#</th>
                        <th className="py-2.5 px-3 border-b">Code</th>
                        <th className="py-2.5 px-3 border-b">Désignation</th>
                        <th className="py-2.5 px-3 border-b text-center">Qté</th>
                        <th className="py-2.5 px-3 border-b text-center">Unité</th>
                        <th className="py-2.5 px-3 border-b text-right">Prix Unitaire (FC / USD)</th>
                        <th className="py-2.5 px-3 border-b text-right">Total (FC / USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {viewInvoice.items.map((itm, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 text-slate-500">{i + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{itm.itemCode}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{itm.description}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{itm.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{itm.unit}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="font-mono">{itm.unitPriceFC.toLocaleString()} FC</div>
                            <div className="text-[11px] text-slate-500">(${itm.unitPriceUSD.toFixed(2)})</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            <div className="font-mono text-slate-900">{itm.totalFC.toLocaleString()} FC</div>
                            <div className="text-[11px] text-emerald-800 font-semibold">(${itm.totalUSD.toFixed(2)})</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Dual Currency Totals */}
                  <div className="flex justify-end mb-6">
                    <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Sous-total HT:</span>
                        <span className="font-mono">{viewInvoice.subtotalFC.toLocaleString()} FC / ${viewInvoice.subtotalUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>TVA ({viewInvoice.tvaRate}%):</span>
                        <span className="font-mono">{viewInvoice.tvaAmountFC.toLocaleString()} FC / ${viewInvoice.tvaAmountUSD.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                        <span>TOTAL GÉNÉRAL:</span>
                        <div className="text-right">
                          <div className="font-mono text-blue-900">{viewInvoice.totalFC.toLocaleString()} FC</div>
                          <div className="text-xs font-semibold text-slate-700">(${viewInvoice.totalUSD.toFixed(2)} USD)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* === WITHOUT TVA FORMAT: ONLY USD VALUE, NO SHOP NAME, NO SHOP ADDRESS, NO TAX === */
                <div>
                  <div className="border-b-2 border-slate-400 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                          {viewInvoice.type === 'facture' ? 'COMMERCIAL INVOICE' : 'PROFORMA INVOICE'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                          Direct Settlement / Tax Exempt Export Document (USD Only)
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-slate-900">
                          {viewInvoice.invoiceNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Date: <strong>{viewInvoice.date}</strong>
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          Currency: USD ($)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Only */}
                  <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Billed To (Customer):
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {viewInvoice.customerName}
                    </div>
                    {viewInvoice.customerAddress && (
                      <div className="text-slate-600 mt-0.5">
                        {viewInvoice.customerAddress}
                      </div>
                    )}
                  </div>

                  {/* Items table in USD ONLY */}
                  <table className="w-full text-left text-xs mb-6 border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-b">#</th>
                        <th className="py-2.5 px-3 border-b">Item Code</th>
                        <th className="py-2.5 px-3 border-b">Description</th>
                        <th className="py-2.5 px-3 border-b text-center">Qty</th>
                        <th className="py-2.5 px-3 border-b text-center">Unit</th>
                        <th className="py-2.5 px-3 border-b text-right">Unit Price (USD)</th>
                        <th className="py-2.5 px-3 border-b text-right">Total (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {viewInvoice.items.map((itm, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 text-slate-500">{i + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{itm.itemCode}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{itm.description}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{itm.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{itm.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            ${itm.unitPriceUSD.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ${itm.totalUSD.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* USD Total Only */}
                  <div className="flex justify-end mb-6">
                    <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal USD:</span>
                        <span className="font-mono">${viewInvoice.subtotalUSD.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                        <span>TOTAL AMOUNT (USD):</span>
                        <span className="font-mono text-base text-slate-900">${viewInvoice.totalUSD.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewInvoice.notes && (
                <div className="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                  <strong>Notes & Instructions:</strong> {viewInvoice.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-10 pt-10 border-t border-slate-200 text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 text-center font-bold text-slate-800">
                    Authorized Representative
                  </div>
                  <div className="text-center text-slate-500 mt-1">{viewInvoice.createdByName}</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-2 text-center font-bold text-slate-800">
                    Customer Acceptance / Signature
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
