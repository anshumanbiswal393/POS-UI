import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  FileText,
  Printer,
  PauseCircle,
  Gift,
  IndianRupee,
  BedDouble,
  ChevronDown,
  User,
  Search,
  Check,
  X,
} from "lucide-react";
import type {
  BillingCartItem,
  BillingOrderType,
  CustomerProfile,
} from "@/types/posBilling";
import { useOutletContext } from "@/context/PosOutletContext";
import { useAuth } from "@/hooks/useAuth";
import { getPosCustomers } from "@/services/posCustomerStore";
import { AddCustomerDrawer } from "./AddCustomerDrawer";

type BillingCartRegisterProps = {
  cartItems: BillingCartItem[];
  orderType: BillingOrderType;
  tableNumber?: string;
  roomNumber?: string;
  guestCount: number;
  billNumber: string;
  captainName: string;
  specialNote: string;
  onSpecialNoteChange: (note: string) => void;
  onUpdateCartQty: (cartId: string, newQty: number) => void;
  onRemoveCartItem: (cartId: string) => void;
  onToggleComplimentary: (cartId: string) => void;
  onClearCart: () => void;
  onHoldBill: () => void;
  onPrintKot: () => void;
  onPayNow: () => void;
  onAddToRoomFolio?: () => void;
  busyAction?: "hold" | "kot" | "pay" | "folio" | null;
  selectedCustomer: CustomerProfile | null;
  onSelectCustomer: (customer: CustomerProfile | null) => void;
  discountType?: "percent" | "flat";
  discountValue?: number;
  onDiscountChange?: (type: "percent" | "flat", val: number) => void;
  taxType?: "percent" | "flat";
  taxValue?: number;
  onTaxChange?: (type: "percent" | "flat", val: number) => void;
};

