import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BedDouble,
  Users,
  Plus,
  Minus,
  Check,
  Building2,
  Utensils,
  Clock,
  Sparkles,
} from "lucide-react";
import type { HotelRoom, RoomServiceOrder, RoomOrderItem } from "@/types/posRoomService";

interface NewRoomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: HotelRoom[];
  preselectedRoomNumber?: string;
  onCreateOrder: (
    newOrderData: Omit<RoomServiceOrder, "id" | "createdAt" | "elapsedMinutes">,
  ) => void;
}

const MENU_ITEMS = [
  { id: "m1", name: "Club Sandwich with Sweet Potato Fries", price: 19.5, category: "Mains" },
  { id: "m2", name: "Prime Angus Ribeye Steak (Medium Rare)", price: 48.0, category: "Mains" },
  { id: "m3", name: "Wild Mushroom Risotto with Truffle Oil", price: 28.0, category: "Mains" },
  { id: "m4", name: "Classic Margherita Pizza", price: 17.0, category: "Mains" },
  { id: "m5", name: "Artisan Burrata Salad", price: 18.5, category: "Starters" },
  { id: "m6", name: "Warm Chocolate Lava Cake", price: 12.0, category: "Desserts" },
  { id: "m7", name: "Cold Pressed Fresh Orange Juice", price: 7.5, category: "Beverages" },
  { id: "m8", name: "Double Espresso", price: 5.5, category: "Beverages" },
  { id: "m9", name: "Château Margaux Red Wine (Bottle)", price: 95.0, category: "Wine & Bar" },
];

export function NewRoomOrderModal({
  isOpen,
  onClose,
  rooms,
  preselectedRoomNumber,
  onCreateOrder,
}: NewRoomOrderModalProps) {
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(preselectedRoomNumber || "");
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: number }>({
    m1: 1,
    m7: 1,
  });
  const [traySetup, setTraySetup] = useState<RoomServiceOrder["traySetup"]>("Single Tray");
  const [paymentMethod, setPaymentMethod] =
    useState<RoomServiceOrder["paymentMethod"]>("room_folio");
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState("");

  const occupiedRooms = rooms.filter((r) => r.isOccupied);

  useEffect(() => {
    if (preselectedRoomNumber) {
      setSelectedRoomNumber(preselectedRoomNumber);
    } else if (occupiedRooms.length > 0) {
      setSelectedRoomNumber(occupiedRooms[0].roomNumber);
    }
  }, [preselectedRoomNumber, rooms, isOpen]);

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

  // Calculate totals
  let subtotal = 0;
  const orderItems: RoomOrderItem[] = [];
  Object.entries(selectedItems).forEach(([id, qty]) => {
    const item = MENU_ITEMS.find((m) => m.id === id);
    if (item && qty > 0) {
      subtotal += item.price * qty;
      orderItems.push({
        id: `item-${id}`,
        name: item.name,
        quantity: qty,
        unitPrice: item.price,
      });
    }
  });

  const serviceCharge = +(subtotal * 0.15).toFixed(2);
  const tax = +(subtotal * 0.08).toFixed(2);
  const totalAmount = +(subtotal + serviceCharge + tax).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomNumber || orderItems.length === 0) return;

    const room = rooms.find((r) => r.roomNumber === selectedRoomNumber);
    const guest = room?.guest || {
      name: `Guest Room ${selectedRoomNumber}`,
      checkInDate: "Today",
      checkOutDate: "Tomorrow",
      phoneExtension: selectedRoomNumber,
    };

    onCreateOrder({
      orderNumber: `RS-${Math.floor(8000 + Math.random() * 1900)}`,
      roomNumber: selectedRoomNumber,
      floor: room?.floor || "Floor 1",
      roomType: room?.roomType || "Standard Deluxe",
      guest,
      items: orderItems,
      status: "kitchen_prep",
      subtotal,
      serviceCharge,
      tax,
      totalAmount,
      estimatedDeliveryTime: "in 25 mins",
      assignedRunner: "Marcus Chen",
      traySetup,
      paymentMethod,
      isUrgent,
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-teal-700" />
            <span>Create In-Room Dining Order</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Dispatch food & beverage directly to guest rooms with automatic PMS folio billing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Room Selection */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Room *
              </label>
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomNumber} disabled={!r.isOccupied}>
                    Room {r.roomNumber} ({r.roomType}) — {r.guest?.name ? `Guest: ${r.guest.name}` : "⛔ Vacant (Disabled)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tray / Trolley Setup
              </label>
              <select
                value={traySetup}
                onChange={(e) => setTraySetup(e.target.value as any)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="Single Tray">Single Tray (Room Runner)</option>
                <option value="Full Dining Trolley">Full Dining Trolley (with Cloches)</option>
                <option value="Wine & Ice Service">Wine & Ice Service</option>
              </select>
            </div>
          </div>

          {/* Quick Menu Dish Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Menu Items *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              {MENU_ITEMS.map((item) => {
                const qty = selectedItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      qty > 0
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-semibold truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {qty > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                      )}
                      {qty > 0 && <span className="w-4 text-center font-bold text-xs">{qty}</span>}
                      <button
                        type="button"
                        onClick={() => handleAddItem(item.id)}
                        className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-pressed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing & Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="room_folio">Post to Room Folio (PMS)</option>
                <option value="card_at_door">Pay by Card at Door</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="complimentary">Complimentary VIP Perk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Requests / Dietary
              </label>
              <input
                type="text"
                placeholder="e.g. Extra hot, dressing on side"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Urgent Priority checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="urgentOrderCheck"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <label
              htmlFor="urgentOrderCheck"
              className="text-xs text-slate-700 font-semibold cursor-pointer"
            >
              Mark as Express Priority Order
            </label>
          </div>

          {/* Bill summary preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500">Order Subtotal:</span>{" "}
              <strong className="text-slate-800">${subtotal.toFixed(2)}</strong>
              <span className="text-slate-400 text-[11px] ml-2">(+15% Service + 8% Tax)</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Folio Charge:</span>
              <span className="text-base font-bold text-primary font-mono">
                ${totalAmount.toFixed(2)}
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
              disabled={orderItems.length === 0}
              className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-pressed disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Dispatch to Kitchen (KOT)
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
