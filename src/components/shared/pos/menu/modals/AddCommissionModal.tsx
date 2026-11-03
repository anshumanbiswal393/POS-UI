import { useState, useMemo } from "react";
import {
  Percent,
  IndianRupee,
  Search,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { useBulkUpdateItemCommissions } from "@/hooks/queries/usePosMenu";
import type { MenuItemCommission } from "@/types/posMenu";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import { calculateEffectivePrice, calculateCommissionAmount } from "@/utils/commissionUtils";

interface AddCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unconfiguredItems: MenuItemCommission[];
}

export function AddCommissionModal({
  isOpen,
  onClose,
  unconfiguredItems,
}: AddCommissionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [commissionType, setCommissionType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [commissionValue, setCommissionValue] = useState<string>("10");

  const bulkMutation = useBulkUpdateItemCommissions();

  // Categories from available unconfigured items
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(unconfiguredItems.map((i) => i.category)))];
  }, [unconfiguredItems]);

  // Filtered unconfigured items
  const filteredItems = useMemo(() => {
    return unconfiguredItems.filter((item) => {
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [unconfiguredItems, categoryFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  // Sample item for live calculation preview
  const sampleItem = useMemo(() => {
    if (selectedIds.length > 0) {
      return unconfiguredItems.find((i) => i.id === selectedIds[0]) || unconfiguredItems[0];
    }
    return unconfiguredItems[0] || null;
  }, [selectedIds, unconfiguredItems]);

  const numVal = parseFloat(commissionValue) || 0;
  const sampleBasePrice = sampleItem?.price || 100;
  const sampleCommAmt = calculateCommissionAmount(sampleBasePrice, commissionType, numVal);
  const sampleEffectivePrice = calculateEffectivePrice(sampleBasePrice, commissionType, numVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Please select at least one menu item to add commission");
      return;
    }
    if (numVal <= 0) {
      toast.error("Please enter a valid commission value greater than 0");
      return;
    }

    bulkMutation.mutate(
      {
        ids: selectedIds,
        commissionType,
        commissionValue: numVal,
      },
      {
        onSuccess: () => {
          toast.success(
            `Added ${commissionType === "Percentage" ? `${numVal}%` : `₹${numVal}`} commission to ${selectedIds.length} item(s)!`,
          );
          setSelectedIds([]);
          onClose();
        },
        onError: () => {
          toast.error("Failed to add commission rules");
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add Menu Item Commission"
      description="Select unconfigured menu items to apply an internal commission markup"
      icon={Percent}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton
            disabled={bulkMutation.isPending || selectedIds.length === 0 || numVal <= 0}
          >
            {bulkMutation.isPending
              ? "Saving..."
              : `Add Commission to ${selectedIds.length} Item${selectedIds.length === 1 ? "" : "s"}`}
          </PosCreateSubmitButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* 1. Commission Type & Value Settings */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              1. Commission Rule
            </span>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Internal Markup
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCommissionType("Percentage")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[12.5px] font-bold transition cursor-pointer ${
                commissionType === "Percentage"
                  ? "border-teal-600 bg-white text-teal-800 shadow-2xs ring-2 ring-teal-600/10"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Percent className="h-4 w-4 text-teal-600" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setCommissionType("Fixed Amount")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[12.5px] font-bold transition cursor-pointer ${
                commissionType === "Fixed Amount"
                  ? "border-teal-600 bg-white text-teal-800 shadow-2xs ring-2 ring-teal-600/10"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <IndianRupee className="h-4 w-4 text-teal-600" />
              <span>Fixed Amount (₹)</span>
            </button>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Commission Value {commissionType === "Percentage" ? "(%)" : "(₹)"}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                {commissionType === "Percentage" ? (
                  <Percent className="h-4 w-4" />
                ) : (
                  <IndianRupee className="h-4 w-4" />
                )}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "Percentage" ? "e.g. 10" : "e.g. 50"}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-[14px] font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Real-time Calculation Preview Card */}
          {sampleItem && numVal > 0 && (
            <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 to-emerald-50/70 p-3 text-[12px] space-y-1.5">
              <div className="flex items-center justify-between text-teal-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                  Live Price Calculation Preview
                </span>
                <span className="text-[11px] font-medium text-teal-700 truncate max-w-[140px]">
                  {sampleItem.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 font-mono text-[13px] pt-1 border-t border-teal-200/60">
                <span>Base ₹{sampleBasePrice.toFixed(2)}</span>
                <span className="text-teal-700 font-bold">
                  + {commissionType === "Percentage" ? `${numVal}% (₹${sampleCommAmt.toFixed(2)})` : `₹${sampleCommAmt.toFixed(2)}`}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="font-extrabold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs">
                  Selling ₹{sampleEffectivePrice.toFixed(2)}
                </span>
              </div>
              <p className="text-[10.5px] text-teal-800/80 mt-1">
                This item will reflect as ₹{sampleEffectivePrice.toFixed(2)} in Billing and Physical Menu with zero commission breakdown shown.
              </p>
            </div>
          )}
        </div>

        {/* 2. Unconfigured Items Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
              2. Select Remaining Menu Items ({unconfiguredItems.length} without commission)
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-[11.5px] font-bold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5" /> Select All ({filteredItems.length})
                </>
              )}
            </button>
          </div>

          {/* Filters inside modal */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search remaining dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Items List */}
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-[12.5px]">
                <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No unconfigured items found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All menu items matching your filter already have commission added.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const itemEffective = calculateEffectivePrice(item.price, commissionType, numVal);

                return (
                  <label
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`flex items-center justify-between p-2.5 hover:bg-slate-50 transition cursor-pointer select-none ${
                      isSelected ? "bg-teal-50/70" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition ${
                          isSelected
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.category}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[12.5px] font-mono font-bold text-slate-800">
                        ₹{item.price.toFixed(2)}
                      </div>
                      {numVal > 0 && isSelected && (
                        <div className="text-[11px] font-mono font-bold text-teal-700">
                          $\rightarrow$ ₹{itemEffective.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PosCreatePanel>
  );
}

