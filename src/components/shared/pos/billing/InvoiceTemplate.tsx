import React from "react";
import { cn } from "@/lib/utils";
import { formatDateIndian } from "@/utils/dateUtils";
import {
  type PosInvoicePrintPayload,
  formatINR,
  numberToWords,
  getActivePropertyFallback,
} from "@/utils/printReceipt";
import type { PaymentEntry } from "./PaymentModal";

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  variant?: string;
  notes?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  outletName?: string;
  outletAddress?: string;
  gstin?: string;
  fssai?: string;
  phone?: string;
  orderType: string;
  tableOrRoom: string;
  captainName?: string;
  guestName?: string;
  guestPhone?: string;
  pax?: number;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discountReason?: string;
  cgst?: number;
  sgst?: number;
  serviceCharge?: number;
  grandTotal: number;
  payments?: PaymentEntry[];
  cashTendered?: number;
  changeDue?: number;
  createdAt?: string;
}

function normalizeToPayload(inv: PosInvoicePrintPayload | InvoiceData): PosInvoicePrintPayload {
  if ("invoiceNo" in inv) {
    return inv;
  }

  const prop = getActivePropertyFallback();
  const subtotal = inv.subtotal || 0;
  const disc = inv.discount || 0;
  const cgst = inv.cgst || (subtotal * 0.025);
  const sgst = inv.sgst || (subtotal * 0.025);
  const grandTotal = inv.grandTotal || (subtotal - disc + cgst + sgst + (inv.serviceCharge || 0));

  return {
    invoiceNo: inv.invoiceNumber,
    orderNo: inv.orderId,
    orderType: inv.orderType,
    source: `POS ${inv.orderType || "Dine-In"}`,
    outletName: inv.outletName || prop.name,
    outletAddress: inv.outletAddress || prop.address,
    outletPhone: inv.phone || prop.phone,
    outletEmail: prop.email,
    outletWebsite: prop.website,
    gstin: inv.gstin || prop.gstin,
    fssai: inv.fssai || "11521008000492",
    guestName: inv.guestName || "Walk-in Guest",
    guestPhone: inv.guestPhone || "—",
    tableOrRoom: inv.tableOrRoom,
    pax: inv.pax || 1,
    captainName: inv.captainName || "Captain",
    status: "SETTLED",
    items: inv.items.map((it, idx) => ({
      sr: idx + 1,
      name: it.name,
      variant: it.variant,
      notes: it.notes,
      sac: "996331",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      amount: it.quantity * it.unitPrice,
      sgst: (it.quantity * it.unitPrice) * 0.025,
      cgst: (it.quantity * it.unitPrice) * 0.025,
    })),
    subtotal,
    discountAmount: disc,
    discountCode: inv.discountReason,
    taxableAmount: Math.max(0, subtotal - disc),
    cgst,
    sgst,
    serviceCharge: inv.serviceCharge,
    grandTotal,
    paidAmount: grandTotal,
    balanceAmount: 0,
    paymentMethod: inv.payments?.[0]?.method || "CASH / UPI",
    payments: inv.payments?.map((p) => ({
      date: p.timestamp,
      method: p.method,
      reference: p.referenceNumber,
      amount: p.amount,
    })),
  };
}

