import React, { useState, useMemo } from "react";
import {
  Table as TableIcon,
  LayoutGrid,
  Search,
  Plus,
  Download,
  Printer,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePosReservations,
  usePosTables,
  useAddReservationMutation,
  useCancelReservationMutation,
  useSeatGuestsMutation,
  useVacateTableMutation,
  useDiningAreas,
} from "@/hooks/queries/usePosTables";
import type { ReservationItem, RestaurantTable } from "@/types/posTables";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { NewReservationModal } from "../tables/NewReservationModal";
import { ReservationDetailSlide } from "../tables/ReservationDetailSlide";
import { exportToExcel } from "@/utils/exportUtils";

function getTodayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-teal-100 text-teal-800 border-teal-200",
];

function getInitials(name?: string) {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PosReservationsManager() {
  // Query data
  const { data: reservations = [], isLoading: isLoadingReservations } = usePosReservations();
  const { data: tables = [] } = usePosTables();
  const { data: areas = [] } = useDiningAreas();

  // Mutations
  const addReservationMutation = useAddReservationMutation();
  const cancelReservationMutation = useCancelReservationMutation();
  const seatGuestsMutation = useSeatGuestsMutation();
  const vacateTableMutation = useVacateTableMutation();

  // View state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  // Date filter (defaults to today)
  const todayIso = useMemo(() => getTodayIso(), []);
  const [fromDate, setFromDate] = useState<string>(todayIso);
  const [toDate, setToDate] = useState<string>(todayIso);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isDetailSlideOpen, setIsDetailSlideOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = res.customerName.toLowerCase().includes(q);
        const matchPhone = (res.customerPhone || "").toLowerCase().includes(q);
        const matchTable = (res.tableNumber || "").toLowerCase().includes(q);
        const matchNotes = (res.notes || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchTable && !matchNotes) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if (res.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Area Filter
      if (areaFilter !== "all") {
        const table = tables.find((t) => t.id === res.tableId || t.tableNumber === res.tableNumber);
        if (table && table.area.toLowerCase() !== areaFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Date Range Filter
      if (fromDate || toDate) {
        let resDate = res.reservationDate;
        if (resDate === "Today" || !resDate) {
          resDate = todayIso;
        }
        if (fromDate && resDate < fromDate) return false;
        if (toDate && resDate > toDate) return false;
      }

      return true;
    });
  }, [reservations, tables, searchQuery, statusFilter, areaFilter, fromDate, toDate, todayIso]);

  // Paginated slice
  const totalCount = filteredReservations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReservations.slice(start, start + pageSize);
  }, [filteredReservations, currentPage, pageSize]);

  // Handlers
  const handleOpenDetail = (res: ReservationItem) => {
    setSelectedReservation(res);
    const table = tables.find((t) => t.id === res.tableId || t.tableNumber === res.tableNumber) || null;
    setSelectedTable(table);
    setIsDetailSlideOpen(true);
  };

  const handleSeatGuests = (tableId: string, reservationId?: string) => {
    seatGuestsMutation.mutate(
      { tableId, reservationId },
      {
        onSuccess: () => {
          toast.success("Guests seated successfully");
          setIsDetailSlideOpen(false);
        },
      },
    );
  };

  const handleCancelReservation = (reservationId: string) => {
    cancelReservationMutation.mutate(reservationId, {
      onSuccess: () => {
        toast.success("Reservation cancelled");
        setIsDetailSlideOpen(false);
      },
    });
  };

  const handleSaveNewReservation = (data: Omit<ReservationItem, "id" | "createdAt" | "status">) => {
    addReservationMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Reservation booked successfully");
        setIsNewBookingOpen(false);
      },
    });
  };

  const handleExportExcel = () => {
    if (filteredReservations.length === 0) {
      toast.info("No reservations to export");
      return;
    }
    const rows = filteredReservations.map((r, idx) => ({
      "Sl No": idx + 1,
      "Guest Name": r.customerName,
      "Phone": r.customerPhone || "N/A",
      "Email": r.customerEmail || "N/A",
      "Guests (Pax)": r.guests,
      "Table": r.tableNumber,
      "Date": r.reservationDate,
      "Time": r.reservationTime,
      "End Time": r.endTime || "N/A",
      "Status": r.status.toUpperCase(),
      "Deposit": r.depositAmount ? `₹${r.depositAmount}` : "None",
      "Notes": r.notes || "",
    }));

    exportToExcel(rows, `POS_Reservations_${fromDate}_to_${toDate}`, {
      title: "Restaurant Table Reservations",
      dateRange: `${fromDate} to ${toDate}`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 bg-white/60 p-4 rounded-2xl backdrop-blur-xs">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Reservations List
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time table bookings, guest arrivals, and reservation schedules
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
          <button
            type="button"
            onClick={() => setIsNewBookingOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Book Reservation
          </button>
        </div>
      </div>

      {/* View Switcher & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Left: View Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid View
            </button>
          </div>

          {/* Area Selector */}
          {areas.length > 0 && (
            <select
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Dining Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="reserved">Reserved</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Right: Date Range Sliding Picker & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sliding Date Range Picker */}
          <PosDateRangePicker
            from={fromDate}
            to={toDate}
            onSelect={({ from, to }) => {
              setFromDate(from);
              setToDate(to);
              setCurrentPage(1);
            }}
            showPresets={true}
            size="sm"
          />

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, guest, phone, table..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        /* ================= TABLE VIEW ================= */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs flex-1 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              {/* Dark Forest Green Header Bar matching PMS Screenshot */}
              <thead className="bg-[#064E3B] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      className="rounded border-emerald-400 text-teal-600 focus:ring-teal-500"
                      readOnly
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Guest & Contact</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Guests / Pax</th>
                  <th className="py-3 px-3 min-w-[130px]">Table / Area</th>
                  <th className="py-3 px-3 min-w-[120px]">Date</th>
                  <th className="py-3 px-3 min-w-[130px]">Time</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Status</th>
                  <th className="py-3 px-3 text-right min-w-[120px]">Deposit</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                          <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No reservations found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          No bookings match your current search query, filters, or selected date range.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsNewBookingOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Book First Reservation
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReservations.map((res, idx) => {
                    const table = tables.find(
                      (t) => t.id === res.tableId || t.tableNumber === res.tableNumber,
                    );
                    const areaName = table?.area || "Dining Area";

                    return (
                      <tr
                        key={res.id || idx}
                        onClick={() => handleOpenDetail(res)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>

                        {/* Guest & Contact */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                                res.customerName,
                              )}`}
                            >
                              {getInitials(res.customerName)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 truncate">
                                  {res.customerName}
                                </span>
                                {res.isVip && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Crown className="w-2.5 h-2.5" /> VIP
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                {res.customerPhone ? (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {res.customerPhone}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Guests / Pax */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 text-xs">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {res.guests} Pax
                          </span>
                        </td>

                        {/* Table / Area */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">
                            {res.tableNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">{areaName}</div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{res.reservationDate || "Today"}</span>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{res.reservationTime}</span>
                            {res.endTime && (
                              <span className="text-slate-400 text-[10px]">
                                – {res.endTime}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {res.status === "seated" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              Seated
                            </span>
                          ) : res.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Completed
                            </span>
                          ) : res.status === "cancelled" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Reserved
                            </span>
                          )}
                        </td>

                        {/* Deposit / Payment */}
                        <td className="py-3 px-3 text-right">
                          {res.depositAmount ? (
                            <span className="font-bold text-emerald-700">
                              ₹{res.depositAmount}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Deposit</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {res.status === "reserved" && (
                              <button
                                type="button"
                                onClick={() => handleSeatGuests(res.tableId, res.id)}
                                title="Seat Table"
                                className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition cursor-pointer"
                              >
                                Seat
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(res)}
                              title="View Details"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {res.status === "reserved" && (
                              <button
                                type="button"
                                onClick={() => handleCancelReservation(res.id)}
                                title="Cancel Reservation"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600">
            <div>
              Showing{" "}
              <span className="font-bold text-slate-900">
                {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-bold text-slate-900">{totalCount}</span> reservations
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-bold text-xs text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= GRID VIEW ================= */
        <div className="space-y-4">
          {paginatedReservations.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No reservations found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No bookings match your current search query, filters, or selected date range.
              </p>
              <button
                type="button"
                onClick={() => setIsNewBookingOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Book First Reservation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedReservations.map((res) => {
                const table = tables.find(
                  (t) => t.id === res.tableId || t.tableNumber === res.tableNumber,
                );
                const areaName = table?.area || "Dining Area";

                return (
                  <div
                    key={res.id}
                    onClick={() => handleOpenDetail(res)}
                    className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-teal-400/50 transition-all cursor-pointer group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-base text-slate-900">
                              {res.tableNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10.5px] font-bold text-slate-600">
                              {areaName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {res.reservationDate || "Today"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {res.reservationTime}
                            </span>
                          </div>
                        </div>

                        {/* Status pill */}
                        {res.status === "seated" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Seated
                          </span>
                        ) : res.status === "cancelled" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Reserved
                          </span>
                        )}
                      </div>

                      {/* Guest details */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(
                            res.customerName,
                          )}`}
                        >
                          {getInitials(res.customerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {res.customerName}
                            </span>
                            {res.isVip && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          {res.customerPhone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {res.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes / Details */}
                      {res.notes && (
                        <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] text-slate-600 line-clamp-2">
                          {res.notes}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.guests} Guests</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.status === "reserved" && (
                          <button
                            type="button"
                            onClick={() => handleSeatGuests(res.tableId, res.id)}
                            className="px-3 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer"
                          >
                            Seat
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(res)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Bar for Grid View */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-600 shadow-2xs">
              <div>
                Showing {paginatedReservations.length} of {totalCount} reservations
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-bold text-xs text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book New Reservation Modal */}
      <NewReservationModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        tables={tables}
        onSaveReservation={handleSaveNewReservation}
      />

      {/* Reservation Details Slide-out */}
      <ReservationDetailSlide
        isOpen={isDetailSlideOpen}
        onClose={() => setIsDetailSlideOpen(false)}
        selectedTable={selectedTable}
        selectedReservation={selectedReservation}
        onSeatGuests={handleSeatGuests}
        onCancelReservation={handleCancelReservation}
        onVacateTable={(tableId) => vacateTableMutation.mutate(tableId)}
        onOpenNewBooking={() => {
          setIsDetailSlideOpen(false);
          setIsNewBookingOpen(true);
        }}
      />
    </div>
  );
}

export default PosReservationsManager;

