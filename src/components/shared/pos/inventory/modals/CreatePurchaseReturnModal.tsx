import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  useCreatePurchaseReturn,
  useInventoryVendors,
  useStockItems,
} from "@/hooks/queries/usePosInventory";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import {
  StockSkuLines,
  emptySkuLine,
  lineAmount,
  toPurchaseItems,
} from "@/components/shared/pos/inventory/StockSkuLines";

export function CreatePurchaseReturnModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: vendors } = useInventoryVendors();
  const { data: stockItems = [] } = useStockItems();
  const createMutation = useCreatePurchaseReturn();

  const [vendorName, setVendorName] = useState("Metro Cash & Carry");
  const [debitNoteNo, setDebitNoteNo] = useState(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reason, setReason] = useState<
    "Damaged / Expired" | "Wrong Item" | "Excess Quantity" | "Quality Issue"
  >("Damaged / Expired");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([emptySkuLine()]);

  const items = toPurchaseItems(lines);
  const returnAmount = useMemo(
    () => Math.round(lines.reduce((sum, line) => sum + lineAmount(line), 0) * 100) / 100,
    [lines],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitNoteNo.trim()) {
      toast.error("Please enter a Debit Note Number");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one stock SKU to return");
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
        itemCount: items.length,
        returnAmount,
        status: "Issued",
        notes,
        items,
      },
      {
        onSuccess: () => {
          toast.success(`Purchase Return Debit Note ${debitNoteNo} issued`);
          onClose();
        },
        onError: () => toast.error("Failed to issue debit note"),
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Create Purchase Return"
      description="Issue a debit note. Selected SKUs are deducted from on-hand stock."
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

      <div>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Return Reason</label>
        <select
          value={reason}
          onChange={(e) =>
            setReason(e.target.value as "Damaged / Expired" | "Wrong Item" | "Excess Quantity" | "Quality Issue")
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="Damaged / Expired">Damaged / Expired</option>
          <option value="Wrong Item">Wrong Item</option>
          <option value="Excess Quantity">Excess Quantity</option>
          <option value="Quality Issue">Quality Issue</option>
        </select>
      </div>

      <StockSkuLines lines={lines} onChange={setLines} stockItems={stockItems} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-900">
        Return value ₹ {returnAmount.toFixed(2)}
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
