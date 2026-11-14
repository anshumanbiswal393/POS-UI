// Unified POS Tax Invoice Print Generator
// Matches the official PMS Folio/Invoice standard from PMS FolioView.tsx and print-templates.ts

import { formatDateIndian } from "./dateUtils";
import type { BillSettlementRecord } from "@/types/posBilling";
import type { AllOrderItem } from "@/types/posOrders";
import type { RoomServiceOrder } from "@/types/posRoomService";

export interface PosInvoiceItem {
  sr?: number;
  date?: string;
  name: string;
  variant?: string;
  notes?: string;
  sac?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  discount?: number;
  sgst?: number;
  cgst?: number;
  isComplimentary?: boolean;
}

export interface PosInvoicePayment {
  date?: string;
  method: string;
  reference?: string;
  amount: number;
}

export interface PosInvoicePrintPayload {
  invoiceNo: string;
  orderNo?: string;
  orderType?: string;
  source?: string;
  issueDate?: string;
  issueTime?: string;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
  outletEmail?: string;
  outletWebsite?: string;
  outletLogo?: string;
  gstin?: string;
  fssai?: string;
  guestName?: string;
  guestPhone?: string;
  guestAddress?: string;
  company?: string;
  companyGst?: string;
  tableOrRoom?: string;
  pax?: number | string;
  captainName?: string;
  status?: string;
  items: PosInvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountCode?: string;
  taxableAmount?: number;
  cgst: number;
  sgst: number;
  serviceCharge?: number;
  roundOff?: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  payments?: PosInvoicePayment[];
  specialNote?: string;
}

// Convert numbers to words (Indian numbering system: Lakhs / Crores)
export function numberToWords(num: number): string {
  if (!num || isNaN(num)) return "Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatChunk = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + formatChunk(n % 100) : "");
    if (n < 100000) return formatChunk(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + formatChunk(n % 1000) : "");
    if (n < 10000000) return formatChunk(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + formatChunk(n % 100000) : "");
    return formatChunk(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + formatChunk(n % 10000000) : "");
  };

  return formatChunk(Math.floor(Math.abs(num))).trim();
}

export function formatINR(val: number | undefined | null): string {
  const num = Number(val || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getActivePropertyFallback(): {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  gstin: string;
} {
  let activeStoredProp: any = null;
  let activeOutletName = "";
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("retrod:active-property");
      if (raw) activeStoredProp = JSON.parse(raw);
    } catch {}
    try {
      const userRaw = localStorage.getItem("retrod:auth-user") || localStorage.getItem("retrod_user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.outlet_name) activeOutletName = u.outlet_name;
        else if (u?.property) activeOutletName = u.property.split("·")[0].trim();
      }
    } catch {}
    try {
      const activeId = localStorage.getItem("retrod_pos_active_outlet_id");
      const outletsRaw = localStorage.getItem("retrod_pos_custom_outlets");
      if (activeId && outletsRaw) {
        const list = JSON.parse(outletsRaw);
        const match = Array.isArray(list) ? list.find((o: any) => o.id === activeId) : null;
        if (match?.name) activeOutletName = match.name;
      }
    } catch {}
  }

  const isOldDummyName =
    !activeStoredProp?.name ||
    activeStoredProp.name.toLowerCase().includes("retrod") ||
    activeStoredProp.name.trim() === "Main Outlet";

  const name = !isOldDummyName
    ? activeStoredProp.name
    : (activeOutletName || "Anshu Suite Restaurant");

  const addressParts = [
    activeStoredProp?.address_line_1,
    activeStoredProp?.address_line_2,
    activeStoredProp?.city,
    activeStoredProp?.state,
    activeStoredProp?.country,
    activeStoredProp?.postal_code ? `- ${activeStoredProp.postal_code}` : "",
  ].filter(Boolean);

  const isOldDummyAddress =
    !activeStoredProp?.address ||
    activeStoredProp.address.includes("Plot 42") ||
    activeStoredProp.address.includes("Mumbai");

  const address =
    addressParts.length > 0 && !addressParts.join(", ").includes("Plot 42")
      ? addressParts.join(", ")
      : (!isOldDummyAddress
          ? activeStoredProp.address
          : "Fortune Tower, Khorda, Odisha, India, - 751001");

  const isOldDummyPhone =
    !activeStoredProp?.phone ||
    activeStoredProp.phone.includes("2640") ||
    activeStoredProp.phone.includes("8899");

  const phone = !isOldDummyPhone
    ? (activeStoredProp?.contact_phone || activeStoredProp?.phone)
    : "9895898999";

  const email = activeStoredProp?.contact_email || activeStoredProp?.email || "anshumanbiswal393@gmail.com";
  const website = activeStoredProp?.website || "https://retrodtech.com/";
  const logo = activeStoredProp?.website_logo || activeStoredProp?.kot_logo || activeStoredProp?.logo || "";

  const isOldDummyGstin =
    !activeStoredProp?.tax_id &&
    (!activeStoredProp?.gst_number || activeStoredProp.gst_number.includes("27AABCR"));

  const gstin = !isOldDummyGstin
    ? (activeStoredProp?.tax_id || activeStoredProp?.gst_number)
    : "HGFDRTWC14517713";

  return { name, address, phone, email, website, logo, gstin };
}

