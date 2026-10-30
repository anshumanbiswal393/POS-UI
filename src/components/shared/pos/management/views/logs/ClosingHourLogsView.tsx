import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface ClosingHourLogEntry {
  id: string;
  logId: string;
  timestamp: string;
  section: string;
  eventType: string;
  effectiveFrom: string;
  effectiveTo: string;
  reason: string;
  authorizedBy: string;
  customerNoticeSent: boolean;
}

export function ClosingHourLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<ClosingHourLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "CLOSING_HOURS");
      const mapped: ClosingHourLogEntry[] = data.map((log: POSManagementLogDto) => ({
        id: log.id,
        logId: log.reference_id || `TIM-${log.id.slice(0, 8).toUpperCase()}`,
        timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
        section: (log.details?.section as string) || "Entire Outlet",
        eventType: (log.details?.eventType as string) || "Regular Timing Shift",
        effectiveFrom: (log.details?.effectiveFrom as string) || (log.created_at ? new Date(log.created_at).toLocaleDateString("en-IN") : ""),
        effectiveTo: (log.details?.effectiveTo as string) || "Active Schedule",
        reason: (log.details?.reason as string) || log.event_title || "Outlet operating hours update",
        authorizedBy: (log.details?.authorizedBy as string) || log.actor_name || "Management Admin",
        customerNoticeSent: Boolean(log.details?.customerNoticeSent),
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load closing hour logs:", err);
      toast.error("Failed to load closing hour logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (eventTypeFilter !== "All" && log.eventType !== eventTypeFilter) return false;
      return true;
    });
  }, [logs, eventTypeFilter]);

  const stats = useMemo(() => {
    const extendedCount = logs.filter((l) => l.eventType.toLowerCase().includes("extended")).length;
    const earlyCount = logs.filter((l) => l.eventType.toLowerCase().includes("early")).length;
    return { extendedCount, earlyCount, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<ClosingHourLogEntry>[] = [
    {
      id: "logId",
      header: "Log Ref",
      accessorKey: "logId",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.logId}</span>
      ),
    },
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="font-mono text-[12px] text-slate-600 font-medium">{r.timestamp}</span>
      ),
    },
    {
      id: "section",
      header: "Dining / Bar Section",
      accessorKey: "section",
      sortable: true,
      defaultWidth: 170,
      render: (_, r) => (
        <span className="text-[12.5px] font-semibold text-slate-900">{r.section}</span>
      ),
    },
    {
      id: "eventType",
      header: "Override Nature",
      accessorKey: "eventType",
      sortable: true,
      defaultWidth: 180,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
          {r.eventType}
        </span>
      ),
    },
    {
      id: "effectivePeriod",
      header: "Effective Period",
      defaultWidth: 190,
      render: (_, r) => (
        <div className="font-mono text-[11.5px] text-slate-700 font-medium">
          {r.effectiveFrom} &rarr; {r.effectiveTo}
        </div>
      ),
    },
    {
      id: "reason",
      header: "Reason / Authorization Note",
      accessorKey: "reason",
      defaultWidth: 230,
      render: (_, r) => (
        <div className="text-[12px] text-slate-600 truncate" title={r.reason}>
          {r.reason}
        </div>
      ),
    },
    {
      id: "authorizedBy",
      header: "Authorized By",
      accessorKey: "authorizedBy",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.authorizedBy}</div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" />
            Closing Hours & Schedule Override Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} operating timings, holiday schedules, and early closures.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Schedule Updates</span>
            <Calendar className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.count}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Recorded shifts & saves</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Night Extensions</span>
            <Moon className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">{stats.extendedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Late night operations</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Early Closures</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-amber-600">{stats.earlyCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Maintenance / special off</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Operating Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">Active</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Regular store timings</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Type:
        </div>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Schedule Types</option>
          <option value="Regular Timing Shift">Regular Timing Shift</option>
          <option value="Extended Night Hours">Extended Night Hours</option>
          <option value="Early Closure">Early Closure</option>
          <option value="Holiday Schedule">Holiday Schedule</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search schedule shifts or authorization notes..."
        emptyMessage="No closing hour or schedule overrides recorded yet for this outlet."
      />
    </div>
  );
}

export default ClosingHourLogsView;
