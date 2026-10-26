import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Utensils,
  Plus,
  Minus,
  Check,
  Coffee,
  Wine,
  Cake,
  Pizza,
  Sparkles,
  Receipt,
} from "lucide-react";
import type { RoomServiceOrder, RoomOrderItem } from "@/types/posRoomService";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";

interface AddItemsToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RoomServiceOrder | null;
  onConfirmAddItems: (orderId: string, newItems: RoomOrderItem[]) => void;
}

export function AddItemsToOrderModal({
  isOpen,
  onClose,
  order,
  onConfirmAddItems,
}: AddItemsToOrderModalProps) {
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: number }>({});
  const [specialNote, setSpecialNote] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  if (!order) return null;

    const { activeOutlet } = useOutletContext();
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id);

  const availableItems = React.useMemo(() => {
    return menuList
      .filter((item) => item.status === "Active" && item.baseMenu !== false)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category || "General",
      }));
  }, [menuList]);

  const categories = React.useMemo(() => {
    const fromItems = Array.from(
      new Set(availableItems.map((i) => i.category).filter((c): c is string => Boolean(c?.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All", ...fromItems];
  }, [availableItems]);


  const handleAddItem = (id: string) => {
    setSelectedItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[id] > 1) {
        copy[id] -= 1;
      } else {
        delete copy[id];
      }
      return copy;
    });
  };

  const filteredItems = availableItems.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category === activeCategory;
  });

  // Calculate incremental costs
  let addedSubtotal = 0;
  const newItemsList: RoomOrderItem[] = [];

  Object.entries(selectedItems).forEach(([id, qty]) => {
    const item = availableItems.find((m) => m.id === id);
    if (item && qty > 0) {
      addedSubtotal += item.price * qty;
      newItemsList.push({
        id: `sup-${id}-${Date.now()}`,
        name: item.name,
        quantity: qty,
        unitPrice: item.price,
        specialInstructions: specialNote || undefined,
      });
    }
  });

  const addedServiceCharge = +(addedSubtotal * 0.15).toFixed(2);
  const addedTax = +(addedSubtotal * 0.08).toFixed(2);
  const addedTotal = +(addedSubtotal + addedServiceCharge + addedTax).toFixed(2);
  const projectedTotal = +(order.totalAmount + addedTotal).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemsList.length === 0) return;

    onConfirmAddItems(order.id, newItemsList);
    setSelectedItems({});
    setSpecialNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 max-h-[90vh] flex flex-col z-50">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white font-bold text-sm shadow-xs">
              {order.roomNumber}
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
                Add Items to Room {order.roomNumber} Order
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Supplementary KOT for {order.guest.name} ({order.orderNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2">
          {/* Category Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            {filteredItems.map((item) => {
              const qty = selectedItems[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    qty > 0
                      ? "bg-primary/10 border-primary/50 text-foreground shadow-xs"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="font-semibold block truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {qty > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-slate-600" />
                      </button>
                    )}
                    {qty > 0 && <span className="w-4 text-center font-bold text-xs">{qty}</span>}
                    <button
                      type="button"
                      onClick={() => handleAddItem(item.id)}
                      className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-pressed transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kitchen notes for this addition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplementary Preparation Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Bring extra wine glasses, deliver immediately with dessert spoons"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Cost update preview */}
          <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span>Existing Order Total:</span>
              <span className="font-mono font-semibold">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-primary font-medium">
              <span>Additional Items (+15% Service + 8% Tax):</span>
              <span className="font-mono font-bold">+${addedTotal.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-primary/20 flex items-center justify-between">
              <span className="font-bold text-slate-900">New Room Folio Total:</span>
              <span className="font-bold text-primary text-sm font-mono">
                ${projectedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={newItemsList.length === 0}
              className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-pressed disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Add to Room Ticket & Fire KOT
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
