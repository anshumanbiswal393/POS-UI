import { useState, useEffect } from "react";
import { Percent, IndianRupee } from "lucide-react";
import { useUpdateItemCommission } from "@/hooks/queries/usePosMenu";
import type { MenuItemCommission } from "@/types/posMenu";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const numVal = commissionType === "Not Configured" ? null : parseFloat(value) || 0;

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

  return (
    <PosCreatePanel
      open={isOpen && Boolean(item)}
      onClose={onClose}
      title="Set Menu Commission"
      description={item?.name}
      icon={Percent}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Commission"}
          </PosCreateSubmitButton>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary-tint/70 px-3 py-2.5 text-[12.5px]">
        <div>
          <span className="text-muted-foreground">Category:</span>{" "}
          <span className="font-medium text-foreground">{item?.category}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Base Price:</span>{" "}
          <span className="font-mono font-semibold text-foreground">₹{item?.price}</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Commission Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["Not Configured", "Percentage", "Fixed Amount"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCommissionType(type)}
              className={`rounded-lg border px-3 py-2 text-center text-[12px] font-medium transition cursor-pointer ${
                commissionType === type
                  ? "border-primary bg-primary-tint font-semibold text-primary"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {type === "Not Configured"
                ? "None"
                : type === "Percentage"
                  ? "% Percent"
                  : "₹ Fixed"}
            </button>
          ))}
        </div>
      </div>

      {commissionType !== "Not Configured" ? (
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Commission Value {commissionType === "Percentage" ? "(%)" : "(₹)"}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
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
              className="w-full rounded-lg border border-border bg-primary-tint/70 py-2 pl-9 pr-3.5 text-[13.5px] text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ) : null}
    </PosCreatePanel>
  );
}
