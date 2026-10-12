import React from "react";
import { Users, Clock, Receipt, CalendarCheck } from "lucide-react";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";

interface TableCardItemProps {
  table: RestaurantTable;
  onSelectReserved: (table: RestaurantTable, reservation?: ReservationItem) => void;
  onSelectTable: (table: RestaurantTable) => void;
}

/**
 * Renders an individual chair positioned outside the table border.
 */
function Chair({
  orientation,
  status,
}: {
  orientation: "top" | "bottom" | "left" | "right";
  status: RestaurantTable["status"];
}) {
  // Color palette for chairs matching table status with high contrast
  let chairBg = "bg-slate-400 border-slate-500 shadow-2xs";
  if (status === "reserved") {
    chairBg = "bg-primary border-primary/80 shadow-xs";
  } else if (status === "occupied") {
    chairBg = "bg-orange-500 border-orange-600 shadow-xs";
  }

  const isHorizontal = orientation === "top" || orientation === "bottom";

  return (
    <div
      className={`relative rounded-xs border transition-all duration-200 ${chairBg} ${
        isHorizontal ? "h-2 w-3.5 sm:h-2 sm:w-4" : "h-3.5 w-2 sm:h-4 sm:w-2"
      }`}
    >
      {/* Inner backrest cushion curve for realistic depth */}
      <div className="absolute inset-0.5 rounded-[1px] bg-white/30" />
    </div>
  );
}

export function TableCardItem({ table, onSelectReserved, onSelectTable }: TableCardItemProps) {
  const { status, capacity, tableNumber, activeReservation, activeOrder } = table;

  // Determine chair layout count strictly matching capacity
  const getChairDistribution = (cap: number) => {
    if (cap <= 1) return { top: 1, bottom: 0, left: 0, right: 0 };
    if (cap === 2) return { top: 1, bottom: 1, left: 0, right: 0 };
    if (cap === 3) return { top: 1, bottom: 1, left: 1, right: 0 };
    if (cap === 4) return { top: 1, bottom: 1, left: 1, right: 1 };
    if (cap === 5) return { top: 2, bottom: 2, left: 1, right: 0 };
    if (cap === 6) return { top: 3, bottom: 3, left: 0, right: 0 };
    if (cap === 7) return { top: 3, bottom: 3, left: 1, right: 0 };
    if (cap === 8) return { top: 3, bottom: 3, left: 1, right: 1 };
    if (cap === 9) return { top: 4, bottom: 4, left: 1, right: 0 };
    if (cap === 10) return { top: 4, bottom: 4, left: 1, right: 1 };

    // For capacity >= 11 (e.g. 11, 12, 14, 16, 20...)
    const sidesCount = cap >= 16 ? 4 : 2;
    const left = Math.ceil(sidesCount / 2);
    const right = Math.floor(sidesCount / 2);
    const remaining = cap - (left + right);
    const top = Math.ceil(remaining / 2);
    const bottom = Math.floor(remaining / 2);

    return { top, bottom, left, right };
  };

  const {
    top: topChairs,
    bottom: bottomChairs,
    left: leftChairs,
    right: rightChairs,
  } = getChairDistribution(capacity);

  // High-contrast, vibrant visual styling of the table surface based on status
  let tableStyle =
    "bg-white text-slate-800 border-slate-300 hover:border-slate-500 hover:bg-slate-50 shadow-xs ring-1 ring-slate-200/80";
  let statusBadge = null;

  if (status === "reserved") {
    tableStyle =
      "bg-primary/5 text-foreground border-primary/40 hover:bg-primary/10 shadow-xs ring-1 ring-primary/30";
    statusBadge = (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectReserved(table, activeReservation);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
        title="Click to view reservation details"
      >
        <CalendarCheck className="w-3 h-3" />
        Reserved
      </button>
    );
  } else if (status === "occupied") {
    tableStyle =
      "bg-[#fff7ed] text-orange-950 border-orange-400 hover:bg-[#ffedd5] shadow-xs ring-1 ring-orange-500/40";
    statusBadge = (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-600 text-white shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        On Dine
      </div>
    );
  } else {
    // Vacant
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[9.5px] font-semibold text-slate-400 bg-slate-100">
        Available
      </span>
    );
  }

  const maxTopBottom = Math.max(topChairs, bottomChairs);
  const isExtraWide = maxTopBottom >= 5;
  const isWide = maxTopBottom >= 3;

  const handleClick = () => {
    if (status === "reserved") {
      onSelectReserved(table, activeReservation);
    } else {
      onSelectTable(table);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col items-center justify-center p-1 sm:p-1.5 select-none cursor-pointer transition-all duration-200 hover:scale-[1.03]"
    >
      {/* Top Chairs Row */}
      {topChairs > 0 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5">
          {Array.from({ length: topChairs }).map((_, i) => (
            <Chair key={`top-${i}`} orientation="top" status={status} />
          ))}
        </div>
      )}

      {/* Middle Row: Left Chairs + Table Surface + Right Chairs */}
      <div className="flex items-center justify-center gap-0.5">
        {/* Left Chairs */}
        {leftChairs > 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 mr-0.5">
            {Array.from({ length: leftChairs }).map((_, i) => (
              <Chair key={`left-${i}`} orientation="left" status={status} />
            ))}
          </div>
        )}

        {/* The Physical Table Surface */}
        <div
          className={`relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 ${tableStyle} ${
            isExtraWide
              ? "w-48 sm:w-56 h-20 sm:h-22 px-3"
              : isWide
                ? "w-36 sm:w-42 h-20 sm:h-22 px-2.5"
                : "w-26 sm:w-30 h-20 sm:h-22 px-2"
          }`}
        >
          {/* Table Header / Number */}
          <span className="text-xs sm:text-[13.5px] font-extrabold tracking-tight">
            {tableNumber}
          </span>

          {/* Capacity Indicator */}
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] opacity-85 mt-0.5 font-semibold">
            <Users className="w-2.5 h-2.5 opacity-80" />
            <span>{capacity} Seats</span>
          </div>

          {/* Reservation / On-Dine Tag */}
          <div className="mt-1 min-h-[18px] flex items-center justify-center">{statusBadge}</div>

          {/* Active order info / reservation summary mini ticker */}
          {status === "occupied" && activeOrder && (
            <div className="mt-0.5 flex items-center gap-1 text-[9.5px] font-bold text-orange-950 bg-orange-100/90 px-1.5 py-0.2 rounded border border-orange-200/80">
              <Clock className="w-2 h-2 text-orange-700" />
              <span>{activeOrder.elapsedMinutes}m</span>
              <span>•</span>
              <Receipt className="w-2 h-2 text-orange-700" />
              <span>${activeOrder.totalAmount.toFixed(2)}</span>
            </div>
          )}

          {status === "reserved" && activeReservation && (
            <div className="mt-0.5 text-[9.5px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/30 truncate max-w-[110px]">
              {activeReservation.customerName.split(" ")[0]} ({activeReservation.reservationTime})
            </div>
          )}
        </div>

        {/* Right Chairs */}
        {rightChairs > 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 ml-0.5">
            {Array.from({ length: rightChairs }).map((_, i) => (
              <Chair key={`right-${i}`} orientation="right" status={status} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Chairs Row */}
      {bottomChairs > 0 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5">
          {Array.from({ length: bottomChairs }).map((_, i) => (
            <Chair key={`bottom-${i}`} orientation="bottom" status={status} />
          ))}
        </div>
      )}
    </div>
  );
}
