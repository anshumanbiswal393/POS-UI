import { useState, useMemo } from "react";
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  CreditCard,
  IndianRupee,
  Building2,
  Percent,
  AlertCircle,
  Hash,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface PaymentTransaction {
  id: string;
  orderId: string;
  billNo: string;
  customerName: string;
  provider: "Razorpay" | "Pine Labs" | "Paytm" | "UPI" | "Cash" | "EDC Card Swipe" | "Bank NEFT";
  txnRef: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "Success" | "Pending" | "Failed";
  timestamp: string;
  notes?: string;
}

const INITIAL_RECORDS: PaymentTransaction[] = [
  {
    id: "tx-101",
    orderId: "ORD-9842",
    billNo: "RET-2026-0812",
    customerName: "Rahul Sharma",
    provider: "UPI",
    txnRef: "UPI/2609028912/gpay",
    amount: 1450,
    fee: 0,
    netAmount: 1450,
    status: "Success",
    timestamp: "2026-09-02 12:45:10",
  },
  {
    id: "tx-102",
    orderId: "ORD-9843",
    billNo: "RET-2026-0813",
    customerName: "Pooja Verma",
    provider: "Pine Labs",
    txnRef: "PL-POS-78219401",
    amount: 2890,
    fee: 34.68,
    netAmount: 2855.32,
    status: "Success",
    timestamp: "2026-09-02 13:10:44",
  },
  {
    id: "tx-103",
    orderId: "ORD-9844",
    billNo: "RET-2026-0814",
    customerName: "Anand Gupta",
    provider: "Razorpay",
    txnRef: "pay_Nk829xLq81",
    amount: 620,
    fee: 11.16,
    netAmount: 608.84,
    status: "Success",
    timestamp: "2026-09-02 13:42:05",
  },
  {
    id: "tx-104",
    orderId: "ORD-9845",
    billNo: "RET-2026-0815",
    customerName: "Vikas Malhotra",
    provider: "Paytm",
    txnRef: "PTM2983109381",
    amount: 850,
    fee: 10.2,
    netAmount: 839.8,
    status: "Pending",
    timestamp: "2026-09-02 14:02:18",
  },
  {
    id: "tx-105",
    orderId: "ORD-9846",
    billNo: "RET-2026-0816",
    customerName: "Deepak Mehta",
    provider: "Razorpay",
    txnRef: "pay_Nk930kLm04",
    amount: 1980,
    fee: 0,
    netAmount: 0,
    status: "Failed",
    timestamp: "2026-09-02 14:15:22",
  },
  {
    id: "tx-106",
    orderId: "ORD-9847",
    billNo: "RET-2026-0817",
    customerName: "Siddharth Rao",
    provider: "Cash",
    txnRef: "CASH-DESK-01",
    amount: 3400,
    fee: 0,
    netAmount: 3400,
    status: "Success",
    timestamp: "2026-09-02 15:00:30",
  },
];

