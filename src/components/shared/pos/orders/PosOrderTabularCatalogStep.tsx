import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ChefHat,
  PauseCircle,
  ArrowLeft,
  Percent,
  Tag,
  Barcode,
  Receipt,
} from "lucide-react";
import type { BillingMenuItem, BillingCategory } from "@/types/posBilling";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";
import { PaymentModal } from "../billing/PaymentModal";

export interface PosOrderCartItem {
  item: BillingMenuItem;
  quantity: number;
  selectedVariantName?: string;
  unitPrice: number;
  notes?: string;
}

interface PosOrderTabularCatalogStepProps {
  items?: BillingMenuItem[];
  // Title & Metadata shown on top of the bill
  billTitle: string;
  billSubtitle?: React.ReactNode;
  badgeText?: string;

  // Cart State & Mutators
  cart: Record<string, PosOrderCartItem>;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onAddItem: (
    item: BillingMenuItem,
    selectedVariant?: { id: string; name: string; price: number },
  ) => void;

  // Financial rates
  taxRate?: number; // e.g. 0.05 for 5% GST (default)
  serviceChargeRate?: number; // e.g. 0.05 for 5% Room Service Fee (default 0)

  // Navigation & Actions
  onBack?: () => void;
  onCancel: () => void;
  onHoldOrder: () => void;
  onSendToKOT: () => void;

  holdButtonText?: string;
  confirmButtonText?: string;
}

