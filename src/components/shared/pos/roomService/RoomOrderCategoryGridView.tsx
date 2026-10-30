import React, { useState, useMemo } from "react";
import type { HotelRoom } from "@/types/posRoomService";
import type { HeldRoomOrder } from "./RoomOrderWizardModal";
import { Search, PauseCircle, Trash2, ArrowRight, Info } from "lucide-react";

interface RoomOrderCategoryGridViewProps {
  rooms: HotelRoom[];
  heldOrders?: HeldRoomOrder[];
  /** Open take-order for in-house (guest) rooms only */
  onSelectRoom: (room: HotelRoom) => void;
  onViewRoomOrders?: (room: HotelRoom) => void;
  onResumeHeldOrder?: (heldOrder: HeldRoomOrder) => void;
  onCancelHeldOrder?: (heldOrderId: string) => void;
}

const CATEGORY_ORDER = ["Standard Rooms", "Deluxe Rooms", "Superior Rooms", "Suite Rooms"];

export function RoomOrderCategoryGridView({
  rooms,
  heldOrders = [],
  onSelectRoom,
  onViewRoomOrders,
  onResumeHeldOrder,
  onCancelHeldOrder,
}: RoomOrderCategoryGridViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q) ||
        r.guest?.name?.toLowerCase().includes(q),
    );
  }, [rooms, searchQuery]);

  // Group rooms by category adhering to image structure
  const groupedRooms = useMemo(() => {
    const groups: Record<string, HotelRoom[]> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = [];
    }

    for (const room of filteredRooms) {
      const cat = room.roomType || "Standard Rooms";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(room);
    }
    return groups;
  }, [filteredRooms]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto font-sans select-none relative">
      {/* Top Header Bar */}
      <div className="px-5 sm:px-8 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Room View
          </h1>
        </div>

        <div className="flex items-center gap-5 self-end sm:self-auto">
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Legend matching dynamic theme */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-primary/15 border border-primary/40 shadow-2xs" />
              <span className="text-slate-700 font-semibold text-[11.5px]">Vacant</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-primary shadow-2xs" />
              <span className="text-slate-700 font-semibold text-[11.5px]">In-house guest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Held Orders Card in Upper Right Corner */}
      {heldOrders.length > 0 && (
        <div className="absolute top-14 right-6 z-20 flex flex-col gap-2 max-w-xs animate-in slide-in-from-top-2">
          {heldOrders.map((held) => {
            const itemCount = Object.values(held.cart).reduce((sum, i) => sum + i.quantity, 0);
            const total = Object.values(held.cart).reduce(
              (sum, i) => sum + i.unitPrice * i.quantity,
              0,
            );

            return (
              <div
                key={held.id}
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-md flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate">
                      Room {held.roomNumber} ({held.guestName.split(" ")[0]})
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      {itemCount} items • ₹{total.toFixed(0)} • {held.savedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResumeHeldOrder && onResumeHeldOrder(held)}
                    className="px-2 py-1 rounded-lg bg-teal-700 text-white font-bold text-[10.5px] hover:bg-teal-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onCancelHeldOrder && onCancelHeldOrder(held.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                    title="Discard held order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Rows (Ultra Compact Single Screen Layout) */}
      <div className="flex-1 px-5 sm:px-8 py-2.5 space-y-2.5">
        {filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No rooms available</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? "No rooms match your search query."
                : "No active rooms found for the current property."}
            </p>
          </div>
        )}
        {Object.entries(groupedRooms).map(([category, categoryRooms]) => {
          if (categoryRooms.length === 0) return null;

          return (
            <div key={category} className="space-y-1 pb-1.5 border-b border-slate-100 last:border-0">
              {/* Category Header Title */}
              <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                {category}
              </h2>

              {/* Compact Doors Horizontal Row */}
              <div className="flex flex-wrap items-end gap-2.5 sm:gap-3.5 pt-0.5">
                {categoryRooms.map((room) => {
                  const isOccupied = room.isOccupied;

                  // ==========================================
                  // 1. OCCUPIED ROOM DOOR (Dynamic Theme Primary, Clickable)
                  // ==========================================
                  if (isOccupied) {
                    const chargeTotal =
                      room.posChargeTotal ??
                      (room.folioOrders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0) ??
                      room.activeOrder?.totalAmount ??
                      0;
                    const hasOrders =
                      chargeTotal > 0 || (room.folioOrders && room.folioOrders.length > 0);

                    return (
                      <div
                        key={room.id}
                        className="group relative flex flex-col items-center"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectRoom(room)}
                          title={`Room ${room.roomNumber} - Guest: ${room.guest?.name || "Occupied"} (Click to take order)`}
                          className="relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:-translate-y-1 bg-transparent border-0 p-0"
                        >
                          {/* Outer Door Frame Arch */}
                          <div className="relative w-[50px] sm:w-[58px] md:w-[64px] h-[70px] sm:h-[80px] md:h-[88px] rounded-t-[22px] sm:rounded-t-[26px] rounded-b-none p-[3.5px] sm:p-[4px] bg-primary shadow-2xs group-hover:shadow-md transition-all">
                            {/* Inner Door Leaf */}
                            <div className="w-full h-full rounded-t-[16px] sm:rounded-t-[20px] rounded-b-none bg-primary/90 text-primary-foreground relative flex flex-col items-center justify-between pt-2.5 sm:pt-3.5 pb-1 px-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] overflow-hidden">
                              <div className="absolute inset-x-1 top-1 bottom-0 rounded-t-[12px] sm:rounded-t-[15px] rounded-b-none border-t border-x border-white/20 pointer-events-none" />

                              <div className="relative z-10 text-center">
                                <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-primary-foreground drop-shadow-xs">
                                  {room.roomNumber}
                                </span>
                              </div>

                              <div className="absolute right-1 sm:right-1.5 top-[56%] -translate-y-1/2 flex items-center z-20 pointer-events-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-400 shadow-2xs flex items-center justify-center">
                                  <div className="w-0.5 h-0.5 rounded-full bg-slate-500" />
                                </div>
                                <div className="w-2 sm:w-2.5 h-0.5 -ml-0.5 rounded-r-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-400/90 shadow-2xs" />
                              </div>

                              <div className="relative z-10 w-full mt-auto text-center">
                                <span className="text-[7.5px] sm:text-[8px] text-primary-foreground/90 font-semibold truncate max-w-[48px] block mx-auto leading-tight">
                                  {room.guest?.name?.split(" ")[0] || "Guest"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-[85%] h-1 bg-slate-400/25 rounded-full blur-[1px] -mt-0.5 group-hover:bg-slate-500/35 transition-all" />
                        </button>

                        {hasOrders && (
                          <div className="mt-1 flex items-center gap-0.5 max-w-[72px]">
                            <span className="text-[9px] font-black text-slate-800 truncate">
                              ₹{Math.round(chargeTotal).toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewRoomOrders?.(room);
                              }}
                              title="View room orders"
                              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-teal-800 cursor-pointer"
                            >
                              <Info className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ==========================================
                  // 2. VACANT ROOM — not clickable (no guest assigned)
                  // ==========================================
                  return (
                    <div
                      key={room.id}
                      title={`Room ${room.roomNumber} — Vacant (no guest)`}
                      aria-label={`Room ${room.roomNumber} vacant`}
                      className="relative flex flex-col items-center select-none opacity-80 cursor-not-allowed"
                    >
                      <div className="relative w-[50px] sm:w-[58px] md:w-[64px] h-[70px] sm:h-[80px] md:h-[88px] rounded-t-[22px] sm:rounded-t-[26px] rounded-b-none p-[3.5px] sm:p-[4px] bg-primary/30 border border-primary/25 shadow-2xs">
                        <div className="w-full h-full rounded-t-[16px] sm:rounded-t-[20px] rounded-b-none bg-primary/10 text-foreground relative flex flex-col items-center justify-between pt-2.5 sm:pt-3.5 pb-1 px-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
                          <div className="absolute inset-x-1 top-1 bottom-0 rounded-t-[12px] sm:rounded-t-[15px] rounded-b-none border-t border-x border-primary/20 pointer-events-none" />

                          <div className="relative z-10 text-center">
                            <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-foreground">
                              {room.roomNumber}
                            </span>
                          </div>

                          <div className="absolute right-1 sm:right-1.5 top-[56%] -translate-y-1/2 flex items-center z-20 pointer-events-none opacity-70">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-400 shadow-2xs flex items-center justify-center">
                              <div className="w-0.5 h-0.5 rounded-full bg-slate-500" />
                            </div>
                            <div className="w-2 sm:w-2.5 h-0.5 -ml-0.5 rounded-r-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-400/90 shadow-2xs" />
                          </div>

                          <div className="relative z-10 w-full mt-auto text-center">
                            <span className="text-[7.5px] sm:text-[8px] text-primary font-bold block leading-tight">
                              Vacant
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-[85%] h-1 bg-slate-300/35 rounded-full blur-[1px] -mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}