export function PaymentInformationView() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("All");
  const [provider, setProvider] = useState("All");
  const [orderId, setOrderId] = useState("");
  const [records, setRecords] = useState<PaymentTransaction[]>(INITIAL_RECORDS);

  // Pagination & selection
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Add / Adjustment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    billNo: "",
    customerName: "",
    provider: "UPI" as "Razorpay" | "Pine Labs" | "Paytm" | "UPI" | "Cash" | "EDC Card Swipe" | "Bank NEFT",
    txnRef: "",
    amount: "",
    fee: "0",
    status: "Success" as "Success" | "Pending" | "Failed",
    notes: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!formData.orderId.trim()) {
      errs.orderId = "Order ID is required.";
    }

    if (!formData.billNo.trim()) {
      errs.billNo = "POS Bill Reference is required.";
    }

    if (!formData.customerName.trim()) {
      errs.customerName = "Customer name is required.";
    }

    if (!formData.txnRef.trim()) {
      errs.txnRef = "Transaction Reference / UTR Number is required.";
    }

    const amt = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      errs.amount = "Gross transaction amount is required.";
    } else if (isNaN(amt) || amt <= 0) {
      errs.amount = "Enter a valid amount greater than ₹0.";
    }

    const feeAmt = parseFloat(formData.fee);
    if (isNaN(feeAmt) || feeAmt < 0) {
      errs.fee = "MDR fee cannot be negative.";
    }

    return errs;
  }, [formData]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      billNo: `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: "",
      provider: "UPI",
      txnRef: "",
      amount: "",
      fee: "0",
      status: "Success",
      notes: "",
    });
    setTouched({});
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({
        orderId: true,
        billNo: true,
        customerName: true,
        txnRef: true,
        amount: true,
        fee: true,
      });
      toast.error("Please fill all required mandatory fields correctly.");
      return;
    }

    const amt = parseFloat(formData.amount);
    const feeAmt = parseFloat(formData.fee) || 0;
    const net = formData.status === "Failed" ? 0 : Math.max(0, amt - feeAmt);

    const now = new Date();
    const ts = now.toISOString().replace("T", " ").substring(0, 19);

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      orderId: formData.orderId,
      billNo: formData.billNo,
      customerName: formData.customerName,
      provider: formData.provider,
      txnRef: formData.txnRef,
      amount: amt,
      fee: feeAmt,
      netAmount: net,
      status: formData.status,
      timestamp: ts,
      notes: formData.notes,
    };

    setRecords([newTx, ...records]);
    toast.success(`Payment transaction ${newTx.txnRef} recorded successfully!`);
    setIsAddModalOpen(false);
  };

  // KPIs
  const totalGross = useMemo(() => records.reduce((acc, r) => acc + r.amount, 0), [records]);
  const totalNet = useMemo(() => records.reduce((acc, r) => acc + r.netAmount, 0), [records]);
  const totalFees = useMemo(() => records.reduce((acc, r) => acc + r.fee, 0), [records]);
  const successCount = useMemo(() => records.filter((r) => r.status === "Success").length, [records]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (status !== "All" && r.status !== status) return false;
      if (provider !== "All" && r.provider !== provider) return false;
      if (orderId.trim()) {
        const q = orderId.toLowerCase();
        const match =
          r.orderId.toLowerCase().includes(q) ||
          r.billNo.toLowerCase().includes(q) ||
          r.txnRef.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, status, provider, orderId]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const field = sortConfig.colId as keyof PaymentTransaction;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRecords, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const validPage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, validPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedRecords.length && sortedRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const columns: PosDataGridColumn<PaymentTransaction>[] = [
    {
      id: "orderId",
      header: "Order / Bill No",
      accessorKey: "orderId",
      sortable: true,
      defaultWidth: 160,
      render: (_, row) => (
        <div>
          <div className="font-mono text-[12.5px] font-bold text-slate-900">{row.orderId}</div>
          <div className="text-[11px] text-slate-500 font-mono">{row.billNo}</div>
        </div>
      ),
    },
    {
      id: "customerName",
      header: "Customer",
      accessorKey: "customerName",
      sortable: true,
      defaultWidth: 160,
      render: (_, row) => <div className="font-medium text-slate-800">{row.customerName}</div>,
    },
    {
      id: "provider",
      header: "Payment Gateway",
      accessorKey: "provider",
      sortable: true,
      filterable: true,
      defaultWidth: 140,
      render: (_, row) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-700">
          {row.provider}
        </span>
      ),
    },
    {
      id: "txnRef",
      header: "Reference / UTR",
      accessorKey: "txnRef",
      sortable: true,
      defaultWidth: 180,
      render: (_, row) => (
        <span className="font-mono text-[11.5px] text-slate-600 select-all bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {row.txnRef}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Gross Amount (₹)",
      accessorKey: "amount",
      align: "right",
      sortable: true,
      defaultWidth: 140,
      render: (_, row) => <div className="font-bold text-slate-900 font-mono">₹{row.amount.toLocaleString("en-IN")}</div>,
    },
    {
      id: "fee",
      header: "MDR Fee (₹)",
      accessorKey: "fee",
      align: "right",
      sortable: true,
      defaultWidth: 120,
      render: (_, row) => <div className="text-slate-500 font-mono">₹{row.fee.toFixed(2)}</div>,
    },
    {
      id: "netAmount",
      header: "Net Settled (₹)",
      accessorKey: "netAmount",
      align: "right",
      sortable: true,
      defaultWidth: 140,
      render: (_, row) => <div className="font-bold text-teal-700 font-mono">₹{row.netAmount.toLocaleString("en-IN")}</div>,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      filterable: true,
      align: "center",
      defaultWidth: 120,
      render: (_, row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            row.status === "Success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "Pending"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {row.status === "Success" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          {row.status === "Pending" && <Clock className="h-3 w-3 text-amber-600" />}
          {row.status === "Failed" && <XCircle className="h-3 w-3 text-rose-600" />}
          {row.status}
        </span>
      ),
    },
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      sortable: true,
      defaultWidth: 160,
      render: (_, row) => <div className="text-[11.5px] text-slate-500 font-mono">{row.timestamp}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      filterable: false,
      align: "center",
      defaultWidth: 80,
      render: (_, row) => (
        <button
          type="button"
          onClick={() => toast.info(`Re-verifying gateway settlement for ${row.txnRef}`)}
          title="Re-verify Status"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer inline-flex items-center justify-center"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* 1. Header with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Payment Information</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Real-time digital payment settlements, MDR charges, and multi-gateway provider reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Record Payment Entry
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Gross Collections</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">
              ₹{totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Total processed amount</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Net Bank Disbursed</p>
            <h3 className="text-xl font-bold font-mono text-teal-700 mt-1">
              ₹{totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Disbursed to primary A/C</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Gateway MDR Fees</p>
            <h3 className="text-xl font-bold font-mono text-amber-700 mt-1">
              ₹{totalFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Total provider commissions</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Success Rate</p>
            <h3 className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {records.length > 0 ? ((successCount / records.length) * 100).toFixed(0) : 0}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{successCount} of {records.length} successful</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1 min-w-[120px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="space-y-1 min-w-[140px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Providers</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Pine Labs">Pine Labs</option>
              <option value="Paytm">Paytm</option>
              <option value="UPI">UPI / QR</option>
              <option value="Cash">Cash</option>
              <option value="EDC Card Swipe">EDC Card Swipe</option>
              <option value="Bank NEFT">Bank NEFT</option>
            </select>
          </div>

          <div className="space-y-1 min-w-[200px] flex-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Order / Bill / UTR</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search reference, order or customer..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredRecords.length} transactions`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("All");
                setProvider("All");
                setOrderId("");
                setFromDate("");
                setToDate("");
                toast.info("Showing all payment records");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table with PosDataGrid */}
      <PosDataGrid
        data={filteredRecords}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey="pos-accounting-payment-information"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="transactions"
        emptyState={
          <div className="py-12 text-center text-slate-400">
            <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No payment transaction records found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or record a new payment entry.</p>
          </div>
        }
      />

      <PosCreatePanel
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Payment / Transaction Entry"
        description="Manually log or adjust digital payment gateway records."
        icon={CreditCard}
        onSubmit={handleSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsAddModalOpen(false)} />
            <PosCreateSubmitButton disabled={!isFormValid}>Record Payment</PosCreateSubmitButton>
          </>
        }
      >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Order ID <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-9850"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    onBlur={() => handleBlur("orderId")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${
                      touched.orderId && errors.orderId
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.orderId && errors.orderId && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.orderId}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    POS Bill Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RET-2026-0820"
                    value={formData.billNo}
                    onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                    onBlur={() => handleBlur("billNo")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${
                      touched.billNo && errors.billNo
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.billNo && errors.billNo && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.billNo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Customer Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sanjay Das"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    onBlur={() => handleBlur("customerName")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-none ${
                      touched.customerName && errors.customerName
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.customerName && errors.customerName && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.customerName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">Payment Gateway</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Razorpay">Razorpay</option>
                    <option value="Pine Labs">Pine Labs</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Cash">Cash</option>
                    <option value="EDC Card Swipe">EDC Card Swipe</option>
                    <option value="Bank NEFT">Bank NEFT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Transaction Reference / UTR Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/26090299/paytm or PL-POS-8921"
                  value={formData.txnRef}
                  onChange={(e) => setFormData({ ...formData, txnRef: e.target.value })}
                  onBlur={() => handleBlur("txnRef")}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${
                    touched.txnRef && errors.txnRef
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.txnRef && errors.txnRef && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.txnRef}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Gross (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    onBlur={() => handleBlur("amount")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${
                      touched.amount && errors.amount
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.amount && errors.amount && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.amount}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">MDR Fee (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    onBlur={() => handleBlur("fee")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">Adjustment Note / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

      </PosCreatePanel>
    </div>
  );
}
