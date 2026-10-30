import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface StoreLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  event: "STORE_ONLINE" | "STORE_OFFLINE";
  operator: string;
  reason: string;
  status: "Success" | "Warning" | "Error";
}

export function OnlineStoreLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<StoreLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "ONLINE_STORE");
      const mapped: StoreLogEntry[] = data.map((log: POSManagementLogDto) => {
        const connected = Boolean(log.details?.connected ?? true);
        return {
          id: log.id,
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
          platform: (log.details?.platform as string) || "Retrod Online Store",
          event: connected ? "STORE_ONLINE" : "STORE_OFFLINE",
          operator: (log.details?.operator as string) || log.actor_name || "Management Admin",
          reason: (log.details?.reason as string) || log.event_title || "Store connection toggled",
          status: connected ? "Success" : "Warning",
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load online store logs:", err);
      toast.error("Failed to load store logs from server");
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
    const onlineCount = logs.filter((l) => l.event === "STORE_ONLINE").length;
    return { onlineCount, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<StoreLogEntry>[] = [
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
      header: "Platform / Store",
      accessorKey: "platform",
      sortable: true,
      defaultWidth: 180,
      render: (_, r) => (
        <span className="text-[12.5px] font-bold text-slate-900">{r.platform}</span>
      ),
    },
    {
      id: "event",
      header: "Online / Offline State",
      accessorKey: "event",
      sortable: true,
      defaultWidth: 160,
      render: (_, r) => {
        if (r.event === "STORE_ONLINE") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Wifi className="h-3.5 w-3.5" />
              Store Online
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
            <WifiOff className="h-3.5 w-3.5" />
            Store Offline
          </span>
        );
      },
    },
    {
      id: "reason",
      header: "Reason / Event Description",
      accessorKey: "reason",
      defaultWidth: 240,
      render: (_, r) => (
        <div className="text-[12px] text-slate-600 truncate" title={r.reason}>
          {r.reason}
        </div>
      ),
    },
    {
      id: "operator",
      header: "Operator",
      accessorKey: "operator",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.operator}</div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-600" />
            Online Store Status & Aggregator Connectivity Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} marketplace integration connections and pauses.
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
            <span>Logged Events</span>
            <Globe className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.count}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Recorded transitions</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Online Events</span>
            <Wifi className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">{stats.onlineCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Activated storefronts</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Offline Events</span>
            <WifiOff className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-rose-600">
            {stats.count - stats.onlineCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Deactivated storefronts</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Server Sync</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">Active</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Real-time marketplace sync</div>
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
          <option value="Retrod Online Store">Retrod Online Store</option>
          <option value="Zomato">Zomato</option>
          <option value="Swiggy">Swiggy</option>
          <option value="Direct QR Ordering">Direct QR Ordering</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search store events by platform or operator..."
        emptyMessage="No online store connection logs recorded yet for this outlet."
      />
    </div>
  );
}

export default OnlineStoreLogsView;
