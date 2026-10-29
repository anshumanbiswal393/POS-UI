import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  QrCode,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingPaymentMethod } from "@/types/posBilling";

export type PayNowMode = "Cash" | "UPI" | "Card" | "Room Charge" | "Wallet";

const PAY_METHODS: Array<{
  id: PayNowMode;
  label: string;
  hint: string;
  icon: typeof Banknote;
}> = [
  { id: "Cash", label: "Cash", hint: "Cash drawer", icon: Banknote },
  { id: "UPI", label: "UPI", hint: "QR / PhonePe / GPay", icon: QrCode },
  { id: "Card", label: "Card", hint: "Debit / Credit", icon: CreditCard },
  { id: "Room Charge", label: "Room charge", hint: "Post to guest folio", icon: Building2 },
  { id: "Wallet", label: "Other", hint: "Wallet / voucher", icon: Wallet },
];

const MODE_TO_BILLING: Record<PayNowMode, BillingPaymentMethod> = {
  Cash: "cash",
  UPI: "upi",
  Card: "card",
  "Room Charge": "room_post",
  Wallet: "split",
};

type BillingPayNowModalProps = {
  isOpen: boolean;
  onClose: () => void;
  billNumber: string;
  tableOrRoom: string;
  customerName?: string;
  itemsSummary: string;
  grandTotal: number;
  busy?: boolean;
  onConfirm: (paymentMethod: BillingPaymentMethod, tenderedAmount: number) => void;
};

export function BillingPayNowModal({
  isOpen,
  onClose,
  billNumber,
  tableOrRoom,
  customerName,
  itemsSummary,
  grandTotal,
  busy = false,
  onConfirm,
}: BillingPayNowModalProps) {
  const [mode, setMode] = useState<PayNowMode>("Cash");
  const [amount, setAmount] = useState(String(grandTotal || 0));

  useEffect(() => {
    if (!isOpen) return;
    setMode("Cash");
    setAmount(String(grandTotal || 0));
  }, [isOpen, grandTotal]);

  const amt = useMemo(() => {
    const parsed = parseFloat(amount);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return grandTotal || 0;
  }, [amount, grandTotal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
      <div className="flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-e3">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Collect payment
            </p>
            <p className="truncate text-[14px] font-extrabold text-text-primary">
              {billNumber}
              {tableOrRoom ? ` · ${tableOrRoom}` : ""}
              {customerName ? ` · ${customerName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-2 hover:text-text-primary cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:flex-row">
          <aside className="md:w-56 shrink-0 rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-border bg-surface-2/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Payment method
              </p>
            </div>
            <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-y-auto">
              {PAY_METHODS.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition cursor-pointer min-w-[9.5rem] md:min-w-0",
                      active
                        ? "bg-primary text-white shadow-e1"
                        : "bg-transparent text-text-primary hover:bg-surface-2",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-primary")} />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-bold leading-tight">{m.label}</span>
                      <span
                        className={cn(
                          "block text-[10.5px] leading-tight mt-0.5",
                          active ? "text-white/80" : "text-text-secondary",
                        )}
                      >
                        {m.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border bg-surface p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-center">
              <div>
                <div className="text-[10.5px] font-bold uppercase text-text-secondary">Total</div>
                <div className="mt-0.5 text-[15px] font-black text-text-primary">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase text-text-secondary">Paid</div>
                <div className="mt-0.5 text-[15px] font-bold text-text-secondary">₹0</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase text-primary">Due</div>
                <div className="mt-0.5 text-[16px] font-black text-primary">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {itemsSummary ? (
              <div className="rounded-xl border border-border px-3 py-2.5">
                <p className="text-[10.5px] font-bold uppercase text-text-secondary mb-1">Items</p>
                <p className="text-[12.5px] font-semibold text-text-primary leading-relaxed">
                  {itemsSummary}
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-text-primary">
                Amount ({mode === "Wallet" ? "Other" : mode})
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[16px] font-bold text-text-primary focus:border-primary focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(grandTotal))}
                className="text-[11.5px] font-bold text-primary hover:underline cursor-pointer"
              >
                Use full due ₹{grandTotal.toLocaleString("en-IN")}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => onConfirm(MODE_TO_BILLING[mode], amt || grandTotal)}
                disabled={busy || amt < grandTotal}
                className="inline-flex h-10 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl bg-teal-800 px-5 text-[13px] font-bold text-white hover:bg-teal-900 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-[13px] font-bold text-text-primary hover:bg-surface-2 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-text-secondary">
              Full payment sends this order to KOT and saves it permanently in Order History. It
              will not appear in Pending Payments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
