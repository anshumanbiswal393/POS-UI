import { useState, useMemo } from "react";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  BedDouble,
  Split,
  FileText,
  Printer,
  PauseCircle,
  UserCheck,
  Search,
  Tag,
  Gift,
  CheckCircle2,
  X,
  Percent,
} from "lucide-react";
import type {
  BillingCartItem,
  BillingOrderType,
  BillingPaymentMethod,
  CustomerProfile,
} from "@/types/posBilling";
import { MOCK_CUSTOMERS } from "./mockBillingData";

type BillingCartRegisterProps = {
  cartItems: BillingCartItem[];
  orderType: BillingOrderType;
  tableNumber?: string;
  roomNumber?: string;
  guestCount: number;
  billNumber: string;
  captainName: string;
  onUpdateCartQty: (cartId: string, newQty: number) => void;
  onRemoveCartItem: (cartId: string) => void;
  onToggleComplimentary: (cartId: string) => void;
  onClearCart: () => void;
  onHoldBill: () => void;
  onPrintKot: () => void;
  onOpenSplitModal: () => void;
  onSettleBill: (paymentMethod: BillingPaymentMethod, tenderedAmount: number) => void;
  selectedCustomer: CustomerProfile | null;
  onSelectCustomer: (customer: CustomerProfile | null) => void;
};

