import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import {
  Coins,
  Save,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Plus,
  ArrowUpDown,
  History,
  TrendingDown,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common";
import { PosDataGrid } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ShiftCashLog {
  id: string;
  shiftName: "Morning Shift" | "Evening / Dinner Shift" | "Night Shift";
  cashierName: string;
  countedDate: string;
  openingFloat: number;
  expectedSystemCash: number;
  physicalCountedCash: number;
  variance: number;
  status: "Balanced" | "Surplus" | "Shortage";
  notes?: string;
}

const INITIAL_LOGS: ShiftCashLog[] = [];

export function CashDenominationView() {
  const { activeOutlet } = useOutletContext();
  // Live Denomination Counter State
  const [denominations, setDenominations] = useState([
    { note: 500, count: 24 },
    { note: 200, count: 35 },
    { note: 100, count: 50 },
    { note: 50, count: 40 },
    { note: 20, count: 60 },
    { note: 10, count: 80 },
    { note: 5, count: 20 },
    { note: 1, count: 50 },
  ]);

  const [openingFloat, setOpeningFloat] = useState(5000);
  const [expectedSystemCash, setExpectedSystemCash] = useState(38400);
  const [shiftName, setShiftName] = useState<"Morning Shift" | "Evening / Dinner Shift" | "Night Shift">("Evening / Dinner Shift");
  const [cashierName, setCashierName] = useState("Ayush Mishra");
  const [cashierNotes, setCashierNotes] = useState("");

  // History Logs Table State
  const [logs, setLogs] = useState<ShiftCashLog[]>(INITIAL_LOGS);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getDenominations(activeOutlet.id).then((res) => {
      setLogs(
        (res || []).map((d) => ({
          id: d.id,
          shiftName: (d.session_type as any) || "Morning Shift",
          cashierName: d.session_type || "Cashier",
          countedDate: d.date ? new Date(d.date).toLocaleString("en-IN") : "",
          openingFloat: parseFloat(d.total_amount) || 0,
          expectedSystemCash: parseFloat(d.total_amount) || 0,
          physicalCountedCash: parseFloat(d.total_amount) || 0,
          variance: 0,
          status: "Balanced",
          notes: d.notes || "Count verified",
        }))
      );
    }).catch(() => {});
  }, [activeOutlet?.id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Totals
  const physicalTotal = useMemo(() => {
    return denominations.reduce((acc, d) => acc + d.note * (Number(d.count) || 0), 0);
  }, [denominations]);

  const totalCalculatedDrawer = physicalTotal;
  const variance = totalCalculatedDrawer - (expectedSystemCash + openingFloat);

  const handleSaveShiftCount = () => {
    const status: "Balanced" | "Surplus" | "Shortage" =
      variance === 0 ? "Balanced" : variance > 0 ? "Surplus" : "Shortage";

    const newLog: ShiftCashLog = {
      id: `scl-${Date.now()}`,
      shiftName: shiftName,
      cashierName: cashierName.trim() || "Cashier Desk",
      countedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      openingFloat: openingFloat,
      expectedSystemCash: expectedSystemCash,
      physicalCountedCash: totalCalculatedDrawer,
      variance: variance,
      status: status,
      notes: cashierNotes.trim() || undefined,
    };

    setLogs((prev) => [newLog, ...prev]);
    toast.success(
      `Shift cash count saved! Status: ${status} (${variance === 0 ? "Exact Match" : `₹${Math.abs(variance)} ${status}`})`
    );
  };

  const handleResetCounts = () => {
    setDenominations((prev) => prev.map((d) => ({ ...d, count: 0 })));
    toast.info("Denomination counters reset to zero");
  };

  // Filtered & Sorted
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (shiftFilter !== "All" && l.shiftName !== shiftFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.cashierName.toLowerCase().includes(q) ||
          l.shiftName.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, searchQuery, shiftFilter]);

  const sortedLogs = useMemo(() => {
    if (!sortConfig) return filteredLogs;
    return [...filteredLogs].sort((a, b) => {
      const field = sortConfig.colId as keyof ShiftCashLog;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredLogs, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, validPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedLogs.length && sortedLogs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedLogs.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const columns: any[] = useMemo(
    () => [
      {
        id: "countedDate",
        header: "Counted Date & Time",
        label: "Counted Date & Time",
        sortable: true,
        width: 170,
        render: (_: any, r: ShiftCashLog) => (
          <span className="font-mono text-slate-700">{r.countedDate}</span>
        ),
        getValue: (r: ShiftCashLog) => r.countedDate,
      },
      {
        id: "shiftName",
        header: "Shift",
        label: "Shift",
        sortable: true,
        filterable: true,
        width: 180,
        render: (_: any, r: ShiftCashLog) => (
          <span className="font-medium text-slate-900">{r.shiftName}</span>
        ),
        getValue: (r: ShiftCashLog) => r.shiftName,
      },
      {
        id: "cashierName",
        header: "Cashier / Operator",
        label: "Cashier / Operator",
        sortable: true,
        width: 200,
        render: (_: any, r: ShiftCashLog) => (
          <div>
            <div className="font-medium text-slate-800">{r.cashierName}</div>
            {r.notes && <div className="text-[11px] text-slate-400">{r.notes}</div>}
          </div>
        ),
        getValue: (r: ShiftCashLog) => r.cashierName,
      },
      {
        id: "openingFloat",
        header: "Opening Float (₹)",
        label: "Opening Float (₹)",
        sortable: true,
        align: "right" as const,
        width: 140,
        render: (_: any, r: ShiftCashLog) => (
          <span className="font-mono text-slate-600">₹{r.openingFloat.toLocaleString("en-IN")}</span>
        ),
        getValue: (r: ShiftCashLog) => `₹${r.openingFloat.toLocaleString("en-IN")}`,
      },
      {
        id: "expectedSystemCash",
        header: "System Cash (₹)",
        label: "System Cash (₹)",
        sortable: true,
        align: "right" as const,
        width: 140,
        render: (_: any, r: ShiftCashLog) => (
          <span className="font-mono text-slate-700 font-medium">₹{r.expectedSystemCash.toLocaleString("en-IN")}</span>
        ),
        getValue: (r: ShiftCashLog) => `₹${r.expectedSystemCash.toLocaleString("en-IN")}`,
      },
      {
        id: "physicalCountedCash",
        header: "Physical Cash (₹)",
        label: "Physical Cash (₹)",
        sortable: true,
        align: "right" as const,
        width: 150,
        render: (_: any, r: ShiftCashLog) => (
          <span className="font-mono font-bold text-slate-900">₹{r.physicalCountedCash.toLocaleString("en-IN")}</span>
        ),
        getValue: (r: ShiftCashLog) => `₹${r.physicalCountedCash.toLocaleString("en-IN")}`,
      },
      {
        id: "variance",
        header: "Variance (₹)",
        label: "Variance (₹)",
        sortable: true,
        align: "right" as const,
        width: 130,
        render: (_: any, r: ShiftCashLog) => (
          <span
            className={
              r.variance === 0
                ? "font-mono font-semibold text-emerald-600"
                : r.variance > 0
                ? "font-mono font-semibold text-blue-600"
                : "font-mono font-semibold text-rose-600"
            }
          >
            {r.variance === 0 ? "₹0.00" : `₹${r.variance.toLocaleString("en-IN")}`}
          </span>
        ),
        getValue: (r: ShiftCashLog) => (r.variance === 0 ? "₹0.00" : `₹${r.variance.toLocaleString("en-IN")}`),
      },
      {
        id: "status",
        header: "Reconciliation Status",
        label: "Reconciliation Status",
        sortable: true,
        filterable: true,
        align: "center" as const,
        width: 160,
        render: (_: any, r: ShiftCashLog) => (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              r.status === "Balanced"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : r.status === "Surplus"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {r.status === "Balanced" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
            {r.status === "Surplus" && <TrendingUp className="h-3 w-3 text-blue-600" />}
            {r.status === "Shortage" && <TrendingDown className="h-3 w-3 text-rose-600" />}
            {r.status}
          </span>
        ),
        getValue: (r: ShiftCashLog) => r.status,
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Cash Drawer Denomination & Shift Reconciliation
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Count physical currency notes & coins, audit opening float, and reconcile shift cash variances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCounts}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Reset Counters
          </button>
          <button
            type="button"
            onClick={handleSaveShiftCount}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
          >
            <Save className="h-4 w-4" /> Save Shift Count
          </button>
        </div>
      </div>

      {/* 2. Interactive Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Currency Denominations Entry Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-teal-600" />
              <h3 className="text-[14px] font-bold text-slate-900">Currency Notes & Coin Breakdown</h3>
            </div>
            <span className="text-[12px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
              Total: ₹{physicalTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {denominations.map((d, index) => (
              <div
                key={d.note}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 font-mono font-bold text-[12px] text-slate-800 shadow-2xs">
                    ₹{d.note}
                  </span>
                  <span className="text-[12px] text-slate-500 font-medium">×</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={d.count === 0 ? "" : d.count}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setDenominations((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, count: val } : item))
                      );
                    }}
                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[13px] font-mono font-semibold text-slate-800 text-center focus:border-teal-500 focus:outline-none shadow-2xs"
                  />
                  <div className="w-20 text-right font-mono font-bold text-[13px] text-slate-900">
                    ₹{(d.note * (Number(d.count) || 0)).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Cash Reconciliation Summary Box */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-[14px] font-bold text-slate-900">Shift Reconciliation Parameters</h3>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Shift opening float & POS system expected balance</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Active Shift</label>
                <select
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none"
                >
                  <option value="Morning Shift">Morning Shift</option>
                  <option value="Evening / Dinner Shift">Evening / Dinner Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Cashier Name</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">POS Net Cash Sales (₹)</label>
                <input
                  type="number"
                  value={expectedSystemCash}
                  onChange={(e) => setExpectedSystemCash(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Reconciliation Comparison Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 text-[12.5px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>Expected Total (Float + Sales)</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₹{(openingFloat + expectedSystemCash).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Physical Cash Counted</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{totalCalculatedDrawer.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">Variance (Discrepancy)</span>
                <span
                  className={`font-mono font-bold text-[14px] ${
                    variance === 0
                      ? "text-emerald-600"
                      : variance > 0
                      ? "text-blue-600"
                      : "text-rose-600"
                  }`}
                >
                  {variance === 0
                    ? "₹0.00 (Balanced)"
                    : variance > 0
                    ? `+₹${variance.toLocaleString("en-IN")} (Surplus)`
                    : `-₹${Math.abs(variance).toLocaleString("en-IN")} (Shortage)`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-slate-600">Reconciliation Notes</label>
              <input
                type="text"
                placeholder="Optional comments regarding shift handover..."
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveShiftCount}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-sm shadow-teal-600/20"
          >
            <Save className="h-4 w-4" /> Save & Log Shift Reconciliation
          </button>
        </div>
      </div>

      {/* 3. Shift Cash Reconciliation History Table with DataTableHeader & Footer */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="text-[13px] font-bold text-slate-900 tracking-tight">
            Shift Cash Drawer Reconciliation Log
          </div>
          <span className="text-[11.5px] text-slate-400">Audited shift closings & cashier handover history</span>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[220px]">
              <label className="text-[11.5px] font-semibold text-slate-600">Search Shift / Cashier</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cashier name or notes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1 min-w-[160px]">
              <label className="text-[11.5px] font-semibold text-slate-600">Shift</label>
              <div className="relative">
                <select
                  value={shiftFilter}
                  onChange={(e) => {
                    setShiftFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Shifts</option>
                  <option value="Morning Shift">Morning Shift</option>
                  <option value="Evening / Dinner Shift">Evening / Dinner Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info(`Found ${filteredLogs.length} matching shift logs`)}
                className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShiftFilter("All");
                  setCurrentPage(1);
                  toast.info("Showing all shift reconciliation logs");
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                Show All
              </button>
            </div>
          </div>
        </div>

        {/* Full Table */}
        <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
          <PosDataGrid
            data={filteredLogs}
            columns={columns}
            keyField="id"
            selectable
            selectedRowIds={selectedIds}
            onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
            storageKey="pos-accounting-cash-denomination"
            pageSize={10}
            themeVariant="primary"
            emptyMessage="No shift cash reconciliation logs found matching your criteria."
          />
        </div>
      </div>
    </div>
  );
}
