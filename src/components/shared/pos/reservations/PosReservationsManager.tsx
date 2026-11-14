function toStandardIsoDate(rawDate?: string, fallbackIso?: string): string {
  if (!rawDate || rawDate === "Today") return fallbackIso || new Date().toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;
  // Try parsing human formatted date like "Mon, Nov 2, 2026"
  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return fallbackIso || new Date().toISOString().split("T")[0];
}

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
  Eye,
  Crown,
  ChevronLeft,
  ChevronRight,
  XCircle,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { ColorActionPrint, ColorActionView } from "@/components/common/ColorActionIcons";
import {
  usePosReservations,
  usePosTables,
  useAddReservationMutation,
  useCancelReservationMutation,
  useSeatGuestsMutation,
  useVacateTableMutation,
  useDiningAreas,
  useSwitchTableMutation,
} from "@/hooks/queries/usePosTables";
import type { ReservationItem, RestaurantTable } from "@/types/posTables";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { usePosDate } from "@/hooks/usePosDate";
import { openPrintReportTable } from "@/utils/printReportTable";
import { formatDateIndian } from "@/utils/dateUtils";
import { NewReservationModal } from "../tables/NewReservationModal";
import { ReservationDetailSlide } from "../tables/ReservationDetailSlide";
import { SwitchTableModal } from "../tables/SwitchTableModal";
import { fuzzyMatch } from "@/utils/fuzzySearch";
import { formatDateIndian } from "@/utils/dateUtils";
import { exportToExcel } from "@/utils/exportUtils";
import {
  PosDataGrid,
  ChooseColumnsMenu,
  type PosDataGridColumn,
  type DataTableColumn,
} from "@/components/ui/data-grid";

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