/**
 * Generates the unified, professional PMS Tax Invoice HTML string.
 * Directly corresponds to the format defined in PMS FolioView.tsx & print-templates.ts.
 */
export function generatePosInvoiceHtml(p: PosInvoicePrintPayload): string {
  const prop = getActivePropertyFallback();
  const rawOutletName = p.outletName || prop.name;
  const outletName = rawOutletName.toLowerCase().includes("retrod") ? "Anshu Suite Restaurant" : rawOutletName;
  const rawAddress = p.outletAddress || prop.address;
  const outletAddress = rawAddress.includes("Plot 42") ? "Fortune Tower, Khorda, Odisha, India, - 751001" : rawAddress;
  const rawPhone = p.outletPhone || prop.phone;
  const outletPhone = rawPhone.includes("2640") ? "9895898999" : rawPhone;
  const outletEmail = p.outletEmail || prop.email;
  const outletWebsite = p.outletWebsite || prop.website;
  const outletLogo = p.outletLogo || prop.logo;
  const rawGstin = p.gstin || prop.gstin;
  const gstin = rawGstin.includes("27AABCR") ? "HGFDRTWC14517713" : rawGstin;
  const fssai = p.fssai || "11521008000492";

  const issueDate = p.issueDate ? formatDateIndian(p.issueDate) : formatDateIndian(new Date());
  const issueTime = p.issueTime || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const taxableVal = p.taxableAmount !== undefined ? p.taxableAmount : Math.max(0, p.subtotal - (p.discountAmount || 0));
  const amountWords = `${numberToWords(p.grandTotal)} Only.`;
  const paidWords = `${numberToWords(p.paidAmount)} Only.`;

  // Item rows
  const itemRowsHtml = p.items.length > 0
    ? p.items.map((item, idx) => {
        const srNo = item.sr || idx + 1;
        const rowDate = item.date ? formatDateIndian(item.date) : issueDate;
        const sac = item.sac || "996331";
        const unitRate = item.unitPrice;
        const lineTotal = item.isComplimentary ? 0 : item.amount;
        const lineDisc = item.discount || 0;
        const lineSgst = item.sgst !== undefined ? item.sgst : (lineTotal * 0.025);
        const lineCgst = item.cgst !== undefined ? item.cgst : (lineTotal * 0.025);

        return `
          <tr>
            <td>${srNo}</td>
            <td>${escapeHtml(rowDate)}</td>
            <td class="text-left">
              <strong>${escapeHtml(item.name)}</strong>
              ${item.variant ? `<span style="font-size:9.5px; font-weight:700; color:#000000;"> (${escapeHtml(item.variant)})</span>` : ""}
              ${item.notes ? `<div style="font-size:9px; color:#000000; font-weight:600; font-style:italic;">Note: ${escapeHtml(item.notes)}</div>` : ""}
              ${item.isComplimentary ? '<span style="font-size:9px; font-weight:800; background:#f0fdf4; border:1px solid #16a34a; color:#15803d; padding:1px 4px; border-radius:2px; margin-left:4px;">COMPLIMENTARY</span>' : ""}
            </td>
            <td>${escapeHtml(sac)}</td>
            <td>${item.quantity}</td>
            <td class="text-right">${formatINR(unitRate)}</td>
            <td class="text-right font-bold">${formatINR(lineTotal)}</td>
            <td class="text-right">${lineDisc > 0 ? `-${formatINR(lineDisc)}` : "0.00"}</td>
            <td class="text-right">${formatINR(lineSgst)}</td>
            <td class="text-right">${formatINR(lineCgst)}</td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td>1</td>
        <td>${escapeHtml(issueDate)}</td>
        <td class="text-left">Food &amp; Beverage Order Services</td>
        <td>996331</td>
        <td>1</td>
        <td class="text-right">${formatINR(p.subtotal)}</td>
        <td class="text-right font-bold">${formatINR(p.subtotal)}</td>
        <td class="text-right">0.00</td>
        <td class="text-right">${formatINR(p.sgst)}</td>
        <td class="text-right">${formatINR(p.cgst)}</td>
      </tr>
    `;

  // Mini payments table
  const paymentsHtml = p.payments && p.payments.length > 0
    ? p.payments.map((pmt) => `
        <tr>
          <td>${escapeHtml(pmt.date || issueDate)}</td>
          <td>${escapeHtml(pmt.method)} ${pmt.reference ? `(${escapeHtml(pmt.reference)})` : ""}</td>
          <td class="text-right font-mono">${formatINR(pmt.amount)}</td>
        </tr>
      `).join("")
    : `
      <tr>
        <td>${escapeHtml(issueDate)}</td>
        <td>${escapeHtml(p.paymentMethod || "Settled / Walk-in")}</td>
        <td class="text-right font-mono">${formatINR(p.paidAmount)}</td>
      </tr>
    `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${escapeHtml(p.invoiceNo)}</title>
  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      margin: 0;
      padding: 0;
    }
    body {
      background: #fff;
      color: #000;
      padding: 20px;
    }
    .invoice-box {
      width: 100%;
      max-width: 820px;
      border: 2px solid #000;
      margin: 0 auto;
      background: #fff;
    }
    
    .header-table {
      width: 100%;
      border-bottom: 2px double #000;
      border-collapse: collapse;
    }
    .header-table td {
      padding: 8px 10px;
      vertical-align: middle;
    }
    .header-logo {
      width: 120px;
      text-align: left;
      vertical-align: middle;
    }
    .header-center {
      text-align: center;
      vertical-align: middle;
    }
    .header-center h1 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111;
    }
    .header-center p {
      font-size: 10.5px;
      margin: 1px 0;
      color: #222;
    }
    .header-right {
      width: 220px;
      text-align: right;
      vertical-align: middle;
      font-size: 10.5px;
    }
    .header-right p {
      margin: 2px 0;
    }

    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px double #000;
      padding: 5px 10px;
      font-weight: bold;
      background: #ffffff;
      font-size: 10.5px;
    }
    .sub-header-center {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    .info-table {
      width: 100%;
      border-bottom: 2px double #000;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 6px 10px;
      vertical-align: top;
      border-right: 1px solid #000;
    }
    .info-table td:last-child {
      border-right: none;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 10.5px;
    }
    .info-label {
      font-weight: bold;
      color: #000;
    }
    .info-val {
      font-weight: 600;
      color: #000;
    }

    .item-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px double #000;
    }
    .item-table th {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      background: #ffffff;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
    }
    .item-table td {
      border: 1px solid #000;
      padding: 5px 6px;
      text-align: center;
      font-size: 10.5px;
    }
    .item-table .text-left { text-align: left; }
    .item-table .text-right { text-align: right; font-family: monospace; }
    .item-table .font-bold { font-weight: bold; }
    .item-table tr.grand-total td {
      font-weight: bold;
      background: #ffffff;
      border-top: 2px solid #000;
    }

    .middle-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px double #000;
    }
    .middle-left {
      width: 54%;
      border-right: 1px solid #000;
      padding: 8px 10px;
      vertical-align: top;
    }
    .middle-right {
      width: 46%;
      padding: 8px 10px;
      vertical-align: top;
    }

    .paid-title {
      font-weight: bold;
      margin-bottom: 2px;
      font-size: 11px;
    }
    .paid-words {
      font-style: italic;
      margin-bottom: 8px;
      font-size: 10.5px;
      color: #000;
    }

    .mini-pay-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .mini-pay-table th, .mini-pay-table td {
      border: 1px solid #000;
      padding: 3px 6px;
      font-size: 9.5px;
      text-align: left;
    }
    .mini-pay-table td.text-right { text-align: right; font-family: monospace; }
    .mini-pay-table tr.total-row td {
      font-weight: bold;
      background: #ffffff;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 2.5px 4px;
      text-align: right;
      font-size: 10.5px;
    }
    .totals-table td.label {
      font-weight: 600;
      text-align: left;
      color: #000;
    }
    .totals-table td.val-bold {
      font-weight: bold;
      font-family: monospace;
    }
    .totals-table td.val-red {
      font-weight: bold;
      color: #b91c1c;
      font-family: monospace;
    }
    .totals-table tr.net-row td {
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      font-weight: 800;
      font-size: 12px;
      background: #ffffff;
      padding: 4px;
    }

    .bottom-box {
      width: 100%;
    }
    .words-row {
      border-bottom: 1px solid #000;
      padding: 6px 10px;
      font-weight: bold;
      font-size: 10.5px;
      background: #ffffff;
    }
    .policy-row {
      border-bottom: 1px solid #000;
      padding: 6px 10px;
      font-size: 9.5px;
      color: #000;
    }
    .policy-row ol {
      margin-left: 16px;
      margin-top: 3px;
    }

    .signature-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 36px 20px 10px 20px;
      font-weight: bold;
      font-size: 10px;
    }
    .sig-line {
      border-top: 1px solid #000;
      width: 180px;
      text-align: center;
      padding-top: 4px;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .invoice-box {
        border: 2px solid #000;
        width: 100%;
        max-width: 100%;
      }
      @page {
        size: auto;
        margin: 6mm 8mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- 1. Header Table -->
    <table class="header-table">
      <tr>
        <td class="header-logo">
          ${outletLogo
            ? `<img src="${escapeHtml(outletLogo)}" alt="${escapeHtml(outletName)}" style="max-height:48px; max-width:115px; object-fit:contain;" onerror="this.style.display='none';" />`
            : `<div style="font-weight:bold; font-size:15px; color:#0f766e; text-transform:uppercase;">${escapeHtml(outletName)}</div>`
          }
        </td>
        <td class="header-center">
          <h1>${escapeHtml(outletName)}</h1>
          <p>${escapeHtml(outletAddress)}</p>
          <p>${[outletPhone ? `Phone: ${escapeHtml(outletPhone)}` : '', gstin ? `GSTIN: ${escapeHtml(gstin)}` : '', fssai ? `FSSAI: ${escapeHtml(fssai)}` : ''].filter(Boolean).join(' | ')}</p>
          <p>${[outletWebsite ? `Website: ${escapeHtml(outletWebsite)}` : '', outletEmail ? `Email: ${escapeHtml(outletEmail)}` : ''].filter(Boolean).join(' | ')}</p>
        </td>
        <td class="header-right">
          <p><strong>Invoice No:</strong> ${escapeHtml(p.invoiceNo)}</p>
          ${p.orderNo && p.orderNo !== p.invoiceNo ? `<p><strong>Order Ref:</strong> #${escapeHtml(p.orderNo)}</p>` : ''}
          <p style="margin-top:4px;"><strong>Date:</strong> ${escapeHtml(issueDate)}</p>
          <p><strong>Time:</strong> ${escapeHtml(issueTime)}</p>
        </td>
      </tr>
    </table>

    <!-- 2. Subheader Bar -->
    <div class="sub-header">
      <div>Booking Source : ${escapeHtml(p.source || p.orderType || "Direct")}</div>
      <div class="sub-header-center">TAX INVOICE</div>
      <div>ORIGINAL FOR RECIPIENT</div>
    </div>

    <!-- 3. Two-Column Info Table -->
    <table class="info-table">
      <tr>
        <td style="width: 50%;">
          <div class="info-row"><span class="info-label">Guest Name:</span><span class="info-val">${escapeHtml(p.guestName || "Walk-in Guest")}</span></div>
          <div class="info-row"><span class="info-label">Guest Mobile No:</span><span class="info-val">${escapeHtml(p.guestPhone || "—")}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-val">${escapeHtml(p.guestAddress || "—")}</span></div>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-val">${escapeHtml(p.company || "—")}</span></div>
          <div class="info-row"><span class="info-label">Company GST:</span><span class="info-val">${escapeHtml(p.companyGst || "—")}</span></div>
        </td>
        <td style="width: 50%;">
          <div class="info-row"><span class="info-label">Room / Table No:</span><span class="info-val">${escapeHtml(p.tableOrRoom || "—")}</span></div>
          <div class="info-row"><span class="info-label">No Of Pax:</span><span class="info-val">${escapeHtml(String(p.pax || 1))}</span></div>
          <div class="info-row"><span class="info-label">Date Of Arrival:</span><span class="info-val">${escapeHtml(issueDate)} ${escapeHtml(issueTime)}</span></div>
          <div class="info-row"><span class="info-label">Date Of Departure:</span><span class="info-val">${escapeHtml(issueDate)} ${escapeHtml(issueTime)}</span></div>
          <div class="info-row"><span class="info-label">Duration Of Stay:</span><span class="info-val">${escapeHtml(p.captainName || "1 Day")}</span></div>
          <div class="info-row"><span class="info-label">Plan Type:</span><span class="info-val">${escapeHtml(p.orderType || "Dine-In")}</span></div>
        </td>
      </tr>
    </table>

    <!-- 4. Itemized Particulars Table -->
    <table class="item-table">
      <thead>
        <tr>
          <th style="width: 5%;">Sr No</th>
          <th style="width: 12%;">Date</th>
          <th style="width: 27%;">Particulars / Item Description</th>
          <th style="width: 10%;">HSN / SAC</th>
          <th style="width: 6%;">Qty</th>
          <th style="width: 10%;">Rate (₹)</th>
          <th style="width: 10%;">Total (₹)</th>
          <th style="width: 8%;">Discount</th>
          <th style="width: 6%;">SGST</th>
          <th style="width: 6%;">CGST</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        <tr class="grand-total">
          <td colspan="6" class="text-right">Grand Total</td>
          <td class="text-right">${formatINR(p.subtotal)}</td>
          <td class="text-right">${p.discountAmount ? `-${formatINR(p.discountAmount)}` : "0.00"}</td>
          <td class="text-right">${formatINR(p.sgst)}</td>
          <td class="text-right">${formatINR(p.cgst)}</td>
        </tr>
      </tbody>
    </table>

    <!-- 5. Middle Split Table (Payment Breakdown on Left, Financials on Right) -->
    <table class="middle-table">
      <tr>
        <td class="middle-left">
          <div class="paid-title">Total Amount Paid</div>
          <div class="paid-words">${escapeHtml(paidWords)}</div>
          <table class="mini-pay-table">
            <thead>
              <tr style="background:#f8fafc; font-weight:bold;">
                <th>Date</th>
                <th>Walk-in / Online</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsHtml}
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="text-right" style="font-weight:bold;">Rs ${formatINR(p.paidAmount)}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top:10px; font-size:10px;">
            <strong>Remark:</strong> ${escapeHtml(p.specialNote || "")}
          </div>
        </td>
        <td class="middle-right">
          <table class="totals-table">
            <tr>
              <td class="label">Net Amount:</td>
              <td class="val-bold">${formatINR(p.subtotal)}</td>
            </tr>
            <tr>
              <td class="label">CGST:</td>
              <td class="val-bold">${formatINR(p.cgst)}</td>
            </tr>
            <tr>
              <td class="label">SGST:</td>
              <td class="val-bold">${formatINR(p.sgst)}</td>
            </tr>
            <tr>
              <td class="label">Invoice Amount:</td>
              <td class="val-bold">${formatINR(p.grandTotal)}</td>
            </tr>
            <tr>
              <td class="label">Round Off:</td>
              <td class="val-bold">${p.roundOff !== undefined ? (p.roundOff >= 0 ? `+${p.roundOff.toFixed(2)}` : p.roundOff.toFixed(2)) : "+0.00"}</td>
            </tr>
            <tr class="net-row">
              <td class="label" style="font-size:11px;">Net Invoice Amount:</td>
              <td class="val-bold" style="font-size:11.5px;">${formatINR(p.grandTotal)}</td>
            </tr>
            <tr>
              <td class="label">Balance:</td>
              <td class="${p.balanceAmount > 0 ? 'val-red' : 'val-bold'}">${formatINR(p.balanceAmount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- 6. Bottom Box: Words, Policies, Signatures -->
    <div class="bottom-box">
      <div class="words-row">
        Invoice Amount In Words: ${escapeHtml(amountWords)}
      </div>
      <div class="policy-row">
        <strong>Conditions &amp; Policies</strong>
        <ol style="margin-top:3px; padding-left:14px;">
          <li>Goods once sold or services once rendered will not be refunded.</li>
          <li>All disputes are subject to local state jurisdiction only.</li>
        </ol>
      </div>
      <div class="signature-box">
        <div class="sig-line">
          GUEST SIGNATURE
        </div>
        <div class="sig-line">
          CASHIER/ FO. SIGNATURE
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const BILL_IFRAME_ID = "retrod-pos-invoice-print-frame";

/**
 * Executes high-reliability silent printing of the unified PMS Tax Invoice
 * via a hidden iframe (preventing UI flicker and page capture). Falls back to popup window if needed.
 */
export function printPosInvoice(payload: PosInvoicePrintPayload): void {
  if (typeof document === "undefined") {
    throw new Error("Print is only available in the browser environment");
  }

  const html = generatePosInvoiceHtml(payload);

  let iframe = document.getElementById(BILL_IFRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = BILL_IFRAME_ID;
    iframe.setAttribute("title", "POS Tax Invoice Print");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);
  }

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument || frameWindow?.document;

  if (frameWindow && frameDoc) {
    try {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          frameWindow.focus();
          frameWindow.print();
        } catch (e) {
          console.warn("Iframe print error, falling back to popup", e);
          fallbackPopupPrint(html);
        }
      };

      if (frameDoc.readyState === "complete") {
        setTimeout(triggerPrint, 80);
      } else {
        iframe.onload = () => setTimeout(triggerPrint, 80);
      }
      return;
    } catch (e) {
      console.warn("Could not write to iframe, trying popup", e);
    }
  }

  fallbackPopupPrint(html);
}

