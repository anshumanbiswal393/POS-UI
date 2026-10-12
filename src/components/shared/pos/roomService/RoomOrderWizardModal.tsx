import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  UserCheck,
  Utensils,
  User,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { HotelRoom, RoomOrderItem } from "@/types/posRoomService";
import type { BillingMenuItem } from "@/types/posBilling";
import {
  PosOrderTabularCatalogStep,
  type PosOrderCartItem,
} from "../orders/PosOrderTabularCatalogStep";

export type CartItem = PosOrderCartItem;

export interface HeldRoomOrder {
  id: string;
  roomNumber: string;
  roomType: string;
  guestName: string;
  pax: number;
  waiterName?: string;
  notes?: string;
  cart: Record<string, PosOrderCartItem>;
  savedAt: string;
}

interface RoomOrderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: HotelRoom | null;
  heldOrder?: HeldRoomOrder | null;
  onConfirmOrder: (data: {
    roomNumber: string;
    roomType: string;
    floor: string;
    guestName: string;
    pax: number;
    waiterName?: string;
    notes?: string;
    items: RoomOrderItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    totalAmount: number;
  }) => void;
  onHoldOrder: (data: HeldRoomOrder) => void;
}

const WAITER_OPTIONS = [
  "Rahul V. (Senior Captain)",
  "Sunil (Captain)",
  "Amit (Room Runner)",
  "David M. (Butler)",
  "Sarah K. (Butler)",
  "Vikram N. (Head Butler)",
  "Marcus Chen (Room Service)",
  "Pooja (Captain)",
];

