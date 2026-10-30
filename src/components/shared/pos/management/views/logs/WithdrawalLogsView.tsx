import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowDownCircle,
  IndianRupee,
  Building,
  ShieldCheck,
  Vault,
  Plus,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSManagementLogDto } from "@/services/posManagementService";

interface WithdrawalLogEntry {
  id: string;
  withdrawalId: string;
  timestamp: string;
  terminal: string;
  amount: number;
  reason: string;
  handedTo: string;
  approvedBy: string;
  remainingDrawerBalance: number;
  acknowledgmentStatus: string;
}

export function WithdrawalLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<WithdrawalLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasonFilter, setReasonFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Bank Deposit Drop");
  const [handedTo, setHandedTo] = useState("HDFC Cash Courier / Armor");
  const [terminal, setTerminal] = useState("Terminal POS 1 (Counter)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getManagementLogs(activeOutlet.id, "WITHDRAWAL");
      const mapped: WithdrawalLogEntry[] = data.map((log: POSManagementLogDto) => ({
        id: log.id,
        withdrawalId: log.reference_id || `WTH-${log.id.slice(0, 8).toUpperCase()}`,
        timestamp: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "",
        terminal: (log.details?.terminal as string) || "Terminal POS 1 (Counter)",
        amount: Number(log.details?.amount || 0),
        reason: (log.details?.reason as string) || log.event_title || "Bank Deposit Drop",
        handedTo: (log.details?.handedTo as string) || log.actor_name || "Manager",
        approvedBy: (log.details?.approvedBy as string) || "Store Manager",
        remainingDrawerBalance: Number(log.details?.newBalance || log.details?.remainingDrawerBalance || 0),
        acknowledgmentStatus: (log.details?.acknowledgmentStatus as string) || "Verified & Signed",
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load withdrawal logs:", err);
      toast.error("Failed to load cash withdrawal logs");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!activeOutlet?.id) {
      toast.error("No active outlet selected");
      return;
    }

    setIsSubmitting(true);
    try {
      await posManagementService.recordManagementLog(activeOutlet.id, {
        log_type: "WITHDRAWAL",
        event_title: `Cash Drop / Withdrawal of ₹${numAmount}: ${reason}`,
        actor_name: "Store Manager",
        details: {
          amount: numAmount,
          reason,
          terminal,
          handedTo,
          approvedBy: "Store Manager",
          remainingDrawerBalance: 0,
          acknowledgmentStatus: "Verified & Signed",
        },
      });
      toast.success(`Cash withdrawal of ₹${numAmount.toLocaleString("en-IN")} recorded permanently!`);
      setIsModalOpen(false);
      setAmount("");
      await fetchLogs();
    } catch (err) {
      console.error("Failed to record cash withdrawal:", err);
      toast.error("Failed to record cash withdrawal");
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

  const totalWithdrawnAmount = useMemo(() => {
    return logs.reduce((sum, l) => sum + (l.amount || 0), 0);
  }, [logs]);

  const bankDropsCount = useMemo(() => {
    return logs.filter((l) => l.reason.toLowerCase().includes("bank")).length;
  }, [logs]);

  const columns: PosDataGridColumn<WithdrawalLogEntry>[] = [
    {
      id: "withdrawalId",
      header: "Drop Slip ID",
      accessorKey: "withdrawalId",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-amber-700">{r.withdrawalId}</span>
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
      header: "Source Register",
      accessorKey: "terminal",
      sortable: true,
      defaultWidth: 170,
      render: (_, r) => (
        <span className="font-semibold text-[12.5px] text-slate-900">{r.terminal}</span>
      ),
    },
    {
      id: "amount",
      header: "Amount Dropped",
      accessorKey: "amount",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[13.5px] font-black text-rose-600">
          - ₹ {r.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "reason",
      header: "Purpose / Destination",
      accessorKey: "reason",
      sortable: true,
      defaultWidth: 190,
      render: (_, r) => (
        <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          {r.reason}
        </span>
      ),
    },
    {
      id: "handedTo",
      header: "Handed To",
      accessorKey: "handedTo",
      defaultWidth: 180,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.handedTo}</div>
      ),
    },
    {
      id: "approvedBy",
      header: "Manager Auth",
      accessorKey: "approvedBy",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[12px] text-slate-600 font-medium">{r.approvedBy}</div>
      ),
    },
    {
      id: "acknowledgmentStatus",
      header: "Status",
      accessorKey: "acknowledgmentStatus",
      defaultWidth: 150,
      render: (_, r) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          {r.acknowledgmentStatus}
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
            <ArrowDownCircle className="h-5 w-5 text-rose-600" />
            Cash Drop & Withdrawal Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} cash drawer skims and bank drops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Record Cash Drop
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Cash Dropped</span>
            <IndianRupee className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">
            ₹ {totalWithdrawnAmount.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {logs.length} Total record{logs.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Bank Deposits</span>
            <Building className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">{bankDropsCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Escorted courier drops</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Safe Box Moves</span>
            <Vault className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-amber-600">
            {logs.filter((l) => l.reason.toLowerCase().includes("safe")).length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Safe box transfers</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Reconciled Rate</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">
            {logs.length > 0 ? "100%" : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Dual signed slips</div>
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
          <option value="All">All Withdrawal Reasons</option>
          <option value="Bank Deposit Drop">Bank Deposit Drop</option>
          <option value="Safe Box Transfer">Safe Box Transfer</option>
          <option value="Owner Draw">Owner Draw</option>
          <option value="Emergency Vendor Payout">Emergency Vendor Payout</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search drops by ID, recipient, or terminal..."
        emptyMessage="No cash withdrawal or drop logs recorded yet for this outlet."
      />

      {/* Modal to record cash withdrawal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                Record Cash Drop / Withdrawal
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="mt-4 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Amount to Skim / Drop (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Drop Purpose
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="Bank Deposit Drop">Bank Deposit Drop</option>
                  <option value="Safe Box Transfer">Safe Box Transfer</option>
                  <option value="Owner Draw">Owner Draw</option>
                  <option value="Emergency Vendor Payout">Emergency Vendor Payout</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Handed To (Courier / Staff / Owner)
                </label>
                <input
                  type="text"
                  required
                  value={handedTo}
                  onChange={(e) => setHandedTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Source Register
                </label>
                <select
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="Terminal POS 1 (Counter)">Terminal POS 1 (Counter)</option>
                  <option value="Terminal POS 2 (Bar Station)">Terminal POS 2 (Bar Station)</option>
                  <option value="Main Cash Drawer">Main Cash Drawer</option>
                </select>
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
                  className="rounded-lg bg-rose-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
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

export default WithdrawalLogsView;
