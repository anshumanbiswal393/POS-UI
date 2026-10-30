import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Bell,
  MessageSquare,
  Smartphone,
  Mail,
  CheckCheck,
  Clock,
  AlertCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface NotificationLogEntry {
  id: string;
  msgId: string;
  timestamp: string;
  channel: string;
  recipient: string;
  templateType: string;
  orderRef?: string;
  status: "Delivered" | "Read" | "Pending" | "Failed";
  gatewayResponse: string;
}

export function NotificationsLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState("All");

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "NOTIFICATIONS");
      const mapped: NotificationLogEntry[] = data.map((log: POSManagementLogDto) => {
        let st: "Delivered" | "Read" | "Pending" | "Failed" = "Delivered";
        const rawStatus = (log.details?.status as string)?.toLowerCase();
        if (rawStatus === "read") st = "Read";
        else if (rawStatus === "pending") st = "Pending";
        else if (rawStatus === "failed") st = "Failed";

        return {
          id: log.id,
          msgId: log.reference_id || `MSG-${log.id.slice(0, 8).toUpperCase()}`,
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
          channel: (log.details?.channel as string) || "WhatsApp",
          recipient: (log.details?.recipient as string) || (log.details?.target_email as string) || log.actor_name || "Customer",
          templateType: (log.details?.templateType as string) || (log.details?.subject as string) || "Bill E-Receipt",
          orderRef: (log.details?.orderRef as string) || (log.reference_id ? `#${log.reference_id.slice(0, 8)}` : "Direct"),
          status: st,
          gatewayResponse: (log.details?.gatewayResponse as string) || log.event_title || "Dispatched successfully",
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load notifications logs:", err);
      toast.error("Failed to load notification logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (channelFilter !== "All" && log.channel !== channelFilter) return false;
      return true;
    });
  }, [logs, channelFilter]);

  const stats = useMemo(() => {
    const delivered = logs.filter((l) => l.status === "Delivered" || l.status === "Read").length;
    const read = logs.filter((l) => l.status === "Read").length;
    const failed = logs.filter((l) => l.status === "Failed").length;
    return { delivered, read, failed, total: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<NotificationLogEntry>[] = [
    {
      id: "msgId",
      header: "Message ID",
      accessorKey: "msgId",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.msgId}</span>
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
      id: "channel",
      header: "Channel",
      accessorKey: "channel",
      sortable: true,
      defaultWidth: 130,
      render: (_, r) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
          {r.channel.toLowerCase().includes("whatsapp") && <Smartphone className="h-3.5 w-3.5 text-emerald-600" />}
          {r.channel.toLowerCase().includes("sms") && <MessageSquare className="h-3.5 w-3.5 text-sky-600" />}
          {r.channel.toLowerCase().includes("email") && <Mail className="h-3.5 w-3.5 text-indigo-600" />}
          {r.channel}
        </span>
      ),
    },
    {
      id: "recipient",
      header: "Recipient / Contact",
      accessorKey: "recipient",
      defaultWidth: 180,
      render: (_, r) => (
        <div className="text-[12px] text-slate-900 font-medium truncate" title={r.recipient}>
          {r.recipient}
        </div>
      ),
    },
    {
      id: "templateType",
      header: "Template / Purpose",
      accessorKey: "templateType",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {r.templateType}
        </span>
      ),
    },
    {
      id: "orderRef",
      header: "Order Ref",
      accessorKey: "orderRef",
      defaultWidth: 120,
      render: (_, r) => (
        <span className="font-mono text-[11.5px] font-bold text-slate-600">{r.orderRef || "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Delivery Status",
      accessorKey: "status",
      sortable: true,
      defaultWidth: 130,
      render: (_, r) => {
        if (r.status === "Read") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              <CheckCheck className="h-3 w-3" />
              Read
            </span>
          );
        }
        if (r.status === "Delivered") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCheck className="h-3 w-3" />
              Delivered
            </span>
          );
        }
        if (r.status === "Failed") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="h-3 w-3" />
              Failed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      },
    },
    {
      id: "gatewayResponse",
      header: "Gateway Response",
      accessorKey: "gatewayResponse",
      defaultWidth: 220,
      render: (_, r) => (
        <span className="text-[11px] text-slate-500 font-mono truncate block" title={r.gatewayResponse}>
          {r.gatewayResponse}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            Customer Notification Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} WhatsApp bills, SMS receipts, and alerts.
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
            <span>Total Dispatched</span>
            <Bell className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.total}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Recorded notifications</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Delivered</span>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">{stats.delivered}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Gateway confirmed</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Read By Guests</span>
            <Smartphone className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-sky-600">{stats.read}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Customer viewed receipt</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Delivery Rate</span>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">
            {stats.total > 0 ? `${Math.round((stats.delivered / stats.total) * 100)}%` : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Success reliability</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Channel:
        </div>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Channels</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search notifications by recipient or message ID..."
        emptyMessage="No customer notification logs recorded yet for this outlet."
      />
    </div>
  );
}

export default NotificationsLogsView;
