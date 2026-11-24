import { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Info, ToggleRight, ToggleLeft } from "lucide-react";
import type { MenuItem } from "@/types/posMenu";

export function BulkAvailabilityModal({
  isOpen,
  onClose,
  selectedItemIds,
  items,
  actionType,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds: string[];
  items: MenuItem[];
  actionType: "enable" | "disable";
  onConfirm: (platforms: { zomato: boolean; swiggy: boolean; direct: boolean }) => void;
}) {
  const [applyZomato, setApplyZomato] = useState(true);
  const [applySwiggy, setApplySwiggy] = useState(true);
  const [applyDirect, setApplyDirect] = useState(true);

  if (!isOpen) return null;

  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));

  const handleConfirm = () => {
    onConfirm({
      zomato: applyZomato,
      swiggy: applySwiggy,
      direct: applyDirect,
    });
  };

  const isEnable = actionType === "enable";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isEnable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isEnable ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Bulk {isEnable ? "Enable" : "Disable"} Online Availability
              </h2>
              <p className="text-[12px] text-slate-500">
                Updating {selectedItemIds.length} selected items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Target Platforms Checkboxes */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-2">
              Apply {isEnable ? "Turn ON" : "Turn OFF"} to channels:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <label
                className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                  applyZomato
                    ? "border-red-500 bg-red-50/40 text-red-900"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={applyZomato}
                  onChange={(e) => setApplyZomato(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <span className="text-[12.5px] font-bold">Zomato</span>
              </label>

              <label
                className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                  applySwiggy
                    ? "border-orange-500 bg-orange-50/40 text-orange-900"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={applySwiggy}
                  onChange={(e) => setApplySwiggy(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
                <span className="text-[12.5px] font-bold">Swiggy</span>
              </label>

              <label
                className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${
                  applyDirect
                    ? "border-teal-500 bg-teal-50/40 text-teal-900"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={applyDirect}
                  onChange={(e) => setApplyDirect(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-[12.5px] font-bold">Direct QR</span>
              </label>
            </div>
          </div>

          {/* Selected Items preview */}
          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">
              Selected Dishes ({selectedItems.length}):
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex flex-wrap gap-1.5">
              {selectedItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-slate-800 border border-slate-200"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>

          {/* Helper Info Notice */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2.5 text-[12px] text-blue-900 leading-relaxed">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>POS Base Menu Protection:</strong> Disabling items for online aggregator
              delivery does not remove or impact their availability on the POS counter billing
              screen.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!applyZomato && !applySwiggy && !applyDirect}
            className={`rounded-lg px-5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer disabled:opacity-50 ${
              isEnable ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Confirm {isEnable ? "Enable" : "Disable"} ({selectedItemIds.length} Items)
          </button>
        </div>
      </div>
    </div>
  );
}
