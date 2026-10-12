import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  Sparkles,
  Barcode,
  UtensilsCrossed,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";
import type {
  BillingMenuItem,
  BillingCategory,
  BillingDietType,
  BillingCartItem,
  BillingItemVariant,
} from "@/types/posBilling";
import { BILLING_CATEGORIES } from "./mockBillingData";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";

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
  onOpenModifierModal,
  onUpdateCartQty,
  searchQuery,
  onSearchChange,
}: BillingMenuCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Items");
  const [selectedDiet, setSelectedDiet] = useState<BillingDietType>("all");
  const [localSearch, setLocalSearch] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track portion variant selection per item
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Image load error fallback tracker
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Active query is either parent searchQuery or localSearch
  const effectiveQuery = searchQuery || localSearch;

  // Autofocus search on pressing '/' hotkey
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

  // Compute all available categories from items + standard categories
  const allCategories = useMemo(() => {
    const customCats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
    const combined = ["All Items", ...BILLING_CATEGORIES.filter((c) => c !== "All Items")];
    for (const cat of customCats) {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    }
    return combined;
  }, [items]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== "All Items" && item.category !== selectedCategory) {
        return false;
      }

      // Diet filter
      if (selectedDiet !== "all" && item.diet !== selectedDiet) {
        return false;
      }

      // Search query
      if (effectiveQuery.trim()) {
        const query = effectiveQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesCategory;
      }

      return true;
    });
  }, [items, selectedCategory, selectedDiet, effectiveQuery]);

  // Helper to find matching cart item
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
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    if (onSearchChange) {
      onSearchChange("");
    }
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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* 1. Top Search & Diet Filter Toolbar (Image 1 style) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/60 space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Fast Search Bar with '/' hotkey badge & Barcode scan listener */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes or scan barcode... (Press '/' to focus)"
              value={effectiveQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-9 pr-14 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium placeholder:text-slate-400 shadow-2xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {effectiveQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                  <Barcode className="w-3 h-3 text-slate-400 inline mr-0.5" />/
                </span>
              )}
            </div>
          </div>

          {/* Diet Filters: All, Veg, Non-Veg */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedDiet("all")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedDiet === "all"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiet("veg")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedDiet === "veg"
                  ? "bg-emerald-700 text-white shadow-xs font-bold"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <FoodTypeIcon type="veg" size="sm" />
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiet("non_veg")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedDiet === "non_veg"
                  ? "bg-rose-700 text-white shadow-xs font-bold"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <FoodTypeIcon type="non_veg" size="sm" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* 2. Category Filter Pills (Image 1 style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {allCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                    : "bg-white text-slate-700 border-slate-200/80 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Row-Wise Dish Table (Image 1 Layout with Dish Picture) */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Dish Name</th>
              <th className="py-2.5 px-2 text-center">Portion / Size</th>
              <th className="py-2.5 px-3.5 text-right">Price</th>
              <th className="py-2.5 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No dishes found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Adjust your search or category filters to find dishes.
                    </p>
                  </div>
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
                    className={`transition-colors hover:bg-slate-50/80 ${
                      inCart ? "bg-teal-50/20" : ""
                    }`}
                  >
                    {/* Dish Column: Picture of Dish in place of serial number + Diet icon + Name */}
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {/* Picture of that dish in place of serial number */}
                        <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                          {hasImage ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                              }
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-slate-400">
                              <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Veg / Non-veg dot & Name */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FoodTypeIcon type={item.diet} size="sm" />
                            <span className="truncate max-w-[220px] sm:max-w-[300px] font-bold text-slate-900 text-[12.5px]">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-mono">
                            <span>{item.code}</span>
                            {item.description && (
                              <span className="truncate max-w-[180px] text-slate-500 font-sans hidden sm:inline">
                                · {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Portion / Size (Half / Full or Standard) */}
                    <td className="py-2.5 px-2 text-center">
                      {hasVariants ? (
                        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          {item.variants!.map((v) => {
                            const isSelected = v.id === chosenVarId;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [item.id]: v.id,
                                  }))
                                }
                                className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {v.name.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Standard</span>
                      )}
                    </td>

                    {/* Price in INR Bold font-mono */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 text-[13px]">
                      ₹{displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Action Button: + Add or Quantity controls */}
                    <td className="py-2.5 px-3.5 text-right">
                      {inCart && cartId ? (
                        <div className="inline-flex items-center border border-primary/30 rounded-lg overflow-hidden bg-primary/10">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(cartId, totalQty - 1)}
                            className="h-7 w-7 flex items-center justify-center text-primary hover:bg-primary/20 active:scale-95 transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-primary">
                            {totalQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(cartId, totalQty + 1)}
                            className="h-7 w-7 flex items-center justify-center text-primary hover:bg-primary/20 active:scale-95 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddClick(item)}
                          className="inline-flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
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
