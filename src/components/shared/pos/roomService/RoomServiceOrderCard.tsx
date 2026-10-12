import React from "react";
import {
  Clock,
  User,
  Crown,
  ChefHat,
  Truck,
  CheckCircle2,
  Sparkles,
  BedDouble,
  BellRing,
  ArrowRight,
} from "lucide-react";
import type { RoomServiceOrder } from "@/types/posRoomService";

interface RoomServiceOrderCardProps {
  order: RoomServiceOrder;
  onSelectOrder: (order: RoomServiceOrder) => void;
  onAdvanceStatus: (orderId: string, currentStatus: RoomServiceOrder["status"]) => void;
}

export function RoomServiceOrderCard({
  order,
  onSelectOrder,
  onAdvanceStatus,
}: RoomServiceOrderCardProps) {
  const {
    orderNumber,
    roomNumber,
    floor,
    roomType,
    guest,
    items,
    status,
    elapsedMinutes,
    totalAmount,
    assignedRunner,
    traySetup,
    isUrgent,
  } = order;

  // Status visual mapping
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      <ChefHat className="w-3 h-3" />
      Kitchen Prep
    </span>
  );
  let nextActionLabel = "Pack & Ready Tray";

  if (status === "tray_ready") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        <Sparkles className="w-3 h-3" />
        Tray Packed
      </span>
    );
    nextActionLabel = "Dispatch to Room";
  } else if (status === "dispatched") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <Truck className="w-3 h-3" />
        On the way
      </span>
    );
    nextActionLabel = "Confirm Delivery";
  } else if (status === "delivered") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        <CheckCircle2 className="w-3 h-3" />
        Delivered / In Room
      </span>
    );
    nextActionLabel = "Call Tray Clearance";
  } else if (status === "clearance_needed") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
        <BellRing className="w-3 h-3 text-rose-600" />
        Clearance Needed
      </span>
    );
    nextActionLabel = "Tray Cleared";
  }

  return (
    <div
      onClick={() => onSelectOrder(order)}
      className="group relative flex flex-col justify-between p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Top Bar: Room Number + Order Number + Elapsed Time */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-base shadow-xs group-hover:scale-105 transition-transform">
              {roomNumber}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">{orderNumber}</span>
                {isUrgent && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                    Urgent
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {floor} • {roomType}
              </span>
            </div>
          </div>

          <div className="text-right">
            {statusBadge}
            <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-500 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{elapsedMinutes}m ago</span>
            </div>
          </div>
        </div>

        {/* Guest info */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{guest.name}</span>
          </div>
          {guest.vipTier && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              <Crown className="w-2.5 h-2.5 text-amber-600" />
              VIP {guest.vipTier}
            </span>
          )}
        </div>

        {/* Dish Items Snapshot */}
        <div className="mt-2.5 space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-xs">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span className="text-slate-800 font-medium truncate">
                <strong className="text-primary font-bold">{item.quantity}x</strong> {item.name}
              </span>
              <span className="text-slate-500 text-[11px] font-mono shrink-0">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-[10.5px] font-semibold text-slate-400 italic">
              +{items.length - 3} more items...
            </div>
          )}
        </div>

        {/* Tray & Runner badge */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {traySetup}
          </span>
          <span className="truncate text-slate-500">
            {assignedRunner ? `Butler: ${assignedRunner.split(" ")[0]}` : "Unassigned"}
          </span>
        </div>
      </div>

      {/* Bottom Actions: Total Amount + One-Click State Transition */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
          <span className="text-base font-bold text-slate-900 leading-none">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdvanceStatus(order.id, status);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer shadow-xs active:scale-95"
          title={nextActionLabel}
        >
          <span>{nextActionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
