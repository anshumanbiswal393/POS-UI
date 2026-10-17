import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Plus, Minus, UtensilsCrossed } from "lucide-react";
import type {
  BillingMenuItem,
  BillingDietType,
  BillingCartItem,
  BillingItemVariant,
} from "@/types/posBilling";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";
import { cn } from "@/lib/utils";

type BillingMenuCatalogProps = {
  items: BillingMenuItem[];
  cartItems: BillingCartItem[];
  onAddItem: (item: BillingMenuItem, selectedVariant?: BillingItemVariant) => void;
  onOpenModifierModal: (item: BillingMenuItem) => void;
  onUpdateCartQty: (cartId: string, newQty: number) => void;
  searchQuery: string;
  onSearchChange?: (query: string) => void;
};

export function BillingMenuCatalog({
  items,
  cartItems,
  onAddItem,
  onOpenModifierModal: _onOpenModifierModal,
  onUpdateCartQty,
  searchQuery,
  onSearchChange,
}: BillingMenuCatalogProps) {
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
    const fromItems = Array.from(
      new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c?.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All Items", ...fromItems];
  }, [items]);

  useEffect(() => {
    if (!allCategories.includes(selectedCategory)) {
      setSelectedCategory("All Items");
    }
  }, [allCategories, selectedCategory]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== "All Items" && item.category !== selectedCategory) return false;
      if (selectedDiet !== "all" && item.diet !== selectedDiet) return false;
      if (effectiveQuery.trim()) {
        const query = effectiveQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, selectedCategory, selectedDiet, effectiveQuery]);

  const getCartInfo = (item: BillingMenuItem, chosenVariant?: BillingItemVariant | null) => {
    const matchingCartItems = cartItems.filter((ci) => {
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
    const hasVariants = item.variants && item.variants.length > 0;
    const chosenVarId = selectedVariants[item.id] || (hasVariants ? item.variants![0].id : "");
    const chosenVariant = hasVariants
      ? item.variants!.find((v) => v.id === chosenVarId) || item.variants![0]
      : undefined;
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {allCategories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-e1"
                    : "border-border/80 bg-surface text-text-secondary hover:border-primary/40 hover:bg-primary-tint hover:text-primary",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Column labels */}
      <div className="hidden sm:grid shrink-0 grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_6rem] gap-2 border-b border-border/60 bg-surface-2/50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary/80">
        <span>Dish</span>
        <span className="text-center">Portion</span>
        <span className="text-right">Price</span>
        <span className="text-right">Action</span>
      </div>

      {/* Item list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-text-secondary/50">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-bold text-text-primary">No dishes found</p>
            <p className="text-[11.5px] text-text-secondary">Try another search or category</p>
          </div>
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
              <div
                key={item.id}
                className={cn(
                  "group grid grid-cols-1 items-center gap-2.5 rounded-xl border px-2.5 py-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_6rem] sm:gap-2 sm:px-3 sm:py-2 transition-all",
                  inCart
                    ? "border-primary/35 bg-primary-tint/70 shadow-2xs"
                    : "border-border/70 bg-surface hover:border-primary/25 hover:bg-surface-2/40",
                )}
              >
                {/* Dish */}
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-2 shadow-2xs">
                    {hasImage ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-2 to-border/40 text-text-secondary/45">
                        <UtensilsCrossed className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <FoodTypeIcon type={item.diet} size="sm" />
                      <span className="truncate text-[13px] font-bold tracking-tight text-text-primary">
                        {item.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-text-secondary">
                      {item.code}
                      {item.description ? (
                        <span className="font-sans text-text-secondary/80">
                          {" "}
                          · {item.description}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Portion */}
                <div className="flex justify-start sm:justify-center">
                  {hasVariants ? (
                    <div className="inline-flex items-center rounded-lg border border-border bg-surface-2/80 p-0.5">
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
                              "rounded-md px-2 py-1 text-[10.5px] font-bold transition cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-text-secondary hover:text-text-primary",
                            )}
                          >
                            {v.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="rounded-md border border-border/60 bg-surface-2/60 px-2 py-1 text-[10.5px] font-semibold text-text-secondary">
                      Standard
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="text-left font-mono text-[13px] font-extrabold tabular-nums text-text-primary sm:text-right">
                  ₹{displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>

                {/* Action */}
                <div className="flex justify-start sm:justify-end">
                  {inCart && cartId ? (
                    <div className="inline-flex h-8 items-center overflow-hidden rounded-lg border border-primary/30 bg-surface shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(cartId, totalQty - 1)}
                        className="flex h-8 w-8 items-center justify-center text-primary hover:bg-primary-tint cursor-pointer"
                        title="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center font-mono text-[12px] font-extrabold text-primary">
                        {totalQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(cartId, totalQty + 1)}
                        className="flex h-8 w-8 items-center justify-center text-primary hover:bg-primary-tint cursor-pointer"
                        title="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddClick(item)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-[11.5px] font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
