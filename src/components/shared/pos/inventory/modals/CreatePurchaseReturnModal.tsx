import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useCreatePurchaseReturn, useInventoryVendors } from "@/hooks/queries/usePosInventory";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function CreatePurchaseReturnModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: vendors } = useInventoryVendors();
  const createMutation = useCreatePurchaseReturn();

  const [vendorName, setVendorName] = useState("Metro Cash & Carry");
  const [debitNoteNo, setDebitNoteNo] = useState(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reason, setReason] = useState<
    "Damaged / Expired" | "Wrong Item" | "Excess Quantity" | "Quality Issue"
  >("Damaged / Expired");
  const [itemCount, setItemCount] = useState("2");
  const [returnAmount, setReturnAmount] = useState("850");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitNoteNo.trim()) {
      toast.error("Please enter a Debit Note Number");
      return;
    }

    createMutation.mutate(
      {
        debitNoteNo: debitNoteNo.trim(),
        vendorName,
        returnDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        reason,
        itemCount: parseInt(itemCount) || 1,
        returnAmount: parseFloat(returnAmount) || 0,
        status: "Issued",
        notes,
      },
      {
        onSuccess: () => {
          toast.success(`Purchase Return Debit Note ${debitNoteNo} issued`);
          onClose();
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Create Purchase Return"
      description="Issue a debit note for damaged, excess, or wrong stock."
      icon={RotateCcw}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>Issue Debit Note</PosCreateSubmitButton>
        </>
      }
    >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Vendor / Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {vendors?.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Debit Note No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={debitNoteNo}
                onChange={(e) => setDebitNoteNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Return Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="Damaged / Expired">Damaged / Expired</option>
                <option value="Wrong Item">Wrong Item</option>
                <option value="Excess Quantity">Excess Quantity</option>
                <option value="Quality Issue">Quality Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Return Value (₹)
              </label>
              <input
                type="number"
                step="any"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
              Item Count
            </label>
            <input
              type="number"
              min="1"
              value={itemCount}
              onChange={(e) => setItemCount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Package seal broken upon delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
            />
          </div>

    </PosCreatePanel>
  );
}
