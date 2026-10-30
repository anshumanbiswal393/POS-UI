import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Receipt,
  IndianRupee,
  FileCheck,
  AlertCircle,
  Paperclip,
  Plus,
  Filter,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSExpenseDto } from "@/services/posManagementService";

interface ExpenseLogEntry {
  id: string;
  voucherNo: string;
  timestamp: string;
  category: string;
  amount: number;
  paymentMode: string;
  vendor: string;
  recordedBy: string;
  hasReceipt: boolean;
  approvalStatus: "Approved" | "Pending" | "Rejected";
  notes: string;
}

export function ExpenseLogsView() {
  const { activeOutlet } = useOutletContext();
  const [logs, setLogs] = useState<ExpenseLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Kitchen Raw Materials");
  const [paymentMode, setPaymentMode] = useState("Petty Cash Drawer");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getExpenses(activeOutlet.id);
      const mapped: ExpenseLogEntry[] = data.map((exp: POSExpenseDto) => {
        let status: "Approved" | "Pending" | "Rejected" = "Approved";
        if (exp.status?.toUpperCase() === "PENDING") status = "Pending";
        else if (exp.status?.toUpperCase() === "REJECTED") status = "Rejected";

        return {
          id: exp.id,
          voucherNo: exp.expense_number || `EXP-${exp.id.slice(0, 8).toUpperCase()}`,
          timestamp: exp.expense_date ? new Date(exp.expense_date).toLocaleString("en-IN") : "",
          category: exp.category || "General Expense",
          amount: parseFloat(exp.amount) || 0,
          paymentMode: exp.payment_mode || "Petty Cash Drawer",
          vendor: exp.payee_name || "Local Vendor",
          recordedBy: exp.approved_by_name || "Cashier",
          hasReceipt: Boolean(exp.receipt_attachment_url),
          approvalStatus: status,
          notes: exp.notes || "",
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      toast.error("Failed to load expense logs from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }
    if (!activeOutlet?.id) {
      toast.error("No active outlet selected");
      return;
    }

    setIsSubmitting(true);
    try {
      await posManagementService.createExpense(activeOutlet.id, {
        amount: numAmount.toString(),
        category,
        payment_mode: paymentMode,
        payee_name: vendor.trim() || "Local Vendor",
        notes: notes.trim(),
        expense_date: new Date().toISOString(),
        status: "APPROVED",
      });
      toast.success(`Expense voucher of ₹${numAmount.toLocaleString("en-IN")} saved permanently!`);
      setIsModalOpen(false);
      setAmount("");
      setVendor("");
      setNotes("");
      await fetchExpenses();
    } catch (err) {
      console.error("Failed to create expense:", err);
      toast.error("Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, voucherNo: string) => {
    try {
      await posManagementService.approveExpense(id);
      toast.success(`Voucher ${voucherNo} approved!`);
      await fetchExpenses();
    } catch (err) {
      console.error("Failed to approve expense:", err);
      toast.error("Failed to approve expense");
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (categoryFilter !== "All" && log.category !== categoryFilter) return false;
      return true;
    });
  }, [logs, categoryFilter]);

  const stats = useMemo(() => {
    const totalAmount = logs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const approvedCount = logs.filter((l) => l.approvalStatus === "Approved").length;
    const pendingCount = logs.filter((l) => l.approvalStatus === "Pending").length;
    return { totalAmount, approvedCount, pendingCount, count: logs.length };
  }, [logs]);

  const columns: PosDataGridColumn<ExpenseLogEntry>[] = [
    {
      id: "voucherNo",
      header: "Voucher No",
      accessorKey: "voucherNo",
      sortable: true,
      defaultWidth: 145,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.voucherNo}</span>
      ),
    },
    {
      id: "timestamp",
      header: "Date & Time",
      accessorKey: "timestamp",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="font-mono text-[12px] text-slate-600 font-medium">{r.timestamp}</span>
      ),
    },
    {
      id: "category",
      header: "Expense Category",
      accessorKey: "category",
      sortable: true,
      defaultWidth: 185,
      render: (_, r) => (
        <span className="text-[12.5px] font-semibold text-slate-800">{r.category}</span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      defaultWidth: 130,
      render: (_, r) => (
        <span className="font-mono text-[13.5px] font-black text-slate-900">
          ₹ {r.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "paymentMode",
      header: "Paid From",
      accessorKey: "paymentMode",
      sortable: true,
      defaultWidth: 160,
      render: (_, r) => (
        <span className="text-[12px] text-slate-600 font-medium">{r.paymentMode}</span>
      ),
    },
    {
      id: "vendor",
      header: "Vendor / Payee",
      accessorKey: "vendor",
      defaultWidth: 180,
      render: (_, r) => (
        <div className="text-[12px] text-slate-800 font-semibold">{r.vendor}</div>
      ),
    },
    {
      id: "approvalStatus",
      header: "Approval",
      accessorKey: "approvalStatus",
      sortable: true,
      defaultWidth: 125,
      render: (_, r) => {
        if (r.approvalStatus === "Approved") {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <FileCheck className="h-3 w-3" />
              Approved
            </span>
          );
        }
        if (r.approvalStatus === "Pending") {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertCircle className="h-3 w-3" />
              Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            Rejected
          </span>
        );
      },
    },
    {
      id: "notes",
      header: "Expense Notes",
      accessorKey: "notes",
      defaultWidth: 200,
      render: (_, r) => (
        <div className="text-[11.5px] text-slate-600 truncate" title={r.notes}>
          {r.notes || "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      defaultWidth: 110,
      render: (_, r) => {
        if (r.approvalStatus === "Pending") {
          return (
            <button
              type="button"
              onClick={() => handleApprove(r.id, r.voucherNo)}
              className="flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
            >
              <Check className="h-3 w-3" />
              Approve
            </button>
          );
        }
        return <span className="text-[11px] text-slate-400 font-medium">Logged</span>;
      },
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-teal-600" />
            Expense & Petty Cash Logs
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server records for {activeOutlet?.name || "Active Outlet"} operational costs and store vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchExpenses}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
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
            Add Expense Voucher
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Operational Spend</span>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">
            ₹ {stats.totalAmount.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {stats.count} Total vouchers
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Approved Vouchers</span>
            <FileCheck className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-teal-600">{stats.approvedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Verified by management</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Pending Review</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-amber-600">{stats.pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Awaiting sign-off</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Approval Rate</span>
            <Receipt className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-indigo-600">
            {stats.count > 0 ? `${Math.round((stats.approvedCount / stats.count) * 100)}%` : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Compliance rate</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Category:
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Categories</option>
          <option value="Kitchen Raw Materials">Kitchen Raw Materials</option>
          <option value="Gas & Cylinder">Gas & Cylinder</option>
          <option value="Repairs & Maintenance">Repairs & Maintenance</option>
          <option value="Staff Meals & Tea">Staff Meals & Tea</option>
          <option value="Disposables & Cleaning">Disposables & Cleaning</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredLogs}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search vouchers by number, vendor, or category..."
        emptyMessage="No expense records found yet for this outlet."
      />

      {/* Modal to record expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-teal-600" />
                Add Operational Expense Voucher
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 1450"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Kitchen Raw Materials">Kitchen Raw Materials</option>
                  <option value="Gas & Cylinder">Gas & Cylinder</option>
                  <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                  <option value="Staff Meals & Tea">Staff Meals & Tea</option>
                  <option value="Disposables & Cleaning">Disposables & Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Payment Source
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Petty Cash Drawer">Petty Cash Drawer</option>
                  <option value="UPI Transfer">UPI Transfer</option>
                  <option value="Company Credit Card">Company Credit Card</option>
                  <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manoj Sabzi Mandi"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Notes / Voucher Particulars
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emergency purchase of mint and fresh lemons"
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
                  {isSubmitting ? "Saving..." : "Save Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseLogsView;
