import { useState, useEffect } from "react";
import { Percent, IndianRupee, ArrowRight, Trash2, Sparkles } from "lucide-react";
import { useUpdateItemCommission } from "@/hooks/queries/usePosMenu";
import type { MenuItemCommission } from "@/types/posMenu";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import { calculateEffectivePrice, calculateCommissionAmount } from "@/utils/commissionUtils";

export function SetCommissionModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItemCommission | null;
}) {
  const [commissionType, setCommissionType] = useState<
    "Not Configured" | "Percentage" | "Fixed Amount"
  >("Percentage");
  const [value, setValue] = useState<string>("5");
  const updateMutation = useUpdateItemCommission();

  useEffect(() => {
    if (item) {
      setCommissionType(
        item.commissionType === "Not Configured" ? "Percentage" : item.commissionType,
      );
      setValue(item.commissionValue != null ? String(item.commissionValue) : "5");
    }
  }, [item]);

  const numVal = commissionType === "Not Configured" ? null : parseFloat(value) || 0;
  const basePrice = item?.price || 0;
  const commAmt = calculateCommissionAmount(basePrice, commissionType, numVal);
  const effectivePrice = calculateEffectivePrice(basePrice, commissionType, numVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    updateMutation.mutate(
      {
        id: item.id,
        commissionType,
        commissionValue: numVal,
      },
      {
        onSuccess: () => {
          toast.success(`Commission updated for "${item.name}"`);
          onClose();
        },
        onError: () => {
          toast.error("Failed to update commission");
        },
      },
    );
  };

  const handleClearCommission = () => {
    if (!item) return;
    updateMutation.mutate(
      {
        id: item.id,
        commissionType: "Not Configured",
        commissionValue: null,
      },
      {
        onSuccess: () => {
          toast.success(`Commission removed for "${item.name}" (reverted to base price)`);
          onClose();
        },
        onError: () => {
          toast.error("Failed to remove commission");
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen && Boolean(item)}
      onClose={onClose}
      title="Edit Menu Item Commission"
      description={item?.name}
      icon={Percent}
      onSubmit={handleSubmit}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {item?.commissionType !== "Not Configured" && item?.commissionValue != null ? (
            <button
              type="button"
              onClick={handleClearCommission}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Commission</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <PosCreateCancelButton onClick={onClose} />
            <PosCreateSubmitButton disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Commission"}
            </PosCreateSubmitButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Item Summary Bar */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px]">
          <div>
            <span className="text-slate-500">Category:</span>{" "}
            <span className="font-semibold text-slate-800">{item?.category}</span>
          </div>
          <div>
            <span className="text-slate-500">Base Price:</span>{" "}
            <span className="font-mono font-bold text-slate-900">₹{item?.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Commission Type Switcher */}
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">
            Commission Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["Not Configured", "Percentage", "Fixed Amount"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCommissionType(type)}
                className={`rounded-xl border px-3 py-2 text-center text-[12px] font-bold transition cursor-pointer ${
                  commissionType === type
                    ? "border-teal-600 bg-white text-teal-800 shadow-2xs ring-2 ring-teal-600/10"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {type === "Not Configured"
                  ? "None (Base)"
                  : type === "Percentage"
                    ? "% Percentage"
                    : "₹ Fixed Amount"}
              </button>
            ))}
          </div>
        </div>

        {/* Value Input */}
        {commissionType !== "Not Configured" ? (
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">
              Commission Value {commissionType === "Percentage" ? "(%)" : "(₹)"}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                {commissionType === "Percentage" ? (
                  <Percent className="h-4 w-4" />
                ) : (
                  <IndianRupee className="h-4 w-4" />
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-[14px] font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 shadow-2xs"
              />
            </div>
          </div>
        ) : null}

        {/* Live Calculation Preview */}
        {commissionType !== "Not Configured" && (numVal || 0) > 0 && (
          <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 to-emerald-50/70 p-3 text-[12px] space-y-1.5">
            <div className="flex items-center justify-between text-teal-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                Updated Selling Price
              </span>
              <span className="text-[11px] font-semibold text-teal-700">Reflects in Billing & Menu</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-mono text-[13px] pt-1 border-t border-teal-200/60">
              <span>Base ₹{basePrice.toFixed(2)}</span>
              <span className="text-teal-700 font-bold">
                + {commissionType === "Percentage" ? `${numVal}% (₹${commAmt.toFixed(2)})` : `₹${commAmt.toFixed(2)}`}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="font-extrabold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs">
                Selling ₹{effectivePrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </PosCreatePanel>
  );
}
