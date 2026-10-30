import { useState, useMemo } from "react";
import {
  Zap,
  Plus,
  Search,
  ChevronDown,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Flame,
  Droplets,
  Wifi,
  Receipt,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface UtilityBill {
  id: string;
  billType: "Electricity" | "Commercial Gas" | "Water Supply" | "Internet & Broadband" | "Waste Management";
  providerName: string;
  consumerNumber: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  paidDate?: string;
  paymentMode?: "Bank Transfer" | "UPI" | "Credit Card" | "Cash" | "Auto-Debit";
  txnRef?: string;
  notes?: string;
}

const INITIAL_BILLS: UtilityBill[] = [];

const UTILITY_TYPES = [
  "Electricity",
  "Commercial Gas",
  "Water Supply",
  "Internet & Broadband",
  "Waste Management",
];

const PAYMENT_MODES = ["Bank Transfer", "UPI", "Credit Card", "Cash", "Auto-Debit"];

export function UtilityBillsView() {
  const [bills, setBills] = useState<UtilityBill[]>(INITIAL_BILLS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [viewingBill, setViewingBill] = useState<UtilityBill | null>(null);

  // Form States
  const [formBillType, setFormBillType] = useState("");
  const [formProviderName, setFormProviderName] = useState("");
  const [formConsumerNumber, setFormConsumerNumber] = useState("");
  const [formBillingPeriod, setFormBillingPeriod] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState<"Paid" | "Pending" | "Overdue">("Pending");
  const [formPaidDate, setFormPaidDate] = useState("");
  const [formPaymentMode, setFormPaymentMode] = useState<any>("");
  const [formTxnRef, setFormTxnRef] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  // Real-time Errors
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formBillType) errs.billType = "Please select utility type.";
    if (!formProviderName.trim()) errs.providerName = "Provider name is required.";
    if (!formConsumerNumber.trim()) errs.consumerNumber = "Consumer / Account number is required.";
    if (!formBillingPeriod.trim()) errs.billingPeriod = "Billing period is required (e.g. Sep 2026).";
    if (!formDueDate.trim()) errs.dueDate = "Due date is required.";
    if (!formAmount.trim()) {
      errs.amount = "Bill amount is required.";
    } else if (isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      errs.amount = "Enter a valid positive amount.";
    }
    if (formStatus === "Paid") {
      if (!formPaidDate.trim()) errs.paidDate = "Payment date is required when status is Paid.";
      if (!formPaymentMode) errs.paymentMode = "Please select a payment mode.";
    }
    return errs;
  }, [formBillType, formProviderName, formConsumerNumber, formBillingPeriod, formDueDate, formAmount, formStatus, formPaidDate, formPaymentMode]);

  const isFormValid = Object.keys(errors).length === 0;

  const openAddModal = () => {
    setEditingBillId(null);
    setFormBillType("");
    setFormProviderName("");
    setFormConsumerNumber("");
    setFormBillingPeriod("");
    setFormDueDate("");
    setFormAmount("");
    setFormStatus("Pending");
    setFormPaidDate("");
    setFormPaymentMode("");
    setFormTxnRef("");
    setFormNotes("");
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (bill: UtilityBill) => {
    setEditingBillId(bill.id);
    setFormBillType(bill.billType);
    setFormProviderName(bill.providerName);
    setFormConsumerNumber(bill.consumerNumber);
    setFormBillingPeriod(bill.billingPeriod);
    setFormDueDate(bill.dueDate);
    setFormAmount(String(bill.amount));
    setFormStatus(bill.status);
    setFormPaidDate(bill.paidDate || "");
    setFormPaymentMode(bill.paymentMode || "");
    setFormTxnRef(bill.txnRef || "");
    setFormNotes(bill.notes || "");
    setTouched({
      billType: true,
      providerName: true,
      consumerNumber: true,
      billingPeriod: true,
      dueDate: true,
      amount: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      billType: true,
      providerName: true,
      consumerNumber: true,
      billingPeriod: true,
      dueDate: true,
      amount: true,
      paidDate: true,
      paymentMode: true,
    });

    if (!isFormValid) {
      toast.error("Please fill all mandatory fields marked with red star (*)");
      return;
    }

    const payload: UtilityBill = {
      id: editingBillId || `ub-${Date.now()}`,
      billType: formBillType as any,
      providerName: formProviderName.trim(),
      consumerNumber: formConsumerNumber.trim().toUpperCase(),
      billingPeriod: formBillingPeriod.trim(),
      dueDate: formDueDate.trim(),
      amount: parseFloat(formAmount),
      status: formStatus,
      paidDate: formStatus === "Paid" ? formPaidDate : undefined,
      paymentMode: formStatus === "Paid" ? formPaymentMode : undefined,
      txnRef: formTxnRef.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingBillId) {
      setBills((prev) => prev.map((b) => (b.id === editingBillId ? payload : b)));
      toast.success("Utility bill updated successfully");
    } else {
      setBills((prev) => [payload, ...prev]);
      toast.success("New utility bill recorded");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    toast.success("Utility bill record removed");
  };

  // KPI Calculations
  const totalAmount = bills.reduce((acc, b) => acc + b.amount, 0);
  const paidAmount = bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + b.amount, 0);
  const pendingAmount = bills.filter((b) => b.status !== "Paid").reduce((acc, b) => acc + b.amount, 0);

  // Filtered & Sorted
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (typeFilter !== "All" && b.billType !== typeFilter) return false;
      if (statusFilter !== "All" && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.providerName.toLowerCase().includes(q) ||
          b.consumerNumber.toLowerCase().includes(q) ||
          b.billType.toLowerCase().includes(q) ||
          b.billingPeriod.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bills, searchQuery, typeFilter, statusFilter]);

  const sortedBills = useMemo(() => {
    if (!sortConfig) return filteredBills;
    return [...filteredBills].sort((a, b) => {
      const field = sortConfig.colId as keyof UtilityBill;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredBills, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedBills.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedBills = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedBills.slice(start, start + pageSize);
  }, [sortedBills, validPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedBills.length && sortedBills.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedBills.map((b) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Electricity":
        return <Zap className="h-4 w-4 text-amber-500" />;
      case "Commercial Gas":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "Water Supply":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "Internet & Broadband":
        return <Wifi className="h-4 w-4 text-indigo-500" />;
      default:
        return <Receipt className="h-4 w-4 text-teal-600" />;
    }
  };

  const columns: PosDataGridColumn<UtilityBill>[] = [
    {
      id: "billType",
      header: "Utility Category",
      accessorKey: "billType",
      sortable: true,
      filterable: true,
      defaultWidth: 190,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
            {getIcon(row.billType)}
          </div>
          <span className="font-semibold text-slate-900">{row.billType}</span>
        </div>
      ),
    },
    {
      id: "providerName",
      header: "Biller / Provider",
      accessorKey: "providerName",
      sortable: true,
      defaultWidth: 240,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.providerName}</div>
          {row.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{row.notes}</div>}
        </div>
      ),
    },
    {
      id: "consumerNumber",
      header: "Account / Consumer No.",
      accessorKey: "consumerNumber",
      sortable: true,
      defaultWidth: 180,
      render: (_, row) => (
        <span className="font-mono text-[11.5px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {row.consumerNumber}
        </span>
      ),
    },
    {
      id: "billingPeriod",
      header: "Bill Month",
      accessorKey: "billingPeriod",
      sortable: true,
      defaultWidth: 120,
      render: (_, row) => <span className="text-slate-600 font-medium">{row.billingPeriod}</span>,
    },
    {
      id: "amount",
      header: "Amount (₹)",
      accessorKey: "amount",
      sortable: true,
      align: "right",
      defaultWidth: 130,
      render: (_, row) => (
        <div className="font-bold text-slate-900 font-mono">
          ₹{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      id: "dueDate",
      header: "Due Date",
      accessorKey: "dueDate",
      sortable: true,
      defaultWidth: 130,
      render: (_, row) => <span className="font-mono text-[12px] text-slate-600">{row.dueDate}</span>,
    },
    {
      id: "status",
      header: "Payment Status",
      accessorKey: "status",
      sortable: true,
      filterable: true,
      align: "center",
      defaultWidth: 130,
      render: (_, row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            row.status === "Paid"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "Pending"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {row.status === "Paid" ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Clock className="h-3 w-3 text-amber-600" />
          )}
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      filterable: false,
      align: "right",
      defaultWidth: 110,
      render: (_, row) => (
        <div className="inline-flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
            title="Edit Utility Bill"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            title="Delete Bill"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Utility Bills & Recurring Invoices</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Log and track hotel & restaurant electricity, commercial LPG, water, and broadband expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Utility Bill
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-medium text-slate-500 block">Total Utility Invoices</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-slate-900">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">{bills.length} bills</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-semibold text-emerald-800 block">Settled / Paid Bills</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-emerald-700">
              ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-emerald-600 font-bold">
              {bills.filter((b) => b.status === "Paid").length} Paid
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-semibold text-amber-800 block">Outstanding / Due Soon</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-amber-700">
              ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-amber-600 font-bold">
              {bills.filter((b) => b.status !== "Paid").length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[220px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Utility / Biller</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search provider, consumer no, or month..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1 min-w-[160px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Utility Type</label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Utilities</option>
                {UTILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 min-w-[130px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Payment Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredBills.length} matching utility records`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("All");
                setStatusFilter("All");
                setCurrentPage(1);
                toast.info("Showing all utility bills");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 4. Full Width Table with PosDataGrid */}
      <PosDataGrid
        data={filteredBills}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey="pos-accounting-utility-bills"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="utility bills"
        emptyState={
          <div className="py-12 text-center text-slate-400">
            <Zap className="mx-auto h-8 w-8 mb-2 opacity-50 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No utility bills found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or log a new utility invoice.</p>
          </div>
        }
      />

      {/* 5. Add / Edit Utility Bill Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-2xs">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
                  {editingBillId ? "Edit Utility Bill" : "Log New Utility Bill"}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  Record outlet operational utility and service provider invoices.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBill} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Utility Type & Provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Utility Category <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={formBillType}
                  onBlur={() => markTouched("billType")}
                  onChange={(e) => {
                    setFormBillType(e.target.value);
                    markTouched("billType");
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none cursor-pointer shadow-2xs ${
                    touched.billType && errors.billType ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                >
                  <option value="" disabled>
                    Select Utility Type
                  </option>
                  {UTILITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {touched.billType && errors.billType && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.billType}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Biller / Provider Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TPCODL / Indane / Airtel"
                  value={formProviderName}
                  onBlur={() => markTouched("providerName")}
                  onChange={(e) => {
                    setFormProviderName(e.target.value);
                    markTouched("providerName");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.providerName && errors.providerName
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {touched.providerName && errors.providerName && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.providerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Consumer No & Billing Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Consumer / Meter Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. EL-ANG-8920194"
                  value={formConsumerNumber}
                  onBlur={() => markTouched("consumerNumber")}
                  onChange={(e) => {
                    setFormConsumerNumber(e.target.value);
                    markTouched("consumerNumber");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.consumerNumber && errors.consumerNumber
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {touched.consumerNumber && errors.consumerNumber && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.consumerNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Bill Period / Month <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sep 2026"
                  value={formBillingPeriod}
                  onBlur={() => markTouched("billingPeriod")}
                  onChange={(e) => {
                    setFormBillingPeriod(e.target.value);
                    markTouched("billingPeriod");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.billingPeriod && errors.billingPeriod
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {touched.billingPeriod && errors.billingPeriod && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.billingPeriod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bill Amount & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Bill Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onBlur={() => markTouched("amount")}
                  onChange={(e) => {
                    setFormAmount(e.target.value);
                    markTouched("amount");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.amount && errors.amount
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
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
                <label className="text-[12px] font-semibold text-slate-700">
                  Due Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onBlur={() => markTouched("dueDate")}
                  onChange={(e) => {
                    setFormDueDate(e.target.value);
                    markTouched("dueDate");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.dueDate && errors.dueDate
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {touched.dueDate && errors.dueDate && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.dueDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status Switch */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">Payment Status</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="billStatus"
                    value="Pending"
                    checked={formStatus === "Pending"}
                    onChange={() => setFormStatus("Pending")}
                    className="h-4 w-4 text-teal-600"
                  />
                  Pending
                </label>
                <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="billStatus"
                    value="Paid"
                    checked={formStatus === "Paid"}
                    onChange={() => setFormStatus("Paid")}
                    className="h-4 w-4 text-teal-600"
                  />
                  Paid / Settled
                </label>
              </div>
            </div>

            {/* Paid Details if status is Paid */}
            {formStatus === "Paid" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-semibold text-slate-700">
                      Payment Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      value={formPaidDate}
                      onBlur={() => markTouched("paidDate")}
                      onChange={(e) => {
                        setFormPaidDate(e.target.value);
                        markTouched("paidDate");
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:outline-none"
                    />
                    {touched.paidDate && errors.paidDate && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.paidDate}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11.5px] font-semibold text-slate-700">
                      Payment Mode <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      value={formPaymentMode}
                      onBlur={() => markTouched("paymentMode")}
                      onChange={(e) => {
                        setFormPaymentMode(e.target.value);
                        markTouched("paymentMode");
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Mode
                      </option>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    {touched.paymentMode && errors.paymentMode && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.paymentMode}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-700">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC9821049102"
                    value={formTxnRef}
                    onChange={(e) => setFormTxnRef(e.target.value)}
                    className="w-full font-mono rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">Remarks / Description</label>
              <input
                type="text"
                placeholder="e.g. Main Kitchen AC Meter line"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11.5px] text-slate-400">
                {!isFormValid ? (
                  <span className="text-amber-600 font-medium">Fill mandatory fields (*) to enable</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Ready to save</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition ${
                    isFormValid
                      ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] cursor-pointer shadow-sm shadow-teal-600/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                  }`}
                >
                  {editingBillId ? "Save Changes" : "Record Utility Bill"}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