export function InvoiceTemplate({
  invoice,
  className,
}: {
  invoice: PosInvoicePrintPayload | InvoiceData;
  width?: "80mm" | "58mm";
  className?: string;
}) {
  const p = normalizeToPayload(invoice);
  const prop = getActivePropertyFallback();

  const outletName = p.outletName || prop.name;
  const outletAddress = p.outletAddress || prop.address;
  const outletPhone = p.outletPhone || prop.phone;
  const gstin = p.gstin || prop.gstin;
  const fssai = p.fssai || "11521008000492";

  const rawDate = p.issueDate || (p.payments?.[0]?.date?.split(" ")[0]) || new Date();
  const issueDate = formatDateIndian(rawDate);
  const issueTime = p.issueTime || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const taxableVal = p.taxableAmount !== undefined ? p.taxableAmount : Math.max(0, p.subtotal - (p.discountAmount || 0));
  const amountWords = `${numberToWords(p.grandTotal)} Only.`;
  const paidWords = `${numberToWords(p.paidAmount)} Only.`;

  return (
    <div
      className={cn(
        "bg-white text-black p-4 font-sans text-[11px] leading-tight border-2 border-black max-w-[760px] w-full mx-auto shadow-sm",
        className,
      )}
      id="printable-pos-invoice"
    >
      {/* 1. Header Table */}
      <div className="flex items-center justify-between border-b-2 border-double border-black pb-2.5 mb-0">
        <div className="w-[110px] shrink-0 text-left">
          {p.outletLogo ? (
            <img
              src={p.outletLogo}
              alt={outletName}
              className="max-h-12 max-w-[110px] object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="font-extrabold text-sm text-teal-800 uppercase tracking-tight">
              {outletName}
            </div>
          )}
        </div>

        <div className="text-center flex-1 px-2 space-y-0.5">
          <h1 className="font-extrabold text-[15px] tracking-wide uppercase text-black">
            {outletName}
          </h1>
          <p className="text-[10px] text-slate-700">{outletAddress}</p>
          <p className="text-[9.5px] text-slate-700">
            {[outletPhone ? `Phone: ${outletPhone}` : "", gstin ? `GSTIN: ${gstin}` : "", fssai ? `FSSAI: ${fssai}` : ""].filter(Boolean).join(" | ")}
          </p>
        </div>

        <div className="w-[180px] shrink-0 text-right text-[10px] space-y-0.5">
          <p>
            <strong>Invoice No:</strong> {p.invoiceNo}
          </p>
          {p.orderNo && p.orderNo !== p.invoiceNo && (
            <p>
              <strong>Order Ref:</strong> #{p.orderNo}
            </p>
          )}
          <p className="pt-0.5">
            <strong>Date:</strong> {issueDate}
          </p>
          <p>
            <strong>Time:</strong> {issueTime}
          </p>
        </div>
      </div>

      {/* 2. Subheader Bar */}
      <div className="flex justify-between items-center border-b-2 border-double border-black px-2 py-1 bg-slate-50 font-bold text-[10px]">
        <div>Booking Source : {p.source || p.orderType || "Direct"}</div>
        <div className="text-[12px] font-black tracking-wider text-black">TAX INVOICE</div>
        <div>ORIGINAL FOR RECIPIENT</div>
      </div>

      {/* 3. Two-Column Info Table */}
      <div className="grid grid-cols-2 border-b-2 border-double border-black text-[10.5px]">
        <div className="p-2 space-y-1 border-r border-black">
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Guest Name:</span>
            <span className="font-semibold">{p.guestName || "Walk-in Guest"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Guest Mobile No:</span>
            <span>{p.guestPhone || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Address:</span>
            <span className="truncate max-w-[180px]">{p.guestAddress || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Company:</span>
            <span>{p.company || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Company GST:</span>
            <span>{p.companyGst || "—"}</span>
          </div>
        </div>

        <div className="p-2 space-y-1">
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Room / Table No:</span>
            <span className="font-bold text-black">{p.tableOrRoom || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Pax:</span>
            <span>{p.pax || 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Date Of Arrival:</span>
            <span>{issueDate} {issueTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Date Of Departure:</span>
            <span>{issueDate} {issueTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Duration Of Stay:</span>
            <span>{p.captainName || "1 Day"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">Plan Type:</span>
            <span className="font-bold">{p.orderType || "Dine-In"}</span>
          </div>
        </div>
      </div>

      {/* 4. Particulars Table */}
      <div className="border-b-2 border-double border-black overflow-x-auto">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100 font-bold uppercase text-slate-900 border-b border-black">
              <th className="border border-black p-1 text-center w-8">Sr</th>
              <th className="border border-black p-1 text-center w-20">Date</th>
              <th className="border border-black p-1 text-left">Particulars / Description</th>
              <th className="border border-black p-1 text-center w-16">SAC</th>
              <th className="border border-black p-1 text-center w-10">Qty</th>
              <th className="border border-black p-1 text-right w-16">Rate (₹)</th>
              <th className="border border-black p-1 text-right w-18">Total (₹)</th>
              <th className="border border-black p-1 text-right w-14">Disc</th>
              <th className="border border-black p-1 text-right w-14">SGST</th>
              <th className="border border-black p-1 text-right w-14">CGST</th>
            </tr>
          </thead>
          <tbody>
            {p.items.map((it, idx) => {
              const lineTotal = it.isComplimentary ? 0 : it.amount;
              return (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="border border-black p-1 text-center">{it.sr || idx + 1}</td>
                  <td className="border border-black p-1 text-center">{it.date || issueDate}</td>
                  <td className="border border-black p-1 text-left">
                    <span className="font-bold">{it.name}</span>
                    {it.variant && <span className="text-[9px] text-slate-600"> ({it.variant})</span>}
                    {it.notes && <div className="text-[8.5px] italic text-slate-500">Note: {it.notes}</div>}
                    {it.isComplimentary && (
                      <span className="ml-1 text-[8.5px] bg-slate-200 font-bold px-1 rounded">FREE</span>
                    )}
                  </td>
                  <td className="border border-black p-1 text-center font-mono">{it.sac || "996331"}</td>
                  <td className="border border-black p-1 text-center font-semibold">{it.quantity}</td>
                  <td className="border border-black p-1 text-right font-mono">{formatINR(it.unitPrice)}</td>
                  <td className="border border-black p-1 text-right font-mono font-bold">{formatINR(lineTotal)}</td>
                  <td className="border border-black p-1 text-right font-mono text-slate-600">
                    {it.discount ? `-${formatINR(it.discount)}` : "0.00"}
                  </td>
                  <td className="border border-black p-1 text-right font-mono">{formatINR(it.sgst || 0)}</td>
                  <td className="border border-black p-1 text-right font-mono">{formatINR(it.cgst || 0)}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold border-t-2 border-black">
              <td colSpan={6} className="border border-black p-1 text-right font-bold">
                Grand Total:
              </td>
              <td className="border border-black p-1 text-right font-mono font-bold">
                ₹{formatINR(p.subtotal)}
              </td>
              <td className="border border-black p-1 text-right font-mono text-emerald-700">
                {p.discountAmount ? `-₹${formatINR(p.discountAmount)}` : "₹0.00"}
              </td>
              <td className="border border-black p-1 text-right font-mono">₹{formatINR(p.sgst)}</td>
              <td className="border border-black p-1 text-right font-mono">₹{formatINR(p.cgst)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Middle Split Table */}
      <div className="grid grid-cols-12 border-b-2 border-double border-black text-[10.5px]">
        {/* Left: Payment info */}
        <div className="col-span-6 p-2 border-r border-black space-y-1.5">
          <div className="font-bold text-[11px]">Total Amount Paid</div>
          <div className="text-[10px] italic text-slate-700">
            Indian Rupees {paidWords}
          </div>

          <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1 text-left">Date</th>
                <th className="p-1 text-left">Payment Mode</th>
                <th className="p-1 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {p.payments && p.payments.length > 0 ? (
                p.payments.map((pmt, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-1">{pmt.date || issueDate}</td>
                    <td className="p-1">
                      {pmt.method} {pmt.reference ? `(${pmt.reference})` : ""}
                    </td>
                    <td className="p-1 text-right font-mono">{formatINR(pmt.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-200">
                  <td className="p-1">{issueDate}</td>
                  <td className="p-1">{p.paymentMethod || "Settled"}</td>
                  <td className="p-1 text-right font-mono">{formatINR(p.paidAmount)}</td>
                </tr>
              )}
              <tr className="font-bold bg-slate-50">
                <td colSpan={2} className="p-1">
                  Total Paid
                </td>
                <td className="p-1 text-right font-mono text-emerald-800">
                  ₹{formatINR(p.paidAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-1 text-[9.5px]">
            <span className="font-bold">Remark: </span>
            <span className="text-slate-600">
              {p.specialNote || "Thank you for dining with us! Please visit again soon."}
            </span>
          </div>
        </div>

        {/* Right: Totals summary */}
        <div className="col-span-6 p-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-700">Net Base Amount:</span>
            <span className="font-mono font-bold">₹{formatINR(p.subtotal)}</span>
          </div>
          {p.discountAmount && p.discountAmount > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Discount Applied:</span>
              <span className="font-mono font-bold">-₹{formatINR(p.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-slate-700">Taxable Value:</span>
            <span className="font-mono font-bold">₹{formatINR(taxableVal)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>CGST (2.5%):</span>
            <span className="font-mono">₹{formatINR(p.cgst)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>SGST (2.5%):</span>
            <span className="font-mono">₹{formatINR(p.sgst)}</span>
          </div>
          {p.serviceCharge && p.serviceCharge > 0 ? (
            <div className="flex justify-between text-slate-700">
              <span>Service Charge:</span>
              <span className="font-mono">₹{formatINR(p.serviceCharge)}</span>
            </div>
          ) : null}
          {p.roundOff && p.roundOff !== 0 ? (
            <div className="flex justify-between text-slate-500">
              <span>Round Off:</span>
              <span className="font-mono">
                {p.roundOff > 0 ? "+" : ""}₹{formatINR(p.roundOff)}
              </span>
            </div>
          ) : null}

          <div className="pt-1.5 pb-1 border-t-2 border-b-2 border-black flex justify-between font-black text-[12px] bg-slate-50 px-1">
            <span>Net Invoice Amount:</span>
            <span className="font-mono text-teal-900 text-[13px]">
              ₹{formatINR(p.grandTotal)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-emerald-800">
            <span>Total Paid:</span>
            <span className="font-mono">₹{formatINR(p.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance Due:</span>
            <span
              className={cn(
                "font-mono",
                p.balanceAmount > 0 ? "text-red-600" : "text-black",
              )}
            >
              ₹{formatINR(p.balanceAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Bottom Box */}
      <div className="space-y-1 pt-1">
        <div className="border-b border-black p-1.5 font-bold text-[10px] bg-slate-50">
          Invoice Amount In Words: Indian Rupees {amountWords}
        </div>

        <div className="border-b border-black p-2 text-[9px] text-slate-700">
          <strong>Conditions &amp; Policies:</strong>
          <ol className="list-decimal ml-4 mt-0.5 space-y-0.5">
            <li>Goods once sold or services once rendered will not be refunded.</li>
            <li>All disputes are subject to local state jurisdiction only.</li>
            <li>Interest @ 18% p.a. will be charged if the bill is not settled on presentation.</li>
            <li>This is a computer generated tax invoice and requires no physical signature.</li>
          </ol>
        </div>

        <div className="flex justify-between items-end px-4 pt-7 pb-1 text-[9.5px] font-bold">
          <div className="border-t border-black w-40 text-center pt-1">Guest Signature</div>
          <div className="border-t border-black w-48 text-center pt-1">
            Cashier / Authorized Signatory
            <div className="font-normal text-[8.5px] text-slate-600">(For {outletName})</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTemplate;
