import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  UserCheck,
  Utensils,
  User,
  Phone,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { RestaurantTable } from "@/types/posTables";
import type { BillingMenuItem } from "@/types/posBilling";
import {
  PosOrderTabularCatalogStep,
  type PosOrderCartItem,
} from "../orders/PosOrderTabularCatalogStep";

export type CartItem = PosOrderCartItem;

export interface HeldTableOrder {
  id: string;
  tableId: string;
  tableNumber: string;
  waiterName?: string;
  pax: number;
  guestName?: string;
  guestPhone?: string;
  notes?: string;
  cart: Record<string, PosOrderCartItem>;
  savedAt: string;
}

interface TableOrderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTables: RestaurantTable[];
  preselectedTableId?: string;
  heldOrder?: HeldTableOrder | null;
  onConfirmOrder: (data: {
    tableId: string;
    waiterName?: string;
    pax: number;
    guestName?: string;
    guestPhone?: string;
    notes?: string;
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
  }) => void;
  onHoldOrder?: (data: HeldTableOrder) => void;
}

const WAITER_OPTIONS = [
  "Rahul V. (Senior Captain)",
  "Sunil (Captain)",
  "Amit (Server)",
  "David M. (Server)",
  "Sarah K. (Server)",
  "Leo R. (Server)",
  "Kunal S. (Floor Manager)",
  "Pooja (Captain)",
];