export function PosOrderTabularCatalogStep({
  items: propItems,
  billTitle,
  billSubtitle,
  badgeText,
  cart,
  onUpdateQty,
  onRemoveItem,
  onAddItem,
  taxRate = 0.05,
  serviceChargeRate = 0,
  onBack,
  onCancel,
  onHoldOrder,
  onSendToKOT,
  holdButtonText = "Hold Order",
  confirmButtonText = "Send to KOT",
}: PosOrderTabularCatalogStepProps) {
    const { activeOutlet } = useOutletContext();
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id);

  const catalogItems = useMemo<BillingMenuItem[]>(() => {
    if (propItems && propItems.length > 0) return propItems;
    return menuList
      .filter((item) => item.status === "Active" && item.baseMenu !== false)
      .map((item) => {
        const primaryImg =
          item.images?.find((img) => img.isPrimary)?.url || item.images?.[0]?.url;
        const diet: "veg" | "non_veg" | "egg" | "drinks" =
          item.itemType === "Veg"
            ? "veg"
            : item.itemType === "Egg"
              ? "egg"
              : item.category.toLowerCase().includes("bev") ||
                item.category.toLowerCase().includes("cocktail") ||
                item.category.toLowerCase().includes("vodka") ||
                item.category.toLowerCase().includes("whisky")
                ? "drinks"
                : "non_veg";

        return {
          id: item.id,
          code: item.code.startsWith("#") ? item.code : "#" + item.code,
          name: item.name,
          category: item.category as any,
          diet,
          price: item.price,
          inStock: true,
          prepTimeMinutes: 15,
          imageUrl: primaryImg,
          description: item.description,
          variants: item.variants && item.variants.length > 0 ? (item.variants as any) : undefined,
          modifierGroups: item.modifierGroups,
        };
      });
  }, [propItems, menuList]);

  const categories = useMemo(() => {
    const fromItems = Array.from(
      new Set(catalogItems.map((i) => i.category).filter((c): c is string => Boolean(c?.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All Items", ...fromItems];
  }, [catalogItems]);

  const [selectedCategory, setSelectedCategory] = useState<BillingCategory>("All Items");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal & Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "flat">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false);

  // Keyboard shortcut listener for '/' autofocus & barcode scanner listener
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

  // Track portion variant chosen per dish in the table view
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return catalogItems.filter((item) => {
      if (selectedCategory !== "All Items" && item.category !== selectedCategory) {
        return false;
      }
      if (dietFilter !== "all" && item.diet !== dietFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchCode) return false;
      }
      return true;
    });
  }, [catalogItems, selectedCategory, dietFilter, searchQuery]);

  // Barcode / Direct match handler on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredMenuItems.length === 1) {
      handleDishAddClick(filteredMenuItems[0]);
      setSearchQuery("");
    }
  };

  // Cart financial calculations
  const cartList = Object.values(cart);
  const totalItemCount = cartList.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cartList.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const discountAmount =
    discountType === "percent"
      ? (subtotal * discountValue) / 100
      : discountType === "flat"
        ? Math.min(discountValue, subtotal)
        : 0;

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const serviceCharge = serviceChargeRate > 0 ? +(taxableSubtotal * serviceChargeRate).toFixed(2) : 0;
  const tax = +(taxableSubtotal * taxRate).toFixed(2);
  const grandTotal = +(taxableSubtotal + serviceCharge + tax).toFixed(2);

  const handleDishAddClick = (item: BillingMenuItem) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const chosenVarId = selectedVariants[item.id] || (hasVariants ? item.variants![0].id : "");
    const chosenVariant = hasVariants
      ? item.variants!.find((v) => v.id === chosenVarId) || item.variants![0]
      : undefined;

    onAddItem(item, chosenVariant);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-border bg-surface space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Fast Search Bar with '/' hotkey badge & Barcode scan listener */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes or scan barcode... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-14 py-2 text-xs text-[#000000] dark:text-white bg-surface border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium placeholder:text-[#64748b] shadow-xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-surface-2 rounded border border-border">
                  <Barcode className="w-3 h-3 text-slate-400 inline mr-0.5" />/
                </span>
              )}
            </div>
          </div>

          {/* Diet filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setDietFilter("all")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                dietFilter === "all" ? "bg-surface text-black dark:text-white shadow-xs font-bold" : "text-slate-600 hover:text-black"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDietFilter("veg")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                dietFilter === "veg"
                  ? "bg-emerald-700 text-white shadow-xs font-bold"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <FoodTypeIcon type="veg" size="sm" />
              Veg
            </button>
            <button
              type="button"
              onClick={() => setDietFilter("non_veg")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                dietFilter === "non_veg"
                  ? "bg-rose-700 text-white shadow-xs font-bold"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <FoodTypeIcon type="non_veg" size="sm" />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Brand Rose Accents) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "bg-surface-2 text-slate-700 hover:bg-primary-tint hover:text-primary border border-border/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Split: 65%-70% Catalog Grid & Search (Left 8 cols) + Fixed/35% Bill Panel (Right 4 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-background">
        {/* Left Column: Product Grid & Search */}
        <div className="lg:col-span-8 overflow-y-auto p-3.5 border-r border-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-text-secondary font-bold uppercase text-[10.5px]">
                <th className="py-2.5 px-3">Dish Name</th>
                <th className="py-2.5 px-2 text-center">Portion / Size</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenuItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-text-secondary">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No dishes found in menu</p>
                    <p className="text-xs text-slate-400 mt-1">Add items to this outlet's Food Menu to take orders.</p>
                  </td>
                </tr>
              ) : (
                filteredMenuItems.map((item) => {
                const hasVariants = item.variants && item.variants.length > 0;
                const chosenVarId =
                  selectedVariants[item.id] || (hasVariants ? item.variants![0].id : "");
                const chosenVariant = hasVariants
                  ? item.variants!.find((v) => v.id === chosenVarId) || item.variants![0]
                  : null;
                const displayPrice = chosenVariant ? chosenVariant.price : item.price;

                // Check if in cart
                const cartKey = chosenVariant ? `${item.id}-${chosenVariant.id}` : item.id;
                const inCart = cart[cartKey];

                return (
                  <tr key={item.id} className="hover:bg-surface-2/60 transition-colors">
                    {/* Dish Name with unified FoodTypeIcon */}
                    <td className="py-2.5 px-3 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <FoodTypeIcon type={item.diet} size="sm" />
                        <span className="truncate max-w-[200px] sm:max-w-[260px] font-bold">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({item.code})</span>
                      </div>
                    </td>

                    {/* Portion / Size (Half / Full or Standard) */}
                    <td className="py-2.5 px-2 text-center">
                      {hasVariants ? (
                        <div className="inline-flex items-center p-0.5 bg-surface-2 rounded-lg border border-border">
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
                                    : "text-slate-600 hover:text-black"
                                }`}
                              >
                                {v.name.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 font-medium">Standard</span>
                      )}
                    </td>

                    {/* Price in JetBrains Mono */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary text-[13px]">
                      ₹{displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3 text-right">
                      {inCart ? (
                        <div className="inline-flex items-center border border-primary/30 rounded-lg overflow-hidden bg-primary-tint">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(cartKey, -1)}
                            className="h-7 w-7 flex items-center justify-center text-primary hover:bg-primary/10 active:scale-[0.98] transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-primary">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(cartKey, 1)}
                            className="h-7 w-7 flex items-center justify-center text-primary hover:bg-primary/10 active:scale-[0.98] transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDishAddClick(item)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-pressed text-primary-foreground shadow-e1 active:scale-[0.98] transition-all cursor-pointer min-h-[34px]"
                        >
                          + Add
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

        {/* Right Column: Cart & Order Ticket Panel (Fixed 380px feel) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-3.5 bg-surface-2/40 overflow-y-auto min-w-[340px]">
          <div>
            <div className="p-3 bg-surface rounded-xl border border-border shadow-e1 mb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-text-primary">{billTitle}</span>
                {badgeText && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-tint text-primary border border-primary/20">
                    {badgeText}
                  </span>
                )}
              </div>
              {billSubtitle && <div className="text-[11px] text-text-secondary mt-1">{billSubtitle}</div>}
            </div>

            {/* Cart Items List */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-e1">
              <div className="p-2.5 border-b border-border bg-surface-2/80 font-bold text-[11px] text-text-primary flex items-center justify-between">
                <span>Ordered Dishes ({totalItemCount})</span>
                <span>Amount</span>
              </div>

              {cartList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Utensils className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-primary" />
                  <span className="font-semibold">No dishes added yet.</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Click "+ Add" from the menu to populate ticket.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {Object.entries(cart).map(([key, c]) => (
                    <div
                      key={key}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-surface-2/50"
                    >
                      <div className="flex-1 mr-2 min-w-0">
                        <div className="font-bold text-text-primary truncate">{c.item.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {c.selectedVariantName || "Standard"} • ₹{c.unitPrice} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(key, -1)}
                            className="h-6 w-6 flex items-center justify-center text-slate-600 hover:bg-surface-2 active:scale-[0.98] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 font-mono text-xs font-bold">{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(key, 1)}
                            className="h-6 w-6 flex items-center justify-center text-slate-600 hover:bg-surface-2 active:scale-[0.98] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-16 text-right font-mono font-bold text-text-primary">
                          ₹{(c.unitPrice * c.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(key)}
                          className="text-slate-300 hover:text-error p-0.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Footer: Discount Popover, Tax Breakdown & Monospace Grand Total */}
          <div className="mt-3 p-3.5 bg-surface rounded-xl border border-border shadow-e1 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Discount Row & Trigger */}
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1">
                <span>Discount:</span>
                <button
                  type="button"
                  onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {discountType === "none" ? "+ Add Discount" : `${discountType === "percent" ? `${discountValue}%` : `₹${discountValue}`}`}
                </button>
              </div>
              <span className="font-mono font-semibold text-emerald-600">
                {discountAmount > 0
                  ? `-₹${discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "₹0.00"}
              </span>
            </div>

            {/* Discount Selector Dropdown */}
            {isDiscountOpen && (
              <div className="p-2 bg-surface-2 rounded-lg border border-border space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percent");
                      setDiscountValue(10);
                    }}
                    className={`flex-1 py-1 rounded font-bold text-center border cursor-pointer ${
                      discountType === "percent"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface text-slate-700 border-border"
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("flat");
                      setDiscountValue(100);
                    }}
                    className={`flex-1 py-1 rounded font-bold text-center border cursor-pointer ${
                      discountType === "flat"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface text-slate-700 border-border"
                    }`}
                  >
                    ₹ Flat Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("none");
                      setDiscountValue(0);
                      setIsDiscountOpen(false);
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-error cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                {discountType !== "none" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold bg-surface border border-input rounded"
                      placeholder="Discount value"
                    />
                  </div>
                )}
              </div>
            )}

            {serviceChargeRate > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Room Service Fee ({Math.round(serviceChargeRate * 100)}%):</span>
                <span className="font-mono">
                  ₹{serviceCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>GST ({Math.round(taxRate * 100)}%):</span>
              <span className="font-mono font-semibold">
                ₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Monospace Grand Total */}
            <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-sm text-text-primary">
              <span className="text-[13px] font-bold">Grand Total:</span>
              <span className="font-mono text-primary text-[22px] font-bold">
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-2 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-bold text-error hover:bg-error-tint rounded-xl transition cursor-pointer"
          >
            Cancel Order
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onHoldOrder}
            disabled={cartList.length === 0}
            className="px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-surface-2 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <PauseCircle className="w-4 h-4 text-warning" />
            <span>{holdButtonText}</span>
          </button>
          <button
            type="button"
            onClick={onSendToKOT}
            disabled={cartList.length === 0}
            className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-surface-2 hover:bg-slate-200 border border-border rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <ChefHat className="w-4 h-4 text-primary" />
            <span>Send KOT</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPaymentOpen(true)}
            disabled={cartList.length === 0}
            className="px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-pressed active:scale-[0.98] disabled:opacity-50 rounded-xl shadow-e1 transition cursor-pointer flex items-center gap-1.5 min-h-[38px]"
          >
            <Receipt className="w-4 h-4" />
            <span>Pay & Settle</span>
          </button>
        </div>
      </div>

      {/* Payment & Settlement Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        discount={discountAmount}
        taxes={tax + serviceCharge}
        grandTotal={grandTotal}
        onPaymentComplete={(_payments) => {
          setIsPaymentOpen(false);
          onSendToKOT();
        }}
      />
    </div>
  );
}

export default PosOrderTabularCatalogStep;
