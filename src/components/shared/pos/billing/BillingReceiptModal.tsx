import { Printer, CheckCircle, Download, X, QrCode } from "lucide-react";
import type { BillSettlementRecord } from "@/types/posBilling";

type BillingReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  record: BillSettlementRecord | null;
  onPrint: () => void;
  onNewBill: () => void;
};

export function BillingReceiptModal({
  isOpen,
  onClose,
  record,
  onPrint,
  onNewBill,
}: BillingReceiptModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-emerald-50 text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold">Settlement Successful</h3>
              <p className="text-[11px] text-emerald-700">Receipt generated & ready to print</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-white border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center text-emerald-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Card */}
        <div className="p-4 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="w-full max-w-[340px] bg-white p-5 rounded shadow-md border border-slate-300 font-mono text-[11.5px] text-slate-800 space-y-3">
            {/* Restaurant Branding Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-0.5">
              <h2 className="font-bold text-base tracking-wider text-slate-950">
                RETROD FINE DINING & BAR
              </h2>
              <p className="text-[10px] text-slate-600">Plot 42, Bandra West, Mumbai - 400050</p>
              <p className="text-[10px] text-slate-600">
                GSTIN: 27AABCR8841M1ZU · FSSAI: 11521008000492
              </p>
              <p className="text-[10px] text-slate-600">Tel: +91 22 2640 8899</p>
            </div>

            {/* Bill Meta Data */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10.5px]">
              <div className="flex justify-between">
                <span>
                  Bill No: <strong>{record.billNumber}</strong>
                </span>
                <span>Date: {record.settledAt.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {record.orderType === "dine_in"
                    ? `Table: ${record.tableNumber || "—"}`
                    : record.orderType === "room_service"
                      ? `Room: ${record.roomNumber}`
                      : "Takeaway / Delivery"}
                </span>
                <span>Time: {record.settledAt.split(" ")[1]}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Steward: {record.captainName}</span>
                <span>PAX: {record.guestCount}</span>
              </div>
              {record.customerName && (
                <div className="text-slate-600">
                  Guest: <strong>{record.customerName}</strong> ({record.customerPhone})
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1.5 text-[10px] uppercase text-slate-700">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt</span>
              </div>

              <div className="space-y-1">
                {record.items.map((cartItem) => {
                  const basePrice = cartItem.selectedVariant
                    ? cartItem.selectedVariant.price
                    : cartItem.item.price;
                  const itemPrice =
                    basePrice + cartItem.selectedModifiers.reduce((s, m) => s + m.price, 0);
                  const amt = cartItem.isComplimentary ? 0 : itemPrice * cartItem.quantity;

                  return (
                    <div
                      key={cartItem.cartId}
                      className="flex justify-between items-start leading-tight"
                    >
                      <div className="w-1/2 pr-1">
                        <div className="truncate font-semibold">{cartItem.item.name}</div>
                        {cartItem.selectedVariant && (
                          <div className="text-[9.5px] text-slate-500">
                            ({cartItem.selectedVariant.name})
                          </div>
                        )}
                      </div>
                      <span className="w-1/6 text-center">{cartItem.quantity}</span>
                      <span className="w-1/6 text-right">₹{itemPrice}</span>
                      <span className="w-1/6 text-right font-bold">
                        {cartItem.isComplimentary ? "FREE" : `₹${amt}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{record.subtotal.toLocaleString()}</span>
              </div>
              {record.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount {record.discountCode ? `(${record.discountCode})` : ""}</span>
                  <span>-₹{record.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>CGST @ 2.5%</span>
                <span>₹{record.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST @ 2.5%</span>
                <span>₹{record.sgst.toLocaleString()}</span>
              </div>
              {record.serviceCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge @ 5%</span>
                  <span>₹{record.serviceCharge.toLocaleString()}</span>
                </div>
              )}
              {record.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off</span>
                  <span>
                    {record.roundOff > 0
                      ? `+₹${record.roundOff}`
                      : `-₹${Math.abs(record.roundOff)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Net Amount Paid */}
            <div className="border-b border-dashed border-slate-400 pb-2 pt-1">
              <div className="flex justify-between font-extrabold text-sm text-slate-950">
                <span>NET TOTAL</span>
                <span>₹{record.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10.5px] text-slate-600 mt-1">
                <span>
                  Mode: <strong className="uppercase">{record.paymentMethod}</strong>
                </span>
                <span>Tendered: ₹{record.tenderedAmount}</span>
              </div>
              {record.changeDue > 0 && (
                <div className="flex justify-between text-[10.5px] text-emerald-800 font-bold">
                  <span>Change Returned</span>
                  <span>₹{record.changeDue}</span>
                </div>
              )}
            </div>

            {/* E-bill QR and Footer */}
            <div className="text-center pt-1 space-y-1">
              <div className="flex justify-center py-1">
                <div className="h-16 w-16 border border-slate-300 rounded bg-slate-50 flex items-center justify-center text-slate-600">
                  <QrCode className="h-12 w-12" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-700">
                Scan for Digital E-Bill & Feedback
              </p>
              <p className="text-[9.5px] text-slate-500">
                Thank you for dining with us! Please visit again.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt [F9]</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNewBill();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Start Next Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