function fallbackPopupPrint(html: string) {
  try {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {}
      }, 300);
      return;
    }
  } catch (err) {
    console.error("Popup print failed:", err);
  }
}

// ============================================================================
// ADAPTERS: Seamlessly transform domain models to the unified PMS print format
// ============================================================================

/**
 * Adapter for BillSettlementRecord (Billing / Cashier / Table Settlement)
 */
export function settlementRecordToInvoicePayload(
  record: BillSettlementRecord,
  outlet?: any,
): PosInvoicePrintPayload {
  const prop = getActivePropertyFallback();
  const items: PosInvoiceItem[] = (record.items || []).map((c, idx) => {
    const basePrice = c.selectedVariant ? c.selectedVariant.price : c.item.price;
    const modifierTotal = (c.selectedModifiers || []).reduce((sum, m) => sum + (m.price || 0), 0);
    const unitPrice = basePrice + modifierTotal;
    const amount = c.isComplimentary ? 0 : unitPrice * c.quantity;

    return {
      sr: idx + 1,
      date: record.settledAt ? record.settledAt.split(" ")[0] : undefined,
      name: c.item.name,
      variant: c.selectedVariant?.name,
      notes: c.specialInstructions,
      sac: "996331",
      quantity: c.quantity,
      unitPrice,
      amount,
      discount: c.discountPercentage ? (unitPrice * c.quantity * (c.discountPercentage / 100)) : 0,
      sgst: amount * 0.025,
      cgst: amount * 0.025,
      isComplimentary: c.isComplimentary,
    };
  });

  const settledDate = record.settledAt ? record.settledAt.split(" ")[0] : undefined;
  const settledTime = record.settledAt ? record.settledAt.split(" ")[1] : undefined;

  const orderTypeFormatted =
    record.orderType === "dine_in"
      ? "Dine-In"
      : record.orderType === "room_service"
        ? "Room Service"
        : record.orderType === "takeaway"
          ? "Takeaway"
          : "Delivery";

  const tableOrRoom =
    record.orderType === "dine_in"
      ? (record.tableNumber ? `Table ${record.tableNumber}` : "Dine-In Table")
      : record.orderType === "room_service"
        ? (record.roomNumber ? `Room ${record.roomNumber}` : "Room Guest")
        : (record.orderType === "takeaway" ? "Takeaway Counter" : "Home Delivery");

  const deposit = Number(record.depositAmount || 0);
  const tendered = Number(record.tenderedAmount || 0);
  const totalPaid = Math.min(record.grandTotal, tendered + deposit);
  const paidAmount = totalPaid > 0 ? totalPaid : (record.tenderedAmount >= record.grandTotal ? record.grandTotal : (record.tenderedAmount || record.grandTotal));
  const balanceAmount = Math.max(0, record.grandTotal - paidAmount);

  const payments: PosInvoicePayment[] = [];
  if (deposit > 0) {
    payments.push({
      date: record.settledAt,
      method: "ADVANCE DEPOSIT",
      amount: deposit,
    });
  }
  if (tendered > 0 || deposit === 0) {
    payments.push({
      date: record.settledAt,
      method: String(record.paymentMethod || "CASH").toUpperCase(),
      amount: tendered > 0 ? tendered : Math.max(0, paidAmount - deposit),
    });
  }

  return {
    invoiceNo: record.billNumber,
    orderNo: record.billNumber,
    orderType: orderTypeFormatted,
    source: `POS ${orderTypeFormatted}`,
    issueDate: settledDate,
    issueTime: settledTime,
    outletName: outlet?.name || prop.name,
    outletAddress: outlet?.address || prop.address,
    outletPhone: outlet?.contact || prop.phone,
    outletEmail: prop.email,
    outletWebsite: prop.website,
    outletLogo: outlet?.logo || prop.logo,
    gstin: prop.gstin,
    guestName: record.customerName || "Walk-in Guest",
    guestPhone: record.customerPhone || "—",
    tableOrRoom,
    pax: record.guestCount || 1,
    captainName: record.captainName || "Captain",
    status: balanceAmount <= 0 ? "SETTLED" : "PARTIAL",
    items,
    subtotal: record.subtotal,
    discountAmount: record.discountAmount,
    discountCode: record.discountCode,
    taxableAmount: Math.max(0, record.subtotal - (record.discountAmount || 0)),
    cgst: record.cgst,
    sgst: record.sgst,
    serviceCharge: record.serviceCharge,
    roundOff: record.roundOff,
    grandTotal: record.grandTotal,
    paidAmount,
    balanceAmount,
    paymentMethod: String(record.paymentMethod || "CASH").toUpperCase(),
    payments,
    specialNote: record.specialNote,
  };
}

