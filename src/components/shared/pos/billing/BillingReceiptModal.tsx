import React, { useEffect } from "react";
import { Printer, CheckCircle, X } from "lucide-react";
import type { BillSettlementRecord } from "@/types/posBilling";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { settlementRecordToInvoicePayload } from "@/utils/printReceipt";

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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        onPrint();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onPrint, onClose]);

  if (!isOpen || !record) return null;

  const invoicePayload = settlementRecordToInvoicePayload(record);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-emerald-50 text-emerald-950 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold">Settlement Successful</h3>
              <p className="text-[11px] text-emerald-700">Official PMS Tax Invoice generated & ready to print</p>
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

        {/* Unified PMS Tax Invoice Preview Card */}
        <div className="p-4 overflow-y-auto bg-slate-100/80 flex justify-center flex-1">
          <div className="w-full max-w-[760px] bg-white rounded-md shadow-md p-2">
            <InvoiceTemplate invoice={invoicePayload} />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Tax Invoice [F9]</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNewBill();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Start Next Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillingReceiptModal;
