import { X, Utensils, IndianRupee, CheckCircle2 } from "lucide-react";

export type PreviousOrderItem = {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
};

export type BillingPreviousOrdersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  tableNumber?: string;
  guestName?: string;
  items: PreviousOrderItem[];
  grandTotal: number;
  onSettleBill?: () => void;
};

export function BillingPreviousOrdersModal({
  isOpen,
  onClose,
  orderNumber,
  tableNumber,
  guestName,
  items,
  grandTotal,
  onSettleBill,
}: BillingPreviousOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Previous Orders {tableNumber ? `· ${tableNumber}` : ""}
              </h3>
              <p className="text-xs text-slate-500">
                Order #{orderNumber} {guestName ? `· Guest: ${guestName}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No items recorded for this order yet.
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0">
                    {item.quantity}×
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {item.variant ? (
                      <span className="text-[10px] text-slate-500 ml-1">({item.variant})</span>
                    ) : null}
                  </div>
                </div>
                <span className="font-extrabold text-slate-900 shrink-0 font-mono">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Active Bill</span>
            <span className="text-lg font-black text-slate-900 font-mono">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            {onSettleBill && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSettleBill();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <IndianRupee className="h-3.5 w-3.5" />
                <span>Settle Full Bill</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

