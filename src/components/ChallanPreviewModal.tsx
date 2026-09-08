import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Trash2,
  Copy,
  Check,
  Building2,
  Calendar,
  Truck,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Share2,
  MessageSquare,
  ExternalLink,
  FileText,
  ImageIcon,
  RefreshCw,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { StockTransfer } from '../types';
import { useInventory } from '../context/InventoryContext';
import {
  formatChallanWhatsAppText,
  copyChallanImageToClipboard,
  downloadChallanImage,
  getPrintableChallanHtml
} from '../services/challanImageService';
import { exportTransferChallanPDF } from '../services/pdfExport';

interface ChallanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
  onDeleteSuccess?: () => void;
}

export const ChallanPreviewModal: React.FC<ChallanPreviewModalProps> = ({
  isOpen,
  onClose,
  transfer,
  onDeleteSuccess
}) => {
  const {
    company,
    currentUser,
    canDeleteTransfer,
    deleteTransfer,
    isTransferSyncedToSheet,
    syncTransferToSheets
  } = useInventory();
  const documentRef = useRef<HTMLDivElement>(null);

  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'fallback'>('idle');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen || !transfer) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSyncToSheets = async () => {
    if (!transfer) return;
    setIsSyncing(true);
    setSyncError(null);
    showToast('Authorizing & saving to Google Sheet tabs "buro" and "club"...');
    try {
      const res = await syncTransferToSheets(transfer);
      if (res.success) {
        showToast(`✅ Challan #${transfer.challanNo} successfully saved to Google Sheet tabs "buro" and "club"!`);
      } else {
        setSyncError(res.error || 'Failed to save to Google Sheet.');
        showToast(`⚠️ Sync failed: ${res.error || 'Check write authorization'}`);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Error syncing to Google Sheet');
      showToast(`⚠️ Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Copy Image & Formatted Summary for WhatsApp
  const handleCopyImageForWhatsApp = async () => {
    setIsCopyingImage(true);
    setCopyStatus('idle');
    showToast('⏳ Generating Challan image for WhatsApp...');

    try {
      const res = await copyChallanImageToClipboard(transfer, company);
      setCopyStatus('success');
      if (res.imageCopied) {
        showToast('✅ Challan image copied to clipboard! Press Ctrl+V directly in WhatsApp. (PNG image also saved)');
      } else {
        showToast('📋 WhatsApp text copied to clipboard & Challan PNG image saved to Downloads! You can paste (Ctrl+V) or attach the image.');
      }
    } catch (err) {
      console.error('WhatsApp image copy error:', err);
      showToast('⚠️ Could not copy directly. Image saved to Downloads & Open WhatsApp available.');
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Open WhatsApp directly with pre-formatted message
  const handleOpenWhatsApp = () => {
    const text = formatChallanWhatsAppText(transfer, company);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Direct PNG Image Download
  const handleDownloadImage = () => {
    try {
      downloadChallanImage(transfer, company);
      showToast('📥 Challan PNG image saved to Downloads!');
    } catch (e) {
      console.error('Download image error:', e);
      showToast('⚠️ Failed to save image.');
    }
  };

  // 2. Reliable Print functionality (opens print-ready document & downloads A4 vector PDF)
  const handlePrint = () => {
    setIsPrinting(true);
    showToast('🖨️ Opening print view & saving A4 Printable PDF...');

    // A. Generate and save the official vector A4 PDF directly
    try {
      exportTransferChallanPDF(transfer, company);
    } catch (pdfErr) {
      console.warn('PDF export error:', pdfErr);
    }

    // B. Open self-contained printable window
    try {
      const printWin = window.open('', '_blank', 'width=850,height=900');
      if (printWin) {
        printWin.document.write(getPrintableChallanHtml(transfer, company));
        printWin.document.close();
        printWin.focus();
      }
    } catch (winErr) {
      console.warn('Print popup blocked by browser:', winErr);
    }

    // C. Trigger current-frame window.print() if allowed
    try {
      window.print();
    } catch (frameErr) {
      console.warn('Frame print blocked:', frameErr);
    }

    setIsPrinting(false);
  };

  // Direct PDF Download
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      exportTransferChallanPDF(transfer, company);
      showToast('📥 Challan A4 PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast('⚠️ Failed to generate PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // 4. Delete Challan
  const handleDelete = () => {
    if (!canDeleteTransfer(transfer)) {
      alert(
        `Permission Denied: Only the creator (${transfer.createdByEmail}) or an administrator can delete this challan.`
      );
      return;
    }

    setIsDeleting(true);
    const result = deleteTransfer(transfer.id);
    setIsDeleting(false);

    if (result.success) {
      showToast('Challan deleted and inventory balances restored.');
      setShowDeleteConfirm(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      onClose();
    } else {
      alert(result.error || 'Failed to delete challan');
    }
  };

  const isUserAuthorizedToDelete = canDeleteTransfer(transfer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 max-w-lg w-full px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm animate-bounce">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <p className="flex-1 font-medium">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden my-auto">
        {/* Top Control Bar with Explicit Action Buttons */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Inter Stock Transfer Preview
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  {transfer.challanNo}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                  ✓ Saved to Sheets (buro &amp; club)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Created by {transfer.createdByName || transfer.createdByEmail} • {transfer.date}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 1. Copy IMAGE for WhatsApp */}
            <button
              id="btn-copy-whatsapp"
              onClick={handleCopyImageForWhatsApp}
              disabled={isCopyingImage}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                copyStatus === 'success'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              } active:scale-95 disabled:opacity-50 cursor-pointer`}
              title="Generate Challan image & copy directly to clipboard for WhatsApp"
            >
              {isCopyingImage ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Image...</span>
                </>
              ) : copyStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied! (Ctrl+V)</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Copy for WhatsApp</span>
                </>
              )}
            </button>

            {/* Direct Open in WhatsApp */}
            <button
              id="btn-open-whatsapp"
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 active:scale-95 transition-all cursor-pointer"
              title="Open WhatsApp Web directly with formatted Challan details"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Open WhatsApp</span>
            </button>

            {/* Save PNG Image */}
            <button
              id="btn-download-image"
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Download Challan as high-resolution PNG image"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Save Image</span>
            </button>

            {/* 2. Print Challan */}
            <button
              id="btn-print-challan"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Open printable view and save A4 printable PDF document"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>{isPrinting ? 'Preparing...' : 'Print'}</span>
            </button>

            {/* Save as PDF */}
            <button
              id="btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Download Challan as standard vector A4 PDF"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Save PDF</span>
            </button>

            {/* 3. Delete Button */}
            {isUserAuthorizedToDelete && (
              <button
                id="btn-delete-challan"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 active:scale-95 transition-all cursor-pointer"
                title="Delete this transfer and restore stock"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Confirm Deletion:</strong> Are you sure you want to delete Challan{' '}
                <strong>{transfer.challanNo}</strong>? All {transfer.totalQuantity} items will be restored to{' '}
                <strong>{transfer.fromBranchName}</strong> stock.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-rose-300 hover:bg-rose-100 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-xs font-bold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete & Restore'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 space-y-4">
          {/* Sync Status Banner */}
          {isTransferSyncedToSheet(transfer.id) ? (
            <div className="max-w-3xl mx-auto flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-emerald-900">Saved to Google Sheet: </span>
                  <span className="text-emerald-800">
                    Recorded in tabs <strong>"buro"</strong> (28 columns) & <strong>"club"</strong> (Dual entry)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncToSheets}
                disabled={isSyncing}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? 'Re-syncing...' : 'Re-sync'}
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 shadow-2xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-950">
                      Challan #{transfer.challanNo} Recorded in App • Pending Google Sheet Sync
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      This transfer was saved in Easy Flow ERP locally, but requires Google write authorization (OAuth) to append rows into tabs <strong>"buro"</strong> and <strong>"club"</strong>.
                    </div>
                    {syncError && (
                      <div className="text-[11px] text-rose-700 font-medium mt-1">
                        Sync Error: {syncError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncToSheets}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isSyncing ? 'Authorizing & Saving...' : 'Authorize & Sync to Sheets Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rendered Challan Document */}
          <div
            id="challan-printable-doc"
            ref={documentRef}
            className="bg-white mx-auto max-w-3xl p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 text-slate-900 font-sans printable-area"
            style={{ minHeight: '650px' }}
          >
            {/* Header / Brand */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-6 h-6 text-slate-900" />
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {company.companyName || 'EASY FLOW'}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Commercial Network • Central Logistics & Inventory
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {company.address || 'Avenue Du Commerce, Gombe, Kinshasa, RDC'}
                  </p>
                  <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
                    TAX NO (NIF): {company.taxNumber || 'CD-KIN-TVA-00984218-A'} | RCCM: {company.rccm || 'CD/KIN/RCCM/20-B-08412'} | ID NAT: {company.nationalId || '01-83-N45209P'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Email: {company.email || 'contact@rftcom-trading.com'} | Phone: {company.phone || '+243 81 000 9876 / +243 99 555 4321'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-3.5 py-1 rounded-md text-xs font-black uppercase tracking-wider mb-1">
                    BON DE TRANSFERT
                  </div>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    N° {transfer.challanNo}
                  </p>
                  <p className="text-xs text-slate-600">
                    Date: <strong className="text-slate-900">{transfer.date}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Movement Route: Source to Destination */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Point de Départ (FROM)
                </p>
                <div className="text-sm font-bold text-slate-900">{transfer.fromBranchName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Type: Stock Source • Kinshasa
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Destination (TO)
                </p>
                <div className="text-sm font-bold text-slate-900">{transfer.toBranchName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Type: Stock Réceptionnaire
                </div>
              </div>
            </div>

            {/* Transfer Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Désignation</th>
                    <th className="py-2.5 px-3 text-right">Quantité</th>
                    <th className="py-2.5 px-3 text-center">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transfer.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.itemName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {item.unit || 'Pcs'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-slate-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      Total Quantité Transférée:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm">
                      {transfer.totalQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 text-xs">Articles</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Remarks if any */}
            {transfer.remarks && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 mb-6">
                <span className="font-bold text-slate-900">Remarques: </span>
                {transfer.remarks}
              </div>
            )}

            {/* Signatures & Approvals Section */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center text-xs text-slate-700">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-slate-900 mb-8">Émis par (Magasinier)</p>
                <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500 font-medium">
                  {transfer.createdByName || transfer.createdByEmail}
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-slate-900 mb-8">Transporteur / Chauffeur</p>
                <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500 font-medium">
                  {transfer.driverOrCarrier || 'Nom & Signature'}
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-slate-900 mb-8">Réceptionnaire (Boutique)</p>
                <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500 font-medium">
                  Date & Cachet
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Document officiel généré par Easy Flow ERP Kinshasa • Enregistré au registre central de stock
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

