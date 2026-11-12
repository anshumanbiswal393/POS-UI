import React, { useState, useRef, useEffect, useMemo } from "react";
import { TableCardItem } from "./TableCardItem";
import type {
  RestaurantTable,
  ReservationItem,
  DiningArea,
  TableManagementStats,
} from "@/types/posTables";
import {
  Users,
  Sparkles,
  LayoutGrid,
  RotateCw,
  Plus,
  CalendarPlus,
  UserPlus,
  Utensils,
  AlertCircle,
  X,
  Trash2,
  BellRing,
  ArrowLeftRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { parseReservationDateTime } from "@/services/posTablesService";

interface TableFloorPlanProps {
  tables: RestaurantTable[];
  reservations?: ReservationItem[];
  areas?: string[];
  activeArea: DiningArea;
  onSelectArea: (area: DiningArea) => void;
  onSelectReserved: (table: RestaurantTable, reservation?: ReservationItem) => void;
  onSelectTable: (table: RestaurantTable) => void;
  onOpenAddArea?: () => void;
  onOpenAddTable?: () => void;
  onOpenBookReservation?: () => void;
  onOpenSeatGuest?: () => void;
  onOpenTakeOrder?: (tableId?: string) => void;
  onSwitchTable?: (reservation: ReservationItem) => void;
  onSeatReservation?: (tableId: string, reservationId?: string) => void;
  stats?: TableManagementStats;
  onRefresh?: () => void;
  onDeleteArea?: (area: string) => void;
  onDeleteTable?: (tableId: string) => void;
}

const DEFAULT_AREAS: string[] = [];

export function TableFloorPlan({
  tables = [],
  reservations = [],
  areas = DEFAULT_AREAS,
  activeArea,
  onSelectArea,
  onSelectReserved,
  onSelectTable,
  onOpenAddArea,
  onOpenAddTable,
  onOpenBookReservation,
  onOpenSeatGuest,
  onOpenTakeOrder,
  onSwitchTable,
  onSeatReservation,
  stats,
  onRefresh,
  onDeleteArea,
  onDeleteTable,
}: TableFloorPlanProps) {
  const [showNoAreaWarning, setShowNoAreaWarning] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<Date>(() => new Date());
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Periodic clock ticker to refresh upcoming 30m countdown and status
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Compute upcoming reservations starting within 30 minutes
  const upcomingAlerts = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status !== "reserved") return false;
      if (dismissedAlertIds.has(r.id)) return false;
      const start = parseReservationDateTime(r.reservationDate, r.reservationTime);
      if (!start) return false;
      const diffMs = start.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / (60 * 1000));
      // Trigger between -15 mins (due/just started) and 30 mins before
      return diffMins >= -15 && diffMins <= 30;
    });
  }, [reservations, now, dismissedAlertIds]);

  // Show notification popup / toast on first detection of upcoming reservations
  useEffect(() => {
    upcomingAlerts.forEach((r) => {
      const start = parseReservationDateTime(r.reservationDate, r.reservationTime);
      if (!start) return;
      const diffMins = Math.round((start.getTime() - Date.now()) / (60 * 1000));
      const timingText = diffMins <= 0 ? "due now" : `in ${diffMins} min${diffMins === 1 ? "" : "s"}`;
      toast.info(
        `Upcoming Reservation: ${r.tableNumber} for ${r.customerName} is ${timingText} (${r.reservationTime}). Hoteliers please prepare the table.`,
        {
          id: `upcoming-toast-${r.id}`,
          duration: 9000,
        },
      );
    });
  }, [upcomingAlerts]);

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  const handleAddTableClick = () => {
    if (areas.length === 0) {
      setShowNoAreaWarning(true);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setShowNoAreaWarning(false);
      }, 5000);
      return;
    }
    onOpenAddTable?.();
  };
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-y-auto">
      {/* 1. Header Bar: Title + Actions + Area Switcher Tabs */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-3.5 border-b border-slate-200/80 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Manage Tables</span>
              {stats && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {areas.length === 0 ? 0 : stats.totalTables} Tables
                </span>
              )}
            </h1>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Live restaurant seating layout, floor occupancy, and reservation schedule.
            </p>
          </div>

          {/* Area Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto relative">
            {/* Area Switcher with + button */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 relative">
              {areas.length === 0 ? (
                <div className="relative">

                  <button
                    type="button"
                    onClick={() => {
                      setShowNoAreaWarning(false);
                      onOpenAddArea?.();
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Area</span>
                  </button>
                </div>
              ) : null}
              {areas.map((area) => {
                const isActive = activeArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => onSelectArea(area)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}

              {/* Plus button to add new area */}
              {onOpenAddArea && areas.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenAddArea}
                  title="Add new floor / area"
                  className="flex items-center justify-center p-1 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}


            </div>

            {/* Add Table Button with Popover */}
            <div className="relative">
              {onOpenAddTable && (
                <button
                  type="button"
                  onClick={handleAddTableClick}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all ${
                    areas.length === 0
                      ? "bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed hover:bg-slate-200 hover:text-slate-400"
                      : "text-primary-foreground bg-primary hover:bg-primary/90 active:scale-95 cursor-pointer"
                  }`}
                  title={areas.length === 0 ? "First add a dining area to create tables" : "Add Table"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Table</span>
                </button>
              )}

              {/* Popup warning when clicking Add Table without any dining area */}
              {showNoAreaWarning && (
                <div className="absolute right-0 top-full mt-2.5 w-72 rounded-xl bg-white p-3.5 shadow-2xl border border-primary/25 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  {/* Caret pointing up to the Add Table button */}
                  <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 border-l border-t border-primary/25 bg-white" />

                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
                      <span>First add a dining area!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNoAreaWarning(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600 relative z-10">
                    Tables must belong to a dining area (e.g. Main Dining, Terrace). Please add your dining area first.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNoAreaWarning(false);
                      onOpenAddArea?.();
                    }}
                    className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-xs transition-all cursor-pointer relative z-10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dining Area Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Sub-Bar: Status Legend & Action Buttons */}
      <div className="px-5 py-2.5 sm:px-6 border-b border-slate-200/60 bg-white/70 backdrop-blur-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Counts Pill */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Available */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-slate-400 border border-slate-500" />
              <span>Available</span>
              <span className="text-[10px] text-slate-500 font-extrabold ml-0.5">
                ({areas.length === 0 ? 0 : (Array.isArray(tables) ? tables : []).filter((t) => t && t.status === "vacant").length})
              </span>
            </div>

            {/* Reserved */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-primary border border-primary" />
              <span>Reserved</span>
              <span className="text-[10px] text-primary font-extrabold ml-0.5">
                ({areas.length === 0 ? 0 : (Array.isArray(tables) ? tables : []).filter((t) => t && t.status === "reserved").length})
              </span>
            </div>

            {/* On Dine */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-300/80 text-orange-950 font-bold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-orange-500 border border-orange-600" />
              <span>On Dine</span>
              <span className="text-[10px] text-orange-700 font-extrabold ml-0.5">
                ({areas.length === 0 ? 0 : (Array.isArray(tables) ? tables : []).filter((t) => t && t.status === "occupied").length})
              </span>
            </div>
          </div>

          {/* User Requested: Quick action buttons */}
          <div className="flex items-center gap-2.5">
            {onOpenTakeOrder && (
              <button
                type="button"
                onClick={() => onOpenTakeOrder()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/20 rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-primary-foreground/80" />
                <span>Take Order / Book Table</span>
              </button>
            )}

            {onOpenBookReservation && (
              <button
                type="button"
                onClick={onOpenBookReservation}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0b192c] hover:bg-[#132c4e] active:bg-[#07111e] border border-slate-800 rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-amber-300" />
                <span>Book Reservation</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Refresh floor status"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2.5 Upcoming 30-Minute Reservation Alert Notification Banner */}
      {upcomingAlerts.length > 0 && (
        <div className="px-5 pt-3 sm:px-6 space-y-2 shrink-0">
          {upcomingAlerts.map((res) => {
            const start = parseReservationDateTime(res.reservationDate, res.reservationTime);
            const diffMins = start
              ? Math.round((start.getTime() - now.getTime()) / (60 * 1000))
              : 0;
            const timingBadge =
              diffMins <= 0
                ? "Due Now"
                : `in ${diffMins} min${diffMins === 1 ? "" : "s"}`;

            return (
              <div
                key={res.id}
                className="rounded-2xl bg-amber-50 border border-amber-300 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-amber-700 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                        Upcoming Reservation • {timingBadge}
                      </span>
                      <span className="text-[11px] font-bold text-amber-800">
                        Prepare Table
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold mt-1">
                      <span className="text-amber-950 font-extrabold">
                        {res.tableNumber}
                      </span>{" "}
                      is reserved for{" "}
                      <span className="text-slate-900 font-bold">
                        {res.customerName}
                      </span>{" "}
                      ({res.guests} Pax) at{" "}
                      <span className="text-amber-950 font-bold">
                        {res.reservationTime}
                      </span>
                      . Hoteliers please prepare the table for reservation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {onSwitchTable && (
                    <button
                      type="button"
                      onClick={() => onSwitchTable(res)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Switch Table</span>
                    </button>
                  )}
                  {onSeatReservation && (
                    <button
                      type="button"
                      onClick={() => onSeatReservation(res.tableId, res.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Seat Guests</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setDismissedAlertIds((prev) => new Set([...prev, res.id]))
                    }
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. The Floor Plan Grid (Compact Single Page View) */}
      <div className="flex-1 p-3 sm:p-5 flex items-start justify-center overflow-y-auto">
        {areas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No dining areas configured yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your restaurant floors or dining areas (e.g. Indoor, Rooftop, Garden, AC Hall) to set up tables.
            </p>
            {onOpenAddArea && (
              <div className="relative inline-block mt-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowNoAreaWarning(false);
                    onOpenAddArea();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Dining Area
                </button>
              </div>
            )}
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">
              {activeArea ? `No tables configured in ${activeArea}.` : "No tables configured."}
            </p>
            {onOpenAddTable && (
              <button
                type="button"
                onClick={onOpenAddTable}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {activeArea ? `Add First Table in ${activeArea}` : "Add First Table"}
              </button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-1 items-stretch">
            {tables.map((table) => (
              <TableCardItem
                key={table.id}
                table={table}
                onSelectReserved={onSelectReserved}
                onSelectTable={onSelectTable}
                onDeleteTable={onDeleteTable}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
