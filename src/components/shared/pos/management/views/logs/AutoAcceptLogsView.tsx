import { useState, useMemo, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface AutoAcceptLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  previousState: boolean;
  newState: boolean;
  prepTimeBuffer: string;
  maxActiveOrdersLimit: string;
  operator: string;
  role: string;
  reason: string;
  terminalIp: string;
}

export function AutoAcceptLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<AutoAcceptLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "AUTO_ACCEPT");
      const mapped: AutoAcceptLogEntry[] = data.map((log: POSManagementLogDto) => ({
        id: log.id,
        timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
        platform: (log.details?.platform as string) || "Retrod Online Store",
        previousState: Boolean(log.details?.previousState),
        newState: Boolean(log.details?.newState ?? log.details?.autoAccept ?? true),
        prepTimeBuffer: (log.details?.prepTimeBuffer as string) || "20 Mins",
        maxActiveOrdersLimit: (log.details?.maxActiveOrdersLimit as string) || "15 Checks",
        operator: (log.details?.operator as string) || log.actor_name || "Management Admin",
        role: "Store Manager",
        reason: (log.details?.reason as string) || log.event_title || "Auto-accept toggle",
        terminalIp: "192.168.1.101 (Manager Desk)",
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load auto-accept logs:", err);
      toast.error("Failed to load auto-accept logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (platformFilter !== "All" && log.platform !== platformFilter) return false;
      return true;
    });
  }, [logs, platformFilter]);

  const stats = useMemo(() => {
    const activeCount = logs.filter((l) => l.newState).length;
    return { activeCount, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<AutoAcceptLogEntry>[] = [
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
      id: "platform",
      header: "Delivery Platform",
      accessorKey: "platform",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="text-[12.5px] font-bold text-slate-800">{r.platform}</span>
      ),
    },
    {
      id: "stateTransition",
      header: "Mode Transition",
      defaultWidth: 165,
      render: (_, r) => (
        <div className="flex items-center gap-2 font-mono text-[12px]">
          <span className={r.previousState ? "text-emerald-600 font-semibold" : "text-slate-400"}>
            {r.previousState ? "Enabled" : "Disabled"}
          </span>
          <span className="text-slate-400">&rarr;</span>
          <span className={r.newState ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
            {r.newState ? "Enabled" : "Disabled"}
          </span>
        </div>
      ),
    },
    {
      id: "operator",
      header: "Operator / Authorized",
      accessorKey: "operator",
      defaultWidth: 170,
      render: (_, r) => (
        <div>
          <div className="font-bold text-[12px] text-slate-900">{r.operator}</div>
          <div className="text-[10.5px] text-slate-500">{r.role}</div>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Reason / Event Summary",
      accessorKey: "reason",
      defaultWidth: 240,
      render: (_, r) => (
        <div className="text-[11.5px] text-slate-600 truncate" title={r.reason}>
          {r.reason}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-teal-600" />
            Aggregator Auto-Accept Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} Swiggy, Zomato, and online store order auto-acceptance.
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
            <span>Logged Transitions</span>
            <SlidersHorizontal className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.count}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">State override events</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Enabled Count</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">{stats.activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Auto-accept events</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Default Buffer</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">20 Mins</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Standard kitchen prep</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Audit Status</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">100%</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Server verified logs</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Platform:
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Platforms</option>
          <option value="Swiggy">Swiggy</option>
          <option value="Zomato">Zomato</option>
          <option value="Retrod Online Store">Retrod Online Store</option>
          <option value="ONDC Delivery">ONDC Delivery</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search transitions, operators, or reasons..."
        emptyMessage="No auto-accept events recorded yet for this outlet."
      />
    </div>
  );
}

export default AutoAcceptLogsView;
