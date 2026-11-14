import { useState, useMemo, useEffect } from "react";
import {
  Armchair,
  ClipboardList,
  CalendarCheck2,
  MapPin,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  ShoppingBag,
  Edit,
  Phone,
  Plus,
  Crown,
} from "lucide-react";
import {
  useDiningAreas,
  usePosTables,
  usePosReservations,
  useAddReservationMutation,
} from "@/hooks/queries/usePosTables";
import { useCurrentOrdersTimeline } from "@/hooks/queries/usePosOrders";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";
import type { CurrentOrderRecord } from "@/services/posOrdersService";
import { NewReservationModal } from "../tables/NewReservationModal";
import { fuzzyFilter } from "@/utils/fuzzySearch";
import { formatDateIndian } from "@/utils/dateUtils";
import { usePosDate, getTodayIso } from "@/hooks/usePosDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BillingTablesOrdersSidebarProps = {
  activeTable?: string;
  onSelectTable: (table: RestaurantTable, reservation?: ReservationItem) => void;
  onSelectOrder?: (order: CurrentOrderRecord) => void;
  activeOutletId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
};

// Dining table with 2 flanking chairs outline SVG
function TableChairsIcon({ className = "h-10 w-12 text-slate-500" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 68 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Center Dining Table */}
      <rect x="20" y="10" width="28" height="6.5" rx="2.5" fill="currentColor" fillOpacity="0.18" />
      <line x1="24" y1="16.5" x2="24" y2="34" />
      <line x1="44" y1="16.5" x2="44" y2="34" />
      <line x1="21.5" y1="34" x2="26.5" y2="34" strokeWidth="2.6" />
      <line x1="41.5" y1="34" x2="46.5" y2="34" strokeWidth="2.6" />

      {/* Left Chair */}
      <path d="M7 18 C7 14 11.5 14 11.5 18 L11.5 28" />
      <rect x="6" y="19" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.12" />
      <line x1="7" y1="28" x2="7" y2="36" />
      <line x1="14" y1="28" x2="14" y2="36" />

      {/* Right Chair */}
      <path d="M56.5 18 C56.5 14 61 14 61 18 L61 28" />
      <rect x="53" y="19" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.12" />
      <line x1="54" y1="28" x2="54" y2="36" />
      <line x1="61" y1="28" x2="61" y2="36" />
    </svg>
  );
}

/**
 * Exclude settled or cancelled orders from the active POS billing Orders tab.
 */
export function filterActivePosOrders(
  orders: CurrentOrderRecord[],
  searchQuery = "",
): CurrentOrderRecord[] {
  const safeOrders = (Array.isArray(orders) ? orders : []).filter(
    (ord) =>
      ord &&
      !ord.isSettled &&
      String(ord.currentStage || "").toLowerCase() !== "settled" &&
      String((ord as CurrentOrderRecord & { status?: string }).status || "").toLowerCase() !== "cancelled",
  );
  if (!searchQuery.trim()) return safeOrders;
  return fuzzyFilter(safeOrders, searchQuery, [
    (ord) => ord.orderNumber || "",
    (ord) => ord.customerName || "",
    (ord) => ord.tableOrRoom || "",
    (ord) => ord.waiterName || "",
    (ord) => ord.currentStage || "",
    (ord) => String(ord.totalAmount || ""),
  ]);
}

/**
 * Exclude completed, seated, cancelled, or no-show reservations from the POS billing Bookings tab.
 * Only that particular day's upcoming reservations are displayed.
 * Seated and completed reservations belong in the full /pos/reservations list.
 */
export function filterActivePosReservations(
  reservations: ReservationItem[],
  statusFilter = "all",
  searchQuery = "",
  targetDateIso?: string,
  realTodayIso?: string,
): ReservationItem[] {
  let safeRes = (Array.isArray(reservations) ? reservations : []).filter(
    (res) =>
      res &&
      res.status !== "completed" &&
      res.status !== "cancelled" &&
      res.status !== "no_show" &&
      res.status !== "seated",
  );

  // If a target date is specified, filter to only that particular day's upcoming bookings
  if (targetDateIso) {
    const formattedTarget = formatDateIndian(targetDateIso, "");
    safeRes = safeRes.filter((res) => {
      if (!res.reservationDate) return true;
      if (res.reservationDate.toLowerCase() === "today") {
        return !realTodayIso || targetDateIso === realTodayIso;
      }
      const formattedRes = formatDateIndian(res.reservationDate, "");
      return !formattedRes || formattedRes === formattedTarget;
    });
  }

  if (statusFilter !== "all") {
    safeRes = safeRes.filter(
      (res) => (res.status || "").toLowerCase() === statusFilter.toLowerCase(),
    );
  }
  if (!searchQuery.trim()) return safeRes;
  return fuzzyFilter(safeRes, searchQuery, [
    (res) => res.customerName || "",
    (res) => res.customerPhone || "",
    (res) => res.tableNumber || "",
    (res) => res.notes || "",
    (res) => res.reservationDate || "",
    (res) => res.reservationTime || "",
  ]);
}

