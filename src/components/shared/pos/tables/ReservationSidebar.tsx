import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  Phone,
  Calendar,
  Utensils,
  CheckCircle2,
} from "lucide-react";
import type { ReservationItem, RestaurantTable } from "@/types/posTables";

interface ReservationSidebarProps {
  reservations: ReservationItem[];
  tables: RestaurantTable[];
  selectedDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
  onSelectReservation: (reservation: ReservationItem) => void;
  onOpenNewBookingModal: () => void;
}

export function ReservationSidebar({
  reservations = [],
  tables = [],
  selectedDate,
  onPrevDate,
  onNextDate,
  onSelectReservation,
  onOpenNewBookingModal,
}: ReservationSidebarProps) {
  const [filterTab, setFilterTab] = useState<"all" | "reservation" | "on_dine">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const safeTables = Array.isArray(tables) ? tables : [];

  // Filter reservations and active seatings
  const reservedItems = safeReservations.filter((r) => r && r.status === "reserved");
  const occupiedTables = safeTables.filter((t) => t && t.status === "occupied");

  // Filter based on tab and search
  const filteredReservations = safeReservations.filter((r) => {
    if (!r) return false;
    if (filterTab === "reservation" && r.status !== "reserved") return false;
    if (filterTab === "on_dine" && r.status !== "seated") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.customerName || "").toLowerCase().includes(q);
      const matchPhone = (r.customerPhone || "").toLowerCase().includes(q);
      const matchTable = r.tableNumber.toLowerCase().includes(q);
      return matchName || matchPhone || matchTable;
    }
    return true;
  });

  const totalCount = reservations.length + occupiedTables.length;
  const reservationCount = reservedItems.length;
  const onDineCount = occupiedTables.length;

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col bg-white border-r border-slate-200/80 shadow-xs h-full shrink-0">
      {/* 1. Filter Tabs (All, Reservation, On Dine) */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              filterTab === "all"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterTab === "all" ? "bg-teal-800 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("reservation")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              filterTab === "reservation"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Reservation</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterTab === "reservation"
                  ? "bg-teal-800 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {reservationCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("on_dine")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              filterTab === "on_dine"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>On Dine</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterTab === "on_dine" ? "bg-teal-800 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {onDineCount}
            </span>
          </button>
        </div>

        {/* 2. Date Navigator (< Thu, 11 January 2024 >) */}
        <div className="mt-3 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onPrevDate}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>{selectedDate}</span>
          </div>

          <button
            type="button"
            onClick={onNextDate}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Search Customer Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers, tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title="Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Reservations & Seating Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredReservations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No bookings found matching your criteria.
          </div>
        ) : (
          filteredReservations.map((res) => {
            const isSeated = res.status === "seated";
            return (
              <div
                key={res.id}
                onClick={() => onSelectReservation(res)}
                className="group p-3 rounded-xl border border-slate-200/80 bg-white hover:border-teal-300 hover:shadow-xs transition-all duration-150 cursor-pointer flex items-start gap-3 relative"
              >
                {/* Time badge on the left */}
                <div
                  className={`w-16 shrink-0 py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center font-bold text-[11px] leading-tight ${
                    isSeated
                      ? "bg-orange-50 text-orange-700 border border-orange-200/70"
                      : "bg-[#e8f7f3] text-teal-800 border border-teal-200/80"
                  }`}
                >
                  {isSeated ? (
                    <>
                      <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider">
                        On
                      </span>
                      <span>Dine</span>
                    </>
                  ) : (
                    <>
                      <span>{res.reservationTime.split(" ")[0]}</span>
                      <span className="text-[9.5px] font-medium opacity-80">
                        {res.reservationTime.split(" ")[1]}
                      </span>
                    </>
                  )}
                </div>

                {/* Center info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-[13px] truncate group-hover:text-teal-700">
                      {res.customerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {res.notes ? "Dinner" : "Direct"}
                    </span>
                  </div>

                  {/* Table & Guests */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">Tbl</span>
                      <strong className="text-slate-700 font-semibold">
                        {res.tableNumber.replace("Table #", "")}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-700 font-semibold">{res.guests}</strong>
                    </span>
                  </div>

                  {/* Phone number */}
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    <span className="font-mono text-[10.5px]">{res.customerPhone}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 self-center">
                  {isSeated ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      On Dine
                    </span>
                  ) : res.paymentStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Payment
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                      Reserved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Bottom Action: + Add New Reservation button */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={onOpenNewBookingModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Reservation
        </button>
      </div>
    </aside>
  );
}
