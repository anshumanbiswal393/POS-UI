import React from "react";
import { Users, Clock, CalendarCheck, Trash2, Plus } from "lucide-react";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";

interface TableCardItemProps {
  table: RestaurantTable;
  onSelectReserved: (table: RestaurantTable, reservation?: ReservationItem) => void;
  onSelectTable: (table: RestaurantTable) => void;
  onDeleteTable?: (tableId: string) => void;
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
  let chairBg = "bg-slate-400 border-slate-500/70";
  if (status === "reserved") {
    chairBg = "bg-teal-600 border-teal-700/70";
  } else if (status === "occupied") {
    chairBg = "bg-orange-500 border-orange-600/70";
  }

  const isHorizontal = orientation === "top" || orientation === "bottom";

  return (
    <div
      className={`relative rounded-[2.5px] border transition-all duration-200 shrink-0 ${chairBg} ${
        isHorizontal ? "h-1.5 w-3.5" : "h-3.5 w-1.5"
      }`}
    >
      <div className="absolute inset-0.5 rounded-[1px] bg-white/25" />
    </div>
  );
}

function formatElapsed(elapsedMinutes: number): string {
  if (!elapsedMinutes || elapsedMinutes <= 0) return "1m";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function TableCardItem({
  table,
  onSelectReserved,
  onSelectTable,
  onDeleteTable,
}: TableCardItemProps) {
  const { status, capacity, tableNumber, activeReservation, activeOrder } = table;

  // Chair distribution matching capacity
  const getChairDistribution = (cap: number) => {
    if (cap <= 1) return { top: 1, bottom: 0, left: 0, right: 0 };
    if (cap === 2) return { top: 1, bottom: 1, left: 0, right: 0 };
    if (cap === 3) return { top: 1, bottom: 1, left: 1, right: 0 };
    if (cap === 4) return { top: 1, bottom: 1, left: 1, right: 1 };
    if (cap === 5) return { top: 2, bottom: 2, left: 1, right: 0 };
    if (cap === 6) return { top: 2, bottom: 2, left: 1, right: 1 };
    if (cap === 7) return { top: 3, bottom: 3, left: 1, right: 0 };
    if (cap === 8) return { top: 3, bottom: 3, left: 1, right: 1 };
    if (cap <= 10) return { top: 4, bottom: 4, left: 1, right: 1 };

    const sidesCount = cap >= 16 ? 4 : 2;
    const left = Math.ceil(sidesCount / 2);
    const right = Math.floor(sidesCount / 2);
    const remaining = cap - (left + right);
    const top = Math.ceil(remaining / 2);
    const bottom = Math.floor(remaining / 2);

    return { top, bottom, left, right };
  };

  const { top: topChairs, bottom: bottomChairs, left: leftChairs, right: rightChairs } =
    getChairDistribution(capacity);

  const maxTopBottom = Math.max(topChairs, bottomChairs);
  // Proportional sizing of table surface so 2 to 16 seats fit within fixed card dimensions
  const surfaceWidthClass =
    maxTopBottom >= 5
      ? "w-36 max-w-[144px]"
      : maxTopBottom >= 3
        ? "w-32"
        : maxTopBottom >= 2
          ? "w-28"
          : "w-24";

  // Card styles by status
  let cardBgClass = "bg-[#fbfcfc] hover:bg-white border-slate-200/90 hover:border-slate-300";
  let footerBgClass = "bg-slate-50/80 border-slate-100";
  let surfaceStyle = "bg-white text-slate-800 border-slate-300 shadow-2xs ring-1 ring-slate-200/80";
  let statusBadge = (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Available
    </span>
  );

  if (status === "occupied") {
    cardBgClass = "bg-[#fdfaf6] hover:bg-[#fffcf9] border-orange-200/80 hover:border-orange-300";
    footerBgClass = "bg-[#faeee2]/70 border-orange-200/60";
    surfaceStyle = "bg-orange-50/90 text-orange-950 border-orange-300 shadow-2xs ring-1 ring-orange-400/30";
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        On Dine
      </span>
    );
  } else if (status === "reserved") {
    cardBgClass = "bg-[#f6fbfb] hover:bg-[#faffff] border-teal-200/80 hover:border-teal-300";
    footerBgClass = "bg-[#e6f7f6]/70 border-teal-200/60";
    surfaceStyle = "bg-teal-50/90 text-teal-950 border-teal-300 shadow-2xs ring-1 ring-teal-400/30";
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
        <CalendarCheck className="w-2.5 h-2.5" />
        Reserved
      </span>
    );
  } else if (status === "blocked") {
    cardBgClass = "bg-slate-100/60 border-slate-200";
    footerBgClass = "bg-slate-100/80 border-slate-200";
    surfaceStyle = "bg-slate-200/60 text-slate-500 border-slate-300 shadow-none";
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
        Blocked
      </span>
    );
  }

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
      className={`group relative flex flex-col w-full h-[215px] rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 select-none cursor-pointer overflow-hidden ${cardBgClass}`}
    >
      {/* 1. Header Zone: Table Name prominently, Seat count below it, Status badge at top-right */}
      <div className="flex items-start justify-between px-3.5 pt-3 pb-1 shrink-0">
        <div className="min-w-0 pr-2">
          <h3 className="text-[13.5px] font-bold text-slate-900 tracking-tight leading-snug truncate">
            {tableNumber}
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5">
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{capacity} Seats</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onDeleteTable && status === "vacant" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete ${tableNumber}?`)) {
                  onDeleteTable(table.id);
                }
              }}
              className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title={`Delete ${tableNumber}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {statusBadge}
        </div>
      </div>

      {/* 2. Middle Zone: Exact Table Representation Centered, scaled proportionally */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2 py-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center">
          {/* Top Chairs Row */}
          {topChairs > 0 && (
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
              {Array.from({ length: topChairs }).map((_, i) => (
                <Chair key={`top-${i}`} orientation="top" status={status} />
              ))}
            </div>
          )}

          {/* Middle Row: Left Chairs + Table Surface + Right Chairs */}
          <div className="flex items-center justify-center gap-0.5">
            {leftChairs > 0 && (
              <div className="flex flex-col items-center justify-center gap-1 mr-0.5">
                {Array.from({ length: leftChairs }).map((_, i) => (
                  <Chair key={`left-${i}`} orientation="left" status={status} />
                ))}
              </div>
            )}

            {/* Physical Table Surface */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 h-13 sm:h-14 py-1 px-2 ${surfaceStyle} ${surfaceWidthClass}`}
            >
              {status === "occupied" ? (
                <div className="flex flex-col items-center justify-center gap-1 w-full">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-600 text-white shadow-xs leading-none">
                    On Dine
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold text-orange-950 leading-tight whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5 text-orange-800">
                      <Clock className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                      <span>{formatElapsed(activeOrder?.elapsedMinutes || 0)}</span>
                    </span>
                    <span className="text-orange-300 font-normal">•</span>
                    <span className="text-orange-950 font-extrabold">
                      ₹{Math.round(activeOrder?.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : status === "reserved" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-teal-600 text-white shadow-xs leading-none">
                  Reserved
                </span>
              ) : status === "blocked" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-semibold text-slate-500 bg-slate-200/80 leading-none">
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/70 leading-none">
                  Available
                </span>
              )}
            </div>

            {rightChairs > 0 && (
              <div className="flex flex-col items-center justify-center gap-1 ml-0.5">
                {Array.from({ length: rightChairs }).map((_, i) => (
                  <Chair key={`right-${i}`} orientation="right" status={status} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Chairs Row */}
          {bottomChairs > 0 && (
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-0.5">
              {Array.from({ length: bottomChairs }).map((_, i) => (
                <Chair key={`bottom-${i}`} orientation="bottom" status={status} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Zone: Status & Order / Reservation details Footer Bar */}
      <div className={`px-3.5 py-2 shrink-0 border-t flex items-center justify-between ${footerBgClass}`}>
        {status === "occupied" ? (
          <>
            <div className="min-w-0 pr-2">
              <div className="text-[12.5px] font-extrabold text-slate-900 leading-tight">
                ₹{Math.round(activeOrder?.totalAmount || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[9.5px] font-medium text-slate-500 mt-0.5">
                {activeOrder?.orderNumber ? `Order #${activeOrder.orderNumber}` : "1 active order"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-orange-800 shrink-0">
              <Clock className="w-3 h-3 text-orange-600 shrink-0" />
              <span>{formatElapsed(activeOrder?.elapsedMinutes || 0)}</span>
            </div>
          </>
        ) : status === "reserved" ? (
          <>
            <div className="min-w-0 pr-2">
              <div className="text-[11.5px] font-bold text-teal-900 leading-tight">
                Reserved
              </div>
              <div className="text-[9.5px] font-medium text-slate-500 mt-0.5 truncate max-w-[120px]">
                {activeReservation?.customerName || "Guest"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-teal-800 shrink-0">
              <Clock className="w-3 h-3 text-teal-600 shrink-0" />
              <span>{activeReservation?.reservationTime || "Scheduled"}</span>
            </div>
          </>
        ) : status === "blocked" ? (
          <div className="min-w-0 pr-2">
            <div className="text-[11.5px] font-semibold text-slate-700 leading-tight">
              Unavailable
            </div>
            <div className="text-[9.5px] font-normal text-slate-400 mt-0.5">
              Table blocked
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 pr-2">
              <div className="text-[11.5px] font-semibold text-emerald-800 leading-tight">
                Ready for guests
              </div>
              <div className="text-[9.5px] font-normal text-slate-400 mt-0.5">
                Tap to take order
              </div>
            </div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-700 shrink-0">
              <Plus className="w-3 h-3" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
