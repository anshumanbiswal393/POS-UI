import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export type WastageFormValues = {
  item: string;
  category: string;
  quantity: string;
  unit: string;
  unitCost: string;
  reason: string;
  approvedBy: string;
  date: string;
  notes: string;
};

const ITEM_OPTIONS = [
  { name: "Tomatoes (Local)", category: "Vegetables", unit: "kg", unitCost: "40" },
  { name: "Milk (Full Cream)", category: "Dairy", unit: "L", unitCost: "65" },
  { name: "Chicken Curry (Prepared)", category: "Prepared Food", unit: "portions", unitCost: "170" },
  { name: "Burger Buns", category: "Bakery", unit: "pcs", unitCost: "12" },
  { name: "Paneer Fresh Malai", category: "Dairy", unit: "kg", unitCost: "320" },
  { name: "Chicken Breast Boneless", category: "Meat", unit: "kg", unitCost: "260" },
  { name: "Basmati Rice", category: "Groceries", unit: "kg", unitCost: "85" },
];

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
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: WastageFormValues & { costLoss: number }) => void;
}) {
  const [item, setItem] = useState(ITEM_OPTIONS[0].name);
  const [category, setCategory] = useState(ITEM_OPTIONS[0].category);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(ITEM_OPTIONS[0].unit);
  const [unitCost, setUnitCost] = useState(ITEM_OPTIONS[0].unitCost);
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [approvedBy, setApprovedBy] = useState(APPROVER_OPTIONS[0]);
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const first = ITEM_OPTIONS[0];
    setItem(first.name);
    setCategory(first.category);
    setQuantity("");
    setUnit(first.unit);
    setUnitCost(first.unitCost);
    setReason(REASON_OPTIONS[0]);
    setApprovedBy(APPROVER_OPTIONS[0]);
    setDate(todayInputValue());
    setNotes("");
  }, [isOpen]);

  if (!isOpen) return null;

  const qtyNum = parseFloat(quantity) || 0;
  const costNum = parseFloat(unitCost) || 0;
  const costLoss = Math.round(qtyNum * costNum * 100) / 100;

  const handleItemChange = (name: string) => {
    setItem(name);
    const match = ITEM_OPTIONS.find((i) => i.name === name);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-rose-100 px-5 py-4 bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">Record Stock Wastage</h3>
              <p className="text-[12px] text-slate-600">
                Log damaged, expired, or leaked inventory with approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Raw Material / Item <span className="text-rose-500">*</span>
                </label>
                <select
                  value={item}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:border-rose-400 focus:outline-hidden cursor-pointer"
                >
                  {ITEM_OPTIONS.map((opt) => (
                    <option key={opt.name} value={opt.name}>
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
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-[13px] font-bold text-white cursor-pointer"
            >
              Save Wastage Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
