import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpCircle,
  IndianRupee,
  Coins,
  ShieldCheck,
  Plus,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface CashTopUpLogEntry {
  id: string;
  topupId: string;
  timestamp: string;
  terminal: string;
  topupAmount: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  depositedBy: string;
  verifiedBy: string;
  notes: string;
}

export function CashTopUpLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<CashTopUpLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasonFilter, setReasonFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Morning Opening Float");
  const [terminal, setTerminal] = useState("Terminal POS 1 (Counter)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "CASH_TOPUP");
      const mapped: CashTopUpLogEntry[] = data.map((log: POSManagementLogDto) => ({
        id: log.id,
        topupId: log.reference_id || `TOP-${log.id.slice(0, 8).toUpperCase()}`,
        timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
        terminal: (log.details?.terminal as string) || (log.details?.register as string) || "Terminal POS 1 (Counter)",
        topupAmount: Number(log.details?.amount || 0),
        previousBalance: Number(log.details?.previousBalance || 0),
        newBalance: Number(log.details?.newBalance || log.details?.amount || 0),
        reason: (log.details?.reason as string) || log.event_title || "Morning Opening Float",
        depositedBy: (log.details?.depositedBy as string) || log.actor_name || "Cashier",
        verifiedBy: (log.details?.verifiedBy as string) || "Store Manager",
        notes: (log.details?.notes as string) || log.event_title || "",
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load cash top-up logs:", err);
      toast.error("Failed to load cash top-up logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (!activeOutlet?.id) {
      toast.error("No active outlet selected");
      return;
    }

    setIsSubmitting(true);
    try {
      await posManagementService.recordManagementLog(activeOutlet.id, {
        log_type: "CASH_TOPUP",
        event_title: `Cash Top-Up of ₹${numAmount}: ${reason}`,
        actor_name: "Staff Cashier",
        details: {
          amount: numAmount,
          reason,
          terminal,
          depositedBy: "Staff Cashier",
          verifiedBy: "Store Manager",
          previousBalance: 0,
          newBalance: numAmount,
          notes: notes.trim() || `Float allocation: ${reason}`,
        },
      });
      toast.success(`Cash top-up of ₹${numAmount.toLocaleString("en-IN")} recorded permanently!`);
      setIsModalOpen(false);
      setAmount("");
      setNotes("");
      await fetchLogs();
    } catch (err) {
      console.error("Failed to record cash top-up:", err);
      toast.error("Failed to record cash top-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (reasonFilter !== "All" && log.reason !== reasonFilter) return false;
      return true;
    });
  }, [logs, reasonFilter]);

  const totalTopUpAmount = useMemo(() => {
    return logs.reduce((sum, l) => sum + (l.topupAmount || 0), 0);
  }, [logs]);

  const columns: PosDataGridColumn<CashTopUpLogEntry>[] = [
    {
      id: "topupId",
      header: "Slip Ref",
      accessorKey: "topupId",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.topupId}</span>
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
      id: "terminal",
      header: "Station / Drawer",
      accessorKey: "terminal",
      sortable: true,
      defaultWidth: 180,
      render: (_, r) => (
        <span className="font-semibold text-[12.5px] text-slate-900">{r.terminal}</span>
      ),
    },
    {
      id: "topupAmount",
      header: "Amount Added",
      accessorKey: "topupAmount",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[13.5px] font-black text-emerald-600">
          + ₹ {r.topupAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "balances",
      header: "Balance Change",
      defaultWidth: 170,
      render: (_, r) => (
        <div className="font-mono text-[11.5px] text-slate-600">
          ₹ {r.previousBalance.toLocaleString("en-IN")} &rarr;{" "}
          <span className="font-bold text-slate-900">
            ₹ {r.newBalance.toLocaleString("en-IN")}
          </span>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Top-Up Reason",
      accessorKey: "reason",
      sortable: true,
      defaultWidth: 190,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
          {r.reason}
        </span>
      ),
    },
    {
      id: "depositedBy",
      header: "Deposited By",
      accessorKey: "depositedBy",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.depositedBy}</div>
      ),
    },
    {
      id: "verifiedBy",
      header: "Manager Auth",
      accessorKey: "verifiedBy",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-600 font-medium">{r.verifiedBy}</div>
      ),
    },
    {
      id: "notes",
      header: "Notes & Details",
      accessorKey: "notes",
      defaultWidth: 220,
      render: (_, r) => (
        <div className="text-[11.5px] text-slate-600 truncate" title={r.notes}>
          {r.notes || "—"}
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
            <ArrowUpCircle className="h-5 w-5 text-teal-600" />
            Cash Top-Up & Float Addition Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} register floats and mid-shift injections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Float Top-Up
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Floats Added</span>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">
            ₹ {totalTopUpAmount.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {logs.length} Total record{logs.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Active Slips</span>
            <Coins className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-teal-600">{logs.length}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Logged in backend</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Latest Deposit</span>
            <Coins className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">
            ₹ {logs[0]?.topupAmount ? logs[0].topupAmount.toLocaleString("en-IN") : "0"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {logs[0]?.terminal || "No entries"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Manager Verified</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">
            {logs.length > 0 ? "100%" : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Live verification status</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Reason:
        </div>

        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Float Reasons</option>
          <option value="Morning Opening Float">Morning Opening Float</option>
          <option value="Small Change & Coin Refill">Small Change & Coin Refill</option>
          <option value="Peak Shift Buffer Float">Peak Shift Buffer Float</option>
          <option value="Shift Handover">Shift Handover</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search top-up slips, stations, or notes..."
        emptyMessage="No cash top-up logs recorded yet for this outlet."
      />

      {/* Modal to record cash top-up */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-teal-600" />
                Record Cash Top-Up / Float
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopUp} className="mt-4 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Top-Up Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Morning Opening Float">Morning Opening Float</option>
                  <option value="Small Change & Coin Refill">Small Change & Coin Refill</option>
                  <option value="Peak Shift Buffer Float">Peak Shift Buffer Float</option>
                  <option value="Shift Handover">Shift Handover</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Target Station / Register
                </label>
                <select
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Terminal POS 1 (Counter)">Terminal POS 1 (Counter)</option>
                  <option value="Terminal POS 2 (Bar Station)">Terminal POS 2 (Bar Station)</option>
                  <option value="Main Cash Drawer">Main Cash Drawer</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Notes / Denomination breakdown
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. ₹500x4, ₹200x5, ₹100x15, ₹50x10"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashTopUpLogsView;
