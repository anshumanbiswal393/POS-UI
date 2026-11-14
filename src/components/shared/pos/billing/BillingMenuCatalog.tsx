import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import type {
  BillingMenuItem,
  BillingDietType,
  BillingCartItem,
  BillingItemVariant,
} from "@/types/posBilling";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";
import { cn } from "@/lib/utils";
import { fuzzyFilter } from "@/utils/fuzzySearch";

type BillingMenuCatalogProps = {
  items: BillingMenuItem[];
  cartItems: BillingCartItem[];
  onAddItem: (item: BillingMenuItem, selectedVariant?: BillingItemVariant) => void;
  onOpenModifierModal: (item: BillingMenuItem) => void;
  onUpdateCartQty: (cartId: string, newQty: number) => void;
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  selectedMealTime?: string;
  onSelectMealTime?: (meal: string) => void;
};

export function BillingMenuCatalog({
  items,
  cartItems,
  onAddItem,
  onOpenModifierModal: _onOpenModifierModal,
  onUpdateCartQty,
  searchQuery,
  onSearchChange,
  selectedMealTime: controlledMealTime,
  onSelectMealTime,
}: BillingMenuCatalogProps) {
  const [internalMealTime, setInternalMealTime] = useState<string>("All");
  const selectedMealTime = controlledMealTime ?? internalMealTime;
  const [selectedCategory, setSelectedCategory] = useState<string>("All Items");
  const [selectedDiet, setSelectedDiet] = useState<BillingDietType>("all");
  const [localSearch, setLocalSearch] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const effectiveQuery = searchQuery || localSearch;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Categories come only from this outlet's menu items (no hardcoded mock chips).
  const allCategories = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const fromItems = Array.from(
      new Set(safeItems.map((i) => i?.category).filter((c): c is string => Boolean(c?.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All Items", ...fromItems];
  }, [items]);

  useEffect(() => {
    if (!allCategories.includes(selectedCategory)) {
      setSelectedCategory("All Items");
    }
  }, [allCategories, selectedCategory]);

  const filteredItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    let result = safeItems.filter((item) => {
      if (!item) return false;
      if (selectedCategory !== "All Items" && item.category !== selectedCategory) return false;
      if (selectedDiet !== "all" && item.diet !== selectedDiet) return false;
      return true;
    });

    if (selectedMealTime !== "All") {
      const targetMeal = selectedMealTime.toLowerCase();
      result = result.filter((item) => {
        const rawItem = item as any;
        const mealTimes: string[] = rawItem.mealTimes || rawItem.meal_times;
        if (!mealTimes || !Array.isArray(mealTimes) || mealTimes.length === 0) {
          return true; // legacy items appear across all meal times
        }
        return mealTimes.some((m) => {
          const lower = String(m).trim().toLowerCase();
          return lower === targetMeal || lower === "all" || lower === "all day";
        });
      });
    }

    if (effectiveQuery.trim()) {
      result = fuzzyFilter(result, effectiveQuery, [
        (item) => item.name || "",
        (item) => item.code || "",
        (item) => item.category || "",
        (item) => item.subCategory || "",
        (item) => item.description || "",
        (item) => String(item.price || ""),
      ]);
    }

    return result;
  }, [items, selectedCategory, selectedDiet, selectedMealTime, effectiveQuery]);

  const getCartInfo = (item: BillingMenuItem, chosenVariant?: BillingItemVariant | null) => {
    const safeCart = Array.isArray(cartItems) ? cartItems : [];
    const matchingCartItems = safeCart.filter((ci) => {
      if (!ci || !ci.item) return false;
      if (ci.item.id !== item.id) return false;
      if (chosenVariant && ci.selectedVariant?.id !== chosenVariant.id) return false;
      return true;
    });
    const totalQty = matchingCartItems.reduce((sum, ci) => sum + ci.quantity, 0);
    const primaryCartItem = matchingCartItems[0];
    return {
      inCart: totalQty > 0,
      totalQty,
      cartId: primaryCartItem?.cartId,
    };
  };

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    onSearchChange?.("");
  };

  const handleAddClick = (item: BillingMenuItem) => {
    if (item.plates !== undefined && item.plates <= 0) {
      toast.error(`"${item.name}" is sold out (0 plates left).`);
      return;
    }
    const hasVariants = item.variants && item.variants.length > 0;
    const chosenVarId = selectedVariants[item.id] || (hasVariants ? item.variants![0].id : "");
    const chosenVariant = hasVariants
      ? item.variants!.find((v) => v.id === chosenVarId) || item.variants![0]
      : undefined;

    if (item.plates !== undefined) {
      const isHalf = (chosenVariant?.name || "").toLowerCase().includes("half");
      const plateCost = isHalf ? 0.5 : 1.0;
      if (plateCost > item.plates) {
        toast.error(`Not enough plate stock for "${item.name}" (only ${item.plates} plates available).`);
        return;
      }
    }
    onAddItem(item, chosenVariant);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-e1">
      {/* Toolbar */}
      <div className="shrink-0 space-y-2.5 border-b border-border/70 bg-linear-to-b from-surface-2/80 to-surface px-3 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary/70" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items by name or code..."
              value={effectiveQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-9 text-[12.5px] font-medium text-text-primary shadow-2xs placeholder:text-text-secondary/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {effectiveQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-surface p-0.5 shadow-2xs">
            {(
              [
                { id: "all" as const, label: "All", icon: false },
                { id: "veg" as const, label: "Veg", icon: true },
                { id: "non_veg" as const, label: "Non-Veg", icon: true },
              ] as const
            ).map((opt) => {
              const active = selectedDiet === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDiet(opt.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-bold transition cursor-pointer",
                    active && opt.id === "all" && "bg-slate-900 text-white shadow-xs",
                    active && opt.id === "veg" && "bg-emerald-700 text-white shadow-xs",
                    active && opt.id === "non_veg" && "bg-rose-700 text-white shadow-xs",
                    !active && "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                  )}
                >
                  {opt.icon ? <FoodTypeIcon type={opt.id === "veg" ? "veg" : "non_veg"} size="sm" /> : null}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal-Time Tabs: All, Breakfast, Lunch, Dinner */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-border shrink-0">
            {(["All", "Breakfast", "Lunch", "Dinner"] as const).map((meal) => {
              const active = selectedMealTime === meal;
              return (
                <button
                  key={meal}
                  type="button"
                  onClick={() => (onSelectMealTime ? onSelectMealTime(meal) : setInternalMealTime(meal))}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80",
                  )}
                >
                  <span>{meal}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories: rounded-lg border border-border (no circular corners) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {allCategories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer border",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-white text-black hover:bg-slate-100",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Excel Table Format for Dishes with Column Lines and Centered Data */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-2.5">
        <table className="w-full min-w-[520px] excel-format border-collapse border border-border text-center">
          <thead>
            <tr className="bg-slate-100/90 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <th className="py-2 px-3 border-r border-b border-border text-center">Dish</th>
              <th className="py-2 px-3 border-r border-b border-border text-center w-36">Portion</th>
              <th className="py-2 px-3 border-r border-b border-border text-center w-28">Price</th>
              <th className="py-2 px-3 border-b border-border text-center w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 border-b border-border">
                  <UtensilsCrossed className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700">No dishes found</p>
                  <p className="text-xs text-slate-500 mt-0.5">Try another search, meal time, or category</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const hasVariants = Boolean(item.variants && item.variants.length > 0);
                const chosenVarId =
                  selectedVariants[item.id] || (hasVariants ? item.variants![0].id : "");
                const chosenVariant = hasVariants
                  ? item.variants!.find((v) => v.id === chosenVarId) || item.variants![0]
                  : null;
                const displayPrice = chosenVariant ? chosenVariant.price : item.price;
                const { inCart, totalQty, cartId } = getCartInfo(item, chosenVariant);
                const hasImage = Boolean(item.imageUrl && !brokenImages[item.id]);

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50/80",
                      inCart && "bg-primary-tint/30",
                    )}
                  >
                    {/* Dish Name, Image, Diet & Code */}
                    <td className="py-2 px-3 border-r border-b border-border text-center">
                      <div className="flex items-center justify-center gap-2.5 max-w-sm mx-auto">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-2xs">
                          {hasImage ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                              <UtensilsCrossed className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <FoodTypeIcon type={item.diet} size="sm" />
                            <span className="truncate text-[12.5px] font-bold text-slate-900">
                              {item.name}
                            </span>
                            {item.plates !== undefined ? (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[10px] font-bold border",
                                  item.plates <= 0
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : item.plates <= 3
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-emerald-100 text-emerald-800 border-emerald-300",
                                )}
                              >
                                {item.plates} {item.plates === 1 ? "Plate" : "Plates"}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10.5px] text-slate-600">
                            {item.code}
                            {item.description ? ` · ${item.description}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Portion */}
                    <td className="py-2 px-3 border-r border-b border-border text-center">
                      <div className="flex items-center justify-center">
                        {hasVariants ? (
                          <div className="inline-flex items-center rounded-lg border border-border bg-slate-100 p-0.5">
                            {item.variants!.map((v) => {
                              const isSelected = v.id === chosenVarId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({ ...prev, [item.id]: v.id }))
                                  }
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10.5px] font-bold transition cursor-pointer",
                                    isSelected
                                      ? "bg-primary text-primary-foreground shadow-xs"
                                      : "text-slate-600 hover:text-slate-900",
                                  )}
                                >
                                  {v.name.split(" ")[0]}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="rounded border border-border bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            Standard
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3 border-r border-b border-border text-center font-bold text-[13px] text-slate-900">
                      ₹{displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Action */}
                    <td className="py-2 px-3 border-b border-border text-center">
                      <div className="flex items-center justify-center">
                        {inCart && cartId ? (
                          <div className="inline-flex h-7 items-center overflow-hidden rounded-lg border border-primary/40 bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQty(cartId, totalQty - 1)}
                              className="flex h-7 w-7 items-center justify-center text-primary hover:bg-primary-tint cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[1.25rem] text-center font-bold text-[12px] text-primary">
                              {totalQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.plates !== undefined) {
                                  const isHalf = (chosenVariant?.name || "").toLowerCase().includes("half");
                                  const nextPlates = (totalQty + 1) * (isHalf ? 0.5 : 1.0);
                                  if (nextPlates > item.plates) {
                                    toast.error(`Only ${item.plates} plates available for "${item.name}".`);
                                    return;
                                  }
                                }
                                onUpdateCartQty(cartId, totalQty + 1);
                              }}
                              className="flex h-7 w-7 items-center justify-center text-primary hover:bg-primary-tint cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : item.plates !== undefined && item.plates <= 0 ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[11px] font-bold border border-rose-600 bg-rose-50 text-rose-700 cursor-not-allowed select-none"
                          >
                            Sold Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddClick(item)}
                            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-teal-700 px-3 text-[11.5px] font-bold text-white hover:bg-teal-800 active:scale-98 transition cursor-pointer shadow-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
