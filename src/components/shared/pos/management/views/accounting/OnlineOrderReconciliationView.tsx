import { useState, useMemo } from "react";
import {
  Upload,
  ChevronDown,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Plus,
  Eye,
  X,
  AlertCircle,
  IndianRupee,
  FileText,
  Building2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";

interface ReconcileRecord {
  id: string;
  aggregatorOrderId: string;
  posBillNo: string;
  tabType: "missing" | "status_mismatch" | "variance" | "rejected" | "final";
  channel: "Zomato" | "Swiggy" | "Magicpin" | "Direct ONDC";
  aggregatorAmount: number;
  posAmount: number;
  varianceAmount: number;
  aggregatorStatus: string;
  posStatus: string;
  orderDate: string;
  settlementStatus: "Disputed" | "Resolved" | "Pending Review";
  disputeReason?: string;
}

const SAMPLE_RECON_DATA: ReconcileRecord[] = [];

export function OnlineOrderReconciliationView() {
  const [activeTab, setActiveTab] = useState<
    "missing" | "status_mismatch" | "variance" | "rejected" | "final"
  >("missing");

  const [dateRange, setDateRange] = useState("27th Aug to 1st Sep");
  const [channelFilter, setChannelFilter] = useState("All");
  const [records, setRecords] = useState<ReconcileRecord[]>(SAMPLE_RECON_DATA);

  // Pagination & selection
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [reviewRecord, setReviewRecord] = useState<ReconcileRecord | null>(null);

  // Upload Form
  const [uploadData, setUploadData] = useState({
    channel: "Zomato" as "Zomato" | "Swiggy" | "Magicpin" | "Direct ONDC",
    payoutDateRange: "27th Aug to 1st Sep",
    fileName: "",
    totalClaimedAmount: "",
  });
  const [uploadTouched, setUploadTouched] = useState<Record<string, boolean>>({});

  // Dispute Form
  const [disputeData, setDisputeData] = useState({
    aggregatorOrderId: "",
    channel: "Zomato" as "Zomato" | "Swiggy" | "Magicpin" | "Direct ONDC",
    posBillNo: "",
    aggregatorAmount: "",
    posAmount: "",
    tabType: "variance" as "missing" | "status_mismatch" | "variance" | "rejected" | "final",
    disputeReason: "",
  });
  const [disputeTouched, setDisputeTouched] = useState<Record<string, boolean>>({});

  const tabs = [
    {
      id: "missing",
      label: "Missing Orders",
      desc: "Orders in aggregator payout but not found on POS",
    },
    {
      id: "status_mismatch",
      label: "Status Mismatch Orders",
      desc: "Discrepancy in delivered vs cancelled order status",
    },
    {
      id: "variance",
      label: "Variance Orders",
      desc: "Settlement amount difference between aggregator and POS total",
    },
    {
      id: "rejected",
      label: "Rejected/Cancelled Orders",
      desc: "Commission & penalty charges on disputed cancellations",
    },
    {
      id: "final",
      label: "Final Reconciliation",
      desc: "Consolidated net payout summary vs settled bank transfers",
    },
  ] as const;

  // Validation for Upload
  const uploadErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!uploadData.fileName.trim()) {
      errs.fileName = "Please select or upload a settlement CSV / XLSX sheet.";
    }
    const amt = parseFloat(uploadData.totalClaimedAmount);
    if (!uploadData.totalClaimedAmount.trim()) {
      errs.totalClaimedAmount = "Total settlement payout amount is required.";
    } else if (isNaN(amt) || amt <= 0) {
      errs.totalClaimedAmount = "Enter a valid settlement amount greater than ₹0.";
    }
    return errs;
  }, [uploadData]);

  const isUploadValid = Object.keys(uploadErrors).length === 0;

  // Validation for Dispute
  const disputeErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!disputeData.aggregatorOrderId.trim()) {
      errs.aggregatorOrderId = "Aggregator Order ID is required.";
    }
    if (!disputeData.posBillNo.trim()) {
      errs.posBillNo = "POS Bill Reference is required (or '--' if missing).";
    }
    const aggAmt = parseFloat(disputeData.aggregatorAmount);
    if (!disputeData.aggregatorAmount.trim()) {
      errs.aggregatorAmount = "Aggregator claimed amount is required.";
    } else if (isNaN(aggAmt) || aggAmt < 0) {
      errs.aggregatorAmount = "Enter a valid amount.";
    }

    const posAmt = parseFloat(disputeData.posAmount);
    if (!disputeData.posAmount.trim()) {
      errs.posAmount = "POS billed amount is required.";
    } else if (isNaN(posAmt) || posAmt < 0) {
      errs.posAmount = "Enter a valid POS amount.";
    }

    if (!disputeData.disputeReason.trim()) {
      errs.disputeReason = "Reason for dispute or discrepancy claim is mandatory.";
    } else if (disputeData.disputeReason.trim().length < 5) {
      errs.disputeReason = "Please provide detailed justification (min 5 characters).";
    }
    return errs;
  }, [disputeData]);

  const isDisputeValid = Object.keys(disputeErrors).length === 0;

  // Handlers
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUploadValid) {
      setUploadTouched({ fileName: true, totalClaimedAmount: true });
      toast.error("Please fill all required mandatory fields.");
      return;
    }

    toast.success(`Payout sheet parsed successfully! Reconciling ₹${uploadData.totalClaimedAmount} from ${uploadData.channel}.`);
    setIsUploadModalOpen(false);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisputeValid) {
      setDisputeTouched({
        aggregatorOrderId: true,
        posBillNo: true,
        aggregatorAmount: true,
        posAmount: true,
        disputeReason: true,
      });
      toast.error("Please fill all required mandatory fields.");
      return;
    }

    const aggAmt = parseFloat(disputeData.aggregatorAmount);
    const posAmt = parseFloat(disputeData.posAmount);
    const variance = aggAmt - posAmt;

    const newRecord: ReconcileRecord = {
      id: `rec-${Date.now()}`,
      aggregatorOrderId: disputeData.aggregatorOrderId,
      posBillNo: disputeData.posBillNo,
      tabType: disputeData.tabType,
      channel: disputeData.channel,
      aggregatorAmount: aggAmt,
      posAmount: posAmt,
      varianceAmount: variance,
      aggregatorStatus: "CLAIM_SUBMITTED",
      posStatus: "UNDER_REVIEW",
      orderDate: new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      settlementStatus: "Disputed",
      disputeReason: disputeData.disputeReason,
    };

    setRecords([newRecord, ...records]);
    toast.success(`Dispute claim registered for Order #${disputeData.aggregatorOrderId}`);
    setIsDisputeModalOpen(false);
  };

  const handleResolveDispute = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, settlementStatus: "Resolved" } : r))
    );
    toast.success("Dispute status marked as Resolved.");
    setReviewRecord(null);
  };

  // KPI Calculations
  const totalVariance = useMemo(
    () => records.reduce((acc, r) => acc + Math.abs(r.varianceAmount), 0),
    [records]
  );
  const disputedCount = useMemo(
    () => records.filter((r) => r.settlementStatus === "Disputed").length,
    [records]
  );
  const resolvedCount = useMemo(
    () => records.filter((r) => r.settlementStatus === "Resolved").length,
    [records]
  );

  // Filtered by active tab & channel
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.tabType !== activeTab) return false;
      if (channelFilter !== "All" && r.channel !== channelFilter) return false;
      return true;
    });
  }, [records, activeTab, channelFilter]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const field = sortConfig.colId as keyof ReconcileRecord;
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

  const columns: PosDataGridColumn<ReconcileRecord>[] = [
    {
      id: "aggregatorOrderId",
      header: "Aggregator Order ID",
      accessorKey: "aggregatorOrderId",
      sortable: true,
      defaultWidth: 170,
      render: (_, row) => (
        <div>
          <div className="font-mono text-[12.5px] font-bold text-slate-900">{row.aggregatorOrderId}</div>
          <div className="text-[11px] text-slate-500">{row.orderDate}</div>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Channel",
      accessorKey: "channel",
      sortable: true,
      filterable: true,
      defaultWidth: 130,
      render: (_, row) => (
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold ${row.channel === "Zomato"
            ? "bg-rose-50 text-rose-700 border border-rose-200"
            : row.channel === "Swiggy"
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}
        >
          {row.channel}
        </span>
      ),
    },
    {
      id: "posBillNo",
      header: "POS Bill Ref",
      accessorKey: "posBillNo",
      sortable: true,
      defaultWidth: 140,
      render: (_, row) => <span className="font-mono text-[12px] text-slate-700 font-medium">{row.posBillNo}</span>,
    },
    {
      id: "aggregatorAmount",
      header: "Payout Claimed (₹)",
      accessorKey: "aggregatorAmount",
      align: "right",
      sortable: true,
      defaultWidth: 150,
      render: (_, row) => <div className="font-mono font-bold text-slate-900">₹{row.aggregatorAmount.toLocaleString()}</div>,
    },
    {
      id: "posAmount",
      header: "POS Billed (₹)",
      accessorKey: "posAmount",
      align: "right",
      sortable: true,
      defaultWidth: 140,
      render: (_, row) => <div className="font-mono text-slate-600">₹{row.posAmount.toLocaleString()}</div>,
    },
    {
      id: "varianceAmount",
      header: "Variance Diff (₹)",
      accessorKey: "varianceAmount",
      align: "right",
      sortable: true,
      defaultWidth: 150,
      render: (_, row) => (
        <div
          className={`font-mono font-bold ${row.varianceAmount === 0
            ? "text-slate-400"
            : row.varianceAmount > 0
              ? "text-rose-600"
              : "text-amber-600"
            }`}
        >
          {row.varianceAmount > 0 ? `+₹${row.varianceAmount}` : row.varianceAmount < 0 ? `-₹${Math.abs(row.varianceAmount)}` : "₹0"}
        </div>
      ),
    },
    {
      id: "settlementStatus",
      header: "Reconciliation Status",
      accessorKey: "settlementStatus",
      sortable: true,
      filterable: true,
      align: "center",
      defaultWidth: 170,
      render: (_, row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.settlementStatus === "Resolved"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : row.settlementStatus === "Pending Review"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
        >
          {row.settlementStatus === "Resolved" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          {row.settlementStatus === "Pending Review" && <AlertTriangle className="h-3 w-3 text-amber-600" />}
          {row.settlementStatus === "Disputed" && <XCircle className="h-3 w-3 text-rose-600" />}
          {row.settlementStatus}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      sortable: false,
      filterable: false,
      align: "center",
      defaultWidth: 90,
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setReviewRecord(row)}
          title="Review Dispute & Justification"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer inline-flex items-center justify-center"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Third Party Online Orders Reconciliation
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Compare aggregator payout summaries (Zomato, Swiggy, ONDC) against POS kitchen tokens and settled revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDisputeData({
                aggregatorOrderId: "",
                channel: "Zomato",
                posBillNo: "",
                aggregatorAmount: "",
                posAmount: "",
                tabType: activeTab,
                disputeReason: "",
              });
              setDisputeTouched({});
              setIsDisputeModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Log Dispute / Adjustment
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Settlement Discrepancy</p>
            <h3 className="text-xl font-bold font-mono text-rose-600 mt-1">
              ₹{totalVariance.toLocaleString("en-IN")}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Total variance across streams</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Active Disputes</p>
            <h3 className="text-xl font-bold font-mono text-amber-600 mt-1">{disputedCount} Orders</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Pending aggregator credit</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Settled & Resolved</p>
            <h3 className="text-xl font-bold font-mono text-emerald-700 mt-1">{resolvedCount} Records</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Directly reconciled to bank</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Top Integrations Filter Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-[12.5px] font-semibold text-slate-800">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-600 text-[10px] font-bold text-white">
              Z
            </div>
            <span>l2c4wtru (Zomato & Swiggy Feed Active)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-600">Channel Filter:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-[12px] font-medium text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Channels</option>
              <option value="Zomato">Zomato</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Magicpin">Magicpin</option>
              <option value="Direct ONDC">Direct ONDC</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 pt-2">
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Date Range</label>
            <div className="relative min-w-[200px]">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="27th Aug to 1st Sep">27th Aug to 1st Sep</option>
                <option value="20th Aug to 26th Aug">20th Aug to 26th Aug</option>
                <option value="13th Aug to 19th Aug">13th Aug to 19th Aug</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">
              Aggregator Payout Sheet
            </label>
            <div>
              <button
                type="button"
                onClick={() => {
                  setUploadData({
                    channel: "Zomato",
                    payoutDateRange: dateRange,
                    fileName: "",
                    totalClaimedAmount: "",
                  });
                  setUploadTouched({});
                  setIsUploadModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Upload Payout File
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11.5px] font-semibold text-slate-600">Integration Status:</div>
            <div className="text-[13px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active Sync
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Bar & Data Grid */}
      <div className="rounded-xl border border-slate-300 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium transition cursor-pointer border-b-2 ${activeTab === tab.id
                ? "border-teal-600 bg-white text-teal-600 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
            >
              <span>{tab.label}</span>
              <span title={tab.desc}>
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </span>
            </button>
          ))}
        </div>

        <div className="p-0">
          <PosDataGrid
            data={filteredRecords}
            columns={columns}
            keyField="id"
            selectable
            selectedRowIds={selectedIds}
            onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
            storageKey={`pos-accounting-recon-${activeTab}`}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            themeVariant="primary"
            itemName="reconciliation orders"
            emptyState={
              <div className="p-16 text-center space-y-4">
                <div className="mx-auto relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute h-12 w-12 rounded-full bg-slate-100" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-[14px] font-bold text-slate-700">No Records Found</div>
                <p className="text-[12px] text-slate-400 max-w-sm mx-auto">
                  Upload aggregator payout reports or manually log a dispute to match discrepancies.
                </p>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. Upload Payout Sheet Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Upload Aggregator Settlement</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Parse weekly payout file for automated reconciliation.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">Aggregator Channel</label>
                <select
                  value={uploadData.channel}
                  onChange={(e) => setUploadData({ ...uploadData, channel: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="Zomato">Zomato Payout</option>
                  <option value="Swiggy">Swiggy Payout</option>
                  <option value="Magicpin">Magicpin Settlement</option>
                  <option value="Direct ONDC">Direct ONDC Settlement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">Payout Date Cycle</label>
                <input
                  type="text"
                  value={uploadData.payoutDateRange}
                  onChange={(e) => setUploadData({ ...uploadData, payoutDateRange: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Select Payout Sheet (CSV / Excel) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    id="payoutFile"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadData({ ...uploadData, fileName: e.target.files[0].name });
                      }
                    }}
                  />
                  <label htmlFor="payoutFile" className="cursor-pointer block">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-400 mb-1" />
                    <span className="text-[12.5px] font-medium text-teal-600 hover:underline">
                      {uploadData.fileName ? uploadData.fileName : "Click to select payout file"}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">Supports Zomato/Swiggy Settlement .csv, .xlsx</p>
                  </label>
                </div>
                {uploadTouched.fileName && uploadErrors.fileName && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadErrors.fileName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Total Disbursed Net Payout (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 45000"
                  value={uploadData.totalClaimedAmount}
                  onChange={(e) => setUploadData({ ...uploadData, totalClaimedAmount: e.target.value })}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${uploadTouched.totalClaimedAmount && uploadErrors.totalClaimedAmount
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-slate-300 focus:border-teal-500"
                    }`}
                />
                {uploadTouched.totalClaimedAmount && uploadErrors.totalClaimedAmount && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadErrors.totalClaimedAmount}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isUploadValid}
                  className={`rounded-lg px-5 py-2 text-[12.5px] font-bold transition shadow-xs ${isUploadValid
                    ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  Upload & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Log Dispute / Adjustment Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Log Dispute / Settlement Adjustment</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Register discrepancy claim for aggregator investigation.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Aggregator Order ID <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ZOM-7821940"
                    value={disputeData.aggregatorOrderId}
                    onChange={(e) => setDisputeData({ ...disputeData, aggregatorOrderId: e.target.value })}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${disputeTouched.aggregatorOrderId && disputeErrors.aggregatorOrderId
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                      }`}
                  />
                  {disputeTouched.aggregatorOrderId && disputeErrors.aggregatorOrderId && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{disputeErrors.aggregatorOrderId}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">Channel</label>
                  <select
                    value={disputeData.channel}
                    onChange={(e) => setDisputeData({ ...disputeData, channel: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Magicpin">Magicpin</option>
                    <option value="Direct ONDC">Direct ONDC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    POS Bill Reference <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RET-2026-0812"
                    value={disputeData.posBillNo}
                    onChange={(e) => setDisputeData({ ...disputeData, posBillNo: e.target.value })}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${disputeTouched.posBillNo && disputeErrors.posBillNo
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                      }`}
                  />
                  {disputeTouched.posBillNo && disputeErrors.posBillNo && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{disputeErrors.posBillNo}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">Dispute Category</label>
                  <select
                    value={disputeData.tabType}
                    onChange={(e) => setDisputeData({ ...disputeData, tabType: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="variance">Amount Variance</option>
                    <option value="missing">Missing In POS</option>
                    <option value="status_mismatch">Status Mismatch</option>
                    <option value="rejected">Rejected / Cancelled Claim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Aggregator Claimed (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={disputeData.aggregatorAmount}
                    onChange={(e) => setDisputeData({ ...disputeData, aggregatorAmount: e.target.value })}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${disputeTouched.aggregatorAmount && disputeErrors.aggregatorAmount
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                      }`}
                  />
                  {disputeTouched.aggregatorAmount && disputeErrors.aggregatorAmount && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{disputeErrors.aggregatorAmount}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    POS Actual Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={disputeData.posAmount}
                    onChange={(e) => setDisputeData({ ...disputeData, posAmount: e.target.value })}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 focus:outline-none ${disputeTouched.posAmount && disputeErrors.posAmount
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                      }`}
                  />
                  {disputeTouched.posAmount && disputeErrors.posAmount && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{disputeErrors.posAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Detailed Justification / Claim Reason <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why commission, discount, or delivery charge was wrongfully deducted..."
                  value={disputeData.disputeReason}
                  onChange={(e) => setDisputeData({ ...disputeData, disputeReason: e.target.value })}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-none ${disputeTouched.disputeReason && disputeErrors.disputeReason
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-slate-300 focus:border-teal-500"
                    }`}
                />
                {disputeTouched.disputeReason && disputeErrors.disputeReason && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{disputeErrors.disputeReason}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isDisputeValid}
                  className={`rounded-lg px-5 py-2 text-[12.5px] font-bold transition shadow-xs ${isDisputeValid
                    ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  Submit Dispute Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Review Dispute Modal */}
      {reviewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  Dispute Review — {reviewRecord.aggregatorOrderId}
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {reviewRecord.channel} • {reviewRecord.orderDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[12.5px]">
                <div>
                  <span className="text-slate-500">POS Bill Ref:</span>
                  <div className="font-mono font-bold text-slate-800">{reviewRecord.posBillNo}</div>
                </div>
                <div>
                  <span className="text-slate-500">Settlement Status:</span>
                  <div className="font-bold text-slate-800">{reviewRecord.settlementStatus}</div>
                </div>
                <div>
                  <span className="text-slate-500">Aggregator Claim:</span>
                  <div className="font-mono font-bold text-slate-900">₹{reviewRecord.aggregatorAmount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-500">POS Billed:</span>
                  <div className="font-mono font-bold text-slate-900">₹{reviewRecord.posAmount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[12px] font-semibold text-slate-600">Dispute Justification / Case Notes:</span>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[12.5px] text-slate-800">
                  {reviewRecord.disputeReason || "No custom justification notes attached."}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setReviewRecord(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                {reviewRecord.settlementStatus !== "Resolved" && (
                  <button
                    type="button"
                    onClick={() => handleResolveDispute(reviewRecord.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-[12.5px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    Mark Reconciled & Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
