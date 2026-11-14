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
  stockItems?: Array<{
    id: string;
    rawMaterial: string;
    category: string;
    unit: string;
    unitCost?: number;
    availableStock?: number;
    quantityOnHand?: number;
    closingStock?: number;
  }>;
}) {
  const skuOptions = stockItems.length
    ? stockItems.map((sku) => {
        const avail = Number(sku.availableStock ?? sku.quantityOnHand ?? sku.closingStock ?? 0);
        return {
          id: sku.id,
          name: sku.rawMaterial,
          category: sku.category,
          unit: sku.unit,
          unitCost: String(sku.unitCost ?? 0),
          availableStock: avail,
        };
      })
    : ITEM_OPTIONS.map((opt) => ({ id: opt.name, ...opt, availableStock: 0 }));
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

  const selectedSku = skuOptions.find((i) => i.id === (stockItemId || item));
  const currentAvailable = selectedSku ? selectedSku.availableStock : 0;
  const remainingStock = Math.max(0, currentAvailable - qtyNum);
  const isOverdraw = qtyNum > currentAvailable;

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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12.5px] font-semibold text-slate-700">
                    Raw Material / Item <span className="text-rose-500">*</span>
                  </label>
                  {selectedSku && (
                    <span className="text-[11.5px] font-medium text-slate-500">
                      Current Stock: <strong className="text-teal-700 font-bold">{selectedSku.availableStock} {selectedSku.unit}</strong>
                    </span>
                  )}
                </div>
                <select
                  value={stockItemId || item}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden cursor-pointer"
                >
                  {skuOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.availableStock} {opt.unit} available)
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
                  max={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={(e) => {
                    const val = e.target.value;
                    const todayIso = new Date().toISOString().slice(0, 10);
                    if (val && val > todayIso) return;
                    setDate(val);
                  }}
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

              {selectedSku && qtyNum > 0 && (
                <div className="sm:col-span-2 rounded-lg bg-teal-50 border border-teal-200/80 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-teal-900 font-semibold">Remaining Stock after Wastage:</span>{" "}
                    <strong className={`font-mono font-bold ${isOverdraw ? "text-amber-700" : "text-teal-800"}`}>
                      {remainingStock.toFixed(2)} {unit}
                    </strong>
                  </div>
                  {isOverdraw && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      ⚠️ Exceeds tracked stock ({selectedSku.availableStock} {unit})
                    </span>
                  )}
                </div>
              )}

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
