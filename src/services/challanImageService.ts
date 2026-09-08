import { StockTransfer, CompanyProfile } from '../types';

/**
 * Generates formatted WhatsApp message text with Challan details
 */
export function formatChallanWhatsAppText(transfer: StockTransfer, company: CompanyProfile): string {
  const lines = [
    `📦 *BON DE TRANSFERT INTERNE*`,
    `🏢 *${company.companyName || 'EASY FLOW'}*`,
    `TAX NO (NIF): ${company.taxNumber || 'CD-KIN-TVA-00984218-A'} | RCCM: ${company.rccm || 'CD/KIN/RCCM/20-B-08412'} | ID NAT: ${company.nationalId || '01-83-N45209P'}`,
    `Email: ${company.email || 'contact@rftcom-trading.com'} | Phone: ${company.phone || '+243 81 000 9876 / +243 99 555 4321'}`,
    `-----------------------------------------`,
    `*Challan N°:* ${transfer.challanNo}`,
    `*Date:* ${transfer.date}`,
    `*Expéditeur (FROM):* ${transfer.fromBranchName}`,
    `*Destinataire (TO):* ${transfer.toBranchName}`,
    `*Type de Mouvement:* ${transfer.transactionType || 'Bon-Stock Transfer'}`,
    transfer.driverOrCarrier ? `*Chauffeur / Transporteur:* ${transfer.driverOrCarrier}` : '',
    transfer.remarks ? `*Remarques / Motif:* ${transfer.remarks}` : '',
    `-----------------------------------------`,
    `📋 *ARTICLES EN TRANSFERT (${transfer.items.length}):*`,
    ...transfer.items.map((it, idx) => 
      `${idx + 1}. *${it.itemName}*\n    ▸ Quantité: *${it.quantity} ${it.unit || 'Pcs'}*`
    ),
    `-----------------------------------------`,
    `🔢 *TOTAL ARTICLES:* *${transfer.totalQuantity}*`,
    `👤 *Émis par:* ${transfer.createdByName || transfer.createdByEmail || 'Logistique'}`,
    `-----------------------------------------`
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Copies text to clipboard with automatic fallback to execCommand
 */
export async function copyWhatsAppTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText blocked, trying fallback textarea:', err);
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Renders the Stock Transfer Challan onto a pure HTML5 2D Canvas.
 * This completely avoids html2canvas and never crashes on CSS oklch or Tailwind colors.
 */
export function renderChallanToCanvas(transfer: StockTransfer, company: CompanyProfile): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1100;
  const rowHeight = 38;
  const remarksHeight = transfer.remarks ? 65 : 0;
  const height = 540 + transfer.items.length * rowHeight + remarksHeight;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top navy accent bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, 10);

  // Company Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText(company.companyName || 'EASY FLOW', 40, 58);

  // Subtitle & Tax details
  ctx.fillStyle = '#475569';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(
    `TAX NO (NIF): ${company.taxNumber || 'CD-KIN-TVA-00984218-A'}   |   RCCM: ${company.rccm || 'CD/KIN/RCCM/20-B-08412'}   |   ID NAT: ${company.nationalId || '01-83-N45209P'}`,
    40,
    86
  );
  ctx.fillText(
    `Email: ${company.email || 'contact@rftcom-trading.com'}   |   Phone: ${company.phone || '+243 81 000 9876 / +243 99 555 4321'}`,
    40,
    108
  );

  // Document Badge (Top Right)
  const badgeWidth = 260;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width - badgeWidth - 40, 36, badgeWidth, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BON DE TRANSFERT INTERNE', width - 40 - badgeWidth / 2, 60);

  // Challan No & Date
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`N° ${transfer.challanNo}`, width - 40, 104);
  ctx.fillStyle = '#475569';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(`Date: ${transfer.date}`, width - 40, 126);
  ctx.textAlign = 'left';

  // Divider line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(40, 142);
  ctx.lineTo(width - 40, 142);
  ctx.stroke();

  // Route Box (Source -> Destination)
  const routeBoxY = 158;
  const routeBoxH = 92;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, routeBoxY, width - 80, routeBoxH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, routeBoxY, width - 80, routeBoxH);

  // From
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('POINT DE DÉPART (SOURCE):', 60, routeBoxY + 28);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(transfer.fromBranchName, 60, routeBoxY + 54);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(`Type: Stock Source • ${transfer.branchContext || 'Opérations'}`, 60, routeBoxY + 76);

  // Transfer Arrow
  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('➔', width / 2, routeBoxY + 54);
  ctx.textAlign = 'left';

  // To
  const rightColX = width / 2 + 50;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('DESTINATION (RÉCEPTION):', rightColX, routeBoxY + 28);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(transfer.toBranchName, rightColX, routeBoxY + 54);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(`Mouvement: ${transfer.transactionType || 'Bon-Stock Transfer'}`, rightColX, routeBoxY + 76);

  // Table Start
  let y = routeBoxY + routeBoxH + 24;

  // Table Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, y, width - 80, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('#', 55, y + 23);
  ctx.fillText('DÉSIGNATION / ARTICLE', 95, y + 23);
  ctx.fillText('UNITÉ', width - 210, y + 23);
  ctx.textAlign = 'right';
  ctx.fillText('QUANTITÉ TRANSFÉRÉE', width - 60, y + 23);
  ctx.textAlign = 'left';

  y += 36;

  // Items
  transfer.items.forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(40, y, width - 80, rowHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, y, width - 80, rowHeight);

    // Number
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(String(idx + 1), 55, y + 24);

    // Name (truncated if very long)
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px Arial, sans-serif';
    let name = item.itemName;
    if (name.length > 70) name = name.substring(0, 67) + '...';
    ctx.fillText(name, 95, y + 24);

    // Unit
    ctx.fillStyle = '#475569';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(item.unit || 'Pcs', width - 210, y + 24);

    // Quantity
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(item.quantity), width - 60, y + 24);
    ctx.textAlign = 'left';

    y += rowHeight;
  });

  // Table Summary / Total Row
  const totalRowH = 44;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, y, width - 80, totalRowH);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, y, width - 80, totalRowH);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText(`TOTAL ARTICLES ENREGISTRÉS: ${transfer.items.length}`, 60, y + 27);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`TOTAL QUANTITÉ: ${transfer.totalQuantity}`, width - 60, y + 29);
  ctx.textAlign = 'left';

  y += totalRowH + 18;

  // Remarks
  if (transfer.remarks) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, y, width - 80, 48);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, y, width - 80, 48);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('Remarques / Motif:', 55, y + 28);
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(transfer.remarks, 185, y + 28);

    y += 62;
  }

  // Signatures Section
  const sigBoxW = (width - 80 - 40) / 3;
  const sigBoxH = 92;

  const signatures = [
    {
      title: 'Émis par (Magasinier)',
      sub: transfer.createdByName || transfer.createdByEmail || 'Responsable Logistique'
    },
    {
      title: 'Transporteur / Chauffeur',
      sub: transfer.driverOrCarrier || 'En Transit'
    },
    {
      title: 'Réceptionnaire (Boutique)',
      sub: 'Cachet & Signature'
    }
  ];

  signatures.forEach((sig, i) => {
    const sx = 40 + i * (sigBoxW + 20);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(sx, y, sigBoxW, sigBoxH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, y, sigBoxW, sigBoxH);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(sig.title, sx + 15, y + 24);

    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx + 15, y + 60);
    ctx.lineTo(sx + sigBoxW - 15, y + 60);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sig.sub, sx + sigBoxW / 2, y + 78);
    ctx.textAlign = 'left';
  });

  // Footer Note
  y += sigBoxH + 32;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Document officiel Easy Flow ERP • Enregistré au registre central de stock • Valide pour contrôle physique et transport routier',
    width / 2,
    y
  );
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Copies Challan Image to clipboard as PNG and downloads fallback file
 */