export function TableOrderWizardModal({
  isOpen,
  onClose,
  availableTables,
  preselectedTableId,
  heldOrder,
  onConfirmOrder,
  onHoldOrder,
}: TableOrderWizardModalProps) {
  const navigate = useNavigate();

  // Step state: 1 = Table & Guest Setup, 2 = Tabular Menu & Live Bill
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Form state
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [waiterName, setWaiterName] = useState<string>("");
  const [customWaiter, setCustomWaiter] = useState<string>("");
  const [isCustomWaiter, setIsCustomWaiter] = useState(false);
  const [pax, setPax] = useState<number>(5);
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [step1Error, setStep1Error] = useState<string>("");

  // Step 2: Live cart state
  const [cart, setCart] = useState<Record<string, PosOrderCartItem>>({});

  // Initialize or reset on open
  useEffect(() => {
    if (isOpen) {
      if (heldOrder) {
        setStep(2);
        setSelectedTableId(heldOrder.tableId);
        setPax(heldOrder.pax || 5);
        setWaiterName(heldOrder.waiterName || "");
        setGuestName(heldOrder.guestName || "");
        setGuestPhone(heldOrder.guestPhone || "");
        setNotes(heldOrder.notes || "");
        setCart(heldOrder.cart || {});
      } else {
        setStep(1);
        const initialId =
          preselectedTableId ||
          availableTables.find((t) => t.status === "vacant")?.id ||
          availableTables[0]?.id ||
          "";
        setSelectedTableId(initialId);
        const preselectedTable = availableTables.find((t) => t.id === initialId);
        if (preselectedTable) {
          setPax(preselectedTable.capacity || 5);
        }
        setWaiterName("");
        setCustomWaiter("");
        setIsCustomWaiter(false);
        setGuestName("");
        setGuestPhone("");
        setNotes("");
        setCart({});
      }
      setStep1Error("");
    }
  }, [isOpen, preselectedTableId, availableTables, heldOrder]);

  const currentSelectedTable = availableTables.find((t) => t.id === selectedTableId);
  const effectiveWaiter = isCustomWaiter ? customWaiter.trim() : waiterName;

  const cartList = Object.values(cart);
  const subtotal = cartList.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gstAmount = +(subtotal * 0.05).toFixed(2); // 5% GST
  const grandTotal = +(subtotal + gstAmount).toFixed(2);

  // Add dish handler
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
      return { ...prev, [key]: { ...existing, quantity: newQty } };
    });
  };

  const handleRemoveFromCart = (key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Step 1 Validation & Proceed (All fields optional, proceeds directly to billing)
  const handleProceedToMenu = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep1Error("");
    onClose();
    const effectiveTable = currentSelectedTable || availableTables.find((t) => t.id === selectedTableId) || availableTables[0];
    navigate({
      to: "/pos/billing",
      search: {
        orderType: "dine_in",
        table: effectiveTable?.tableNumber || "Table #1",
        guests: pax > 0 ? pax : (effectiveTable?.capacity || 2),
        guestName: guestName.trim() || "",
        waiterName: effectiveWaiter || "",
      },
    });
  };

  // Hold Order Action
  const handleHoldOrderAction = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least 1 dish to hold order");
      return;
    }

    if (onHoldOrder) {
      onHoldOrder({
        id: `held-tbl-${selectedTableId}-${Date.now()}`,
        tableId: selectedTableId,
        tableNumber: currentSelectedTable?.tableNumber || "Selected Table",
        waiterName: effectiveWaiter || undefined,
        pax,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        cart,
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }

    toast.info(`Table order held in queue.`, { duration: 2500 });
    onClose();
  };

  // Step 2 Confirm Order Action
  const handleConfirmFinalOrder = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    const payloadItems = cartList.map((c) => ({
      id: c.item.id,
      name: `${c.item.name}${c.selectedVariantName ? ` (${c.selectedVariantName})` : ""}`,
      quantity: c.quantity,
      price: c.unitPrice,
      selectedVariantName: c.selectedVariantName,
      notes: c.notes,
    }));

    onConfirmOrder({
      tableId: selectedTableId,
      waiterName: effectiveWaiter || undefined,
      pax,
      guestName: guestName.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      items: payloadItems,
      subtotal,
      grandTotal,
    });

    toast.success(`Order confirmed for ${currentSelectedTable?.tableNumber || "Table"}! Sent to KOT.`, {
      duration: 3500,
    });

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
        {/* ===================== TOP HEADER (COMPACT) ===================== */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white font-bold shadow-xs">
              {step === 1 ? <UserCheck className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {step === 1
                  ? "Take Table Order — Table & Guest Setup"
                  : `Take Table Order — Table: ${currentSelectedTable?.tableNumber || "Selected"} (${pax} Pax)`}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 1
                  ? "Select table, party size, waiter & optional details"
                  : `Table: ${currentSelectedTable?.tableNumber || "Selected"} • ${pax} Pax • Waiter: ${effectiveWaiter || "Unassigned"}`}
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

        {/* ===================== STEP 1: SINGLE-PAGE COMPACT FORM ===================== */}
        {step === 1 && (
          <form onSubmit={handleProceedToMenu} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {/* 1. CHOOSE TABLE * */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase">
                  1. Choose Table <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  {availableTables.filter((t) => t.status === "vacant").length} Vacant Tables
                </span>
              </div>

              {availableTables.length === 0 ? (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
                  No tables available. Please add a table first.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableTables.map((tbl) => {
                    const isSelected = tbl.id === selectedTableId;
                    const isVacant = tbl.status === "vacant";

                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTableId(tbl.id);
                          setPax(tbl.capacity || 5);
                          setStep1Error("");
                        }}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xs"
                            : isVacant
                              ? "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                              : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {tbl.tableNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : isVacant
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {tbl.capacity} Seats
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                          {tbl.area}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. NUMBER OF GUESTS / PAX * */}
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

            {/* 3. WAITER & SPECIAL REQUESTS (COMPACT 2-COL) */}
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
                    placeholder="Type server or captain name..."
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

            {/* 4. GUEST NAME & GUEST MOBILE (COMPACT 2-COL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Guest Name <span className="text-slate-400 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in / Guest Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Guest Mobile <span className="text-slate-400 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {step1Error && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                {step1Error}
              </p>
            )}

            {/* 5. MODAL BOTTOM ACTIONS */}
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
            billTitle={`${currentSelectedTable?.tableNumber || "Selected Table"} Order Bill`}
            badgeText={`${pax} Pax`}
            billSubtitle={
              <span>
                Table: <strong className="text-slate-800">{currentSelectedTable?.tableNumber}</strong>
                {" • "}
                Waiter: <strong className="text-slate-800">{effectiveWaiter || "Unassigned"}</strong>
                {guestName ? ` • Guest: ${guestName}` : ""}
              </span>
            }
            cart={cart}
            onAddItem={handleAddItem}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveFromCart}
            taxRate={0.05}
            serviceChargeRate={0}
            onBack={() => setStep(1)}
            onCancel={onClose}
            onHoldOrder={handleHoldOrderAction}
            onSendToKOT={handleConfirmFinalOrder}
            holdButtonText="Hold Order"
            confirmButtonText="Send to KOT"
          />
        )}
      </div>
    </div>
  );
}
