import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSPaymentGatewayConfigDto } from "@/services/posManagementService";
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
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { openPrintReportTable } from "@/utils/printReportTable";
import { ColorActionPrint } from "@/components/common/ColorActionIcons";
import { formatDateIndian, formatDateTimeIndian } from "@/utils/dateUtils";
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

const INITIAL_RECORDS: PaymentTransaction[] = [];

export function PaymentInformationView() {
  const { activeOutlet } = useOutletContext();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("All");
  const [provider, setProvider] = useState("All");
  const [orderId, setOrderId] = useState("");
  const [records, setRecords] = useState<PaymentTransaction[]>(INITIAL_RECORDS);
  const [isLoading, setIsLoading] = useState(false);

  // Gateway Configurations
  const [gatewayConfigs, setGatewayConfigs] = useState<POSPaymentGatewayConfigDto[]>([]);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    provider: "RAZORPAY",
    terminal_merchant_id: "",
    api_key: "",
    api_secret: "",
    mdr_rate_pct: "1.75",
    settlement_cycle: "T+1",
    is_active: true,
  });

  const fetchTransactions = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getPaymentTransactions(activeOutlet.id, {
        from_date: fromDate,
        to_date: toDate,
        provider: provider !== "All" ? provider : "",
        status: status !== "All" ? status : "",
        order_id: orderId,
      });
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load payment transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id, fromDate, toDate, provider, status, orderId]);

  const fetchGateways = useCallback(async () => {
    if (!activeOutlet?.id) return;
    try {
      const configs = await posManagementService.getPaymentGatewayConfigs(activeOutlet.id);
      setGatewayConfigs(configs || []);
    } catch (err) {
      console.error("Failed to load payment gateways:", err);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchTransactions();
    fetchGateways();
  }, [fetchTransactions, fetchGateways]);

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
      errs.customerName = "Guest name is required.";
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

    if (activeOutlet?.id) {
      posManagementService
        .recordPaymentTransaction(activeOutlet.id, {
          orderId: formData.orderId,
          billNo: formData.billNo,
          customerName: formData.customerName,
          provider: formData.provider,
          txnRef: formData.txnRef,
          amount: amt,
          fee: feeAmt,
          status: formData.status,
          notes: formData.notes,
        })
        .then(() => fetchTransactions())
        .catch((e) => console.error(e));
    }

    setRecords([newTx, ...records]);
    toast.success(`Payment transaction ${newTx.txnRef} recorded successfully!`);
    setIsAddModalOpen(false);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayForm.terminal_merchant_id.trim()) {
      toast.error("Merchant ID / Terminal ID is required.");
      return;
    }
    if (!activeOutlet?.id) return;
    try {
      await posManagementService.createPaymentGatewayConfig(activeOutlet.id, {
        provider: gatewayForm.provider,
        terminal_merchant_id: gatewayForm.terminal_merchant_id.trim(),
        api_key: gatewayForm.api_key.trim(),
        api_secret: gatewayForm.api_secret.trim(),
        mdr_rate_pct: parseFloat(gatewayForm.mdr_rate_pct) || 1.75,
        settlement_cycle: gatewayForm.settlement_cycle,
        is_active: gatewayForm.is_active,
      });
      toast.success(`${gatewayForm.provider} payment gateway configuration saved!`);
      setIsGatewayModalOpen(false);
      setGatewayForm({
        provider: "RAZORPAY",
        terminal_merchant_id: "",
        api_key: "",
        api_secret: "",
        mdr_rate_pct: "1.75",
        settlement_cycle: "T+1",
        is_active: true,
      });
      fetchGateways();
    } catch (err) {
      console.error("Failed to save gateway config:", err);
      toast.error("Failed to save gateway configuration");
    }
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
      header: "Guest",
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
      render: (_, row) => <div className="text-[11.5px] text-slate-500 font-mono">{formatDateTimeIndian(row.timestamp)}</div>,
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

  const handlePrintReport = () => {
    if (filteredRecords.length === 0) {
      toast.info("No payment transactions to print");
      return;
    }

    const reportCols = [
      { header: "TXN REF", align: "left" as const },
      { header: "ORDER & BILL NO", align: "left" as const },
      { header: "GUEST NAME", align: "left" as const },
      { header: "GATEWAY", align: "left" as const },
      { header: "PAY MODE", align: "center" as const },
      { header: "GROSS (₹)", align: "right" as const },
      { header: "MDR FEE (₹)", align: "right" as const },
      { header: "NET (₹)", align: "right" as const },
      { header: "STATUS", align: "center" as const },
      { header: "DATE & TIME", align: "center" as const },
    ];

    const reportRows = filteredRecords.map((r) => [
      r.txnRef,
      `${r.orderId} · ${r.billNo}`,
      r.customerName,
      r.provider,
      r.mode,
      Number(r.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(r.mdrFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(r.netSettled || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      (r.status || "SETTLED").toUpperCase(),
      formatDateIndian(r.date),
    ]);

    const totalGross = filteredRecords.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalNet = filteredRecords.reduce((s, r) => s + Number(r.netSettled || 0), 0);

    openPrintReportTable({
      title: "DIGITAL PAYMENTS & RECONCILIATION REPORT",
      hotelName: activeOutlet?.name || "Restaurant",
      subtitle: `Total Transactions: ${filteredRecords.length} • Total Volume: ₹${totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      dateRange: `${formatDateIndian(fromDate)} to ${formatDateIndian(toDate)}`,
      columns: reportCols,
      rows: reportRows,
      summaryTotals: [
        "TOTAL",
        `${filteredRecords.length} Txns`,
        "",
        "",
        "",
        totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        "",
        totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        "",
        "",
      ],
    });
  };

  return (
    <div className="w-full space-y-4 pb-10">
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
            onClick={() => setIsGatewayModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <CreditCard className="h-4 w-4 text-teal-600" />
            Gateway Config ({gatewayConfigs.length})
          </button>
          <button
            type="button"
            onClick={handlePrintReport}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Print Payments Master Report"
          >
            <ColorActionPrint className="h-4 w-4" />
            Print
          </button>
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
              max={new Date().toISOString().slice(0, 10)}
              value={fromDate}
              onChange={(e) => {
                const val = e.target.value;
                const todayIso = new Date().toISOString().slice(0, 10);
                if (val && val > todayIso) return;
                setFromDate(val);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">To Date</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={toDate}
              onChange={(e) => {
                const val = e.target.value;
                const todayIso = new Date().toISOString().slice(0, 10);
                if (val && val > todayIso) return;
                setToDate(val);
              }}
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
                placeholder="Search reference, order or guest..."
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
                    Guest Name <span className="text-rose-500 font-bold ml-0.5">*</span>
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

      {/* 5. Payment Gateway Configuration Panel */}
      <PosCreatePanel
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        title="Payment Gateway Configuration"
        subtitle="Manage EDC card swipe machines, UPI QR providers, and online gateway credentials."
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsGatewayModalOpen(false)} />
            <PosCreateSubmitButton onClick={handleSaveGateway} label="Save Gateway Config" />
          </>
        }
      >
        <div className="space-y-5">
          {/* Active Gateways Table / List */}
          {gatewayConfigs.length > 0 && (
            <div className="space-y-2">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Configured Gateways & Terminals
              </label>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Terminal / MID</th>
                      <th className="px-3 py-2">MDR %</th>
                      <th className="px-3 py-2">Cycle</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gatewayConfigs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-bold text-slate-800">{cfg.provider}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{cfg.terminal_merchant_id}</td>
                        <td className="px-3 py-2 font-mono">{cfg.mdr_rate_pct}%</td>
                        <td className="px-3 py-2 text-slate-500">{cfg.settlement_cycle || "T+1"}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              cfg.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {cfg.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form to add/update gateway */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            <h4 className="text-[13px] font-bold text-slate-900">Add / Update Gateway Credentials</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Gateway Provider</label>
                <select
                  value={gatewayForm.provider}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, provider: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="RAZORPAY">Razorpay POS / QR</option>
                  <option value="PINELABS">PineLabs Plutus EDC Terminal</option>
                  <option value="PAYTM">Paytm EDC / Soundbox</option>
                  <option value="PHONEPE">PhonePe Business Dynamic QR</option>
                  <option value="CASHFREE">Cashfree Payments</option>
                  <option value="EDC_CARD_MACHINE">Standalone Bank EDC Machine</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Merchant ID / Terminal ID <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MID-981240 or PL-POS-01"
                  value={gatewayForm.terminal_merchant_id}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, terminal_merchant_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">API Key / Client ID</label>
                <input
                  type="text"
                  placeholder="Live API Key"
                  value={gatewayForm.api_key}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, api_key: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">API Secret Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={gatewayForm.api_secret}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, api_secret: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">MDR Rate Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1.75"
                  value={gatewayForm.mdr_rate_pct}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mdr_rate_pct: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Settlement Cycle</label>
                <select
                  value={gatewayForm.settlement_cycle}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, settlement_cycle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="T+0">Instant / Same Day (T+0)</option>
                  <option value="T+1">Next Business Day (T+1)</option>
                  <option value="T+2">Two Business Days (T+2)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </PosCreatePanel>
    </div>
  );
}