export function BillingCartRegister({
  cartItems,
  orderType,
  tableNumber,
  roomNumber,
  guestCount,
  billNumber,
  captainName,
  onUpdateCartQty,
  onRemoveCartItem,
  onToggleComplimentary,
  onClearCart,
  onHoldBill,
  onPrintKot,
  onOpenSplitModal,
  onSettleBill,
  selectedCustomer,
  onSelectCustomer,
}: BillingCartRegisterProps) {
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>("cash");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountRate: number } | null>(
    null,
  );
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [cashTendered, setCashTendered] = useState<number | null>(null);

  // Filter customer search
  const matchingCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return MOCK_CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customerSearch]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.isComplimentary) return sum;
      const basePrice = item.selectedVariant ? item.selectedVariant.price : item.item.price;
      const modifiersPrice = item.selectedModifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (basePrice + modifiersPrice) * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    return Math.round((subtotal * appliedCoupon.discountRate) / 100);
  }, [subtotal, appliedCoupon]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const cgst = Math.round(taxableAmount * 0.025); // 2.5%
  const sgst = Math.round(taxableAmount * 0.025); // 2.5%
  const serviceCharge = serviceChargeEnabled ? Math.round(taxableAmount * 0.05) : 0; // 5%
  const rawTotal = taxableAmount + cgst + sgst + serviceCharge;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  // Cash preset amounts
  const cashPresets = useMemo(() => {
    if (grandTotal <= 0) return [];
    const presets = [grandTotal];
    if (grandTotal < 500) presets.push(500);
    if (grandTotal < 1000) presets.push(1000);
    if (grandTotal < 2000) presets.push(2000);
    if (grandTotal >= 2000) presets.push(Math.ceil(grandTotal / 500) * 500);
    return Array.from(new Set(presets));
  }, [grandTotal]);

  const effectiveTendered = cashTendered !== null ? cashTendered : grandTotal;
  const changeDue = Math.max(0, effectiveTendered - grandTotal);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const upper = couponCode.toUpperCase().trim();
    if (upper === "RETROD10" || upper === "WELCOME10") {
      setAppliedCoupon({ code: upper, discountRate: 10 });
      setCouponCode("");
    } else if (upper === "VIP20" || upper === "GOLD20") {
      setAppliedCoupon({ code: upper, discountRate: 20 });
      setCouponCode("");
    } else if (upper === "FLAT50") {
      setAppliedCoupon({ code: upper, discountRate: 50 });
      setCouponCode("");
    } else {
      setAppliedCoupon({ code: upper, discountRate: 5 });
      setCouponCode("");
    }
  };

  const paymentOptions: {
    id: BillingPaymentMethod;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "cash", label: "Cash", icon: Banknote },
    { id: "upi", label: "UPI / QR", icon: QrCode },
    { id: "card", label: "Card / EDC", icon: CreditCard },
    { id: "room_post", label: "Room", icon: BedDouble },
    { id: "split", label: "Split", icon: Split },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col h-full max-h-full overflow-hidden">
      {/* 1. Register Header & Table Ticket Badge (Compact) */}
      <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-primary">
            {orderType === "dine_in"
              ? tableNumber || "Table T-12"
              : orderType === "room_service"
                ? roomNumber || "Room 312"
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
          <span className="text-[10.5px] text-slate-400">
            Steward: <strong className="text-slate-200">{captainName}</strong>
          </span>
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

      {/* 2. Customer Loyalty Lookup Bar (Slim) */}
      <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md px-2 py-1 text-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="truncate flex items-center gap-1.5">
                <span className="font-bold text-[11.5px]">{selectedCustomer.name}</span>
                <span className="text-[9.5px] font-semibold bg-primary/20 text-primary px-1 rounded">
                  {selectedCustomer.tier}
                </span>
                <span className="text-[10px] text-primary font-medium">
                  ({selectedCustomer.loyaltyPoints} Pts)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectCustomer(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Attach customer phone or name..."
                  value={customerSearch}
                  onFocus={() => setIsSearchingCustomer(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsSearchingCustomer(true);
                  }}
                  className="w-full pl-7 pr-2 py-1 text-[11.5px] bg-white border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Customer Dropdown Results */}
            {isSearchingCustomer && matchingCustomers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-slate-200 max-h-40 overflow-y-auto">
                {matchingCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(c);
                      setCustomerSearch("");
                      setIsSearchingCustomer(false);
                    }}
                    className="w-full text-left p-1.5 hover:bg-primary/10 border-b border-slate-100 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-[11.5px]">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.phone}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                        {c.tier}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* 4. Totals, Taxes & Discount Breakdown (Tight) */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs shrink-0">
        {/* Coupon Code Input */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Promo coupon (e.g. RETROD10)..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full pl-6 pr-2 py-0.5 text-xs uppercase bg-white border border-slate-200 rounded-md text-slate-800 placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim()}
            className="px-2 py-0.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold transition disabled:opacity-40 cursor-pointer"
          >
            Apply
          </button>
        </div>

        {appliedCoupon && (
          <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10.5px] font-semibold">
            <span>
              Coupon <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discountRate}% OFF)
            </span>
            <button
              type="button"
              onClick={() => setAppliedCoupon(null)}
              className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Calculation Table */}
        <div className="space-y-0.5 text-slate-600 text-[11px]">
          <div className="flex items-center justify-between">
            <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-emerald-700 font-semibold">
              <span>Discount</span>
              <span>-₹{discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>CGST (2.5%)</span>
            <span>₹{cgst.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>SGST (2.5%)</span>
            <span>₹{sgst.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={serviceChargeEnabled}
                onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                className="h-3 w-3 accent-primary rounded"
              />
              <span>Service Charge (5%)</span>
            </label>
            <span>₹{serviceCharge.toLocaleString()}</span>
          </div>

          {roundOff !== 0 && (
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Round Off</span>
              <span>{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
            </div>
          )}
        </div>

        {/* Grand Total Display */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-900">
          <span className="font-bold text-xs">Grand Total Payable</span>
          <span className="font-extrabold text-base text-primary">
            ₹{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 5. Payment Tender Mode Selector (Slim) */}
      <div className="px-3 py-2 bg-white border-t border-slate-200 space-y-1.5 shrink-0">
        <div className="grid grid-cols-5 gap-1">
          {paymentOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = paymentMethod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(opt.id);
                  if (opt.id === "split") {
                    onOpenSplitModal();
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Icon
                  className={`h-3 w-3 mb-0.5 ${isSelected ? "text-primary-foreground" : "text-slate-600"}`}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cash Tender Presets & Change Due calculator */}
        {paymentMethod === "cash" && grandTotal > 0 && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg px-2 py-1 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[10.5px] text-amber-900 font-semibold">
              <span>Quick Cash:</span>
              <span>
                Change Return: <strong className="text-emerald-700">₹{changeDue}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {cashPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCashTendered(preset)}
                  className={`px-1.5 py-0.2 rounded text-[11px] font-bold border transition cursor-pointer ${
                    effectiveTendered === preset
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-amber-100"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Action Footer */}
      <div className="p-2.5 bg-slate-100 border-t border-slate-200 grid grid-cols-4 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onHoldBill}
          disabled={cartItems.length === 0}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-300 text-slate-700 text-[10.5px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
          <span>Hold [F4]</span>
        </button>

        <button
          type="button"
          onClick={onPrintKot}
          disabled={cartItems.length === 0}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-[10.5px] font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <Printer className="h-3.5 w-3.5 text-blue-600" />
          <span>KOT [F8]</span>
        </button>

        <button
          type="button"
          onClick={() => onSettleBill(paymentMethod, effectiveTendered)}
          disabled={cartItems.length === 0}
          className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Settle & Bill [F10]</span>
        </button>
      </div>
    </div>
  );
}