/**
 * Helper to parse summary string into items array (e.g. "2x Butter Chicken, 4x Garlic Naan")
 */
function parseItemsSummary(summary: string, totalSubtotal: number): PosInvoiceItem[] {
  if (!summary || !summary.trim()) {
    return [
      {
        sr: 1,
        name: "Food & Beverage Order",
        sac: "996331",
        quantity: 1,
        unitPrice: totalSubtotal,
        amount: totalSubtotal,
      },
    ];
  }

  const parts = summary.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    return [
      {
        sr: 1,
        name: summary.trim(),
        sac: "996331",
        quantity: 1,
        unitPrice: totalSubtotal,
        amount: totalSubtotal,
      },
    ];
  }

  const parsed = parts.map((part, idx) => {
    const match = part.match(/^(\d+)\s*[xX*]\s*(.+)$/);
    if (match) {
      const qty = parseInt(match[1], 10) || 1;
      const name = match[2].trim();
      return { qty, name };
    }
    return { qty: 1, name: part };
  });

  const totalQty = parsed.reduce((sum, p) => sum + p.qty, 0) || 1;
  const approxUnitPrice = totalSubtotal / totalQty;

  return parsed.map((p, idx) => {
    const amount = Number((approxUnitPrice * p.qty).toFixed(2));
    return {
      sr: idx + 1,
      name: p.name,
      sac: "996331",
      quantity: p.qty,
      unitPrice: Number(approxUnitPrice.toFixed(2)),
      amount,
      sgst: Number((amount * 0.025).toFixed(2)),
      cgst: Number((amount * 0.025).toFixed(2)),
    };
  });
}

