import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ToggleLeft,
  ToggleRight,
  UtensilsCrossed,
  Layers,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface ItemLogEntry {
  id: string;
  timestamp: string;
  itemName: string;
  category: string;
  channels: string[];
  action: "TURNED_OFF" | "TURNED_ON";
  reason: string;
  operator: string;
}

export function OnlineItemLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<ItemLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "ONLINE_ITEMS");
      const mapped: ItemLogEntry[] = data.map((log: POSManagementLogDto) => {
        const isOff = (log.details?.status as string)?.toLowerCase().includes("out") ||
          log.event_title.toLowerCase().includes("unavailable") ||
          log.event_title.toLowerCase().includes("inactive");

        return {
          id: log.id,
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
          itemName: (log.details?.itemName as string) || log.event_title.split(" ")[0] || "Menu Item",
          category: (log.details?.category as string) || "Food Menu",
          channels: [(log.details?.platform as string) || "Retrod Store"],
          action: isOff ? "TURNED_OFF" : "TURNED_ON",
          reason: (log.details?.reason as string) || log.event_title || "Item stock toggled",
          operator: (log.details?.operator as string) || log.actor_name || "Store Manager",
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load online items logs:", err);
      toast.error("Failed to load online item logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter === "TURNED_OFF" && log.action !== "TURNED_OFF") return false;
      if (actionFilter === "TURNED_ON" && log.action !== "TURNED_ON") return false;
      return true;
    });
  }, [logs, actionFilter]);

  const stats = useMemo(() => {
    const turnedOffCount = logs.filter((l) => l.action === "TURNED_OFF").length;
    const turnedOnCount = logs.filter((l) => l.action === "TURNED_ON").length;
    return { turnedOffCount, turnedOnCount, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<ItemLogEntry>[] = [
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
      id: "itemName",
      header: "Menu Item",
      accessorKey: "itemName",
      sortable: true,
      defaultWidth: 180,
      render: (_, r) => (
        <div>
          <div className="font-bold text-[12.5px] text-slate-900">{r.itemName}</div>
          <div className="text-[10.5px] text-slate-500">{r.category}</div>
        </div>
      ),
    },
    {
      id: "action",
      header: "Availability Action",
      accessorKey: "action",
      sortable: true,
      defaultWidth: 160,
      render: (_, r) => {
        if (r.action === "TURNED_OFF") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
              <ToggleLeft className="h-3.5 w-3.5" />
              Turned OFF (86'd)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <ToggleRight className="h-3.5 w-3.5" />
            Turned ON (Active)
          </span>
        );
      },
    },
    {
      id: "channels",
      header: "Affected Channels",
      accessorKey: "channels",
      defaultWidth: 165,
      render: (_, r) => (
        <div className="flex flex-wrap gap-1">
          {r.channels.map((ch, idx) => (
            <span
              key={idx}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-700"
            >
              {ch}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "reason",
      header: "Reason / Trigger",
      accessorKey: "reason",
      defaultWidth: 230,
      render: (_, r) => (
        <div className="text-[12px] text-slate-700 truncate" title={r.reason}>
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
            <UtensilsCrossed className="h-5 w-5 text-teal-600" />
            Online Item On / Off Availability Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} item 86-ing and channel stock status.
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
            <span>Total Item Actions</span>
            <Layers className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.count}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Recorded stock events</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Turned OFF (86'd)</span>
            <ToggleLeft className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-rose-600">{stats.turnedOffCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Out of stock actions</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Turned ON (Restocked)</span>
            <ToggleRight className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">{stats.turnedOnCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Restocked activations</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Aggregators Synced</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">Swiggy & Zomato</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Live menu push</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Action:
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Item Actions</option>
          <option value="TURNED_OFF">Turned OFF (Out of Stock)</option>
          <option value="TURNED_ON">Turned ON (Available)</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search items by name, category, or reason..."
        emptyMessage="No online item availability changes recorded yet for this outlet."
      />
    </div>
  );
}

export default OnlineItemLogsView;
