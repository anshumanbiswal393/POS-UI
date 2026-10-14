import {
  UtensilsCrossed,
  ShoppingBag,
  BedDouble,
  PauseCircle,
  PlusCircle,
} from "lucide-react";
import type { BillingOrderType } from "@/types/posBilling";

export type OccupiedRoomOption = {
  roomNumber: string;
  guestName?: string;
};

type BillingHeaderProps = {
  orderType: BillingOrderType;
  setOrderType: (type: BillingOrderType) => void;
  activeTable: string;
  onOpenTableSelector: () => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  heldCount: number;
  onOpenHeldDrawer: () => void;
  onNewBill: () => void;
  roomNumber?: string;
  occupiedRooms?: OccupiedRoomOption[];
  onSelectRoom?: (roomNumber: string) => void;
};

export function BillingHeader({
  orderType,
  setOrderType,
  activeTable,
  onOpenTableSelector,
  guestCount,
  setGuestCount,
  heldCount,
  onOpenHeldDrawer,
  onNewBill,
  roomNumber,
  occupiedRooms = [],
  onSelectRoom,
}: BillingHeaderProps) {
  const orderTypes: {
    id: BillingOrderType;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "dine_in", label: "Dine In", icon: UtensilsCrossed },
    { id: "takeaway", label: "Takeaway", icon: ShoppingBag },
    { id: "room_service", label: "Room Service", icon: BedDouble },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2 sm:p-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          {orderTypes.map((mode) => {
            const Icon = mode.icon;
            const isActive = orderType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setOrderType(mode.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground/80" : "text-slate-500"}`}
                />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
          {orderType === "dine_in" && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-primary font-medium">Table:</span>
              <button
                type="button"
                onClick={onOpenTableSelector}
                className="font-bold text-foreground bg-white hover:bg-primary/10 px-2 py-0.5 rounded border border-primary/30 shadow-2xs transition cursor-pointer"
              >
                {activeTable || "Select Table"} ▾
              </button>
              <div className="flex items-center gap-1 border-l border-primary/20 pl-2">
                <span className="text-primary">Pax:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-center font-bold text-foreground bg-white border border-primary/30 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {orderType === "room_service" && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-900 font-medium">
              <span>Room:</span>
              <select
                value={roomNumber || ""}
                onChange={(e) => onSelectRoom?.(e.target.value)}
                className="font-bold text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[220px]"
              >
                {occupiedRooms.length === 0 ? (
                  <option value="">No occupied rooms</option>
                ) : (
                  occupiedRooms.map((room) => (
                    <option key={room.roomNumber} value={`Room ${room.roomNumber}`}>
                      Room {room.roomNumber}
                      {room.guestName ? ` · ${room.guestName}` : ""}
                    </option>
                  ))
                )}
              </select>
              <div className="flex items-center gap-1 border-l border-amber-200 pl-2">
                <span className="text-amber-800">Pax:</span>
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
            <kbd className="hidden sm:inline-block ml-0.5 rounded bg-amber-200/60 px-1 text-[10px] text-amber-800 font-mono">
              F4
            </kbd>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition cursor-pointer shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5 text-primary" />
            <span>New Check</span>
            <kbd className="hidden sm:inline-block ml-0.5 rounded bg-primary/20 px-1 text-[10px] text-primary font-mono">
              F2
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
