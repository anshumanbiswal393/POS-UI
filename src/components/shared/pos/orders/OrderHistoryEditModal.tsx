import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  ShoppingBag,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { livePatchOrder } from "@/services/posOrderLive";
import type { AllOrderItem } from "@/types/posOrders";

interface CartItem {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariantName?: string;
  notes?: string;
  isInitial?: boolean;
}

interface OrderHistoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: (AllOrderItem & { tableNo?: string; customerPhone?: string }) | null;
  onOrderUpdated?: () => void;
}

export function OrderHistoryEditModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}: OrderHistoryEditModalProps) {
  const { activeOutlet } = useOutletContext();
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id);

  const [activeCategory, setActiveCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Parse existing items from order
  useEffect(() => {
    if (!isOpen || !order) {
      setCartItems([]);
      setShowConfirmPopup(false);
      return;
    }

    if (Array.isArray(order.items) && order.items.length > 0) {
      setCartItems(
        order.items.map((it: any, idx) => ({
          id: it.id || `item-${idx}`,
          menuItemId: it.menuItemId || it.menu_item_id || it.id,
          name: it.name || it.item_name || "Item",
          quantity: Number(it.quantity || 1),
          price: Number(it.price || it.unitPrice || it.unit_price || 0),
          selectedVariantName: it.selectedVariantName || it.variant_name || it.variantName,
          notes: it.notes || "",
          isInitial: true,
        }))
      );
    } else if (order.itemsSummary) {
      // Fallback: parse itemsSummary string
      const parts = order.itemsSummary.split(",").map((s) => s.trim()).filter(Boolean);
      const parsed: CartItem[] = parts.map((part, idx) => {
        let name = part;
        let qty = 1;

        const leadMatch = part.match(/^(\d+(?:\.\d+)?)\s*[xX*×]\s*(.+)$/);
        if (leadMatch) {
          qty = parseFloat(leadMatch[1]) || 1;
          name = leadMatch[2].trim();
        } else {
          const trailMatch = part.match(/^(.+?)\s*[xX*×]\s*(\d+(?:\.\d+)?)$/);
          if (trailMatch) {
            name = trailMatch[1].trim();
            qty = parseFloat(trailMatch[2]) || 1;
          }
        }

        // Try to match with menuCatalog item price
        const matchedMenu = menuList.find((m) => m.name.toLowerCase() === name.toLowerCase());
        const price = matchedMenu ? Number(matchedMenu.price) : 0;

        return {
          id: `summary-${idx}`,
          name,
          quantity: qty,
          price,
          isInitial: true,
        };
      });

      setCartItems(parsed);
    } else {
      setCartItems([]);
    }
  }, [isOpen, order, menuList]);

  const menuCatalog = useMemo(() => {
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
      new Set(menuCatalog.map((i) => i.category).filter((c): c is string => Boolean(c?.trim())))
    ).sort((a, b) => a.localeCompare(b));
    return ["All Items", ...fromItems];
  }, [menuCatalog]);

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

  const handleAddItemToCart = (item: any, variant?: { name: string; price: number }) => {
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
          menuItemId: item.id,
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

  const handleSaveConfirmed = async () => {
    if (!order) return;
    if (cartItems.length === 0) {
      toast.error("Order cannot be empty. Please keep at least one dish or cancel.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = cartItems.map((c) => ({
        id: c.id,
        menuItemId: c.menuItemId || c.id,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        unitPrice: c.price,
        selectedVariantName: c.selectedVariantName,
        notes: c.notes,
      }));

      const summaryText = cartItems.map((i) => `${i.name} × ${i.quantity}`).join(", ");

      await livePatchOrder(order.id, {
        outletId: activeOutlet?.id,
        items: formattedItems,
        subtotal,
        grandTotal,
        sendKot: true,
        orderNote: summaryText,
      });

      toast.success(`Order #${order.orderNo} updated successfully!`, {
        description: `Items recalculated. Grand Total: ₹${grandTotal.toLocaleString("en-IN")}`,
      });

      setShowConfirmPopup(false);
      onClose();
      if (onOrderUpdated) {
        onOrderUpdated();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.order || err?.response?.data?.detail || err?.message || "Failed to update order";
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-3 sm:p-5 animate-in fade-in">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white font-bold text-sm shadow-xs">
              #{order.orderNo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-black text-slate-900 leading-none">
                  Edit Order #{order.orderNo}
                </h2>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 border border-emerald-200">
                  {order.status}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700">
                  {order.orderTypeDisplay || "Dine-In"}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-1">
                Modify dish quantities or add new items. Customer details are locked.
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

        {/* Locked Details Bar (Immutable Info) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/70 border-b border-slate-200 px-5 py-2.5 text-[11.5px] shrink-0">
          <div>
            <span className="text-slate-500 block text-[10.5px]">Guest Name (Locked)</span>
            <span className="font-bold text-slate-800 truncate block">{order.customerName || "Walk-in Guest"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10.5px]">Mobile Number (Locked)</span>
            <span className="font-semibold text-slate-700 font-mono block">{order.customerPhone || "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10.5px]">Table / Room</span>
            <span className="font-bold text-slate-800 block">
              {order.tableNo ? (order.tableNo.toLowerCase().startsWith("table") ? order.tableNo : `Table ${order.tableNo}`) : "Counter"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10.5px]">Pax Count</span>
            <span className="font-bold text-slate-800 block">{order.pax || 1} Guests</span>
          </div>
        </div>

        {/* Modal Body: Left Menu Catalog | Right Order Items */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Menu Catalog */}
          <div className="flex flex-1 flex-col border-r border-slate-200 bg-white">
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes to add..."
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      activeCategory === cat
                        ? "bg-teal-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {filteredMenuItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <p className="text-[13px] font-medium">No dishes found</p>
                  <p className="text-[11px]">Try a different search term or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            />
                            <h4 className="text-[12.5px] font-bold text-slate-900 truncate">
                              {item.name}
                            </h4>
                          </div>
                          {item.description && (
                            <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[12.5px] font-bold text-slate-900 shrink-0 font-mono">
                          ₹{item.price}
                        </span>
                      </div>

                      {/* Add Button / Variants */}
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-end">
                        {item.hasVariants && item.variants && item.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map((v) => (
                              <button
                                key={v.name}
                                type="button"
                                onClick={() => handleAddItemToCart(item, v)}
                                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-800 transition cursor-pointer"
                              >
                                + {v.name} (₹{v.price})
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddItemToCart(item)}
                            className="flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-teal-800 transition cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Dish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart / Order Items */}
          <div className="flex w-96 flex-col bg-slate-50/70 border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white">
              <div>
                <h3 className="text-[13.5px] font-bold text-slate-900">Order Items</h3>
                <span className="text-[11px] text-slate-500">
                  {cartItems.reduce((sum, c) => sum + c.quantity, 0)} total items
                </span>
              </div>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                Live Edit
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-[12px]">All dishes removed.</p>
                  <p className="text-[11px]">Select items from the catalog on the left.</p>
                </div>
              ) : (
                cartItems.map((cartItem) => (
                  <div
                    key={cartItem.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-slate-300 transition"
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
                        <span className="font-bold text-slate-900 font-mono">
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
                      <span className="w-5 text-center text-[12px] font-bold text-slate-900 font-mono">
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
            <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5 shrink-0">
              <div className="space-y-1 text-[11.5px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (5% GST)</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{gstTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[13.5px] font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-[15px] font-bold text-teal-800">
                    ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmPopup(true)}
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-[12.5px] font-bold text-white hover:bg-teal-800 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 text-[11.5px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup Modal */}
      {showConfirmPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                  Confirm Order Modification
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Order #{order.orderNo}
                </p>
              </div>
            </div>

            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              Are you sure you want to update the items for this order? Revised dishes will be updated in the system and new items will generate an updated KOT.
            </p>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-[12px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Updated Items Count:</span>
                <span className="font-bold text-slate-800">
                  {cartItems.reduce((sum, c) => sum + c.quantity, 0)} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New Grand Total:</span>
                <span className="font-bold text-teal-800 font-mono">
                  ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmPopup(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={handleSaveConfirmed}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-[12px] font-bold text-white hover:bg-teal-800 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Yes, Confirm Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistoryEditModal;
