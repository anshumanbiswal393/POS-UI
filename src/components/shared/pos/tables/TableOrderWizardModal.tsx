import React, { useState, useEffect, useMemo } from "react";
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
  Combine,
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

function tableCapacitySum(tables: RestaurantTable[], ids: string[]) {
  return ids.reduce((sum, id) => {
    const t = tables.find((x) => x.id === id);
    return sum + (t?.capacity || 0);
  }, 0);
}

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

  const [step, setStep] = useState<1 | 2>(1);

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [waiterName, setWaiterName] = useState("");
  const [customWaiter, setCustomWaiter] = useState("");
  const [isCustomWaiter, setIsCustomWaiter] = useState(false);
  const [pax, setPax] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [step1Error, setStep1Error] = useState("");
  const [cart, setCart] = useState<Record<string, PosOrderCartItem>>({});

  const vacantTables = useMemo(
    () =>
      availableTables
        .filter((t) => t.status === "vacant" || t.status === "reserved")
        .sort((a, b) => a.capacity - b.capacity),
    [availableTables],
  );

  const fittingSingleTables = useMemo(
    () => vacantTables.filter((t) => t.capacity >= pax),
    [vacantTables, pax],
  );

  const needsMerge = fittingSingleTables.length === 0 && vacantTables.length > 0;

  const selectedCapacity = useMemo(
    () => tableCapacitySum(vacantTables, selectedTableIds),
    [vacantTables, selectedTableIds],
  );

  const capacityOk = selectedTableIds.length > 0 && selectedCapacity >= pax;

  const orderedSelected = useMemo(
    () =>
      selectedTableIds
        .map((id) => vacantTables.find((t) => t.id === id) || availableTables.find((t) => t.id === id))
        .filter(Boolean) as RestaurantTable[],
    [selectedTableIds, vacantTables, availableTables],
  );

  const tableLabel =
    orderedSelected.length > 1
      ? orderedSelected.map((t) => t.tableNumber).join(" + ")
      : orderedSelected[0]?.tableNumber || "";

  const primaryTable = orderedSelected[0] || null;
  const effectiveWaiter = isCustomWaiter ? customWaiter.trim() : waiterName;

  const cartList = Object.values(cart);
  const subtotal = cartList.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gstAmount = +(subtotal * 0.05).toFixed(2);
  const grandTotal = +(subtotal + gstAmount).toFixed(2);

  // Init on open
  useEffect(() => {
    if (!isOpen) return;
    if (heldOrder) {
      setStep(2);
      setSelectedTableIds(heldOrder.tableId ? [heldOrder.tableId] : []);
      setPax(heldOrder.pax || 2);
      setWaiterName(heldOrder.waiterName || "");
      setGuestName(heldOrder.guestName || "");
      setGuestPhone(heldOrder.guestPhone || "");
      setNotes(heldOrder.notes || "");
      setCart(heldOrder.cart || {});
      setMergeMode(false);
      setStep1Error("");
      return;
    }

    setStep(1);
    setWaiterName("");
    setCustomWaiter("");
    setIsCustomWaiter(false);
    setGuestName("");
    setGuestPhone("");
    setNotes("");
    setCart({});
    setPax(2);
    setStep1Error("");
  }, [isOpen, heldOrder]);

  // Auto pick single / merge when pax or vacancy changes
  useEffect(() => {
    if (!isOpen || heldOrder) return;

    const preferMerge = vacantTables.every((t) => t.capacity < pax) && vacantTables.length > 0;
    setMergeMode(preferMerge);

    if (preferMerge) {
      const picks: string[] = [];
      let seats = 0;
      for (const table of vacantTables) {
        if (seats >= pax) break;
        picks.push(table.id);
        seats += table.capacity;
      }
      setSelectedTableIds(picks);
      return;
    }

    const preferred =
      (preselectedTableId &&
        vacantTables.find((t) => t.id === preselectedTableId && t.capacity >= pax)) ||
      fittingSingleTables[0] ||
      vacantTables.find((t) => t.id === preselectedTableId) ||
      vacantTables[0];

    setSelectedTableIds(preferred ? [preferred.id] : []);
  }, [isOpen, heldOrder, pax, vacantTables, fittingSingleTables, preselectedTableId]);

  function toggleMergedTable(tableId: string) {
    setSelectedTableIds((prev) => {
      if (prev.includes(tableId)) return prev.filter((id) => id !== tableId);
      return [...prev, tableId];
    });
  }

  const handleAddItem = (
    item: BillingMenuItem,
    selectedVariant?: { id: string; name: string; price: number },
  ) => {
    const unitPrice = selectedVariant ? selectedVariant.price : item.price;
    const variantName = selectedVariant ? selectedVariant.name : undefined;
    const key = selectedVariant ? `${item.id}-${selectedVariant.id}` : item.id;

    setCart((prev) => {
      const existing = prev[key];
      if (existing) {
        return { ...prev, [key]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return {
        ...prev,
        [key]: { item, quantity: 1, selectedVariantName: variantName, unitPrice },
      };
    });
    toast.success(`Added ${item.name}${variantName ? ` (${variantName})` : ""}`, { duration: 1000 });
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

  /** Step 1 → Billing (single table or merged) */
  const handleProceedToBilling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep1Error("");

    if (selectedTableIds.length === 0) {
      setStep1Error("Choose a table, or merge tables if one is too small.");
      return;
    }
    if (!capacityOk) {
      setStep1Error(
        `Selected seats ${selectedCapacity} — need ${pax} pax. Turn on Merge tables and pick more.`,
      );
      return;
    }

    const mergeNote =
      orderedSelected.length > 1
        ? `Merged tables: ${tableLabel} (${selectedCapacity} seats) for ${pax} pax.`
        : undefined;
    const billingNotes = [notes.trim() || undefined, mergeNote].filter(Boolean).join(" ");

    onClose();
    navigate({
      to: "/pos/billing",
      search: {
        orderType: "dine_in",
        table: tableLabel || primaryTable?.tableNumber || "Table #1",
        tableId: primaryTable?.id || "",
        guests: pax > 0 ? pax : primaryTable?.capacity || 2,
        guestName: guestName.trim() || "",
        guestPhone: guestPhone.trim() || "",
        waiterName: effectiveWaiter || "",
        ...(billingNotes ? { note: billingNotes } : {}),
      },
    });
  };

  const handleHoldOrderAction = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least 1 dish to hold order");
      return;
    }
    if (!primaryTable) {
      toast.error("Select a table first");
      return;
    }

    if (onHoldOrder) {
      onHoldOrder({
        id: `held-tbl-${primaryTable.id}-${Date.now()}`,
        tableId: primaryTable.id,
        tableNumber: tableLabel || primaryTable.tableNumber,
        waiterName: effectiveWaiter || undefined,
        pax,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        cart,
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }

    toast.info("Table order held in queue.", { duration: 2500 });
    onClose();
  };

  const handleConfirmFinalOrder = () => {
    if (cartList.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }
    if (!primaryTable) {
      toast.error("Select a table first");
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
      tableId: primaryTable.id,
      waiterName: effectiveWaiter || undefined,
      pax,
      guestName: guestName.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
      notes:
        [notes.trim() || undefined, orderedSelected.length > 1 ? `Merged: ${tableLabel}` : undefined]
          .filter(Boolean)
          .join(" ") || undefined,
      items: payloadItems,
      subtotal,
      grandTotal,
    });

    toast.success(`Order confirmed for ${tableLabel || "Table"}! Sent to KOT.`, { duration: 3500 });
    onClose();
  };

  if (!isOpen) return null;

  const showMergeUi = mergeMode || needsMerge;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
          step === 2 ? "max-w-6xl h-[92vh]" : "max-w-3xl max-h-[95vh]"
        }`}
      >
        <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white font-bold shadow-xs">
              {step === 1 ? <UserCheck className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {step === 1
                  ? "Take Order / Book Table"
                  : `Order — ${tableLabel || "Table"} (${pax} Pax)`}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 1
                  ? "Set pax · choose one table or merge · continue to Billing"
                  : `${tableLabel} • ${pax} Pax • Waiter: ${effectiveWaiter || "Unassigned"}`}
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

        {step === 1 && (
          <form onSubmit={handleProceedToBilling} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {/* 1. PAX first */}
            <div>
              <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                Number of Guests / Pax
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPax(num)}
                    className={`min-w-[2.25rem] py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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

            {/* 2. Table — single choose OR merge */}
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[12.5px] font-bold text-slate-900">Choose table</div>
                  <div className="text-[11px] text-slate-500">
                    Selected seats:{" "}
                    <span className={capacityOk ? "text-primary font-bold" : "text-rose-600 font-bold"}>
                      {selectedCapacity}
                    </span>{" "}
                    / {pax} pax
                    {needsMerge ? (
                      <span className="ml-1.5 text-amber-700 font-semibold">
                        · No single table fits — merge below
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !mergeMode;
                    setMergeMode(next);
                    if (!next && fittingSingleTables[0]) {
                      setSelectedTableIds([fittingSingleTables[0].id]);
                    } else if (next && selectedTableIds.length <= 1) {
                      const picks: string[] = [];
                      let seats = 0;
                      for (const table of vacantTables) {
                        if (seats >= pax) break;
                        picks.push(table.id);
                        seats += table.capacity;
                      }
                      setSelectedTableIds(picks);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold border transition cursor-pointer ${
                    showMergeUi
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Combine className="w-3.5 h-3.5" />
                  Merge tables
                </button>
              </div>

              {!showMergeUi ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {fittingSingleTables.length === 0 && vacantTables.length === 0 ? (
                    <div className="col-span-full p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
                      No available tables right now.
                    </div>
                  ) : (
                    fittingSingleTables.map((tbl) => {
                      const isSelected = selectedTableIds[0] === tbl.id;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => {
                            setSelectedTableIds([tbl.id]);
                            setStep1Error("");
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                              {tbl.tableNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {tbl.capacity} Seats
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                            {tbl.area}
                            {tbl.status === "reserved" ? " · Reserved" : ""}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-500">
                    Tap tables to merge until seats cover {pax} pax, then continue to Billing.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                    {vacantTables.map((t) => {
                      const selected = selectedTableIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            toggleMergedTable(t.id);
                            setStep1Error("");
                          }}
                          className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                            selected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-[13px] font-bold text-slate-900">{t.tableNumber}</div>
                          <div className="text-[11px] text-slate-500">
                            {t.capacity} seats · {t.area}
                          </div>
                          {selected && (
                            <div className="mt-0.5 text-[10.5px] font-bold text-primary">Selected</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTableIds.length > 1 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600">
                  Merged for order:{" "}
                  <span className="font-semibold text-primary">{tableLabel}</span>
                  {" · "}
                  {selectedCapacity} seats
                </div>
              )}
            </div>

            {/* 3. Waiter & notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase">
                    Waiter / Butler <span className="text-slate-400 font-normal">(Optional)</span>
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
                    className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                ) : (
                  <select
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700 cursor-pointer"
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
                  Special Requests <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra cutlery, high chair"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>
            </div>

            {/* 4. Guest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  Guest Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in / Guest Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  Guest Mobile <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>
            </div>

            {step1Error && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                {step1Error}
              </p>
            )}

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
                disabled={!capacityOk}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>
                  {selectedTableIds.length > 1 ? "Continue with merged tables" : "Continue to Billing"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <PosOrderTabularCatalogStep
            billTitle={`${tableLabel || "Selected Table"} Order Bill`}
            badgeText={`${pax} Pax`}
            billSubtitle={
              <span>
                Table: <strong className="text-slate-800">{tableLabel || "Selected"}</strong>
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
