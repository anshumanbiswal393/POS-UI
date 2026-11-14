import React, { useState } from "react";
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Wallet,
  CheckCircle2,
  Receipt,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PaymentMethod =
  | "Cash"
  | "Credit Card"
  | "Debit Card"
  | "UPI"
  | "Room Charge"
  | "Digital Wallet";

export interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  roomNumber?: string;
  guestName?: string;
  timestamp: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  invoiceNumber?: string;
  tableOrRoom?: string;
  guestName?: string;
  subtotal: number;
  taxes: number;
  discount?: number;
  grandTotal: number;
  onPaymentComplete: (payments: PaymentEntry[]) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId = "POS-ORD-2026",
  invoiceNumber = "INV-2201",
  tableOrRoom = "Table 04",
  guestName = "Walk-in Guest",
  subtotal,
  taxes,
  discount = 0,
  grandTotal,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Cash");
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);
  const [referenceInput, setReferenceInput] = useState<string>("");
  const [roomNumberInput, setRoomNumberInput] = useState<string>("");
  const [guestNameInput, setGuestNameInput] = useState<string>(guestName);

  if (!isOpen) return null;

  // Financial calculations
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, +(grandTotal - totalPaid).toFixed(2));
  const changeDue = selectedMethod === "Cash" && cashTendered > remainingBalance ? +(cashTendered - remainingBalance).toFixed(2) : 0;
  const isFullySettled = totalPaid >= grandTotal;

  // Add split payment tender
  const handleAddTender = (amountToAdd: number) => {
    if (amountToAdd <= 0) return;
    const newEntry: PaymentEntry = {
      id: `PAY-${Date.now()}`,
      method: selectedMethod,
      amount: Math.min(amountToAdd, remainingBalance > 0 ? remainingBalance : amountToAdd),
      referenceNumber: referenceInput || undefined,
      roomNumber: selectedMethod === "Room Charge" ? roomNumberInput : undefined,
      guestName: selectedMethod === "Room Charge" ? guestNameInput : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setPayments((prev) => [...prev, newEntry]);
    setReferenceInput("");
    if (selectedMethod === "Cash") {
      setCashTendered(Math.max(0, +(remainingBalance - newEntry.amount).toFixed(2)));
    }
  };

  const handleRemoveTender = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleQuickCashAdd = (addVal: number) => {
    setCashTendered((prev) => +(prev + addVal).toFixed(2));
  };

  const handleCompleteSettlement = () => {
    if (!isFullySettled && payments.length === 0) {
      // If no split entry added, auto-settle current selected method with full remaining
      const finalEntry: PaymentEntry = {
        id: `PAY-${Date.now()}`,
        method: selectedMethod,
        amount: grandTotal,
        referenceNumber: referenceInput || undefined,
        roomNumber: selectedMethod === "Room Charge" ? roomNumberInput : undefined,
        guestName: selectedMethod === "Room Charge" ? guestNameInput : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      onPaymentComplete([finalEntry]);
    } else {
      onPaymentComplete(payments);
    }
    toast.success(`Invoice ${invoiceNumber} Settled!`, {
      description: `Total ₹${grandTotal.toLocaleString("en-IN")} collected via ${payments.length > 1 ? "Split Tender" : selectedMethod}`,
    });
    onClose();
  };

  // UPI QR String
  const upiQrString = `upi://pay?pa=retrodpos@bank&pn=Retrod%20POS&am=${remainingBalance || grandTotal}&cu=INR&tn=Invoice%20${invoiceNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-surface border border-border shadow-e3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/20 bg-gradient-to-r from-primary-tint/50 via-primary/5 to-surface px-5 py-3.5 shrink-0">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">
              Settlement & Payment
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[20px] font-bold text-text-primary">
                Pay Check #{invoiceNumber}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-surface-2 text-text-primary border border-border">
                {tableOrRoom}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-2 hover:text-black dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 3 Columns Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left Column (3.5 cols): Tender Method Switcher */}
          <div className="md:col-span-4 p-4 bg-surface-2/30 space-y-2">
            <div className="label-uppercase mb-2 text-text-secondary">Select Payment Method</div>

            <div className="space-y-1.5">
              {[
                { method: "Cash" as PaymentMethod, icon: Banknote, hint: "Instant cash drawer" },
                { method: "UPI" as PaymentMethod, icon: QrCode, hint: "Dynamic QR / Apps" },
                { method: "Credit Card" as PaymentMethod, icon: CreditCard, hint: "Visa / Mastercard" },
                { method: "Debit Card" as PaymentMethod, icon: CreditCard, hint: "Direct debit pin" },
                { method: "Room Charge" as PaymentMethod, icon: Building, hint: "Hotel PMS Folio" },
                { method: "Digital Wallet" as PaymentMethod, icon: Wallet, hint: "Paytm, PhonePe" },
              ].map(({ method, icon: Icon, hint }) => {
                const isSelected = selectedMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-e1 font-bold"
                        : "bg-surface text-text-primary border-border hover:bg-surface-2 hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-white/20 text-white" : "bg-surface-2 text-primary",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold">{method}</div>
                        <div
                          className={cn(
                            "text-[10.5px]",
                            isSelected ? "text-white/80" : "text-text-secondary",
                          )}
                        >
                          {hint}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column (5 cols): Method Details & Quick Actions */}
          <div className="md:col-span-5 p-4.5 bg-surface space-y-4">
            {/* CASH TENDER VIEW */}
            {selectedMethod === "Cash" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Cash Tendered
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Remaining: ₹{remainingBalance.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={cashTendered || ""}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 font-mono text-2xl font-bold text-text-primary bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-text-secondary uppercase">Quick Cash Presets</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashTendered(remainingBalance)}
                      className="py-2 text-xs font-mono font-bold rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-primary-tint hover:border-primary/40 active:scale-[0.98] transition cursor-pointer"
                    >
                      Exact
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCashAdd(100)}
                      className="py-2 text-xs font-mono font-bold rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-primary-tint hover:border-primary/40 active:scale-[0.98] transition cursor-pointer"
                    >
                      +₹100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCashAdd(500)}
                      className="py-2 text-xs font-mono font-bold rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-primary-tint hover:border-primary/40 active:scale-[0.98] transition cursor-pointer"
                    >
                      +₹500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCashAdd(2000)}
                      className="py-2 text-xs font-mono font-bold rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-primary-tint hover:border-primary/40 active:scale-[0.98] transition cursor-pointer"
                    >
                      +₹2000
                    </button>
                  </div>
                </div>

                {/* Change Due Display */}
                {changeDue > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">Change Due to Guest:</span>
                    <span className="font-mono text-lg font-bold text-emerald-700">
                      ₹{changeDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleAddTender(cashTendered)}
                  disabled={cashTendered <= 0}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add ₹{cashTendered.toLocaleString("en-IN")} Cash Tender</span>
                </button>
              </div>
            )}

            {/* UPI QR CODE VIEW */}
            {selectedMethod === "UPI" && (
              <div className="space-y-3 text-center">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Scan Dynamic UPI QR
                </div>
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border-2 border-primary/30 shadow-md flex items-center justify-center">
                  {/* Generated QR Placeholder */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiQrString)}`}
                    alt="UPI Payment QR"
                    className="w-full h-full rounded-lg"
                  />
                </div>
                <p className="font-mono text-xs font-bold text-primary">
                  Pay ₹{(remainingBalance || grandTotal).toLocaleString("en-IN")} via GooglePay, PhonePe, Paytm
                </p>
                <button
                  type="button"
                  onClick={() => handleAddTender(remainingBalance || grandTotal)}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm UPI Payment Received</span>
                </button>
              </div>
            )}

            {/* ROOM CHARGE FOLIO VIEW */}
            {selectedMethod === "Room Charge" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Post to Hotel Guest Room Folio</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 304, 408, VIP-01"
                    value={roomNumberInput}
                    onChange={(e) => setRoomNumberInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                    Guest Name Validation
                  </label>
                  <input
                    type="text"
                    placeholder="Guest name on reservation"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-surface-2 border border-border text-[11px] text-text-secondary space-y-0.5">
                  <div>Credit Limit Status: <strong className="text-emerald-700 font-bold">Approved (₹25,000)</strong></div>
                  <div>Folio Route: <strong className="text-text-primary">F&B Outlet Charge</strong></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddTender(remainingBalance || grandTotal)}
                  disabled={!roomNumberInput}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Building className="w-4 h-4" />
                  <span>Post ₹{(remainingBalance || grandTotal).toLocaleString("en-IN")} to Room Folio</span>
                </button>
              </div>
            )}

            {/* CARD & WALLET VIEWS */}
            {(selectedMethod === "Credit Card" ||
              selectedMethod === "Debit Card" ||
              selectedMethod === "Digital Wallet") && (
              <div className="space-y-3.5">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {selectedMethod} Details
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                    Auth / Transaction Reference ID <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-998812, Approval Code..."
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAddTender(remainingBalance || grandTotal)}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Charge ₹{(remainingBalance || grandTotal).toLocaleString("en-IN")} via {selectedMethod}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column (3.5 cols): Bill Summary & Split Tenders Ledger */}
          <div className="md:col-span-3 p-4 bg-surface-2/50 flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="label-uppercase text-text-secondary">Summary & Tenders</div>

              <div className="p-3 rounded-xl bg-surface border border-border shadow-xs space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes:</span>
                  <span className="font-mono font-semibold">₹{taxes.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-1.5 border-t border-border flex justify-between font-bold text-text-primary text-[13px]">
                  <span>Total Payable:</span>
                  <span className="font-mono text-primary font-bold text-[16px]">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Split Payments List */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-text-secondary uppercase">
                  Applied Tenders ({payments.length})
                </div>
                {payments.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-surface rounded-xl border border-dashed border-border">
                    No split tender applied yet.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-text-primary">{p.method}</div>
                          <div className="text-[10px] font-mono text-slate-400">{p.timestamp}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary">
                            ₹{p.amount.toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTender(p.id)}
                            className="p-1 text-slate-400 hover:text-error cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleCompleteSettlement}
                className="w-full py-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>Complete Settlement & Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-bold rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-2 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
