import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ChefHat,
  Receipt,
  Sparkles,
  ShoppingBag,
  Check,
  AlertCircle,
  Tag,
} from "lucide-react";
import type { RestaurantTable } from "@/types/posTables";
import { toast } from "sonner";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";

// Rich Mock Menu Catalog (matching TableOrderWizardModal catalog)
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  isSpicy?: boolean;
  description: string;
  hasVariants?: boolean;
  variants?: Array<{ name: string; price: number }>;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariantName?: string;
  notes?: string;
  isInitial?: boolean;
}

interface TableOrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable | null;
  onSaveUpdatedOrder: (data: {
    tableId: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      selectedVariantName?: string;
      notes?: string;
    }>;
    subtotal: number;
    grandTotal: number;
    modifiedSummaryText: string;
  }) => void;
}

export function TableOrderEditModal({
  isOpen,
  onClose,
  table,
  onSaveUpdatedOrder,
}: TableOrderEditModalProps) {
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { activeOutlet } = useOutletContext();
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id);

  const menuCatalog = useMemo<MenuItem[]>(() => {
    return menuList
      .filter((item) => item.status === "Active" && item.baseMenu !== false)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || "General",
        price: item.price,
        isVeg: item.itemType === "Veg",
        description: item.description || "",
        hasVariants: Boolean(item.variants && item.variants.length > 0),
        variants: item.variants?.map((v) => ({ name: v.name, price: v.price })),
      }));
  }, [menuList]);

  const categories = useMemo(() => {
    const fromItems = Array.from(
      new Set(menuCatalog.map((i) => i.category).filter((c): c is string => Boolean(c?.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All Items", ...fromItems];
  }, [menuCatalog]);


  // Initialize cart from existing active table order
  useEffect(() => {
    if (!isOpen || !table?.activeOrder) {
      setCartItems([]);
      return;
    }

    if (table.activeOrder.items && table.activeOrder.items.length > 0) {
      setCartItems(
        table.activeOrder.items.map((it) => ({
          ...it,
          isInitial: true,
        }))
      );
    } else {
      // Fallback if only itemsCount or total amount exists
      setCartItems([
        {
          id: "m-6",
          name: "Butter Chicken (Half)",
          quantity: 1,
          price: 290,
          isInitial: true,
        },
        {
          id: "m-11",
          name: "Butter Naan",
          quantity: 2,
          price: 60,
          isInitial: true,
        },
      ]);
    }
  }, [isOpen, table]);

  const filteredMenuItems = useMemo(() => {
    return menuCatalog.filter((item) => {
      if (activeCategory !== "All Items" && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuCatalog, activeCategory, searchQuery]);

  const handleAddItemToCart = (item: MenuItem, variant?: { name: string; price: number }) => {
    const itemKey = variant ? `${item.id}-${variant.name}` : item.id;
    const itemPrice = variant ? variant.price : item.price;
    const itemName = variant ? `${item.name} (${variant.name})` : item.name;

    setCartItems((prev) => {
      const exists = prev.find((c) => c.id === itemKey);
      if (exists) {
        return prev.map((c) => (c.id === itemKey ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: itemKey,
          name: itemName,
          price: itemPrice,
          quantity: 1,
          selectedVariantName: variant?.name,
          isInitial: false,
        },
      ];
    });

    toast.success(`Added ${itemName}`, { duration: 1500 });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) => {
          if (c.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((c) => c.id !== itemId));
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }, [cartItems]);

  const gstTax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const grandTotal = subtotal + gstTax;

  const handleSaveAndSendKot = () => {
    if (!table) return;
    if (cartItems.length === 0) {
      toast.error("Order cannot be empty. Add at least one item or cancel.");
      return;
    }

    const modifiedSummaryText = cartItems
      .map((i) => `${i.name} × ${i.quantity}`)
      .join(", ");

    onSaveUpdatedOrder({
      tableId: table.id,
      items: cartItems.map((c) => ({
        id: c.id,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        selectedVariantName: c.selectedVariantName,
        notes: c.notes,
      })),
      subtotal,
      grandTotal,
      modifiedSummaryText,
    });

    toast.success(`Order Updated for ${table.tableNumber}!`, {
      description: `New modified KOT sent to Kitchen and Bill recalculated to ₹${grandTotal.toLocaleString()}`,
    });

    onClose();
  };

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 sm:p-5 animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white font-bold text-sm shadow-xs">
              {table.tableNumberRaw}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-black text-slate-900 leading-none">
                  Edit Running Order: {table.tableNumber}
                </h2>
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10.5px] font-bold text-orange-800 border border-orange-200">
                  {table.activeOrder?.orderNumber || "Active Table Order"}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Frontdesk Order Modification · Add/Remove items & send updated KOT to Kitchen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Left Catalog + Right Cart */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Menu Catalog */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50/40 overflow-hidden">
            {/* Search & Category Pills */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, starters, drinks, desserts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-[12.5px] font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-lg px-3 py-1 text-[11.5px] font-bold whitespace-nowrap transition cursor-pointer border ${
                      activeCategory === cat
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-teal-400 hover:shadow-xs transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                      </div>
                      <span className="font-mono text-[13px] font-bold text-primary shrink-0">
                        ₹{item.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Add action / Variants */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>

                    {item.hasVariants && item.variants ? (
                      <div className="flex items-center gap-1">
                        {item.variants.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => handleAddItemToCart(item, v)}
                            className="rounded-md border border-primary/30 bg-primary-tint px-2 py-1 text-[10.5px] font-bold text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                          >
                            + {v.name} (<span className="font-mono">₹{v.price.toLocaleString()}</span>)
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddItemToCart(item)}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary-pressed active:scale-95 transition cursor-pointer shadow-e1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Dish</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Current Active Order & Bill Modification Panel */}
          <div className="w-80 sm:w-96 flex flex-col bg-white overflow-hidden">
            {/* Order Header Summary */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5 text-teal-700" />
                  Table Order Details
                </span>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-black text-teal-900">
                  {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} items
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Server: <strong className="text-slate-700">{table.activeOrder?.serverName || "Captain"}</strong> · Guest: <strong className="text-slate-700">{table.activeOrder?.guestName || "Walk-in"}</strong>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-[12px]">All dishes removed. Add items from catalog.</p>
                </div>
              ) : (
                cartItems.map((cartItem) => (
                  <div
                    key={cartItem.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-slate-900 truncate">
                          {cartItem.name}
                        </span>
                        {!cartItem.isInitial && (
                          <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        ₹{cartItem.price} × {cartItem.quantity} ={" "}
                        <span className="font-bold text-slate-900">
                          ₹{cartItem.price * cartItem.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Adjustment Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(cartItem.id, -1)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-200 transition cursor-pointer shadow-2xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-[12px] font-bold text-slate-900">
                        {cartItem.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(cartItem.id, 1)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-200 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(cartItem.id)}
                      className="ml-1.5 p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary & Save Action */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-2.5">
              <div className="space-y-1 text-[11.5px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%)</span>
                  <span className="font-mono font-semibold text-slate-800">₹{gstTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13.5px] font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Updated Total</span>
                  <span className="font-mono text-[15px] font-bold text-primary">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndSendKot}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[12.5px] font-bold text-primary-foreground hover:bg-primary-pressed active:scale-[0.98] transition cursor-pointer shadow-e1"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Update Order & Dispatch KOT</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-border bg-surface py-2 text-[11.5px] font-bold text-black dark:text-white hover:bg-surface-2 transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableOrderEditModal;
