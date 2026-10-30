import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface MenuTriggerLogEntry {
  id: string;
  syncId: string;
  timestamp: string;
  platforms: string[];
  triggerType: string;
  itemsAffectedCount: number;
  status: "Success" | "Queued" | "Failed";
  operator: string;
  details: string;
}

export function MenuTriggerLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<MenuTriggerLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "MENU_TRIGGER");
      const mapped: MenuTriggerLogEntry[] = data.map((log: POSManagementLogDto) => {
        let st: "Success" | "Queued" | "Failed" = "Success";
        const rawStatus = (log.details?.status as string)?.toLowerCase();
        if (rawStatus === "queued") st = "Queued";
        else if (rawStatus === "failed") st = "Failed";

        const platforms = Array.isArray(log.details?.platforms)
          ? log.details.platforms
          : ["Retrod Store"];

        return {
          id: log.id,
          syncId: log.reference_id || `SYNC-${log.id.slice(0, 8).toUpperCase()}`,
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
          platforms,
          triggerType: (log.details?.triggerType as string) || "Price Revision",
          itemsAffectedCount: Number(log.details?.itemsAffectedCount || 1),
          status: st,
          operator: (log.details?.operator as string) || log.actor_name || "Management Admin",
          details: (log.details?.details as string) || log.event_title || "Menu sync triggered",
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load menu trigger logs:", err);
      toast.error("Failed to load menu trigger logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== "All" && log.triggerType !== typeFilter) return false;
      return true;
    });
  }, [logs, typeFilter]);

  const stats = useMemo(() => {
    const successCount = logs.filter((l) => l.status === "Success").length;
    const itemsTotal = logs.reduce((sum, l) => sum + (l.itemsAffectedCount || 0), 0);
    return { successCount, itemsTotal, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<MenuTriggerLogEntry>[] = [
    {
      id: "syncId",
      header: "Sync Ref",
      accessorKey: "syncId",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.syncId}</span>
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
      id: "triggerType",
      header: "Trigger Type",
      accessorKey: "triggerType",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
          {r.triggerType}
        </span>
      ),
    },
    {
      id: "platforms",
      header: "Target Channels",
      accessorKey: "platforms",
      defaultWidth: 170,
      render: (_, r) => (
        <div className="flex flex-wrap gap-1">
          {r.platforms.map((p, idx) => (
            <span
              key={idx}
              className="rounded bg-teal-50 px-1.5 py-0.5 text-[10.5px] font-bold text-teal-700 border border-teal-200"
            >
              {p}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "itemsAffectedCount",
      header: "Items Count",
      accessorKey: "itemsAffectedCount",
      sortable: true,
      defaultWidth: 110,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-slate-800">
          {r.itemsAffectedCount} item{r.itemsAffectedCount === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Push Status",
      accessorKey: "status",
      sortable: true,
      defaultWidth: 120,
      render: (_, r) => {
        if (r.status === "Success") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Success
            </span>
          );
        }
        if (r.status === "Queued") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Clock className="h-3 w-3" />
              Queued
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      },
    },
    {
      id: "operator",
      header: "Authorized By",
      accessorKey: "operator",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.operator}</div>
      ),
    },
    {
      id: "details",
      header: "Trigger Details",
      accessorKey: "details",
      defaultWidth: 240,
      render: (_, r) => (
        <div className="text-[11.5px] text-slate-600 truncate" title={r.details}>
          {r.details}
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
            <Send className="h-5 w-5 text-teal-600" />
            Menu Catalog Trigger & Sync Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} price revisions, item publishing, and aggregator updates.
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
            <span>Successful Syncs</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.successCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Platform updates published</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Items Affected</span>
            <Layers className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-teal-600">{stats.itemsTotal}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Menu items synchronized</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Triggers</span>
            <Send className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">{stats.count}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Server logged events</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Sync Reliability</span>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">
            {stats.count > 0 ? `${Math.round((stats.successCount / stats.count) * 100)}%` : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Direct API webhook sync</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Action:
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Trigger Types</option>
          <option value="Price Revision">Price Revision</option>
          <option value="New Item Publish">New Item Publish</option>
          <option value="Tax Rate Update">Tax Rate Update</option>
          <option value="Category Sort">Category Sort</option>
          <option value="Item Toggle">Item Toggle</option>
          <option value="Channel Publish">Channel Publish</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search menu sync slips or items affected..."
        emptyMessage="No menu triggers or item price changes recorded yet for this outlet."
      />
    </div>
  );
}

export default MenuTriggerLogsView;
