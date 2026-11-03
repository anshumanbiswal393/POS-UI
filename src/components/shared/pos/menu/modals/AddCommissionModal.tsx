import { useState, useMemo, useEffect } from "react";
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
  Tag,
  Layers,
  Utensils,
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
  allItems: MenuItemCommission[];
}

type ApplyMode = "individual" | "multiple" | "category";

export function AddCommissionModal({
  isOpen,
  onClose,
  allItems,
}: AddCommissionModalProps) {
  const [applyMode, setApplyMode] = useState<ApplyMode>("individual");
  const [selectedSingleId, setSelectedSingleId] = useState<string>("");
  const [selectedMultipleIds, setSelectedMultipleIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [commissionType, setCommissionType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [commissionValue, setCommissionValue] = useState<string>("10");

  const bulkMutation = useBulkUpdateItemCommissions();

  // All unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(allItems.map((i) => i.category).filter(Boolean)));
  }, [allItems]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (allItems.length > 0 && !selectedSingleId) {
        setSelectedSingleId(allItems[0].id);
      }
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
      setSelectedMultipleIds([]);
      setSearchQuery("");
      setCategoryFilter("All");
      setCommissionType("Percentage");
      setCommissionValue("10");
    }
  }, [isOpen, allItems, categories]);

  // Multiple selection filtered items
  const filteredMultipleItems = useMemo(() => {
    return allItems.filter((item) => {
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allItems, categoryFilter, searchQuery]);

  const toggleSelectMultiple = (id: string) => {
    setSelectedMultipleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllMultiple = () => {
    if (selectedMultipleIds.length === filteredMultipleItems.length && filteredMultipleItems.length > 0) {
      setSelectedMultipleIds([]);
    } else {
      setSelectedMultipleIds(filteredMultipleItems.map((i) => i.id));
    }
  };

  // Determine target item IDs based on applyMode
  const targetItemIds = useMemo(() => {
    if (applyMode === "individual") {
      return selectedSingleId ? [selectedSingleId] : [];
    }
    if (applyMode === "multiple") {
      return selectedMultipleIds;
    }
    if (applyMode === "category") {
      if (!selectedCategory) return [];
      return allItems.filter((i) => i.category === selectedCategory).map((i) => i.id);
    }
    return [];
  }, [applyMode, selectedSingleId, selectedMultipleIds, selectedCategory, allItems]);

  // Target item objects for preview
  const targetItems = useMemo(() => {
    const idSet = new Set(targetItemIds);
    return allItems.filter((i) => idSet.has(i.id));
  }, [targetItemIds, allItems]);

  const numVal = parseFloat(commissionValue) || 0;

  // Primary sample item for live preview calculation
  const primarySample = useMemo(() => {
    if (targetItems.length > 0) return targetItems[0];
    if (allItems.length > 0) return allItems[0];
    return null;
  }, [targetItems, allItems]);

  const sampleBasePrice = primarySample?.price || 100;
  const sampleCommAmt = calculateCommissionAmount(sampleBasePrice, commissionType, numVal);
  const sampleEffectivePrice = calculateEffectivePrice(sampleBasePrice, commissionType, numVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetItemIds.length === 0) {
      if (applyMode === "individual") {
        toast.error("Please select a menu item");
      } else if (applyMode === "multiple") {
        toast.error("Please select at least one menu item");
      } else {
        toast.error("Please select a category with items");
      }
      return;
    }

    if (numVal <= 0) {
      toast.error("Please enter a valid commission value greater than 0");
      return;
    }

    bulkMutation.mutate(
      {
        ids: targetItemIds,
        commissionType,
        commissionValue: numVal,
      },
      {
        onSuccess: () => {
          const count = targetItemIds.length;
          if (applyMode === "individual") {
            toast.success(`Commission applied to "${primarySample?.name}"`);
          } else if (applyMode === "category") {
            toast.success(`Commission applied to all ${count} items in "${selectedCategory}"`);
          } else {
            toast.success(`Commission applied to ${count} items successfully`);
          }
          onClose();
        },
        onError: () => {
          toast.error("Failed to save commission. Please try again.");
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add Commission"
      description="Configure commission markup for individual items, multiple selections, or whole categories."
      icon={Percent}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton
            label={bulkMutation.isPending ? "Saving..." : "Save Commission"}
            icon={Check}
            disabled={bulkMutation.isPending || targetItemIds.length === 0 || numVal <= 0}
            isSubmitting={bulkMutation.isPending}
          />
        </>
      }
    >
      <div className="space-y-5">
        {/* SECTION 1: Apply Commission To (3 Modes) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Apply Commission To
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setApplyMode("individual")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                applyMode === "individual"
                  ? "border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Utensils className="h-4 w-4 text-teal-700 shrink-0" />
                <span className="font-bold text-xs">Individual Item</span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Select a single dish
              </span>
            </button>

            <button
              type="button"
              onClick={() => setApplyMode("multiple")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                applyMode === "multiple"
                  ? "border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                <span className="font-bold text-xs">Multiple Items</span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Select with checkboxes
              </span>
            </button>

            <button
              type="button"
              onClick={() => setApplyMode("category")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                applyMode === "category"
                  ? "border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Layers className="h-4 w-4 text-teal-700 shrink-0" />
                <span className="font-bold text-xs">Entire Category</span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Apply to all items
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Selector based on Apply Mode */}
        {applyMode === "individual" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Menu Item
            </label>
            <select
              value={selectedSingleId}
              onChange={(e) => setSelectedSingleId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-teal-600 focus:outline-hidden cursor-pointer"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) — ₹{item.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        {applyMode === "category" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-teal-600 focus:outline-hidden cursor-pointer"
            >
              {categories.map((cat) => {
                const count = allItems.filter((i) => i.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count} items)
                  </option>
                );
              })}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Commission will be applied to all {targetItemIds.length} items in this category.
            </p>
          </div>
        )}

        {applyMode === "multiple" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Select Items ({selectedMultipleIds.length} selected)
              </label>
              <button
                type="button"
                onClick={toggleSelectAllMultiple}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 transition cursor-pointer"
              >
                {selectedMultipleIds.length === filteredMultipleItems.length && filteredMultipleItems.length > 0
                  ? "Deselect All"
                  : "Select All Filtered"}
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-teal-600 focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Checkbox List */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
              {filteredMultipleItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No items found matching filter.
                </div>
              ) : (
                filteredMultipleItems.map((item) => {
                  const isChecked = selectedMultipleIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                        isChecked ? "bg-teal-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectMultiple(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.category}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 shrink-0 ml-2">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Commission Details */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Commission Details
          </label>

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCommissionType("Percentage")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                commissionType === "Percentage"
                  ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Percent className="h-3.5 w-3.5" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setCommissionType("Fixed Amount")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                commissionType === "Fixed Amount"
                  ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <IndianRupee className="h-3.5 w-3.5" />
              <span>Fixed Amount (₹)</span>
            </button>
          </div>

          {/* Value Input */}
          <div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                {commissionType === "Percentage" ? "%" : "₹"}
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder={commissionType === "Percentage" ? "10" : "50.00"}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-hidden"
              />
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 font-medium">Quick values:</span>
              {commissionType === "Percentage" ? (
                [5, 10, 15, 20].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCommissionValue(String(val))}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-800 transition cursor-pointer"
                  >
                    {val}%
                  </button>
                ))
              ) : (
                [10, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCommissionValue(String(val))}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-800 transition cursor-pointer"
                  >
                    ₹{val}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Live Calculation Preview */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-teal-200/60">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <span className="text-xs font-bold text-teal-900">
                Live Price Calculation Preview
              </span>
            </div>
            <span className="text-[11px] font-semibold text-teal-700">
              {targetItemIds.length} {targetItemIds.length === 1 ? "item" : "items"} selected
            </span>
          </div>

          {primarySample ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Original Base Price ({primarySample.name}):</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{sampleBasePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-teal-700 font-medium">
                <span>
                  + Commission Markup ({commissionType === "Percentage" ? `${numVal}%` : `₹${numVal.toFixed(2)}`}):
                </span>
                <span className="font-mono font-bold">
                  +₹{sampleCommAmt.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-extrabold text-sm pt-1.5 border-t border-teal-200">
                <span className="text-teal-950">Final Selling Price:</span>
                <span className="font-mono text-teal-700 text-base">
                  ₹{sampleEffectivePrice.toFixed(2)}
                </span>
              </div>

              {targetItems.length > 1 && (
                <div className="pt-2 text-[11px] text-slate-500 border-t border-teal-100">
                  <span className="font-semibold text-slate-700">Sample of other items:</span>
                  <div className="mt-1 space-y-0.5">
                    {targetItems.slice(1, 3).map((item) => {
                      const eff = calculateEffectivePrice(item.price, commissionType, numVal);
                      return (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="font-mono text-slate-700">
                            ₹{item.price.toFixed(2)} → <strong className="text-teal-800">₹{eff.toFixed(2)}</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Select an item or category above to see the live selling price calculation.
            </p>
          )}
        </div>
      </div>
    </PosCreatePanel>
  );
}
export default AddCommissionModal;