export function BillingTablesOrdersSidebar({
  activeTable,
  onSelectTable,
  onSelectOrder,
  activeOutletId,
  isCollapsed = false,
  onToggleCollapse,
  className = "",
}: BillingTablesOrdersSidebarProps) {
  const [activeTab, setActiveTab] = useState<"tables" | "orders" | "reservations">("tables");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedZone, setSelectedZone] = useState<string>("All Zones");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>("all");
  const [reservationSearchQuery, setReservationSearchQuery] = useState("");
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);

  // Data queries — call usePosTables() with no arg to fetch all tables for the active outlet
  const { data: areasData = [] } = useDiningAreas();
  const { data: tables = [], isLoading: tablesLoading } = usePosTables();
  const { data: currentOrders = [], isLoading: ordersLoading } = useCurrentOrdersTimeline(activeOutletId);
  const { data: reservations = [], isLoading: reservationsLoading } = usePosReservations();
  const addReservationMutation = useAddReservationMutation();

  // Dynamic zones list from areas query and actual table data
  const zones = useMemo(() => {
    const safeAreas = Array.isArray(areasData) ? areasData : [];
    const safeTables = Array.isArray(tables) ? tables : [];
    const fromAreas = safeAreas.filter((a) => a && a !== "All Areas" && a !== "All Zones");
    const fromTables = Array.from(new Set(safeTables.map((t) => t?.area).filter(Boolean)));
    const merged = Array.from(new Set([...fromAreas, ...fromTables]));
    return ["All Zones", ...merged];
  }, [areasData, tables]);

  // Reset selectedZone if it is not in the active zones list
  useEffect(() => {
    if (selectedZone !== "All Zones" && !zones.includes(selectedZone)) {
      setSelectedZone("All Zones");
    }
  }, [zones, selectedZone]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    const safeTables = Array.isArray(tables) ? tables : [];
    return safeTables.filter((table) => {
      if (!table) return false;
      // Zone filter
      if (selectedZone !== "All Zones" && table.area !== selectedZone) {
        return false;
      }
      // Status filter
      if (statusFilter === "occupied" && table.status !== "occupied") return false;
      if (statusFilter === "vacant" && table.status !== "vacant") return false;
      if (statusFilter === "cleaning" && table.status !== "blocked") return false;
      if (statusFilter === "reserved" && table.status !== "reserved") return false;
      return true;
    });
  }, [tables, selectedZone, statusFilter]);

  const activeOrders = useMemo(
    () => filterActivePosOrders(currentOrders),
    [currentOrders],
  );

  // Filtered Orders (active unsettled orders only)
  const filteredOrders = useMemo(
    () => filterActivePosOrders(currentOrders, orderSearchQuery),
    [currentOrders, orderSearchQuery],
  );

  const { selectedDateStr } = usePosDate();
  const realTodayIso = getTodayIso();
  const targetDateIso = selectedDateStr || realTodayIso;

  const activeReservations = useMemo(
    () => filterActivePosReservations(reservations, "all", "", targetDateIso, realTodayIso),
    [reservations, targetDateIso, realTodayIso],
  );

  // Filtered Reservations (active upcoming bookings for that particular day only)
  const filteredReservations = useMemo(
    () =>
      filterActivePosReservations(
        reservations,
        reservationStatusFilter,
        reservationSearchQuery,
        targetDateIso,
        realTodayIso,
      ),
    [reservations, reservationStatusFilter, reservationSearchQuery, targetDateIso, realTodayIso],
  );

  // Format table display ID (e.g. T01, T02)
  const getTableCode = (table: RestaurantTable) => {
    if (table.tableNumber && /^T\d+/i.test(table.tableNumber)) {
      return table.tableNumber.toUpperCase();
    }
    const num = table.tableNumberRaw || parseInt(table.tableNumber?.replace(/\D/g, "") || "1", 10);
    return `T${String(num).padStart(2, "0")}`;
  };

  // Status config mapping using theme patterns
  const getTableStatusConfig = (table: RestaurantTable) => {
    if (table.status === "occupied") {
      return {
        label: "Occupied",
        dotColor: "bg-rose-500",
        badgeBg: "bg-rose-100/70 text-rose-700",
        cardBg: "bg-[#fff8f8] border-rose-200/80 hover:border-rose-300",
      };
    }
    if (table.status === "blocked") {
      return {
        label: "Cleaning",
        dotColor: "bg-sky-500",
        badgeBg: "bg-sky-100/70 text-sky-700",
        cardBg: "bg-[#f4f9ff] border-sky-200/80 hover:border-sky-300",
      };
    }
    if (table.status === "reserved") {
      const isMerged = table.activeReservation?.isMerged;
      return {
        label: isMerged ? "Merged" : "Reserved",
        dotColor: "bg-amber-500",
        badgeBg: "bg-amber-100/70 text-amber-700",
        cardBg: "bg-[#fffaf0] border-amber-200/80 hover:border-amber-300",
      };
    }
    // Vacant / Available
    return {
      label: "Available",
      dotColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100/70 text-emerald-700",
      cardBg: "bg-white border-slate-200/80 hover:border-slate-300",
    };
  };

  // ==================== COLLAPSED VIEW (SLIM 56px STRIP) ====================
  if (isCollapsed) {
    return (
      <aside
        className={`bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center py-3 px-1.5 w-full h-full select-none ${className}`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Tables & Orders"
          className="p-2 rounded-lg bg-slate-100 hover:bg-primary/10 text-slate-600 hover:text-primary transition cursor-pointer mb-3 shadow-2xs"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-2 w-full items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab("tables");
              if (onToggleCollapse) onToggleCollapse();
            }}
            title="Tables View"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === "tables"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <Armchair className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              if (onToggleCollapse) onToggleCollapse();
            }}
            title="Orders View"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeTab === "orders"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="h-4.5 w-4.5" />
            {currentOrders.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("reservations");
              if (onToggleCollapse) onToggleCollapse();
            }}
            title="Reservations View"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeTab === "reservations"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <CalendarCheck2 className="h-4.5 w-4.5" />
            {reservations.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </aside>
    );
  }

  // ==================== EXPANDED VIEW ====================
  return (
    <aside
      className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col h-full max-h-full overflow-hidden w-full select-none ${className}`}
    >
      {/* 1. Header Tabs: [ Tables ] & [ Orders ] & [ Reservations ] with Theme Colors */}
      <div className="p-2 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <div className="flex items-center gap-2">
          {/* Tabs Container */}
          <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-slate-200/60 rounded-xl">
            {/* Tables Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("tables")}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "tables"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Armchair className="h-3.5 w-3.5" />
              <span>Tables</span>
            </button>

            {/* Orders Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer relative ${
                activeTab === "orders"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Orders</span>
              {activeOrders.length > 0 && (
                <span
                  className={`text-[9.5px] px-1 py-0.2 rounded-full font-bold ml-0.5 ${
                    activeTab === "orders" ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {activeOrders.length}
                </span>
              )}
            </button>

            {/* Reservations Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("reservations")}
              className={`py-2 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer relative ${
                activeTab === "reservations"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Bookings</span>
              {activeReservations.length > 0 && (
                <span
                  className={`text-[9.5px] px-1 py-0.2 rounded-full font-bold ml-0.5 ${
                    activeTab === "reservations" ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {activeReservations.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Collapse Arrow */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Tables & Orders Panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Header: Filter controls based on active Tab */}
      {activeTab === "tables" ? (
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          {/* Zones Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 flex items-center gap-1.5 shadow-2xs transition cursor-pointer max-w-[150px] truncate"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedZone === "All Zones" ? "Zones" : selectedZone}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 text-xs font-medium">
              {zones.map((zone) => (
                <DropdownMenuItem
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`cursor-pointer ${selectedZone === zone ? "font-bold text-primary" : ""}`}
                >
                  {zone}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode & Status Filter */}
          <div className="flex items-center gap-1">
            {/* Status Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Filter Tables by Status"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter !== "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 hover:bg-primary/20 text-primary"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 text-xs">
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  className={`cursor-pointer ${statusFilter === "all" ? "font-bold text-primary" : ""}`}
                >
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("vacant")}
                  className={`cursor-pointer ${statusFilter === "vacant" ? "font-bold text-primary" : ""}`}
                >
                  Available only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("occupied")}
                  className={`cursor-pointer ${statusFilter === "occupied" ? "font-bold text-primary" : ""}`}
                >
                  Occupied only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("cleaning")}
                  className={`cursor-pointer ${statusFilter === "cleaning" ? "font-bold text-primary" : ""}`}
                >
                  Cleaning only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("reserved")}
                  className={`cursor-pointer ${statusFilter === "reserved" ? "font-bold text-primary" : ""}`}
                >
                  Reserved only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Grid View Button */}
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>

            {/* List View Button */}
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : activeTab === "reservations" ? (
        <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              {(["all", "reserved"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReservationStatusFilter(st)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer capitalize ${
                    reservationStatusFilter === st
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsNewReservationModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#0b192c] hover:bg-[#132c4e] rounded-lg shadow-2xs transition cursor-pointer shrink-0"
              title="Create New Reservation"
            >
              <Plus className="h-3 w-3" />
              <span>Book</span>
            </button>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={reservationSearchQuery}
              onChange={(e) => setReservationSearchQuery(e.target.value)}
              placeholder="Search guest, phone, table..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
            />
          </div>
        </div>
      ) : (
        /* Orders Search Bar */
        <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              placeholder="Search by order number or guest..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
            />
          </div>
        </div>
      )}

      {/* 3. Main Body Content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {activeTab === "tables" ? (
          tablesLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Armchair className="h-6 w-6 animate-pulse mb-2 text-slate-300" />
              <p className="text-xs">Loading tables...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Armchair className="h-8 w-8 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">No tables found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try changing zone or status filter</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View: Matches screenshot 3 columns */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredTables.map((table) => {
                const code = getTableCode(table);
                const statusCfg = getTableStatusConfig(table);
                const isSelected =
                  activeTable === table.tableNumber ||
                  activeTable === code ||
                  activeTable === `Table #${table.tableNumberRaw}` ||
                  (activeTable.includes("+") &&
                    activeTable.split("+").some((p) => {
                      const t = p.trim();
                      return (
                        t === table.tableNumber ||
                        t === code ||
                        t === `Table #${table.tableNumberRaw}` ||
                        t.replace(/\D/g, "") === String(table.tableNumberRaw)
                      );
                    }));
                const floorSubtitle = table.area ? `${table.area} · Floor 1` : "Floor 1";

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => onSelectTable(table)}
                    className={`rounded-xl border p-2.5 flex flex-col items-center justify-center text-center transition cursor-pointer relative shadow-2xs hover:scale-[1.02] ${
                      statusCfg.cardBg
                    } ${
                      isSelected
                        ? "!border-primary ring-2 ring-primary/40 shadow-sm bg-primary/5"
                        : ""
                    }`}
                  >
                    {/* Table + Chairs SVG Icon */}
                    <div className="mb-1.5 flex items-center justify-center">
                      <TableChairsIcon
                        className={`h-9 w-12 ${
                          isSelected ? "text-primary" : "text-slate-500"
                        }`}
                      />
                    </div>

                    {/* Table Name */}
                    <div className="font-extrabold text-[13px] text-slate-900 tracking-tight leading-tight">
                      {code}
                    </div>

                    {/* Zone & Floor Subtitle */}
                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-full my-1">
                      {floorSubtitle}
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${statusCfg.badgeBg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                      <span>{statusCfg.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1.5">
              {filteredTables.map((table) => {
                const code = getTableCode(table);
                const statusCfg = getTableStatusConfig(table);
                const isSelected =
                  activeTable === table.tableNumber ||
                  activeTable === code ||
                  activeTable === `Table #${table.tableNumberRaw}` ||
                  (activeTable.includes("+") &&
                    activeTable.split("+").some((p) => {
                      const t = p.trim();
                      return (
                        t === table.tableNumber ||
                        t === code ||
                        t === `Table #${table.tableNumberRaw}` ||
                        t.replace(/\D/g, "") === String(table.tableNumberRaw)
                      );
                    }));

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => onSelectTable(table)}
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      statusCfg.cardBg
                    } ${
                      isSelected ? "!border-primary ring-2 ring-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="font-extrabold text-sm text-slate-900">{code}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {table.area || "Dining Area"} · {table.capacity || 4} seats
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusCfg.badgeBg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                      <span>{statusCfg.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : activeTab === "orders" ? (
          /* Orders Tab Content */
          ordersLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ClipboardList className="h-6 w-6 animate-pulse mb-2 text-slate-300" />
              <p className="text-xs">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <ShoppingBag className="h-8 w-8 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">No active orders</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                New checks and sent KOTs will show up here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((ord) => {
                const isDineIn = ord.type === "dine_in";
                const isRoom = ord.type === "room_service";

                return (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-primary/40 transition shadow-2xs space-y-2"
                  >
                    {/* Top Row: Order # + Type + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900 font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {isDineIn
                            ? ord.tableOrRoom || "Dine-In"
                            : isRoom
                              ? ord.tableOrRoom || "Room"
                              : "Takeaway"}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.currentStage === "settled"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.currentStage === "prepared"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ord.stageLabel || "In Progress"}
                      </span>
                    </div>

                    {/* Customer & Elapsed */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1 truncate max-w-[170px]">
                        <User className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate font-medium text-slate-700">
                          {ord.customerName || "Guest"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{ord.elapsedMinutes}m ago</span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    {ord.itemsSummary && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {ord.itemsSummary}
                      </p>
                    )}

                    {/* Bottom Row: Amount + Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="font-bold text-xs text-slate-900">
                        {ord.amountFormatted || `₹${ord.amount}`}
                      </div>
                      <div className="flex items-center gap-1">
                        {onSelectOrder && (
                          <button
                            type="button"
                            onClick={() => onSelectOrder(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary hover:bg-primary-pressed text-primary-foreground transition cursor-pointer shadow-2xs"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit Check</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Reservations Tab Content */
          reservationsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarCheck2 className="h-6 w-6 animate-pulse mb-2 text-slate-300" />
              <p className="text-xs">Loading reservations...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 px-4">
              <CalendarCheck2 className="h-8 w-8 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-700">No reservations found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No bookings scheduled for this outlet or matching filter.
              </p>
              <button
                type="button"
                onClick={() => setIsNewReservationModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-pressed rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Book Reservation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReservations.map((res) => {
                const matchedTable =
                  tables.find(
                    (t) =>
                      t.id === res.tableId ||
                      t.tableNumber === res.tableNumber ||
                      (res.tableNumber && String(t.tableNumberRaw) === res.tableNumber.replace(/\D/g, ""))
                  ) || {
                    id: res.tableId || `tbl-${res.id}`,
                    tableNumber: res.tableNumber || "T01",
                    status: res.status === "seated" ? "occupied" : "reserved",
                    capacity: res.guests || 4,
                    area: "Main Dining",
                    activeReservation: res,
                  };

                const isSeated = res.status === "seated";

                return (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-primary/40 transition shadow-2xs space-y-2"
                  >
                    {/* Top: Guest Name & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {res.isVip && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {res.customerName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          isSeated
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    {/* Table & Pax & Time */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-extrabold">
                          {res.tableNumber || "Table"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {res.guests} {res.guests === 1 ? "Guest" : "Guests"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{res.reservationTime || "7:30 PM"}</span>
                      </div>
                    </div>

                    {/* Customer Phone & Notes */}
                    {res.customerPhone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{res.customerPhone}</span>
                      </div>
                    )}

                    {res.notes && (
                      <p className="text-[10.5px] text-slate-600 italic line-clamp-1 bg-amber-50/60 border border-amber-100 px-2 py-0.5 rounded text-amber-900">
                        {res.notes}
                      </p>
                    )}

                    {/* Bottom Action: Seat & Take Order */}
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <span className="text-[10px] text-foreground/70">
                        {res.reservationDate ? formatDateIndian(res.reservationDate) : "Today"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectTable(matchedTable as RestaurantTable, res)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-primary hover:bg-primary-pressed text-primary-foreground transition cursor-pointer shadow-2xs"
                      >
                        <Armchair className="h-3 w-3" />
                        <span>{isSeated ? "Select Table" : "Seat & Order"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <NewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        tables={Array.isArray(tables) ? tables : []}
        onSaveReservation={(data) => {
          addReservationMutation.mutate(data, {
            onSuccess: () => {
              setIsNewReservationModalOpen(false);
            },
          });
        }}
      />
    </aside>
  );
}
