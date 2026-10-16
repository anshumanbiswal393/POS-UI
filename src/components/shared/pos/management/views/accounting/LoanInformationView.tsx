import { useState, useMemo } from "react";
import {
  Landmark,
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  Percent,
  Calendar,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common";
import { PosDataGrid } from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface BusinessLoan {
  id: string;
  loanRef: string;
  lenderName: string;
  facilityType: "Working Capital" | "Kitchen & Equipment Finance" | "POS Daily Swipe Advance" | "Term Loan";
  sanctionAmount: number;
  disbursedDate: string;
  tenureMonths: number;
  interestRate: number;
  monthlyEmiOrSwipeDeduction: string;
  outstandingBalance: number;
  settlementBank: string;
  status: "Active" | "Closed" | "Under Review";
  repaidAmount: number;
}

const INITIAL_LOANS: BusinessLoan[] = [
  {
    id: "ln-1",
    loanRef: "BL-HDFC-2026-9810",
    lenderName: "HDFC Bank Business Banking",
    facilityType: "Working Capital",
    sanctionAmount: 1500000.0,
    disbursedDate: "10 Feb 2026",
    tenureMonths: 24,
    interestRate: 11.5,
    monthlyEmiOrSwipeDeduction: "₹70,250 / mo",
    outstandingBalance: 1124000.0,
    repaidAmount: 376000.0,
    settlementBank: "HDFC Bank (A/C: ************4821)",
    status: "Active",
  },
  {
    id: "ln-2",
    loanRef: "POS-ADV-ICICI-4921",
    lenderName: "ICICI Merchant Finance (Pine Labs)",
    facilityType: "POS Daily Swipe Advance",
    sanctionAmount: 500000.0,
    disbursedDate: "01 Jun 2026",
    tenureMonths: 12,
    interestRate: 13.0,
    monthlyEmiOrSwipeDeduction: "8% of Daily POS Swipes",
    outstandingBalance: 290000.0,
    repaidAmount: 210000.0,
    settlementBank: "ICICI Bank (A/C: ************1938)",
    status: "Active",
  },
];

const FACILITY_TYPES = [
  "Working Capital",
  "Kitchen & Equipment Finance",
  "POS Daily Swipe Advance",
  "Term Loan",
];

export function LoanInformationView() {
  const [loans, setLoans] = useState<BusinessLoan[]>(INITIAL_LOANS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const [formLenderName, setFormLenderName] = useState("");
  const [formLoanRef, setFormLoanRef] = useState("");
  const [formFacilityType, setFormFacilityType] = useState<any>("");
  const [formSanctionAmount, setFormSanctionAmount] = useState("");
  const [formDisbursedDate, setFormDisbursedDate] = useState("");
  const [formTenureMonths, setFormTenureMonths] = useState("");
  const [formInterestRate, setFormInterestRate] = useState("");
  const [formEmiOrSwipe, setFormEmiOrSwipe] = useState("");
  const [formOutstanding, setFormOutstanding] = useState("");
  const [formSettlementBank, setFormSettlementBank] = useState("HDFC Bank (A/C: ************4821)");
  const [formStatus, setFormStatus] = useState<any>("Active");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  // Form Validation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formLenderName.trim()) errs.lenderName = "Lender / Bank name is required.";
    if (!formLoanRef.trim()) errs.loanRef = "Loan / Reference ID is required.";
    if (!formFacilityType) errs.facilityType = "Please select facility type.";
    if (!formSanctionAmount.trim() || isNaN(Number(formSanctionAmount)) || Number(formSanctionAmount) <= 0) {
      errs.sanctionAmount = "Valid sanction amount is required.";
    }
    if (!formDisbursedDate.trim()) errs.disbursedDate = "Disbursal date is required.";
    if (!formTenureMonths.trim() || isNaN(Number(formTenureMonths)) || Number(formTenureMonths) <= 0) {
      errs.tenureMonths = "Tenure in months is required.";
    }
    if (!formInterestRate.trim() || isNaN(Number(formInterestRate)) || Number(formInterestRate) < 0) {
      errs.interestRate = "Interest rate % is required.";
    }
    if (!formEmiOrSwipe.trim()) errs.emiOrSwipe = "Repayment schedule (e.g. ₹50,000 / mo or 8% swipes) is required.";
    if (!formOutstanding.trim() || isNaN(Number(formOutstanding)) || Number(formOutstanding) < 0) {
      errs.outstanding = "Current outstanding balance is required.";
    }
    return errs;
  }, [formLenderName, formLoanRef, formFacilityType, formSanctionAmount, formDisbursedDate, formTenureMonths, formInterestRate, formEmiOrSwipe, formOutstanding]);

  const isFormValid = Object.keys(errors).length === 0;

  const openAddModal = () => {
    setEditingLoanId(null);
    setFormLenderName("");
    setFormLoanRef(`LN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormFacilityType("");
    setFormSanctionAmount("");
    setFormDisbursedDate(new Date().toISOString().split("T")[0]);
    setFormTenureMonths("12");
    setFormInterestRate("11.5");
    setFormEmiOrSwipe("");
    setFormOutstanding("");
    setFormSettlementBank("HDFC Bank (A/C: ************4821)");
    setFormStatus("Active");
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (loan: BusinessLoan) => {
    setEditingLoanId(loan.id);
    setFormLenderName(loan.lenderName);
    setFormLoanRef(loan.loanRef);
    setFormFacilityType(loan.facilityType);
    setFormSanctionAmount(String(loan.sanctionAmount));
    setFormDisbursedDate(loan.disbursedDate);
    setFormTenureMonths(String(loan.tenureMonths));
    setFormInterestRate(String(loan.interestRate));
    setFormEmiOrSwipe(loan.monthlyEmiOrSwipeDeduction);
    setFormOutstanding(String(loan.outstandingBalance));
    setFormSettlementBank(loan.settlementBank);
    setFormStatus(loan.status);
    setTouched({
      lenderName: true,
      loanRef: true,
      facilityType: true,
      sanctionAmount: true,
      disbursedDate: true,
      tenureMonths: true,
      interestRate: true,
      emiOrSwipe: true,
      outstanding: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      lenderName: true,
      loanRef: true,
      facilityType: true,
      sanctionAmount: true,
      disbursedDate: true,
      tenureMonths: true,
      interestRate: true,
      emiOrSwipe: true,
      outstanding: true,
    });

    if (!isFormValid) {
      toast.error("Please fill all mandatory fields marked with red star (*)");
      return;
    }

    const sanction = parseFloat(formSanctionAmount);
    const outstanding = parseFloat(formOutstanding);
    const repaid = Math.max(0, sanction - outstanding);

    const payload: BusinessLoan = {
      id: editingLoanId || `ln-${Date.now()}`,
      loanRef: formLoanRef.trim().toUpperCase(),
      lenderName: formLenderName.trim(),
      facilityType: formFacilityType,
      sanctionAmount: sanction,
      disbursedDate: formDisbursedDate.trim(),
      tenureMonths: parseInt(formTenureMonths),
      interestRate: parseFloat(formInterestRate),
      monthlyEmiOrSwipeDeduction: formEmiOrSwipe.trim(),
      outstandingBalance: outstanding,
      repaidAmount: repaid,
      settlementBank: formSettlementBank,
      status: formStatus,
    };

    if (editingLoanId) {
      setLoans((prev) => prev.map((l) => (l.id === editingLoanId ? payload : l)));
      toast.success("Business loan details updated successfully");
    } else {
      setLoans((prev) => [payload, ...prev]);
      toast.success("New capital loan facility registered");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    toast.success("Loan facility record removed");
  };

  // KPIs
  const totalSanctioned = loans.reduce((acc, l) => acc + l.sanctionAmount, 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const totalRepaid = loans.reduce((acc, l) => acc + l.repaidAmount, 0);

  // Filter & Sort
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (typeFilter !== "All" && l.facilityType !== typeFilter) return false;
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.lenderName.toLowerCase().includes(q) ||
          l.loanRef.toLowerCase().includes(q) ||
          l.facilityType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [loans, searchQuery, typeFilter, statusFilter]);

  const sortedLoans = useMemo(() => {
    if (!sortConfig) return filteredLoans;
    return [...filteredLoans].sort((a, b) => {
      const field = sortConfig.colId as keyof BusinessLoan;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredLoans, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedLoans.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedLoans = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedLoans.slice(start, start + pageSize);
  }, [sortedLoans, validPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedLoans.length && sortedLoans.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedLoans.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const columns: any[] = useMemo(
    () => [
      {
        id: "loanRef",
        header: "Loan Ref / Account",
        label: "Loan Ref / Account",
        sortable: true,
        width: 180,
        render: (_: any, l: BusinessLoan) => (
          <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {l.loanRef}
          </span>
        ),
        getValue: (r: BusinessLoan) => r.loanRef,
      },
      {
        id: "lenderName",
        header: "Lender / Financial Institution",
        label: "Lender / Financial Institution",
        sortable: true,
        width: 230,
        render: (_: any, l: BusinessLoan) => (
          <div>
            <div className="font-semibold text-slate-900">{l.lenderName}</div>
            <div className="text-[11px] text-slate-400">Debit via {l.settlementBank}</div>
          </div>
        ),
        getValue: (r: BusinessLoan) => r.lenderName,
      },
      {
        id: "facilityType",
        header: "Facility Type",
        label: "Facility Type",
        sortable: true,
        filterable: true,
        width: 190,
        render: (_: any, l: BusinessLoan) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {l.facilityType}
          </span>
        ),
        getValue: (r: BusinessLoan) => r.facilityType,
      },
      {
        id: "sanctionAmount",
        header: "Sanctioned (₹)",
        label: "Sanctioned (₹)",
        sortable: true,
        align: "right" as const,
        width: 140,
        render: (_: any, l: BusinessLoan) => (
          <span className="font-mono font-bold text-slate-900">
            ₹{l.sanctionAmount.toLocaleString("en-IN")}
          </span>
        ),
        getValue: (r: BusinessLoan) => `₹${r.sanctionAmount.toLocaleString("en-IN")}`,
      },
      {
        id: "interestRate",
        header: "Interest (% p.a.)",
        label: "Interest (% p.a.)",
        sortable: true,
        align: "right" as const,
        width: 130,
        render: (_: any, l: BusinessLoan) => (
          <span className="font-mono text-slate-700">{l.interestRate}%</span>
        ),
        getValue: (r: BusinessLoan) => `${r.interestRate}%`,
      },
      {
        id: "monthlyEmiOrSwipeDeduction",
        header: "Deduction / EMI",
        label: "Deduction / EMI",
        sortable: true,
        width: 170,
        render: (_: any, l: BusinessLoan) => (
          <span className="font-medium text-slate-800">{l.monthlyEmiOrSwipeDeduction}</span>
        ),
        getValue: (r: BusinessLoan) => r.monthlyEmiOrSwipeDeduction,
      },
      {
        id: "outstandingBalance",
        header: "Outstanding (₹)",
        label: "Outstanding (₹)",
        sortable: true,
        align: "right" as const,
        width: 150,
        render: (_: any, l: BusinessLoan) => (
          <div className="font-bold font-mono text-amber-700">
            ₹{l.outstandingBalance.toLocaleString("en-IN")}
          </div>
        ),
        getValue: (r: BusinessLoan) => `₹${r.outstandingBalance.toLocaleString("en-IN")}`,
      },
      {
        id: "status",
        header: "Status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center" as const,
        width: 110,
        render: (_: any, l: BusinessLoan) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {l.status}
          </span>
        ),
        getValue: (r: BusinessLoan) => r.status,
      },
      {
        id: "actions",
        header: "Action",
        label: "Action",
        sortable: false,
        filterable: false,
        align: "right" as const,
        width: 100,
        render: (_: any, l: BusinessLoan) => (
          <div className="inline-flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => openEditModal(l)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit Facility"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(l.id)}
              className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Delete Record"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Business Loans & POS Advance</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Track business working capital credit, merchant cash advances, and automated swipe deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success("Exporting loans and repayments ledger to Excel...")}
          />

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Loan Facility
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-medium text-slate-500 block">Total Sanctioned Credit</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-slate-900">
              ₹{totalSanctioned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">{loans.length} active facilities</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-semibold text-amber-800 block">Current Outstanding Balance</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-amber-700">
              ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-amber-600 font-bold">Auto-Deduction Active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-semibold text-emerald-800 block">Total Principal Repaid</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-emerald-700">
              ₹{totalRepaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-emerald-600 font-bold">
              {((totalRepaid / (totalSanctioned || 1)) * 100).toFixed(0)}% Cleared
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[220px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Lender / Loan ID</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search bank name or loan account reference..."
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

          <div className="space-y-1 min-w-[170px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Facility Type</label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Facilities</option>
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredLoans.length} matching loan facilities`)}
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
                toast.info("Showing all loan facilities");
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
        data={filteredLoans}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey="pos-accounting-loan-information"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="loan facilities"
        emptyState={
          <div className="py-12 text-center text-slate-400">
            <Landmark className="mx-auto h-8 w-8 mb-2 opacity-50 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No loan facilities found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or register a new facility.</p>
          </div>
        }
      />

      {/* 5. Add / Edit Loan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-2xs">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
                  {editingLoanId ? "Edit Business Loan Facility" : "Register Business Loan / POS Advance"}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  Configure credit facilities, repayment deductions, and merchant cash advances.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveLoan} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Lender & Loan Ref */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Lender / Bank Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank / ICICI"
                  value={formLenderName}
                  onBlur={() => markTouched("lenderName")}
                  onChange={(e) => {
                    setFormLenderName(e.target.value);
                    markTouched("lenderName");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.lenderName && errors.lenderName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.lenderName && errors.lenderName && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.lenderName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Loan Ref / Account No. <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BL-HDFC-98210"
                  value={formLoanRef}
                  onBlur={() => markTouched("loanRef")}
                  onChange={(e) => {
                    setFormLoanRef(e.target.value);
                    markTouched("loanRef");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.loanRef && errors.loanRef ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.loanRef && errors.loanRef && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.loanRef}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Facility Type & Sanction Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Facility Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={formFacilityType}
                  onBlur={() => markTouched("facilityType")}
                  onChange={(e) => {
                    setFormFacilityType(e.target.value);
                    markTouched("facilityType");
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none cursor-pointer shadow-2xs ${
                    touched.facilityType && errors.facilityType ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                >
                  <option value="" disabled>
                    Select Facility Type
                  </option>
                  {FACILITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {touched.facilityType && errors.facilityType && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.facilityType}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Sanction Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500000"
                  value={formSanctionAmount}
                  onBlur={() => markTouched("sanctionAmount")}
                  onChange={(e) => {
                    setFormSanctionAmount(e.target.value);
                    markTouched("sanctionAmount");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.sanctionAmount && errors.sanctionAmount ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.sanctionAmount && errors.sanctionAmount && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.sanctionAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Disbursed Date & Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Disbursal Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  value={formDisbursedDate}
                  onBlur={() => markTouched("disbursedDate")}
                  onChange={(e) => {
                    setFormDisbursedDate(e.target.value);
                    markTouched("disbursedDate");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.disbursedDate && errors.disbursedDate ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.disbursedDate && errors.disbursedDate && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.disbursedDate}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Tenure (Months) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={formTenureMonths}
                  onBlur={() => markTouched("tenureMonths")}
                  onChange={(e) => {
                    setFormTenureMonths(e.target.value);
                    markTouched("tenureMonths");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.tenureMonths && errors.tenureMonths ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.tenureMonths && errors.tenureMonths && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.tenureMonths}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interest Rate & Repayment Deduction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Interest Rate (% p.a.) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 11.5"
                  value={formInterestRate}
                  onBlur={() => markTouched("interestRate")}
                  onChange={(e) => {
                    setFormInterestRate(e.target.value);
                    markTouched("interestRate");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.interestRate && errors.interestRate ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.interestRate && errors.interestRate && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.interestRate}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  EMI / Deduction Schedule <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹70,250 / mo or 8% swipes"
                  value={formEmiOrSwipe}
                  onBlur={() => markTouched("emiOrSwipe")}
                  onChange={(e) => {
                    setFormEmiOrSwipe(e.target.value);
                    markTouched("emiOrSwipe");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.emiOrSwipe && errors.emiOrSwipe ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.emiOrSwipe && errors.emiOrSwipe && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.emiOrSwipe}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Outstanding Balance & Deduction Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Current Outstanding (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1124000"
                  value={formOutstanding}
                  onBlur={() => markTouched("outstanding")}
                  onChange={(e) => {
                    setFormOutstanding(e.target.value);
                    markTouched("outstanding");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.outstanding && errors.outstanding ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.outstanding && errors.outstanding && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.outstanding}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Linked Deduction Bank</label>
                <input
                  type="text"
                  value={formSettlementBank}
                  onChange={(e) => setFormSettlementBank(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>
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
                  {editingLoanId ? "Save Changes" : "Register Loan Facility"}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