export function RoomOrderWizardModal({
  isOpen,
  onClose,
  room,
  heldOrder,
  onConfirmOrder,
  onHoldOrder,
}: RoomOrderWizardModalProps) {
  const navigate = useNavigate();

  // Step: 1 = Waiter & Guest Setup, 2 = Menu Tabular Catalog & Live Bill
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [waiterName, setWaiterName] = useState<string>("");
  const [customWaiter, setCustomWaiter] = useState<string>("");
  const [isCustomWaiter, setIsCustomWaiter] = useState(false);
  const [pax, setPax] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");
  const [step1Error, setStep1Error] = useState<string>("");

  // Step 2 State
  const [cart, setCart] = useState<Record<string, PosOrderCartItem>>({});

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      if (heldOrder) {
        // Restore from held order
        setStep(2);
        setPax(heldOrder.pax || 2);
        setWaiterName(heldOrder.waiterName || "");
        setNotes(heldOrder.notes || "");
        setCart(heldOrder.cart || {});
      } else {
        // Fresh order for this occupied room
        setStep(1);
        setPax(2);
        setWaiterName("");
        setCustomWaiter("");
        setIsCustomWaiter(false);
        setNotes("");
        setCart({});
      }
      setStep1Error("");
    }
  }, [isOpen, room, heldOrder]);

  const effectiveWaiter = isCustomWaiter ? customWaiter.trim() : waiterName;
  const guestName = room?.guest?.name || heldOrder?.guestName || "In-House Guest";
  const roomNumber = room?.roomNumber || heldOrder?.roomNumber || "101";
  const roomType = room?.roomType || heldOrder?.roomType || "Standard Rooms";
  const floor = room?.floor || "Floor 1";

  // Cart financial calculations
  const cartList = Object.values(cart);
  const subtotal = cartList.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const serviceCharge = +(subtotal * 0.05).toFixed(2); // 5% Room Service Fee
  const tax = +(subtotal * 0.05).toFixed(2); // 5% GST
  const grandTotal = +(subtotal + serviceCharge + tax).toFixed(2);

  // Add item handler
  const handleAddItem = (
    item: BillingMenuItem,
    selectedVariant?: { id: string; name: string; price: number }
  ) => {
    const unitPrice = selectedVariant ? selectedVariant.price : item.price;
    const variantName = selectedVariant ? selectedVariant.name : undefined;
    const key = selectedVariant ? `${item.id}-${selectedVariant.id}` : item.id;

    setCart((prev) => {
      const existing = prev[key];
      if (existing) {
        return {
          ...prev,
          [key]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [key]: {
          item,
          quantity: 1,
          selectedVariantName: variantName,
          unitPrice,
        },
      };
    });
    toast.success(`Added ${item.name}${variantName ? ` (${variantName})` : ""}`, {
      duration: 1000,
    });
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { ...existing, quantity: newQty },
      };
    });
  };

  const handleRemoveFromCart = (key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Step 1 Proceed (All fields optional, proceeds directly to billing)
  const handleProceedToMenu = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep1Error("");
    onClose();
    navigate({
      to: "/pos/billing",
      search: {
        orderType: "room_service",
        room: roomNumber,
        guests: pax > 0 ? pax : 2,
        guestName: guestName.trim() || "",
        waiterName: effectiveWaiter || "",
      },
    });
  };

  // Hold Order action
  const handleHoldOrder = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least 1 dish to hold order");
      return;
    }

    onHoldOrder({
      id: `held-rm-${roomNumber}-${Date.now()}`,
      roomNumber,
      roomType,
      guestName,
      pax,
      waiterName: effectiveWaiter || undefined,
      notes: notes || undefined,
      cart,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    toast.info(`Room ${roomNumber} order held in upper corner card.`, { duration: 2500 });
    onClose();
  };

  // Confirm and Send to KOT
  const handleSendToKOT = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least 1 item to the order before sending to KOT");
      return;
    }

    const roomOrderItems: RoomOrderItem[] = cartList.map((c, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: `${c.item.name}${c.selectedVariantName ? ` (${c.selectedVariantName})` : ""}`,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      specialInstructions: c.notes,
    }));

    onConfirmOrder({
      roomNumber,
      roomType,
      floor,
      guestName,
      pax,
      waiterName: effectiveWaiter || undefined,
      notes: notes || undefined,
      items: roomOrderItems,
      subtotal,
      tax,
      serviceCharge,
      totalAmount: grandTotal,
    });

    toast.success(`Order sent to Kitchen (KOT) for Room ${roomNumber}!`, { duration: 3500 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
          step === 2 ? "max-w-6xl h-[92vh]" : "max-w-3xl max-h-[95vh]"
        }`}
      >
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              {step === 1 ? <UserCheck className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {step === 1
                  ? `Room ${roomNumber} — Waiter & Party Details`
                  : `Take Room Order — Room ${roomNumber} (${guestName})`}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 1
                  ? "Guest name pre-filled from room folio. Select pax and optional waiter."
                  : `Guest: ${guestName} • ${pax} Pax • Waiter: ${effectiveWaiter || "Unassigned"}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===================== STEP 1: COMPACT SINGLE PAGE SETUP ===================== */}
        {step === 1 && (
          <form onSubmit={handleProceedToMenu} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {/* Pre-filled Room & Guest Card */}
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Occupied Room Folio
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  Room {roomNumber} — {roomType}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Guest: {guestName}</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                In-House
              </span>
            </div>

            {/* 1. Pax / Party Size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                Number of Guests / Pax <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPax(num)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      pax === num
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setPax(Math.max(1, pax - 1))}
                    className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-xs font-black text-slate-900">{pax}</span>
                  <button
                    type="button"
                    onClick={() => setPax(pax + 1)}
                    className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Waiter & Special Requests Side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase">
                    Waiter / Butler Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomWaiter(!isCustomWaiter)}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    {isCustomWaiter ? "Select from List" : "+ Custom Name"}
                  </button>
                </div>

                {isCustomWaiter ? (
                  <input
                    type="text"
                    placeholder="Type server or room runner name..."
                    value={customWaiter}
                    onChange={(e) => setCustomWaiter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                  />
                ) : (
                  <select
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="">Select Waiter / Butler (Optional)</option>
                    {WAITER_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1">
                  Special Requests / Delivery Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra cutlery, ice bucket, hot water"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {step1Error && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                {step1Error}
              </p>
            )}

            {/* Footer buttons */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* ===================== STEP 2: REUSABLE TABULAR MENU & LIVE BILL ===================== */}
        {step === 2 && (
          <PosOrderTabularCatalogStep
            billTitle={`Take Room Order — Room ${roomNumber}`}
            badgeText={`${pax} Pax`}
            billSubtitle={
              <span>
                Room: <strong className="text-slate-800">{roomNumber}</strong>
                {" • "}
                Guest: <strong className="text-slate-800">{guestName}</strong>
                {" • "}
                Waiter: <strong className="text-slate-800">{effectiveWaiter || "Unassigned"}</strong>
              </span>
            }
            cart={cart}
            onAddItem={handleAddItem}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveFromCart}
            taxRate={0.05}
            serviceChargeRate={0.05}
            onBack={() => setStep(1)}
            onCancel={onClose}
            onHoldOrder={handleHoldOrder}
            onSendToKOT={handleSendToKOT}
            holdButtonText="Hold Order"
            confirmButtonText="Send to KOT"
          />
        )}
      </div>
    </div>
  );
}