export async function copyChallanImageToClipboard(
  transfer: StockTransfer,
  company: CompanyProfile
): Promise<{ success: boolean; imageCopied: boolean; textCopied: boolean; error?: string }> {
  const canvas = renderChallanToCanvas(transfer, company);
  let imageCopied = false;
  let textCopied = false;

  // Also format and copy text to maximize utility in WhatsApp
  const text = formatChallanWhatsAppText(transfer, company);
  textCopied = await copyWhatsAppTextToClipboard(text);

  // Attempt binary image copy to clipboard
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        imageCopied = true;
      }
    }
  } catch (clipboardErr) {
    console.warn('Direct image clipboard write failed/restricted:', clipboardErr);
  }

  // Always trigger auto-download of image so user has the PNG file immediately available
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Challan_${transfer.challanNo}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (downloadErr) {
    console.warn('Automatic image download failed:', downloadErr);
  }

  return {
    success: imageCopied || textCopied,
    imageCopied,
    textCopied
  };
}

/**
 * Downloads Challan PNG image directly
 */
export function downloadChallanImage(transfer: StockTransfer, company: CompanyProfile): void {
  const canvas = renderChallanToCanvas(transfer, company);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Challan_${transfer.challanNo}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates standalone, self-contained printable HTML document
 */
export function getPrintableChallanHtml(transfer: StockTransfer, company: CompanyProfile): string {
  const itemsRows = transfer.items
    .map(
      (it, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; color: #64748b;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #0f172a;">${it.itemName}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a;">${it.quantity}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; color: #475569;">${it.unit || 'Pcs'}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Challan_${transfer.challanNo}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
    .header { border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company-title { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; }
    .company-sub { font-size: 11px; color: #475569; margin: 3px 0 0 0; }
    .doc-badge { background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 4px; text-align: right; display: inline-block; letter-spacing: 0.5px; }
    .route-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; margin: 16px 0; border-radius: 8px; }
    .route-title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .route-name { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { background: #0f172a; color: #ffffff; border: 1px solid #0f172a; padding: 8px; font-size: 11px; text-transform: uppercase; }
    .footer-total { background: #f1f5f9; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1; text-align: center; }
    .sig-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; height: 85px; display: flex; flex-direction: column; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="company-title">${company.companyName || 'EASY FLOW'}</h1>
      <p class="company-sub" style="font-weight: 600; color: #334155;">TAX NO (NIF): ${company.taxNumber || 'CD-KIN-TVA-00984218-A'} | RCCM: ${company.rccm || 'CD/KIN/RCCM/20-B-08412'} | ID NAT: ${company.nationalId || '01-83-N45209P'}</p>
      <p class="company-sub">Email: ${company.email || 'contact@rftcom-trading.com'} | Phone: ${company.phone || '+243 81 000 9876 / +243 99 555 4321'}</p>
    </div>
    <div style="text-align: right;">
      <div class="doc-badge">BON DE TRANSFERT</div>
      <div style="font-family: monospace; font-size: 16px; font-weight: bold; margin-top: 5px; color: #0f172a;">N° ${transfer.challanNo}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">Date: <strong>${transfer.date}</strong></div>
    </div>
  </div>

  <div class="route-box">
    <div>
      <div class="route-title">Point de Départ (Source / FROM)</div>
      <div class="route-name">${transfer.fromBranchName}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Contexte: ${transfer.branchContext || 'Stock Source'}</div>
    </div>
    <div>
      <div class="route-title">Point d'Arrivée (Destination / TO)</div>
      <div class="route-name">${transfer.toBranchName}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Mouvement: ${transfer.transactionType || 'Bon-Stock Transfer'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th style="text-align: left;">Désignation / Article</th>
        <th style="width: 90px; text-align: right;">Quantité</th>
        <th style="width: 65px; text-align: center;">Unité</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
    <tfoot>
      <tr class="footer-total">
        <td colspan="2" style="border: 1px solid #cbd5e1; padding: 9px; text-align: right; text-transform: uppercase; font-size: 11px;">
          Total Lignes Transférées: ${transfer.items.length}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 9px; text-align: right; font-family: monospace; font-size: 15px; font-weight: 900; color: #1e3a8a;">
          ${transfer.totalQuantity}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 9px; text-align: center; font-size: 11px;">
          Articles
        </td>
      </tr>
    </tfoot>
  </table>

  ${
    transfer.remarks
      ? `
    <div style="margin-top: 14px; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px;">
      <strong>Remarques / Motif:</strong> ${transfer.remarks}
    </div>
  `
      : ''
  }

  <div class="signatures">
    <div class="sig-box">
      <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #334155;">1. Expéditeur (Sender)</div>
      <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 11px; color: #475569;">
        ${transfer.createdByName || transfer.createdByEmail}
      </div>
    </div>
    <div class="sig-box">
      <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #334155;">2. Transporteur (Carrier)</div>
      <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 11px; color: #475569;">
        ${transfer.driverOrCarrier || 'Chauffeur / En Transit'}
      </div>
    </div>
    <div class="sig-box">
      <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #334155;">3. Réceptionnaire (Receiver)</div>
      <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 11px; color: #475569;">
        Date & Cachet
      </div>
    </div>
  </div>

  <div style="margin-top: 25px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
    EASY FLOW ERP • Generated Document • Valid for Transport & Verification
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;
}
