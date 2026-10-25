import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import {
  useCreatePurchaseOrder,
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

export function CreatePurchaseOrderModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: vendors } = useInventoryVendors();
  const { data: stockItems = [] } = useStockItems();
  const createMutation = useCreatePurchaseOrder();

  const [vendorName, setVendorName] = useState("Metro Cash & Carry");
  const [poNumber, setPoNumber] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([emptySkuLine()]);

  const items = toPurchaseItems(lines);
  const estimatedAmount = useMemo(
    () => Math.round(lines.reduce((sum, line) => sum + lineAmount(line), 0) * 100) / 100,
    [lines],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      toast.error("Please enter a PO Number");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one stock SKU");
      return;
    }

    createMutation.mutate(
      {
        poNumber: poNumber.trim(),
        vendorName,
        orderDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        expectedDeliveryDate: deliveryDate,
        itemCount: items.length,
        estimatedAmount,
        status: "Sent",
        notes,
        items,
      },
      {
        onSuccess: () => {
          toast.success(`Purchase Order ${poNumber} issued successfully`);
          onClose();
        },
        onError: () => toast.error("Failed to issue purchase order"),
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Issue a purchase order. Stock is added only when this PO is received."
      icon={ShoppingCart}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>Issue Purchase Order</PosCreateSubmitButton>
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
            PO Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Expected Delivery Date</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
        />
      </div>

      <StockSkuLines lines={lines} onChange={setLines} stockItems={stockItems} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-900">
        Estimated value ₹ {estimatedAmount.toFixed(2)}
      </div>

      <div>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Order Instructions</label>
        <input
          type="text"
          placeholder="e.g. Early morning delivery required"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
        />
      </div>
    </PosCreatePanel>
  );
}