export function BillingCartRegister({
  cartItems,
  orderType,
  tableNumber,
  roomNumber,
  guestCount,
  billNumber,
  captainName: _captainName,
  specialNote,
  onSpecialNoteChange,
  onUpdateCartQty,
  onRemoveCartItem,
  onToggleComplimentary,
  onClearCart,
  onHoldBill,
  onPrintKot,
  onPayNow,
  onAddToRoomFolio,
  busyAction = null,
  selectedCustomer,
  onSelectCustomer,
  discountType: propDiscountType,
  discountValue: propDiscountValue,
  onDiscountChange,
  taxType: propTaxType,
  taxValue: propTaxValue,
  onTaxChange,
}: BillingCartRegisterProps) {
  const { can, user } = useAuth();
  const isMaster =
    Boolean(user?.is_superuser) ||
    ["super_admin", "owner", "tenant_owner", "general_manager", "pos_admin"].includes(
      String(user?.role || "").toLowerCase()
    );

  const canSettle = isMaster || can("pos.billing.settle");
  const canHold = isMaster || can("pos.orders.create");
  const canKot = isMaster || can("pos.kot.create") || can("pos.orders.create");
  const canRoomCharge = isMaster || can("pos.billing.room_charge");
  const canDiscount = isMaster || can("pos.billing.discount");

  const { activeOutlet } = useOutletContext();

  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Real customers store only — zero hardcoded mock data
  const allCustomers = useMemo(() => getPosCustomers(activeOutlet?.id), [activeOutlet?.id, isAddCustomerOpen]);
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return allCustomers;
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [allCustomers, customerSearchQuery]);

  // Discount (Percentage or Flat Amount)
  const [discountType, setDiscountType] = useState<"percent" | "flat">(
    propDiscountType ?? "percent"
  );
  const [discountInput, setDiscountInput] = useState<string>(
    String(propDiscountValue ?? 0)
  );

  // Tax (Percentage or Flat Amount) - default 5%
  const [taxType, setTaxType] = useState<"percent" | "flat">(
    propTaxType ?? "percent"
  );
  const [taxInput, setTaxInput] = useState<string>(
    String(propTaxValue ?? 5)
  );

  useEffect(() => {
    if (propDiscountType !== undefined) setDiscountType(propDiscountType);
  }, [propDiscountType]);

  useEffect(() => {
    if (propDiscountValue !== undefined) setDiscountInput(String(propDiscountValue));
  }, [propDiscountValue]);

  useEffect(() => {
    if (propTaxType !== undefined) setTaxType(propTaxType);
  }, [propTaxType]);

  useEffect(() => {
    if (propTaxValue !== undefined) setTaxInput(String(propTaxValue));
  }, [propTaxValue]);

  const handleDiscountTypeChange = (type: "percent" | "flat") => {
    setDiscountType(type);
    const num = Math.max(0, parseFloat(discountInput) || 0);
    onDiscountChange?.(type, num);
  };

  const handleDiscountInputChange = (val: string) => {
    setDiscountInput(val);
    const num = Math.max(0, parseFloat(val) || 0);
    onDiscountChange?.(discountType, num);
  };

  const handleTaxTypeChange = (type: "percent" | "flat") => {
    setTaxType(type);
    const num = Math.max(0, parseFloat(taxInput) || 0);
    onTaxChange?.(type, num);
  };

  const handleTaxInputChange = (val: string) => {
    setTaxInput(val);
    const num = Math.max(0, parseFloat(val) || 0);
    onTaxChange?.(taxType, num);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.isComplimentary) return sum;
      const basePrice = item.selectedVariant ? item.selectedVariant.price : item.item.price;
      const modifiersPrice = item.selectedModifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (basePrice + modifiersPrice) * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountNumber = Math.max(0, parseFloat(discountInput) || 0);
  const calculatedDiscount = useMemo(() => {
    if (subtotal <= 0 || discountNumber <= 0) return 0;
    if (discountType === "percent") {
      const pct = Math.min(100, discountNumber);
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.round(discountNumber));
  }, [subtotal, discountType, discountNumber]);

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);

  const taxNumber = Math.max(0, parseFloat(taxInput) || 0);
  const calculatedTax = useMemo(() => {
    if (taxableAmount <= 0 || taxNumber <= 0) return 0;
    if (taxType === "percent") {
      return Math.round((taxableAmount * taxNumber) / 100);
    }
    return Math.round(taxNumber);
  }, [taxableAmount, taxType, taxNumber]);

  const rawTotal = taxableAmount + calculatedTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  const actionsDisabled = cartItems.length === 0 || Boolean(busyAction);
  const showRoomFolio = orderType === "room_service" && Boolean(onAddToRoomFolio);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col h-full max-h-full overflow-hidden">
      {/* 1. Register Header & Table Ticket Badge (Compact) */}
      <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-primary">
            {orderType === "dine_in"
              ? tableNumber || "Select Table"
              : orderType === "room_service"
                ? roomNumber || "Select Room"
                : orderType === "delivery"
                  ? "Delivery"
                  : "Takeaway"}
          </span>
          {orderType === "dine_in" && (
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-medium">
              {guestCount} PAX
            </span>
          )}
          <span className="text-[10.5px] text-slate-400 font-mono hidden sm:inline">
            · {billNumber}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              title="Clear all items"
              className="text-[10.5px] font-semibold text-rose-300 hover:text-white hover:bg-rose-900/60 px-1.5 py-0.5 rounded transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Customer dropdown + (+) button - 2 fields only */}
      <div className="relative px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Dropdown for choosing customer */}
          <div className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsCustomerSelectOpen((prev) => !prev)}
              className="w-full h-8 px-2.5 py-1 flex items-center justify-between gap-1.5 bg-white border border-slate-200 rounded-md text-[11.5px] text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary transition cursor-pointer text-left shadow-2xs"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {selectedCustomer ? (
                  <span className="truncate font-semibold text-slate-900">
                    {selectedCustomer.name}
                    {selectedCustomer.phone ? (
                      <span className="font-normal text-slate-500 ml-1">
                        ({selectedCustomer.phone})
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="truncate text-slate-400 font-normal">
                    Choose Customer (Walk-in)...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedCustomer && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomer(null);
                    }}
                    title="Clear to Walk-in"
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>

            {/* Dropdown Popover */}
            {isCustomerSelectOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCustomerSelectOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 w-[280px] sm:w-[320px] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[260px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search by name or phone..."
                      className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
                    {/* Walk-in Option */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCustomer(null);
                        setIsCustomerSelectOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs rounded hover:bg-slate-100 flex items-center justify-between text-slate-700 transition cursor-pointer"
                    >
                      <span className="font-medium">Walk-in Customer (Default)</span>
                      {!selectedCustomer && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>

                    {filteredCustomers.map((cust) => {
                      const isSelected =
                        selectedCustomer?.id === cust.id ||
                        (selectedCustomer?.phone && selectedCustomer?.phone === cust.phone);
                      return (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            onSelectCustomer({
                              id: cust.id,
                              name: cust.name,
                              phone: cust.phone,
                              tier: cust.tier,
                              loyaltyPoints: cust.loyaltyPoints,
                              visitCount: cust.visitCount,
                              lastVisit: cust.lastVisit,
                            });
                            setIsCustomerSelectOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 text-left text-xs rounded flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-slate-100 text-slate-800"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{cust.name}</div>
                            <div className="text-[10.5px] text-slate-500">{cust.phone}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {cust.tier}
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                        </button>
                      );
                    })}

                    {filteredCustomers.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No customer found. Click + to add new.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* (+) Button for Add Customer with Right-Side Sidebar Drawer */}
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            title="Add Customer"
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition cursor-pointer shadow-2xs"
            aria-label="Add Customer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Cart Line Items List (Compact, Tight, Stretchable without extra gaps) */}
      <div className="flex-1 min-h-[75px] overflow-y-auto px-2 py-1.5 space-y-1">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
            <FileText className="h-6 w-6 mb-1 stroke-1 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No items in check</p>
            <p className="text-[10.5px] text-slate-400">
              Click items from the catalog on the left to add
            </p>
          </div>
        ) : (
          cartItems.map((cartItem) => {
            const basePrice = cartItem.selectedVariant
              ? cartItem.selectedVariant.price
              : cartItem.item.price;
            const modifiersPrice = cartItem.selectedModifiers.reduce((sum, m) => sum + m.price, 0);
            const unitPrice = basePrice + modifiersPrice;
            const lineTotal = cartItem.isComplimentary ? 0 : unitPrice * cartItem.quantity;

            return (
              <div
                key={cartItem.cartId}
                className={`group rounded-lg border px-2 py-1.5 transition-all text-xs flex items-center justify-between gap-2 ${
                  cartItem.isComplimentary
                    ? "bg-purple-50/70 border-purple-200"
                    : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
                }`}
              >
                {/* Left: Diet Dot + Item Name + Variant Tags */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    {cartItem.item.diet === "veg" && (
                      <span className="flex h-3 w-3 shrink-0 items-center justify-center border border-emerald-600 p-0.2 rounded-[2px] bg-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      </span>
                    )}
                    {cartItem.item.diet === "non_veg" && (
                      <span className="flex h-3 w-3 shrink-0 items-center justify-center border border-rose-600 p-0.2 rounded-[2px] bg-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                      </span>
                    )}
                    {cartItem.item.diet === "egg" && (
                      <span className="flex h-3 w-3 shrink-0 items-center justify-center border border-amber-600 p-0.2 rounded-[2px] bg-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      </span>
                    )}

                    <span className="font-bold text-[12px] text-slate-900 truncate">
                      {cartItem.item.name}
                    </span>

                    {cartItem.selectedVariant && (
                      <span className="text-[9.5px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-medium shrink-0">
                        {cartItem.selectedVariant.name}
                      </span>
                    )}
                  </div>

                  {/* Subline: Modifiers & instructions if any */}
                  {(cartItem.selectedModifiers.length > 0 || cartItem.specialInstructions) && (
                    <div className="text-[10px] text-slate-500 truncate pl-4.5 mt-0.5">
                      {cartItem.selectedModifiers.map((m) => m.optionName).join(", ")}
                      {cartItem.specialInstructions ? ` · ★ ${cartItem.specialInstructions}` : ""}
                    </div>
                  )}
                </div>

                {/* Right Controls: Stepper, Price, Complimentary, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Stepper */}
                  <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-md p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateCartQty(cartItem.cartId, cartItem.quantity - 1)}
                      className="h-4.5 w-4.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                    >
                      <Minus className="h-2 w-2" />
                    </button>
                    <span className="w-4 text-center font-bold text-[11px] text-slate-900">
                      {cartItem.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCartQty(cartItem.cartId, cartItem.quantity + 1)}
                      className="h-4.5 w-4.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center font-bold text-[10px] cursor-pointer"
                    >
                      <Plus className="h-2 w-2" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="font-bold text-slate-900 text-xs min-w-[50px] text-right font-mono">
                    {cartItem.isComplimentary ? (
                      <span className="text-purple-700 font-bold text-[10px]">FREE</span>
                    ) : (
                      `₹${lineTotal.toLocaleString()}`
                    )}
                  </div>

                  {/* Quick Complimentary Toggle */}
                  {canDiscount && (
                    <button
                      type="button"
                      onClick={() => onToggleComplimentary(cartItem.cartId)}
                      title={cartItem.isComplimentary ? "Remove Complimentary" : "Make Complimentary"}
                      className={`p-1 rounded transition cursor-pointer ${
                        cartItem.isComplimentary
                          ? "text-purple-700 bg-purple-100"
                          : "text-slate-300 hover:text-purple-600 hover:bg-purple-50"
                      }`}
                    >
                      <Gift className="h-3 w-3" />
                    </button>
                  )}

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onRemoveCartItem(cartItem.cartId)}
                    className="text-slate-300 hover:text-rose-600 p-1 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Totals, Taxes & Discount Breakdown (Exact POS Terminal Layout) */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 space-y-2 text-xs shrink-0 select-none">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-slate-700">
          <span className="font-medium text-[11.5px]">
            Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
          </span>
          <span className="font-semibold text-slate-900 text-xs font-mono">
            ₹{subtotal.toLocaleString()}
          </span>
        </div>

        {/* Discount Control Row: Dropdown (% / ₹) + Input + Display */}
        <div className="flex items-center justify-between gap-2 text-slate-700 py-0.5">
          <span className="font-medium text-[11.5px]">Discount</span>
          <div className="flex items-center gap-1.5">
            {/* Dropdown: % or ₹ */}
            <div className="relative">
              <select
                value={discountType}
                onChange={(e) => handleDiscountTypeChange(e.target.value as "percent" | "flat")}
                className="h-7 pl-2 pr-5 text-[11px] font-bold bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none shadow-2xs"
                title="Discount Type"
              >
                <option value="percent">% (Percentage)</option>
                <option value="flat">₹ (Flat)</option>
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Input value */}
            <input
              type="number"
              min="0"
              max={discountType === "percent" ? 100 : undefined}
              value={discountInput}
              onChange={(e) => handleDiscountInputChange(e.target.value)}
              placeholder="0"
              className="h-7 w-16 px-2 text-[11.5px] font-semibold text-right bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            {/* Computed display */}
            <span className="font-bold text-emerald-700 min-w-[55px] text-right font-mono text-[11.5px]">
              {calculatedDiscount > 0 ? `-₹${calculatedDiscount.toLocaleString()}` : "₹0"}
            </span>
          </div>
        </div>

        {/* Tax Control Row: Dropdown (% / ₹) + Input + Display */}
        <div className="flex items-center justify-between gap-2 text-slate-700 py-0.5">
          <span className="font-medium text-[11.5px]">Tax</span>
          <div className="flex items-center gap-1.5">
            {/* Dropdown: % or ₹ */}
            <div className="relative">
              <select
                value={taxType}
                onChange={(e) => handleTaxTypeChange(e.target.value as "percent" | "flat")}
                className="h-7 pl-2 pr-5 text-[11px] font-bold bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none shadow-2xs"
                title="Tax Type"
              >
                <option value="percent">% (Percentage)</option>
                <option value="flat">₹ (Flat)</option>
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Input value */}
            <input
              type="number"
              min="0"
              value={taxInput}
              onChange={(e) => handleTaxInputChange(e.target.value)}
              placeholder="0"
              className="h-7 w-16 px-2 text-[11.5px] font-semibold text-right bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            {/* Computed display */}
            <span className="font-bold text-slate-900 min-w-[55px] text-right font-mono text-[11.5px]">
              {calculatedTax > 0 ? `+₹${calculatedTax.toLocaleString()}` : "₹0"}
            </span>
          </div>
        </div>

        {/* Tax Breakdown Hint (if percentage tax active) */}
        {taxType === "percent" && taxNumber > 0 && calculatedTax > 0 && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 pl-1 font-mono">
            <span>CGST ({(taxNumber / 2).toFixed(1)}%) + SGST ({(taxNumber / 2).toFixed(1)}%)</span>
            <span>₹{Math.round(calculatedTax / 2).toLocaleString()} + ₹{Math.round(calculatedTax / 2).toLocaleString()}</span>
          </div>
        )}

        {/* Round Off (if any) */}
        {roundOff !== 0 && (
          <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
            <span>Round Off</span>
            <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
          </div>
        )}

        {/* Grand Total Display */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-900">
          <span className="font-extrabold text-xs tracking-tight">Grand Total Payable</span>
          <span className="font-black text-base text-primary font-mono tracking-tight">
            ₹{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 5. Action Footer */}
      <div className="p-2.5 bg-slate-100 border-t border-slate-200 space-y-1.5 shrink-0">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onHoldBill}
            disabled={actionsDisabled || !canHold}
            title={!canHold ? "Permission required to hold orders (pos.orders.create)" : undefined}
            className="flex items-center justify-center gap-1 py-2.5 px-1 rounded-lg bg-orange-300 hover:bg-orange-400 text-orange-950 text-[11px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <PauseCircle className="h-3.5 w-3.5" />
            <span>{busyAction === "hold" ? "Holding…" : "HOLD"}</span>
          </button>

          <button
            type="button"
            onClick={onPrintKot}
            disabled={actionsDisabled || !canKot}
            title={!canKot ? "Permission required to send KOT (pos.kot.create)" : undefined}
            className="flex items-center justify-center gap-1 py-2.5 px-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{busyAction === "kot" ? "Sending…" : "KOT"}</span>
          </button>

          <button
            type="button"
            onClick={onPayNow}
            disabled={actionsDisabled || !canSettle}
            title={!canSettle ? "Permission required to settle payments (pos.billing.settle)" : undefined}
            className="flex items-center justify-center gap-1 py-2.5 px-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            <span>{busyAction === "pay" ? "Paying…" : "PAY NOW"}</span>
          </button>
        </div>

        {showRoomFolio && canRoomCharge && (
          <button
            type="button"
            onClick={onAddToRoomFolio}
            disabled={actionsDisabled || !roomNumber}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-white border border-teal-700 text-teal-800 hover:bg-teal-50 text-[11.5px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <BedDouble className="h-3.5 w-3.5" />
            <span>{busyAction === "folio" ? "Posting…" : "Add to Room Folio"}</span>
          </button>
        )}
      </div>

      {/* Add Customer Right Sidebar Drawer */}
      <AddCustomerDrawer
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={(newCust) => {
          onSelectCustomer(newCust);
        }}
        outletId={activeOutlet?.id}
      />
    </div>
  );
}