const VISIBLE_COLUMNS_KEY = "retrod:pos-reservations:visible-columns";

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
  const switchTableMutation = useSwitchTableMutation();

  // View state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [switchReservation, setSwitchReservation] = useState<ReservationItem | null>(null);

  // Date filter (defaults to operational date from top nav calendar)
  const { selectedDateStr } = usePosDate();
  const todayIso = useMemo(() => getTodayIso(), []);
  const [fromDate, setFromDate] = useState<string>(selectedDateStr);
  const [toDate, setToDate] = useState<string>(selectedDateStr);

  React.useEffect(() => {
    setFromDate(selectedDateStr);
    setToDate(selectedDateStr);
    setCurrentPage(1);
  }, [selectedDateStr]);

  // Pagination state (for grid view)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isDetailSlideOpen, setIsDetailSlideOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Filtered reservations (Intelligent Multi-Field Fuzzy Search)
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Multi-Field Fuzzy Search
      if (searchQuery.trim()) {
        const matches = fuzzyMatch(searchQuery, [
          res.customerName,
          res.customerPhone || "",
          res.tableNumber || "",
          res.notes || "",
          res.reservationDate || "",
          res.reservationTime || "",
          res.status || "",
          String(res.guestCount || res.guests || ""),
        ]);
        if (!matches) {
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
        const resDate = toStandardIsoDate(res.reservationDate, todayIso);
        const normFrom = fromDate ? toStandardIsoDate(fromDate, todayIso) : "";
        const normTo = toDate ? toStandardIsoDate(toDate, todayIso) : "";
        if (normFrom && resDate < normFrom) return false;
        if (normTo && resDate > normTo) return false;
      }

      return true;
    });
  }, [reservations, tables, searchQuery, statusFilter, areaFilter, fromDate, toDate, todayIso]);

  // Paginated slice for grid view
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
      "Deposit": r.depositAmount && r.depositAmount > 0 ? `₹${r.depositAmount}` : "₹0",
      "Notes": r.notes || "",
    }));

    exportToExcel(rows, `POS_Reservations_${fromDate}_to_${toDate}`, {
      title: "Restaurant Table Reservations",
      dateRange: `${fromDate} to ${toDate}`,
    });
  };

  const handlePrint = () => {
    if (filteredReservations.length === 0) {
      toast.info("No reservations to print");
      return;
    }

    const columns = [
      { header: "RES ID", align: "left" as const },
      { header: "GUEST NAME", align: "left" as const },
      { header: "CONTACT", align: "left" as const },
      { header: "TABLE / DETAILS", align: "left" as const },
      { header: "DATE", align: "center" as const },
      { header: "TIME / SLOT", align: "center" as const },
      { header: "SOURCE", align: "left" as const },
      { header: "STATUS", align: "center" as const },
      { header: "PAX", align: "center" as const },
      { header: "DEPOSIT (₹)", align: "right" as const },
    ];

    const rows = filteredReservations.map((r) => [
      (r as any).reservationNumber || r.id,
      r.customerName || "Walk-in Guest",
      r.customerPhone || "—",
      r.tableNumber ? `Table ${r.tableNumber}` : "Dine-In",
      formatDateIndian(r.reservationDate),
      r.reservationTime || "—",
      (r as any).source || "Direct Walk-in",
      (r.status || "CONFIRMED").toUpperCase(),
      r.guests || 1,
      Number(r.depositAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    ]);

    const totalDeposit = filteredReservations.reduce((sum, r) => sum + Number(r.depositAmount || 0), 0);

    openPrintReportTable({
      title: "RESERVATIONS MASTER LIST",
      subtitle: `Stay / Reservation Window: ${fromDate} to ${toDate} • Total: ${filteredReservations.length} Bookings`,
      dateRange: `${formatDateIndian(fromDate)} to ${formatDateIndian(toDate)}`,
      columns,
      rows,
      summaryTotals: [
        "TOTAL",
        `${filteredReservations.length} Bookings`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        totalDeposit.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      ],
    });
  };

  // Columns definition for PosDataGrid
  const columns: PosDataGridColumn<ReservationItem>[] = useMemo(
    () => [
      {
        id: "customerName",
        header: "Guest & Contact",
        accessorKey: "customerName",
        sortable: true,
        filterable: true,
        minWidth: 220,
        render: (_, res) => (
          <div className="flex items-center gap-2.5 py-1">
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                res.customerName,
              )}`}
            >
              {getInitials(res.customerName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground truncate text-[12.5px]">
                  {res.customerName}
                </span>
                {res.isVip && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Crown className="w-2.5 h-2.5" /> VIP
                  </span>
                )}
              </div>
              {res.customerPhone ? (
                <div className="flex items-center gap-1 text-[11px] text-foreground/70 font-mono mt-0.5">
                  <Phone className="w-2.5 h-2.5 text-foreground/60" />
                  <span>{res.customerPhone}</span>
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "guests",
        header: "Guests / Pax",
        accessorKey: "guests",
        sortable: true,
        filterable: true,
        align: "center",
        minWidth: 120,
        render: (_, res) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-tint/30 font-bold text-foreground text-xs">
            <Users className="w-3.5 h-3.5 text-primary" />
            {res.guests} Pax
          </span>
        ),
      },
      {
        id: "tableNumber",
        header: "Table / Area",
        accessorKey: "tableNumber",
        sortable: true,
        filterable: true,
        minWidth: 150,
        render: (_, res) => {
          const table = tables.find(
            (t) => t.id === res.tableId || t.tableNumber === res.tableNumber,
          );
          const areaName = table?.area || "Dining Area";
          return (
            <div>
              <div className="font-bold text-foreground text-xs">{res.tableNumber}</div>
              <div className="text-[11px] text-foreground/70">{areaName}</div>
            </div>
          );
        },
      },
      {
        id: "reservationDate",
        header: "Date",
        accessorKey: "reservationDate",
        sortable: true,
        filterable: true,
        minWidth: 130,
        render: (_, res) => (
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{res.reservationDate ? formatDateIndian(res.reservationDate) : "Today"}</span>
          </div>
        ),
      },
      {
        id: "reservationTime",
        header: "Time",
        accessorKey: "reservationTime",
        sortable: true,
        filterable: true,
        minWidth: 140,
        render: (_, res) => (
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{res.reservationTime}</span>
            {res.endTime && (
              <span className="text-foreground/60 text-[10.5px]"> – {res.endTime}</span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        filterable: true,
        align: "center",
        minWidth: 120,
        render: (_, res) => {
          if (res.status === "seated") {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Seated
              </span>
            );
          }
          if (res.status === "completed") {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Completed
              </span>
            );
          }
          if (res.status === "cancelled") {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Cancelled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Reserved
            </span>
          );
        },
      },
      {
        id: "depositAmount",
        header: "Deposit",
        accessorKey: "depositAmount",
        sortable: true,
        align: "right",
        minWidth: 120,
        render: (_, res) =>
          res.depositAmount && res.depositAmount > 0 ? (
            <span className="font-bold text-emerald-700 font-mono text-xs">
              ₹{res.depositAmount}
            </span>
          ) : (
            <span className="font-bold text-slate-500 font-mono text-xs">₹0</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        minWidth: 130,
        render: (_, res) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
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
            {res.status === "reserved" && (
              <button
                type="button"
                onClick={() => setSwitchReservation(res)}
                title="Switch Table"
                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOpenDetail(res)}
              title="View Details"
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-sky-500 hover:bg-sky-50/60 transition cursor-pointer shadow-2xs"
            >
              <ColorActionView className="w-4 h-4" />
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
        ),
      },
    ],
    [tables],
  );

  const chooseColumnDefs: DataTableColumn[] = useMemo(
    () =>
      columns.map((col, idx) => {
        const id =
          col.id ||
          (typeof col.accessorKey === "string" ? col.accessorKey : `col-${idx}`);
        const label =
          typeof col.header === "string" ? col.header : id;
        return { id, key: id, label };
      }),
    [columns],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    const initial: Record<string, boolean> = {};
    for (const col of columns) {
      if (col.id) initial[col.id] = true;
    }
    return initial;
  });

  const handleColumnVisibilityChange = (updated: Record<string, boolean>) => {
    setColumnVisibility(updated);
    try {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 py-2.5 shrink-0">
        <div>
          <h1 className="font-serif text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground leading-tight">
            Reservations List
          </h1>
          <p className="text-[11px] text-foreground/70">
            Real-time table bookings, guest arrivals, and reservation schedules
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-primary-tint/20 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-foreground/70" />
            Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-primary-tint/20 shadow-2xs transition cursor-pointer"
          >
            <ColorActionPrint className="w-3.5 h-3.5" />
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

      <div className="responsive-page-x py-4 sm:py-5 space-y-4">
        {/* View Switcher & Filter Toolbar — Aligned in one line */}
        <div className="flex items-center gap-2 bg-card p-2.5 sm:p-3 rounded-xl border border-border shadow-2xs overflow-x-auto scrollbar-none">
          {/* View Mode Buttons */}
          <div className="inline-flex p-1 rounded-xl bg-surface border border-border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                viewMode === "table"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-foreground hover:text-primary"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                viewMode === "grid"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-foreground hover:text-primary"
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
              className="h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:border-teal-500 focus:outline-hidden cursor-pointer shrink-0"
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
            className="h-8.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:border-teal-500 focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="reserved">Reserved</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sliding Date Range Picker */}
          <div className="shrink-0">
            <PosDateRangePicker
              from={fromDate}
              to={toDate}
              onSelect={({ from, to }) => {
                setFromDate(from);
                setToDate(to);
                setCurrentPage(1);
              }}
              showPresets={true}
              showClear={true}
              size="sm"
            />
          </div>

          {/* Show All Dates Button */}
          <button
            type="button"
            onClick={() => {
              if (fromDate || toDate) {
                setFromDate("");
                setToDate("");
              } else {
                setFromDate(selectedDateStr);
                setToDate(selectedDateStr);
              }
              setCurrentPage(1);
            }}
            className={`h-8.5 px-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              !fromDate && !toDate
                ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                : "bg-card text-foreground border-border hover:bg-primary-tint/20"
            }`}
            title="Toggle between All Dates and Selected Date"
          >
            {!fromDate && !toDate ? "All Dates" : "Show All Dates"}
          </button>

          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px] flex-1">
            <Search className="w-3.5 h-3.5 text-foreground/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, guest, phone, table..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-[12px] font-medium text-foreground placeholder-foreground/60 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Choose Columns Menu */}
          {viewMode === "table" && (
            <ChooseColumnsMenu
              columns={chooseColumnDefs}
              visibleColumns={columnVisibility}
              onVisibleColumnsChange={handleColumnVisibilityChange}
              className="h-8.5 whitespace-nowrap shrink-0"
            />
          )}
        </div>

        {/* Main Content Area */}
        {viewMode === "table" ? (
          /* ================= TABLE VIEW VIA POSDATAGRID ================= */
          <PosDataGrid<ReservationItem>
            data={filteredReservations}
            columns={columns}
            storageKey="pos-reservations"
            itemName="reservations"
            themeVariant="primary"
            loading={isLoadingReservations}
            selectedRowIds={selectedIds}
            onSelectionChange={setSelectedIds}
            enableSelection={true}
            enablePagination={true}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onRowClick={(row) => handleOpenDetail(row)}
            emptyMessage="No reservations found. Try adjusting your search query, filters, or selected date range."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
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
              <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-600 shadow-2xs">
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
      </div>

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
        tables={tables}
        onSeatGuests={handleSeatGuests}
        onCancelReservation={handleCancelReservation}
        onSwitchTable={(reservationId, newTableId) =>
          switchTableMutation.mutate({ reservationId, newTableId })
        }
        onVacateTable={(tableId) => vacateTableMutation.mutate(tableId)}
        onOpenNewBooking={() => {
          setIsDetailSlideOpen(false);
          setIsNewBookingOpen(true);
        }}
      />

      {/* Switch Table Modal */}
      {switchReservation && (
        <SwitchTableModal
          isOpen={!!switchReservation}
          onClose={() => setSwitchReservation(null)}
          reservation={switchReservation}
          tables={tables}
          isPending={switchTableMutation.isPending}
          onConfirmSwitch={(reservationId, newTableId) =>
            switchTableMutation.mutate({ reservationId, newTableId })
          }
        />
      )}
    </div>
  );
}

export default PosReservationsManager;
