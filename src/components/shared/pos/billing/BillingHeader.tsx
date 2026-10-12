import { useState } from "react";
import {
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  BedDouble,
  Search,
  PauseCircle,
  PlusCircle,
  RefreshCw,
  Clock,
  User,
  Hash,
  X,
} from "lucide-react";
import type { BillingOrderType } from "@/types/posBilling";

type BillingHeaderProps = {
  orderType: BillingOrderType;
  setOrderType: (type: BillingOrderType) => void;
  activeTable: string;
  onOpenTableSelector: () => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  heldCount: number;
  onOpenHeldDrawer: () => void;
  onNewBill: () => void;
  billNumber: string;
  captainName: string;
  roomNumber?: string;
  onOpenRoomSelector?: () => void;
};

export function BillingHeader({
  orderType,
  setOrderType,
  activeTable,
  onOpenTableSelector,
  guestCount,
  setGuestCount,
  searchQuery,
  setSearchQuery,
  heldCount,
  onOpenHeldDrawer,
  onNewBill,
  billNumber,
  captainName,
  roomNumber,
}: BillingHeaderProps) {
  const [currentTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  const orderTypes: {
    id: BillingOrderType;
    label: string;
    icon: React.ElementType;
    shortcut: string;
  }[] = [
    { id: "dine_in", label: "Dine In", icon: UtensilsCrossed, shortcut: "Alt+1" },
    { id: "takeaway", label: "Takeaway", icon: ShoppingBag, shortcut: "Alt+2" },
    { id: "delivery", label: "Delivery", icon: Truck, shortcut: "Alt+3" },
    { id: "room_service", label: "Room Service", icon: BedDouble, shortcut: "Alt+4" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 space-y-3">
      {/* Top Row: Meta info & Primary Action Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        {/* Left: Terminal & Bill Info */}
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Counter POS 01</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70">
            <Hash className="h-3 w-3 text-slate-400" />
            <span className="font-bold text-slate-900">{billNumber}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70">
            <User className="h-3 w-3 text-teal-600" />
            <span>
              Steward: <strong className="text-slate-800 font-semibold">{captainName}</strong>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-slate-500 text-[11.5px]">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Shift 01 · {currentTime}</span>
          </div>
        </div>

        {/* Right: Parked/Held Bills & New Bill Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHeldDrawer}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              heldCount > 0
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>Held Checks</span>
            {heldCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white shadow-xs">
                {heldCount}
              </span>
            )}
            <kbd className="hidden sm:inline-block ml-1 rounded bg-amber-200/60 px-1 text-[10px] text-amber-800 font-mono">
              F4
            </kbd>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>New Check</span>
            <kbd className="hidden sm:inline-block ml-1 rounded bg-teal-200/70 px-1 text-[10px] text-teal-900 font-mono">
              F2
            </kbd>
          </button>
        </div>
      </div>

      {/* Bottom Row: Order Mode Switcher & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Order Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          {orderTypes.map((mode) => {
            const Icon = mode.icon;
            const isActive = orderType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setOrderType(mode.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-teal-100" : "text-slate-500"}`} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Selector (Table or Room or Customer) & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
          {/* Table / Room Selector button */}
          {orderType === "dine_in" && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200/90 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-teal-700 font-medium">Table:</span>
              <button
                type="button"
                onClick={onOpenTableSelector}
                className="font-bold text-teal-900 bg-white hover:bg-teal-100/70 px-2 py-0.5 rounded border border-teal-300 shadow-2xs transition cursor-pointer"
              >
                {activeTable || "Select Table"} ▾
              </button>
              <div className="flex items-center gap-1 border-l border-teal-200 pl-2">
                <span className="text-teal-700">Guests:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-center font-bold text-teal-900 bg-white border border-teal-300 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {orderType === "room_service" && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-900 font-medium">
              <span>Room:</span>
              <span className="font-bold text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300">
                {roomNumber || "Room 104"}
              </span>
              <div className="flex items-center gap-1 border-l border-amber-200 pl-2">
                <span className="text-amber-800">Guests:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-center font-bold text-amber-900 bg-white border border-amber-300 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name, code (#101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-teal-600 focus:border-teal-600 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
