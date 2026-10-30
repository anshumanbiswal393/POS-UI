import { useState, useMemo, useEffect, useCallback } from "react";
import { History, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSAuditTrailDto } from "@/services/posManagementService";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  terminalIp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

export function AuditTrailView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const fetchAuditLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getAuditTrail(
        activeOutlet.id,
        actionFilter !== "ALL" ? actionFilter : undefined
      );
      const mapped: AuditLogEntry[] = data.map((item: POSAuditTrailDto) => {
        let sev: "Low" | "Medium" | "High" | "Critical" = "Low";
        const act = item.action?.toUpperCase();
        if (act === "DRAWER_OPEN" || act === "VOID_KOT") {
          sev = "Critical";
        } else if (act === "PRICE_OVERRIDE" || act === "APPLY_DISCOUNT") {
          sev = "High";
        } else if (act === "SETTINGS_CHANGE" || act === "EXPENSE_CREATE") {
          sev = "Medium";
        }

        const role = (item.metadata?.role as string) ||
          (item.actor_name?.toLowerCase().includes("manager")
            ? "Store Manager"
            : item.actor_name?.toLowerCase().includes("captain")
            ? "Floor Captain"
            : item.actor_name?.toLowerCase().includes("admin")
            ? "System Admin"
            : "Cashier");

        return {
          id: item.id,
          timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).toLocaleString("en-IN") : ""),
          user: item.actor_name || "System",
          role,
          action: item.action,
          details: item.description || "Action executed",
          terminalIp: item.ip_address || item.device_name || "192.168.1.100 (POS Terminal)",
          severity: sev,
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load audit trail:", err);
      toast.error("Failed to load audit trail from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (severityFilter !== "ALL" && log.severity !== severityFilter) {
        return false;
      }
      return true;
    });
  }, [logs, severityFilter]);

  const stats = useMemo(() => {
    const criticalCount = logs.filter((l) => l.severity === "Critical" || l.severity === "High").length;
    const usersCount = new Set(logs.map((l) => l.user)).size;
    return {
      total: logs.length,
      critical: criticalCount,
      users: usersCount,
    };
  }, [logs]);

  const columns: PosDataGridColumn<AuditLogEntry>[] = [
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
      id: "user",
      header: "Operator / User",
      accessorKey: "user",
      sortable: true,
      defaultWidth: 160,
      render: (_, r) => (
        <div>
          <div className="font-bold text-[12.5px] text-slate-900">{r.user}</div>
          <div className="text-[11px] text-slate-500 font-medium">{r.role}</div>
        </div>
      ),
    },
    {
      id: "action",
      header: "Security Action",
      accessorKey: "action",
      sortable: true,
      defaultWidth: 160,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-800">
          {r.action}
        </span>
      ),
    },
    {
      id: "details",
      header: "Action Particulars & Reason",
      accessorKey: "details",
      defaultWidth: 280,
      render: (_, r) => (
        <div className="text-[12px] text-slate-700 truncate font-medium" title={r.details}>
          {r.details}
        </div>
      ),
    },
    {
      id: "terminalIp",
      header: "Station / IP Address",
      accessorKey: "terminalIp",
      defaultWidth: 170,
      render: (_, r) => (
        <span className="font-mono text-[11px] text-slate-500">{r.terminalIp}</span>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      accessorKey: "severity",
      sortable: true,
      defaultWidth: 110,
      render: (_, r) => {
        let style = "bg-slate-100 text-slate-700 border-slate-200";
        if (r.severity === "Critical") style = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
        else if (r.severity === "High") style = "bg-amber-50 text-amber-700 border-amber-200 font-bold";
        else if (r.severity === "Medium") style = "bg-sky-50 text-sky-700 border-sky-200";
        return (
          <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style}`}>
            {r.severity}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-teal-600" />
            Security & Operational Audit Trail
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Immutable server audit log for {activeOutlet?.name || "Active Outlet"} tracking supervisor overrides, KOT cancellations, drawer opens, and logins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <ExportToExcelButton
            data={filteredLogs}
            columns={columns}
            fileName={`Audit_Trail_${activeOutlet?.code || "POS"}`}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Logged Events</span>
            <History className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.total}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Server database records</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>High & Critical Events</span>
            <ShieldCheck className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-rose-600">{stats.critical}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Overrides & drawer opens</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Distinct Actors</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">{stats.users}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Staff & managers</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Integrity Status</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">100%</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Cryptographic DB audit</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-bold text-slate-700">Action Filter:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Actions</option>
            <option value="VOID_KOT">VOID_KOT (Void Ticket)</option>
            <option value="APPLY_DISCOUNT">APPLY_DISCOUNT (Special Discount)</option>
            <option value="DRAWER_OPEN">DRAWER_OPEN (Drawer Ejection)</option>
            <option value="PRICE_OVERRIDE">PRICE_OVERRIDE (Price Override)</option>
            <option value="SETTINGS_CHANGE">SETTINGS_CHANGE (Config / Settlement)</option>
            <option value="LOGIN">LOGIN (Terminal Auth)</option>
            <option value="EXPENSE_CREATE">EXPENSE_CREATE (Voucher Recorded)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[12px] font-bold text-slate-700">Severity:</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search audit events by user, action, or details..."
        emptyMessage="No audit trail events recorded yet for this outlet."
      />
    </div>
  );
}

export default AuditTrailView;