function parseCurrencyNumber(formattedStr?: string): number {
  if (!formattedStr) return 0;
  const cleaned = String(formattedStr).replace(/[^0-9.-]+/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Adapter for AllOrderItem (used in PosAllOrdersManager for row/grid/drawer print)
 */
export function allOrderItemToInvoicePayload(
  order: AllOrderItem & { tableNo?: string; customerPhone?: string; customerAddress?: string },
  outlet?: any,
): PosInvoicePrintPayload {
  const prop = getActivePropertyFallback();
  const subtotal = parseCurrencyNumber(order.myAmountFormatted);
  const tax = parseCurrencyNumber(order.taxAmountFormatted);
  const discount = parseCurrencyNumber(order.discountAmountFormatted);
  const grandTotal = parseCurrencyNumber(order.grandTotalFormatted) || (subtotal + tax - discount);
  const cgst = tax / 2;
  const sgst = tax / 2;

  const items = parseItemsSummary(order.itemsSummary, subtotal);

  const [datePart, timePart] = (order.createdAt || "").split(" ");
  const isSettled = order.status === "Settled" || order.status === "Completed";
  const paidAmount = isSettled ? grandTotal : 0;
  const balanceAmount = isSettled ? 0 : grandTotal;

  return {
    invoiceNo: order.orderNo.startsWith("INV-") ? order.orderNo : `INV-${order.orderNo}`,
    orderNo: order.orderNo,
    orderType: order.orderTypeDisplay || "Dine-In",
    source: order.isOnlineOrder ? "Online Order" : order.orderTypeDisplay || "POS",
    issueDate: datePart ? formatDateIndian(datePart) : formatDateIndian(new Date()),
    issueTime: timePart || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    outletName: outlet?.name || prop.name,
    outletAddress: outlet?.address || prop.address,
    outletPhone: outlet?.contact || prop.phone,
    outletEmail: prop.email,
    outletWebsite: prop.website,
    outletLogo: outlet?.logo || prop.logo,
    gstin: prop.gstin,
    guestName: order.customerName || "Customer",
    guestPhone: order.customerPhone || "—",
    guestAddress: order.customerAddress || "—",
    tableOrRoom: order.tableNo ? `Table ${order.tableNo}` : (order.orderTypeDisplay || "Counter"),
    pax: 1,
    captainName: order.assignTo || "Server",
    status: order.status.toUpperCase(),
    items,
    subtotal,
    discountAmount: discount,
    taxableAmount: Math.max(0, subtotal - discount),
    cgst,
    sgst,
    grandTotal,
    paidAmount,
    balanceAmount,
    paymentMethod: order.paymentMode || "CASH / UPI",
    payments: isSettled ? [
      {
        date: order.createdAt,
        method: order.paymentMode || "SETTLED",
        amount: grandTotal,
      },
    ] : [],
  };
}

/**
 * Adapter for RoomServiceOrder (Room Service Module)
 */
export function roomOrderToInvoicePayload(
  order: RoomServiceOrder,
  outlet?: any,
): PosInvoicePrintPayload {
  const prop = getActivePropertyFallback();
  const subtotal = order.subtotal || 0;
  const serviceCharge = order.serviceCharge || 0;
  const tax = order.tax || 0;
  const grandTotal = order.totalAmount || (subtotal + serviceCharge + tax);
  const cgst = tax / 2;
  const sgst = tax / 2;

  const items: PosInvoiceItem[] = (order.items || []).map((it, idx) => ({
    sr: idx + 1,
    name: it.name,
    sac: "996331",
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    amount: it.unitPrice * it.quantity,
    notes: it.specialInstructions,
    sgst: (it.unitPrice * it.quantity) * 0.025,
    cgst: (it.unitPrice * it.quantity) * 0.025,
  }));

  const isSettled = order.status === "settled";
  const paidAmount = isSettled ? grandTotal : 0;
  const balanceAmount = isSettled ? 0 : grandTotal;

  return {
    invoiceNo: `INV-${order.orderNumber}`,
    orderNo: order.orderNumber,
    orderType: "Room Service",
    source: "Room Service Division",
    issueDate: formatDateIndian(new Date()),
    issueTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    outletName: outlet?.name || prop.name,
    outletAddress: outlet?.address || prop.address,
    outletPhone: outlet?.contact || prop.phone,
    outletEmail: prop.email,
    outletWebsite: prop.website,
    outletLogo: outlet?.logo || prop.logo,
    gstin: prop.gstin,
    guestName: order.guest?.name || "In-House Guest",
    guestPhone: order.guest?.phoneExtension ? `Ext: ${order.guest.phoneExtension}` : "—",
    tableOrRoom: `Room ${order.roomNumber} (${order.floor || order.roomType})`,
    pax: order.guest?.pax || 1,
    captainName: (order as any).assignedRunner || "Room Service Steward",
    status: isSettled ? "SETTLED" : "ROOM CHARGE (POSTED)",
    items,
    subtotal,
    taxableAmount: subtotal,
    cgst,
    sgst,
    serviceCharge,
    grandTotal,
    paidAmount,
    balanceAmount,
    paymentMethod: "ROOM FOLIO CHARGE",
    payments: [
      {
        method: "Room Folio Transfer",
        amount: grandTotal,
      },
    ],
    specialNote: order.specialInstructions,
  };
}

/**
 * Adapter for RoomFolioOrder (Posted Room Service Folio orders)
 */
export function roomFolioOrderToInvoicePayload(
  order: {
    orderNumber: string;
    totalAmount: number;
    itemsSummary?: string;
    items?: { name: string; quantity: number; unitPrice: number }[];
    createdAt?: string;
    paymentMode?: string;
  },
  roomNumber?: string,
  guestName?: string,
  outlet?: any,
): PosInvoicePrintPayload {
  const prop = getActivePropertyFallback();
  const grandTotal = order.totalAmount || 0;
  const subtotal = Number((grandTotal / 1.05).toFixed(2));
  const tax = Number((grandTotal - subtotal).toFixed(2));
  const cgst = Number((tax / 2).toFixed(2));
  const sgst = Number((tax / 2).toFixed(2));

  let items: PosInvoiceItem[] = [];
  if (order.items && order.items.length > 0) {
    items = order.items.map((it, idx) => ({
      sr: idx + 1,
      name: it.name,
      sac: "996331",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      amount: it.unitPrice * it.quantity,
      sgst: Number(((it.unitPrice * it.quantity) * 0.025).toFixed(2)),
      cgst: Number(((it.unitPrice * it.quantity) * 0.025).toFixed(2)),
    }));
  } else {
    items = parseItemsSummary(order.itemsSummary || "", subtotal);
  }

  const [datePart, timePart] = (order.createdAt || "").split(" ");

  return {
    invoiceNo: `INV-${order.orderNumber}`,
    orderNo: order.orderNumber,
    orderType: "Room Service",
    source: "Room Folio Billing",
    issueDate: datePart ? formatDateIndian(datePart) : formatDateIndian(new Date()),
    issueTime: timePart || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    outletName: outlet?.name || prop.name,
    outletAddress: outlet?.address || prop.address,
    outletPhone: outlet?.contact || prop.phone,
    outletEmail: prop.email,
    outletWebsite: prop.website,
    outletLogo: outlet?.logo || prop.logo,
    gstin: prop.gstin,
    guestName: guestName || "In-House Guest",
    tableOrRoom: roomNumber ? `Room ${roomNumber}` : "Room",
    pax: 1,
    status: "ROOM FOLIO (POSTED)",
    items,
    subtotal,
    taxableAmount: subtotal,
    cgst,
    sgst,
    grandTotal,
    paidAmount: grandTotal,
    balanceAmount: 0,
    paymentMethod: order.paymentMode || "ROOM FOLIO",
  };
}

/**
 * Backward compatibility wrapper for old ReceiptPrintPayload
 */
export type ReceiptPrintItem = PosInvoiceItem;
export type ReceiptPrintPayload = PosInvoicePrintPayload;
export const printReceipt = printPosInvoice;
