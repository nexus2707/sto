import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockTransfer, Invoice, CompanyProfile } from '../types';

export function exportTransferChallanPDF(transfer: StockTransfer, company: CompanyProfile) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Box
  doc.setFillColor(243, 244, 246);
  doc.rect(14, 12, 182, 28, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(company.companyName, 18, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`TAX NO (NIF): ${company.taxNumber} | RCCM: ${company.rccm} | ID NAT: ${company.nationalId}`, 18, 26);
  doc.text(`Email: ${company.email} | Phone: ${company.phone}`, 18, 32);

  // Title Banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(14, 43, 182, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INTERNAL STOCK TRANSFER CHALLAN / BORDEREAU DE TRANSFERT', 18, 50);

  // Challan Info Grid
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);

  // Left Column (From & To)
  doc.setFont('helvetica', 'bold');
  doc.text('FROM BRANCH (SOURCE):', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.fromBranchName, 14, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('TO BRANCH (DESTINATION):', 14, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.toBranchName, 14, 80);

  // Right Column (Challan Details)
  doc.setFont('helvetica', 'bold');
  doc.text('CHALLAN NUMBER:', 115, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.challanNo, 155, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSFER DATE:', 115, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.date, 155, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', 115, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.status, 155, 72);

  doc.setFont('helvetica', 'bold');
  doc.text('CREATED BY (AUTH EMAIL):', 115, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(transfer.createdByEmail, 155, 78);

  if (transfer.driverOrCarrier || transfer.vehicleNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('CARRIER / VEHICLE:', 115, 84);
    doc.setFont('helvetica', 'normal');
    doc.text(`${transfer.driverOrCarrier || ''} ${transfer.vehicleNumber ? `[${transfer.vehicleNumber}]` : ''}`, 155, 84);
  }

  // Items Table
  const tableData = transfer.items.map((item, index) => [
    index + 1,
    item.itemCode,
    item.itemName,
    item.quantity.toLocaleString(),
    item.unit,
    item.remarks || '-'
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Item Code', 'Description / Product Details', 'Qty', 'Unit', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 40 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Remarks
  if (transfer.remarks) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Special Instructions / Notes:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(transfer.remarks, 14, finalY + 5);
  }

  // Signature Blocks
  const sigY = finalY + 22;
  doc.setDrawColor(209, 213, 219);

  // Signatures
  doc.line(14, sigY, 65, sigY);
  doc.line(75, sigY, 125, sigY);
  doc.line(135, sigY, 185, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DISPATCHED BY (Storekeeper)', 14, sigY + 5);
  doc.text('CARRIER / DRIVER (In-Transit)', 75, sigY + 5);
  doc.text('RECEIVED & VERIFIED BY (Recipient)', 135, sigY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Name: ${transfer.createdByName}`, 14, sigY + 10);
  doc.text(`Date & Signature`, 75, sigY + 10);
  doc.text(`Date & Signature`, 135, sigY + 10);

  doc.save(`Stock_Transfer_${transfer.challanNo}.pdf`);
}

export function exportInvoicePDF(invoice: Invoice, company: CompanyProfile) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // STRICT USER REQUIREMENT:
  // "need option in invoice with tva , without tva"
  // "if with tva print shops address tax and both currency"
  // "if without tax only usd value without shop name address tax"

  let startTableY = 85;

  if (invoice.withTva) {
    // --- WITH TVA MODE ---
    // Print Shop Branch Name & Address, Company Tax No, and BOTH currencies
    doc.setFillColor(243, 244, 246);
    doc.rect(14, 12, 182, 32, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(company.companyName, 18, 19);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`BRANCH: ${invoice.branchName}`, 18, 25);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Shop Address: ${invoice.branchAddress}`, 18, 30);
    doc.text(`TAX NUMBER (NIF): ${company.taxNumber} | RCCM: ${company.rccm}`, 18, 35);
    doc.text(`Phone: ${invoice.branchPhone || company.phone} | Email: ${invoice.branchEmail || company.email}`, 18, 40);

    // Title banner
    doc.setFillColor(30, 58, 138);
    doc.rect(14, 47, 182, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleText = invoice.type === 'facture'
      ? 'FACTURE COMMERCIALE & FISCALE (OFFICIAL TAX INVOICE)'
      : 'FACTURE PROFORMA / QUOTATION (PROFORMA INVOICE)';
    doc.text(titleText, 18, 54);

    // Metadata Grid
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);

    // Customer
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT / FACTURÉ À:', 14, 64);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerName, 14, 69);
    doc.setFont('helvetica', 'normal');
    if (invoice.customerTaxNo) doc.text(`NIF / TVA Client: ${invoice.customerTaxNo}`, 14, 74);
    if (invoice.customerAddress) doc.text(`Adresse: ${invoice.customerAddress}`, 14, 79);

    // Invoice Meta
    doc.setFont('helvetica', 'bold');
    doc.text('NUMÉRO:', 125, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNo, 160, 64);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 125, 69);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.date, 160, 69);

    doc.setFont('helvetica', 'bold');
    doc.text('TAUX DE CHANGE:', 125, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(`1 USD = ${invoice.exchangeRate.toLocaleString()} FC`, 160, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('TVA APPLICABLE:', 125, 79);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.tvaRate}% (Inclus)`, 160, 79);

    startTableY = 86;

    // Table with BOTH currencies
    const tableData = invoice.items.map((item, idx) => [
      idx + 1,
      item.itemCode,
      item.description,
      item.quantity,
      item.unit,
      `${item.unitPriceFC.toLocaleString()} FC\n($${item.unitPriceUSD.toFixed(2)})`,
      `${item.totalFC.toLocaleString()} FC\n($${item.totalUSD.toFixed(2)})`
    ]);

    autoTable(doc, {
      startY: startTableY,
      head: [['#', 'Code', 'Désignation / Description', 'Qté', 'Unité', 'Prix Unitaire (FC / USD)', 'Total (FC / USD)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [31, 41, 55]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 65 },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 27, halign: 'right' },
        6: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Dual Currency Totals summary box
    doc.setFillColor(249, 250, 251);
    doc.rect(100, finalY, 96, 32, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(100, finalY, 96, 32, 'S');

    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text('Sous-Total / Subtotal:', 104, finalY + 6);
    doc.text(`${invoice.subtotalFC.toLocaleString()} FC  /  $${invoice.subtotalUSD.toFixed(2)}`, 192, finalY + 6, { align: 'right' });

    doc.text(`TVA (${invoice.tvaRate}%):`, 104, finalY + 13);
    doc.text(`${invoice.tvaAmountFC.toLocaleString()} FC  /  $${invoice.tvaAmountUSD.toFixed(2)}`, 192, finalY + 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text('TOTAL GÉNÉRAL:', 104, finalY + 23);
    doc.text(`${invoice.totalFC.toLocaleString()} FC`, 192, finalY + 21, { align: 'right' });
    doc.text(`($${invoice.totalUSD.toFixed(2)} USD)`, 192, finalY + 27, { align: 'right' });

  } else {
    // --- WITHOUT TVA MODE ---
    // STRICT USER REQUIREMENT:
    // "if without tax only usd value without shop name address tax"
    // No shop name, No shop address, No company tax number! Strictly commercial invoice in USD!

    // Header without shop name, address or tax number
    doc.setFillColor(243, 244, 246);
    doc.rect(14, 14, 182, 18, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(invoice.type === 'facture' ? 'COMMERCIAL INVOICE' : 'PROFORMA INVOICE', 18, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Tax Exempt / Direct Settlement Export Document', 18, 30);

    // Invoice Info Grid (USD only)
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);

    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO (CUSTOMER):', 14, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerName, 14, 48);

    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE NO:', 125, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNo, 160, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 125, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.date, 160, 48);

    doc.setFont('helvetica', 'bold');
    doc.text('CURRENCY:', 125, 54);
    doc.setFont('helvetica', 'normal');
    doc.text('USD ($) ONLY', 160, 54);

    startTableY = 62;

    // Table with ONLY USD value
    const tableData = invoice.items.map((item, idx) => [
      idx + 1,
      item.itemCode,
      item.description,
      item.quantity,
      item.unit,
      `$${item.unitPriceUSD.toFixed(2)}`,
      `$${item.totalUSD.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startTableY,
      head: [['#', 'Item Code', 'Item Description', 'Qty', 'Unit', 'Unit Price (USD)', 'Total (USD)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [55, 65, 81],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [31, 41, 55]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 74 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // USD Total summary box
    doc.setFillColor(249, 250, 251);
    doc.rect(115, finalY, 81, 20, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(115, finalY, 81, 20, 'S');

    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal USD:', 120, finalY + 7);
    doc.text(`$${invoice.subtotalUSD.toFixed(2)}`, 190, finalY + 7, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(17, 24, 39);
    doc.text('TOTAL AMOUNT (USD):', 120, finalY + 15);
    doc.text(`$${invoice.totalUSD.toFixed(2)}`, 190, finalY + 15, { align: 'right' });
  }

  doc.save(`${invoice.type === 'facture' ? 'Facture' : 'Proforma'}_${invoice.invoiceNo}.pdf`);
}

export function exportTransfersReportPDF(
  transfers: StockTransfer[],
  filters: { dateFrom?: string; dateTo?: string; fromBranch?: string; toBranch?: string }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Document Title & Company Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('STOCK TRANSFERS & CHALLANS REPORT', 14, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Scope: Date ${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'} | From: ${filters.fromBranch || 'All'} | To: ${filters.toBranch || 'All'}`,
    14,
    21
  );
  doc.text(
    `Total Challans: ${transfers.length} | Generated on: ${new Date().toLocaleString()}`,
    14,
    26
  );

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 29, pageWidth - 14, 29);

  let currentY = 34;

  if (transfers.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No stock transfers found matching the filter criteria.', 14, currentY + 10);
  } else {
    transfers.forEach((challan, cIdx) => {
      // Check if we need a new page for the challan block (needs at least ~55mm)
      if (currentY + 50 > pageHeight - 15) {
        doc.addPage();
        currentY = 16;
      }

      // Challan Header Bar
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, currentY, pageWidth - 28, 9, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(14, currentY, pageWidth - 28, 9, 'S');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // blue-900
      doc.text(`Challan #${cIdx + 1}: ${challan.challanNo}`, 17, currentY + 6);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${challan.date}  |  Status: ${challan.status}  |  Creator: ${challan.createdByEmail}`, 85, currentY + 6);

      currentY += 11;

      // Routing & Carrier Info Box
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Route: ${challan.fromBranchName}  ->  ${challan.toBranchName}`,
        16,
        currentY
      );
      if (challan.driverOrCarrier || challan.vehicleNumber) {
        doc.text(
          `Carrier / Vehicle: ${challan.driverOrCarrier || 'N/A'} ${challan.vehicleNumber ? `[${challan.vehicleNumber}]` : ''}`,
          16,
          currentY + 4
        );
        currentY += 6;
      } else {
        currentY += 2;
      }

      // Items Table for this specific Challan
      const itemRows = challan.items.map((it, idx) => [
        idx + 1,
        it.itemCode,
        it.itemName,
        it.quantity,
        it.unit,
        it.remarks || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: 14, right: 14 },
        head: [['#', 'Item Code', 'Product Name & Specifications', 'Qty', 'Unit', 'Remarks']],
        body: itemRows,
        foot: [[
          { content: 'Challan Total Units:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `${challan.totalQuantity}`, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: '', colSpan: 2 }
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59]
        },
        footStyles: {
          fillColor: [248, 250, 252],
          textColor: [30, 58, 138],
          fontSize: 8,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26, fontStyle: 'bold' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 38 }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || currentY + 20;

      if (challan.remarks) {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Challan Remarks: ${challan.remarks}`, 16, finalY + 4);
        currentY = finalY + 9;
      } else {
        currentY = finalY + 6;
      }
    });
  }

  doc.save(`Stock_Transfers_Itemized_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportInvoicesReportPDF(
  invoices: Invoice[],
  filters: { dateFrom?: string; dateTo?: string; branchName?: string; type?: string }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('INVOICES & PROFORMAS SUMMARY REPORT', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Filter: Date ${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'} | Branch: ${filters.branchName || 'All'} | Type: ${filters.type || 'All'} | Total Invoices: ${invoices.length}`,
    14,
    22
  );

  const tableData = invoices.map((inv, idx) => [
    idx + 1,
    inv.invoiceNo,
    inv.type.toUpperCase(),
    inv.date,
    inv.branchName,
    inv.customerName,
    inv.withTva ? `Yes (${inv.tvaRate}%)` : 'No (0%)',
    `${inv.totalFC.toLocaleString()} FC`,
    `$${inv.totalUSD.toFixed(2)}`,
    inv.createdByEmail,
    inv.status
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Invoice No', 'Type', 'Date', 'Branch', 'Customer', 'TVA', 'Total (FC)', 'Total (USD)', 'Created By', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55]
    }
  });

  doc.save(`Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
