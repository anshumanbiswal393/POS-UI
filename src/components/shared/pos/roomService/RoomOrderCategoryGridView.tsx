import React, { useState, useMemo } from "react";
import type { HotelRoom } from "@/types/posRoomService";
import type { HeldRoomOrder } from "./RoomOrderWizardModal";
import { Search, PauseCircle, Trash2, ArrowRight } from "lucide-react";

interface RoomOrderCategoryGridViewProps {
  rooms: HotelRoom[];
  heldOrders?: HeldRoomOrder[];
  onSelectOccupiedRoom: (room: HotelRoom) => void;
  onResumeHeldOrder?: (heldOrder: HeldRoomOrder) => void;
  onCancelHeldOrder?: (heldOrderId: string) => void;
}

const CATEGORY_ORDER = ["Standard Rooms", "Deluxe Rooms", "Superior Rooms", "Suite Rooms"];

export function RoomOrderCategoryGridView({
  rooms,
  heldOrders = [],
  onSelectOccupiedRoom,
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
              className="w-44 pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00827a]/20 focus:border-[#00827a] transition-all"
            />
          </div>

          {/* Legend matching reference image */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#c7efe9] border border-[#00827a] shadow-2xs" />
              <span className="text-slate-700 font-semibold text-[11.5px]">Vacant</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#00827a] shadow-2xs" />
              <span className="text-slate-700 font-semibold text-[11.5px]">Occupied</span>
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
                  // 1. OCCUPIED ROOM DOOR (Dark Teal, Clickable)
                  // ==========================================
                  if (isOccupied) {
                    return (
                      <div
                        key={room.id}
                        onClick={() => onSelectOccupiedRoom(room)}
                        title={`Room ${room.roomNumber} - Guest: ${room.guest?.name || "Occupied"} (Click to take order)`}
                        className="group relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:-translate-y-1"
                      >
                        {/* Outer Door Frame Arch */}
                        <div className="relative w-[50px] sm:w-[58px] md:w-[64px] h-[70px] sm:h-[80px] md:h-[88px] rounded-t-[22px] sm:rounded-t-[26px] rounded-b-none p-[3.5px] sm:p-[4px] bg-[#006e67] shadow-2xs group-hover:shadow-md group-hover:bg-[#005c56] transition-all">
                          {/* Inner Door Leaf */}
                          <div className="w-full h-full rounded-t-[16px] sm:rounded-t-[20px] rounded-b-none bg-[#00837b] text-white relative flex flex-col items-center justify-between pt-2.5 sm:pt-3.5 pb-1 px-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] overflow-hidden">
                            {/* Inner Recessed Moulding Groove Line */}
                            <div className="absolute inset-x-1 top-1 bottom-0 rounded-t-[12px] sm:rounded-t-[15px] rounded-b-none border-t border-x border-[#006c65]/80 pointer-events-none" />

                            {/* Room Number on Door */}
                            <div className="relative z-10 text-center">
                              <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-white drop-shadow-xs">
                                {room.roomNumber}
                              </span>
                            </div>

                            {/* Horizontal Lever Handle on Right Edge */}
                            <div className="absolute right-1 sm:right-1.5 top-[56%] -translate-y-1/2 flex items-center z-20 pointer-events-none">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-400 shadow-2xs flex items-center justify-center">
                                <div className="w-0.5 h-0.5 rounded-full bg-slate-500" />
                              </div>
                              <div className="w-2 sm:w-2.5 h-0.5 -ml-0.5 rounded-r-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-400/90 shadow-2xs" />
                            </div>

                            {/* Guest Name ONLY at bottom (no price) */}
                            <div className="relative z-10 w-full mt-auto text-center">
                              <span className="text-[7.5px] sm:text-[8px] text-teal-100/90 font-semibold truncate max-w-[48px] block mx-auto group-hover:text-white leading-tight">
                                {room.guest?.name?.split(" ")[0] || "Guest"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Soft Floor Shadow at Door Base */}
                        <div className="w-[85%] h-1 bg-slate-400/25 rounded-full blur-[1px] -mt-0.5 group-hover:bg-slate-500/35 transition-all" />
                      </div>
                    );
                  }

                  // ==========================================
                  // 2. VACANT / AVAILABLE ROOM DOOR (Light Mint, Clickable to take order)
                  // ==========================================
                  return (
                    <div
                      key={room.id}
                      onClick={() => onSelectOccupiedRoom(room)}
                      title={`Room ${room.roomNumber} - Available (Click to take order)`}
                      className="group relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:-translate-y-1 select-none"
                    >
                      {/* Outer Door Frame Arch */}
                      <div className="relative w-[50px] sm:w-[58px] md:w-[64px] h-[70px] sm:h-[80px] md:h-[88px] rounded-t-[22px] sm:rounded-t-[26px] rounded-b-none p-[3.5px] sm:p-[4px] bg-[#00827a] shadow-2xs group-hover:shadow-md transition-all">
                        {/* Inner Door Leaf (Light Mint Cyan) */}
                        <div className="w-full h-full rounded-t-[16px] sm:rounded-t-[20px] rounded-b-none bg-gradient-to-b from-[#e3f7f5] via-[#d0f0ed] to-[#c4ebe8] group-hover:from-[#f0fcfb] group-hover:to-[#d2f3f0] text-[#0f2e2b] relative flex flex-col items-center justify-between pt-2.5 sm:pt-3.5 pb-1 px-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
                          {/* Inner Recessed Moulding Groove Line */}
                          <div className="absolute inset-x-1 top-1 bottom-0 rounded-t-[12px] sm:rounded-t-[15px] rounded-b-none border-t border-x border-[#b0e6e2] pointer-events-none" />

                          {/* Room Number on Door (Dark Bold) */}
                          <div className="relative z-10 text-center">
                            <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-[#0f2e2b]">
                              {room.roomNumber}
                            </span>
                          </div>

                          {/* Horizontal Lever Handle on Right Edge */}
                          <div className="absolute right-1 sm:right-1.5 top-[56%] -translate-y-1/2 flex items-center z-20 pointer-events-none opacity-80">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-400 shadow-2xs flex items-center justify-center">
                              <div className="w-0.5 h-0.5 rounded-full bg-slate-500" />
                            </div>
                            <div className="w-2 sm:w-2.5 h-0.5 -ml-0.5 rounded-r-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-400/90 shadow-2xs" />
                          </div>

                          {/* Available label */}
                          <div className="relative z-10 w-full mt-auto text-center">
                            <span className="text-[7.5px] sm:text-[8px] text-teal-800 font-semibold block leading-tight">
                              Available
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Soft Floor Shadow at Door Base */}
                      <div className="w-[85%] h-1 bg-slate-300/35 rounded-full blur-[1px] -mt-0.5 group-hover:bg-slate-400/40 transition-all" />
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




