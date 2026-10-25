import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export type WastageFormValues = {
  item: string;
  stockItemId?: string;
  category: string;
  quantity: string;
  unit: string;
  unitCost: string;
  reason: string;
  approvedBy: string;
  date: string;
  notes: string;
};

const ITEM_OPTIONS: Array<{ name: string; category: string; unit: string; unitCost: string }> = [];

const REASON_OPTIONS = [
  "Spoiled / Overripe",
  "Expired shelf life",
  "Curdled / Contaminated",
  "Customer order cancellation",
  "Prep shrinkage / Overcook",
  "Spillage / Handling damage",
  "Power outage spoilage",
  "Other",
];

const APPROVER_OPTIONS = ["Chef Vikram", "Store Mgr", "Supervisor Rohit", "Head Chef", "Kitchen Captain"];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordWastageModal({
  isOpen,
  onClose,
  onSave,
  stockItems = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: WastageFormValues & { costLoss: number }) => void;
  stockItems?: Array<{ id: string; rawMaterial: string; category: string; unit: string; unitCost?: number }>;
}) {
  const skuOptions = stockItems.length
    ? stockItems.map((sku) => ({
        id: sku.id,
        name: sku.rawMaterial,
        category: sku.category,
        unit: sku.unit,
        unitCost: String(sku.unitCost ?? 0),
      }))
    : ITEM_OPTIONS.map((opt) => ({ id: opt.name, ...opt }));
  const [item, setItem] = useState(skuOptions[0]?.name || "");
  const [stockItemId, setStockItemId] = useState(skuOptions[0]?.id || "");
  const [category, setCategory] = useState(skuOptions[0]?.category || "");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(skuOptions[0]?.unit || "Kg");
  const [unitCost, setUnitCost] = useState(skuOptions[0]?.unitCost || "0");
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [approvedBy, setApprovedBy] = useState(APPROVER_OPTIONS[0]);
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const first = skuOptions[0];
    setItem(first?.name || "");
    setStockItemId(first?.id || "");
    setCategory(first?.category || "");
    setQuantity("");
    setUnit(first?.unit || "Kg");
    setUnitCost(first?.unitCost || "0");
    setReason(REASON_OPTIONS[0]);
    setApprovedBy(APPROVER_OPTIONS[0]);
    setDate(todayInputValue());
    setNotes("");
  }, [isOpen, stockItems]);

  const qtyNum = parseFloat(quantity) || 0;
  const costNum = parseFloat(unitCost) || 0;
  const costLoss = Math.round(qtyNum * costNum * 100) / 100;

  const handleItemChange = (id: string) => {
    const match = skuOptions.find((i) => i.id === id);
    setStockItemId(id);
    setItem(match?.name || "");
    if (match) {
      setCategory(match.category);
      setUnit(match.unit);
      setUnitCost(match.unitCost);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) {
      toast.error("Select an item");
      return;
    }
    if (!quantity || qtyNum <= 0) {
      toast.error("Enter a valid quantity wasted");
      return;
    }
    if (!reason.trim()) {
      toast.error("Select a wastage reason");
      return;
    }
    if (!approvedBy.trim()) {
      toast.error("Approver is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }

    onSave({
      item: item.trim(),
      stockItemId,
      category: category.trim(),
      quantity: quantity.trim(),
      unit: unit.trim(),
      unitCost: unitCost.trim(),
      reason: reason.trim(),
      approvedBy: approvedBy.trim(),
      date,
      notes: notes.trim(),
      costLoss,
    });
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Record Stock Wastage"
      description="Log damaged, expired, or leaked inventory with approval"
      icon={AlertTriangle}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>Save Wastage Entry</PosCreateSubmitButton>
        </>
      }
    >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Raw Material / Item <span className="text-rose-500">*</span>
                </label>
                <select
                  value={stockItemId || item}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden cursor-pointer"
                >
                  {skuOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Quantity Wasted <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Reason / Cause <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden cursor-pointer"
                >
                  {REASON_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Approved By <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden cursor-pointer"
                >
                  {APPROVER_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional investigation notes..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] resize-none focus:border-rose-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-rose-800">Estimated Cost Loss</span>
              <span className="text-[18px] font-extrabold text-rose-600">
                ₹ {costLoss.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
    </PosCreatePanel>
  );
}
