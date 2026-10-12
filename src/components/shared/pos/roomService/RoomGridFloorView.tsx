import React from "react";
import { BedDouble, User, Crown, Utensils, Plus, BellRing, Clock, Sparkles } from "lucide-react";
import type { HotelRoom, RoomServiceOrder, RoomFloor } from "@/types/posRoomService";

interface RoomGridFloorViewProps {
  rooms: HotelRoom[];
  selectedFloor: RoomFloor;
  onSelectFloor: (floor: RoomFloor) => void;
  onSelectRoomOrder: (order: RoomServiceOrder) => void;
  onOpenNewOrderModal: (preselectedRoomNumber?: string) => void;
}

const FLOORS: RoomFloor[] = [
  "All",
  "Floor 1",
  "Floor 2",
  "Floor 3 (Executive)",
  "Floor 4 (Suites)",
];

export function RoomGridFloorView({
  rooms,
  selectedFloor,
  onSelectFloor,
  onSelectRoomOrder,
  onOpenNewOrderModal,
}: RoomGridFloorViewProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 space-y-4 overflow-y-auto">
      {/* Floor Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
          {FLOORS.map((floor) => {
            const isActive = selectedFloor === floor;
            return (
              <button
                key={floor}
                type="button"
                onClick={() => onSelectFloor(floor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {floor}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Active Dining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Tray Clearance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const { roomNumber, roomType, isOccupied, guest, activeOrder, trayClearancePending } =
            room;

          let cardBorder = "border-slate-200 bg-white hover:border-slate-300";
          if (trayClearancePending) {
            cardBorder =
              "border-rose-300 bg-rose-50/40 hover:border-rose-400 ring-1 ring-rose-300/40";
          } else if (activeOrder) {
            cardBorder =
              "border-primary/40 bg-primary/5 hover:border-primary ring-1 ring-primary/20";
          }

          return (
            <div
              key={room.id}
              className={`p-4 rounded-2xl border shadow-xs transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                {/* Room Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-sm shadow-xs">
                      {roomNumber}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        Room {roomNumber}
                      </div>
                      <span className="text-[10.5px] text-slate-400 block">{roomType}</span>
                    </div>
                  </div>

                  {/* Occupancy / Clearance badge */}
                  {trayClearancePending ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                      <BellRing className="w-2.5 h-2.5 text-rose-600" />
                      Clear Tray
                    </span>
                  ) : activeOrder ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                      <Utensils className="w-2.5 h-2.5 text-primary" />
                      Dining
                    </span>
                  ) : isOccupied ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      Occupied
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                      Vacant
                    </span>
                  )}
                </div>

                {/* Guest details if occupied */}
                {isOccupied && guest ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">{guest.name}</span>
                      {guest.vipTier && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700">
                          <Crown className="w-2.5 h-2.5 text-amber-600" />
                          {guest.vipTier}
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5">
                      Ext. {guest.phoneExtension} • {guest.checkInDate} - {guest.checkOutDate}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-400 italic">
                    Ready for guest check-in
                  </div>
                )}

                {/* Active Order Card info */}
                {activeOrder && (
                  <div
                    onClick={() => onSelectRoomOrder(activeOrder)}
                    className="mt-3 p-2.5 rounded-xl bg-white border border-primary/20 shadow-xs hover:border-primary cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">{activeOrder.orderNumber}</span>
                      <span className="font-bold text-slate-900">
                        ${activeOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="capitalize">{activeOrder.status.replace("_", " ")}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {activeOrder.elapsedMinutes}m
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-2 border-t border-slate-100">
                {activeOrder ? (
                  <button
                    type="button"
                    onClick={() => onSelectRoomOrder(activeOrder)}
                    className="w-full py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    View Room Folio
                  </button>
                ) : isOccupied ? (
                  <button
                    type="button"
                    onClick={() => onOpenNewOrderModal(roomNumber)}
                    className="w-full py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Room Order
                  </button>
                ) : (
                  <div className="text-center py-1 text-[11px] text-slate-400 font-medium">
                    Room Vacant
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
