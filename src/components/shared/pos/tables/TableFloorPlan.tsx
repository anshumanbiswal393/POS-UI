import React from "react";
import { TableCardItem } from "./TableCardItem";
import type {
  RestaurantTable,
  ReservationItem,
  DiningArea,
  TableManagementStats,
} from "@/types/posTables";
import { Users, Sparkles, LayoutGrid, RotateCw, Plus, CalendarPlus, UserPlus, Utensils } from "lucide-react";

interface TableFloorPlanProps {
  tables: RestaurantTable[];
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
  stats?: TableManagementStats;
  onRefresh?: () => void;
}

const DEFAULT_AREAS: string[] = [];

export function TableFloorPlan({
  tables,
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
  stats,
  onRefresh,
}: TableFloorPlanProps) {
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
                  {stats.totalTables} Tables
                </span>
              )}
            </h1>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Live restaurant seating layout, floor occupancy, and reservation schedule.
            </p>
          </div>

          {/* Area Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Area Switcher with + button */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
              {areas.length === 0 ? (
                <button
                  type="button"
                  onClick={onOpenAddArea}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Area</span>
                </button>
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

            {/* Add Table Button */}
            {onOpenAddTable && (
              <button
                type="button"
                onClick={onOpenAddTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Table</span>
              </button>
            )}
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
                ({tables.filter((t) => t.status === "vacant").length})
              </span>
            </div>

            {/* Reserved */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-primary border border-primary" />
              <span>Reserved</span>
              <span className="text-[10px] text-primary font-extrabold ml-0.5">
                ({tables.filter((t) => t.status === "reserved").length})
              </span>
            </div>

            {/* On Dine */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-300/80 text-orange-950 font-bold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-orange-500 border border-orange-600" />
              <span>On Dine</span>
              <span className="text-[10px] text-orange-700 font-extrabold ml-0.5">
                ({tables.filter((t) => t.status === "occupied").length})
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
              <button
                type="button"
                onClick={onOpenAddArea}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dining Area
              </button>
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
          <div className="w-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 justify-items-center items-center py-1">
            {tables.map((table) => (
              <TableCardItem
                key={table.id}
                table={table}
                onSelectReserved={onSelectReserved}
                onSelectTable={onSelectTable}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
