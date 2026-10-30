import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import {
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
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

interface MasterItem {
  id: string;
  title: string;
  category: "Expense" | "Withdrawal" | "Cash Top-Up";
  status: boolean;
  createdDate: string;
}

interface ListingItem {
  id: string;
  title: string;
  type: "Expense" | "Withdrawal" | "Cash Top-Up";
  totalReported: number;
  paidTo?: string;
  paymentMode: "Cash Drawer Float" | "UPI" | "Bank Transfer" | "Credit Card";
  date: string;
  refNo?: string;
  notes?: string;
}

const INITIAL_EXPENSES: any[] = [];

const INITIAL_WITHDRAWALS: any[] = [];

const INITIAL_TOPUPS: any[] = [];

const INITIAL_MASTERS: any[] = [];

const PAYMENT_MODES = ["Cash Drawer Float", "UPI", "Bank Transfer", "Credit Card"];

export function ExpenseManagementView() {
  const { activeOutlet } = useOutletContext();
  const [activeTab, setActiveTab] = useState<
    | "expense_listing"
    | "expense_master"
    | "withdrawal_listing"
    | "withdrawal_master"
    | "cash_topup_listing"
    | "cash_topup_master"
  >("expense_listing");

  const [expenses, setExpenses] = useState<ListingItem[]>(INITIAL_EXPENSES);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getExpenses(activeOutlet.id).then((res) => {
      setExpenses(
        (res || []).map((e) => ({
          id: e.id,
          title: e.notes || e.category,
          type: "Expense",
          totalReported: parseFloat(e.amount) || 0,
          paidTo: e.payee_name,
          paymentMode: (e.payment_mode as any) || "Cash Drawer Float",
          date: e.expense_date ? new Date(e.expense_date).toLocaleDateString("en-IN") : "",
          refNo: e.expense_number,
        }))
      );
    }).catch(() => {});
  }, [activeOutlet?.id]);
  const [withdrawals, setWithdrawals] = useState<ListingItem[]>(INITIAL_WITHDRAWALS);
  const [topups, setTopups] = useState<ListingItem[]>(INITIAL_TOPUPS);
  const [masters, setMasters] = useState<MasterItem[]>(INITIAL_MASTERS);

  // Table Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Add / Edit Listing Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPaidTo, setFormPaidTo] = useState("");
  const [formPaymentMode, setFormPaymentMode] = useState<any>("Cash Drawer Float");
  const [formDate, setFormDate] = useState("");
  const [formRefNo, setFormRefNo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [entryTouched, setEntryTouched] = useState<Record<string, boolean>>({});

  // Add / Edit Master Category Modal
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [formMasterTitle, setFormMasterTitle] = useState("");
  const [formMasterCategory, setFormMasterCategory] = useState<"Expense" | "Withdrawal" | "Cash Top-Up">("Expense");
  const [formMasterStatus, setFormMasterStatus] = useState(true);
  const [masterTouched, setMasterTouched] = useState<Record<string, boolean>>({});

  const markEntryTouched = (f: string) => setEntryTouched((p) => ({ ...p, [f]: true }));
  const markMasterTouched = (f: string) => setMasterTouched((p) => ({ ...p, [f]: true }));

  // Entry Errors
  const entryErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formTitle.trim()) errs.title = "Title / Reason is required.";
    if (!formAmount.trim() || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      errs.amount = "Valid amount is required.";
    }
    if (!formPaidTo.trim()) errs.paidTo = "Beneficiary / Paid To is required.";
    if (!formDate.trim()) errs.date = "Date is required.";
    if (!formPaymentMode) errs.paymentMode = "Please select a payment mode.";
    return errs;
  }, [formTitle, formAmount, formPaidTo, formDate, formPaymentMode]);

  const isEntryFormValid = Object.keys(entryErrors).length === 0;

  // Master Errors
  const masterErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formMasterTitle.trim()) errs.title = "Category title is required.";
    return errs;
  }, [formMasterTitle]);

  const isMasterFormValid = Object.keys(masterErrors).length === 0;

  // Current active data set
  const isMasterTab = activeTab.endsWith("_master");
  const currentCategoryType =
    activeTab.startsWith("expense")
      ? "Expense"
      : activeTab.startsWith("withdrawal")
      ? "Withdrawal"
      : "Cash Top-Up";

  const currentListings = useMemo(() => {
    if (activeTab === "expense_listing") return expenses;
    if (activeTab === "withdrawal_listing") return withdrawals;
    return topups;
  }, [activeTab, expenses, withdrawals, topups]);

  const currentMasters = useMemo(() => {
    return masters.filter((m) => m.category === currentCategoryType);
  }, [masters, currentCategoryType]);

  // Filtered & Sorted
  const filteredListings = useMemo(() => {
    return currentListings.filter((i) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          i.title.toLowerCase().includes(q) ||
          (i.paidTo && i.paidTo.toLowerCase().includes(q)) ||
          i.paymentMode.toLowerCase().includes(q) ||
          (i.refNo && i.refNo.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [currentListings, searchQuery]);

  const filteredMasters = useMemo(() => {
    return currentMasters.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!m.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [currentMasters, searchQuery]);

  const sortedListings = useMemo(() => {
    if (!sortConfig) return filteredListings;
    return [...filteredListings].sort((a, b) => {
      const field = sortConfig.colId as keyof ListingItem;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredListings, sortConfig]);

  const sortedMasters = useMemo(() => {
    if (!sortConfig) return filteredMasters;
    return [...filteredMasters].sort((a, b) => {
      const field = sortConfig.colId as keyof MasterItem;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredMasters, sortConfig]);

  // Pagination
  const totalCount = isMasterTab ? sortedMasters.length : sortedListings.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedListings = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedListings.slice(start, start + pageSize);
  }, [sortedListings, validPage, pageSize]);

  const paginatedMasters = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedMasters.slice(start, start + pageSize);
  }, [sortedMasters, validPage, pageSize]);

  const toggleSelectAll = () => {
    const currentDataset = isMasterTab ? sortedMasters : sortedListings;
    if (selectedIds.length === currentDataset.length && currentDataset.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentDataset.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Open Modals
  const openAddEntryModal = () => {
    setEditingEntryId(null);
    setFormTitle("");
    setFormAmount("");
    setFormPaidTo("");
    setFormPaymentMode("Cash Drawer Float");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormRefNo("");
    setFormNotes("");
    setEntryTouched({});
    setIsEntryModalOpen(true);
  };

  const openEditEntryModal = (item: ListingItem) => {
    setEditingEntryId(item.id);
    setFormTitle(item.title);
    setFormAmount(String(item.totalReported));
    setFormPaidTo(item.paidTo || "");
    setFormPaymentMode(item.paymentMode);
    setFormDate(item.date);
    setFormRefNo(item.refNo || "");
    setFormNotes(item.notes || "");
    setEntryTouched({ title: true, amount: true, paidTo: true, date: true });
    setIsEntryModalOpen(true);
  };

  const openAddMasterModal = () => {
    setEditingMasterId(null);
    setFormMasterTitle("");
    setFormMasterCategory(currentCategoryType);
    setFormMasterStatus(true);
    setMasterTouched({});
    setIsMasterModalOpen(true);
  };

  const openEditMasterModal = (m: MasterItem) => {
    setEditingMasterId(m.id);
    setFormMasterTitle(m.title);
    setFormMasterCategory(m.category);
    setFormMasterStatus(m.status);
    setMasterTouched({ title: true });
    setIsMasterModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setEntryTouched({ title: true, amount: true, paidTo: true, date: true, paymentMode: true });
    if (!isEntryFormValid) {
      toast.error("Please fill all mandatory fields marked with red star (*)");
      return;
    }

    const payload: ListingItem = {
      id: editingEntryId || `item-${Date.now()}`,
      title: formTitle.trim(),
      type: currentCategoryType,
      totalReported: parseFloat(formAmount),
      paidTo: formPaidTo.trim(),
      paymentMode: formPaymentMode,
      date: formDate.trim(),
      refNo: formRefNo.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (currentCategoryType === "Expense") {
      setExpenses((prev) =>
        editingEntryId ? prev.map((i) => (i.id === editingEntryId ? payload : i)) : [payload, ...prev]
      );
    } else if (currentCategoryType === "Withdrawal") {
      setWithdrawals((prev) =>
        editingEntryId ? prev.map((i) => (i.id === editingEntryId ? payload : i)) : [payload, ...prev]
      );
    } else {
      setTopups((prev) =>
        editingEntryId ? prev.map((i) => (i.id === editingEntryId ? payload : i)) : [payload, ...prev]
      );
    }

    toast.success(`${currentCategoryType} record saved successfully`);
    setIsEntryModalOpen(false);
  };

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterTouched({ title: true });
    if (!isMasterFormValid) {
      toast.error("Please enter category title");
      return;
    }

    const payload: MasterItem = {
      id: editingMasterId || `m-${Date.now()}`,
      title: formMasterTitle.trim(),
      category: formMasterCategory,
      status: formMasterStatus,
      createdDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };

    setMasters((prev) =>
      editingMasterId ? prev.map((m) => (m.id === editingMasterId ? payload : m)) : [payload, ...prev]
    );

    toast.success(`Master category ${editingMasterId ? "updated" : "created"}`);
    setIsMasterModalOpen(false);
  };

  const handleDeleteListing = (id: string) => {
    if (currentCategoryType === "Expense") setExpenses((p) => p.filter((i) => i.id !== id));
    else if (currentCategoryType === "Withdrawal") setWithdrawals((p) => p.filter((i) => i.id !== id));
    else setTopups((p) => p.filter((i) => i.id !== id));
    toast.success("Entry removed");
  };

  const handleDeleteMaster = (id: string) => {
    setMasters((p) => p.filter((m) => m.id !== id));
    toast.success("Master category removed");
  };

  const listingColumns: any[] = useMemo(
    () => [
      {
        id: "title",
        header: "Title / Description",
        label: "Title / Description",
        sortable: true,
        width: 240,
        render: (_: any, item: ListingItem) => (
          <div>
            <div className="font-semibold text-slate-900">{item.title}</div>
            {item.refNo && <div className="text-[11px] text-slate-400 font-mono">Ref: {item.refNo}</div>}
          </div>
        ),
        getValue: (r: ListingItem) => r.title,
      },
      {
        id: "paidTo",
        header: "Beneficiary / Paid To",
        label: "Beneficiary / Paid To",
        sortable: true,
        width: 180,
        render: (_: any, item: ListingItem) => (
          <span className="text-slate-800 font-medium">{item.paidTo || "—"}</span>
        ),
        getValue: (r: ListingItem) => r.paidTo || "—",
      },
      {
        id: "paymentMode",
        header: "Payment Mode",
        label: "Payment Mode",
        sortable: true,
        filterable: true,
        width: 160,
        render: (_: any, item: ListingItem) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {item.paymentMode}
          </span>
        ),
        getValue: (r: ListingItem) => r.paymentMode,
      },
      {
        id: "date",
        header: "Date",
        label: "Date",
        sortable: true,
        width: 120,
        render: (_: any, item: ListingItem) => (
          <span className="font-mono text-[12px] text-slate-600">{item.date}</span>
        ),
        getValue: (r: ListingItem) => r.date,
      },
      {
        id: "totalReported",
        header: "Amount (₹)",
        label: "Amount (₹)",
        sortable: true,
        align: "right" as const,
        width: 140,
        render: (_: any, item: ListingItem) => (
          <div className="font-bold font-mono text-slate-900">
            ₹{item.totalReported.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        ),
        getValue: (r: ListingItem) => `₹${r.totalReported.toLocaleString("en-IN")}`,
      },
      {
        id: "actions",
        header: "Action",
        label: "Action",
        sortable: false,
        filterable: false,
        align: "right" as const,
        width: 100,
        render: (_: any, item: ListingItem) => (
          <div className="inline-flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => openEditEntryModal(item)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit Entry"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteListing(item.id)}
              className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Delete Entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [currentCategoryType]
  );

  const masterColumns: any[] = useMemo(
    () => [
      {
        id: "title",
        header: "Master Category Title",
        label: "Master Category Title",
        sortable: true,
        width: 300,
        render: (_: any, m: MasterItem) => (
          <span className="font-semibold text-slate-900">{m.title}</span>
        ),
        getValue: (r: MasterItem) => r.title,
      },
      {
        id: "status",
        header: "Status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center" as const,
        width: 130,
        render: (_: any, m: MasterItem) => (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              m.status
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {m.status && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
            {m.status ? "Active" : "Inactive"}
          </span>
        ),
        getValue: (r: MasterItem) => (r.status ? "Active" : "Inactive"),
      },
      {
        id: "createdDate",
        header: "Created Date",
        label: "Created Date",
        sortable: true,
        width: 160,
        render: (_: any, m: MasterItem) => (
          <span className="text-slate-500 font-mono text-[11.5px]">{m.createdDate}</span>
        ),
        getValue: (r: MasterItem) => r.createdDate,
      },
      {
        id: "actions",
        header: "Actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right" as const,
        width: 110,
        render: (_: any, m: MasterItem) => (
          <div className="inline-flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => openEditMasterModal(m)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit Master"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMaster(m.id)}
              className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Delete Master"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const tabs = [
    { id: "expense_listing", label: "Expense Listing" },
    { id: "expense_master", label: "Expense Master" },
    { id: "withdrawal_listing", label: "Withdrawal Listing" },
    { id: "withdrawal_master", label: "Withdrawal Master" },
    { id: "cash_topup_listing", label: "Cash Top-Up Listing" },
    { id: "cash_topup_master", label: "Cash Top-Up Master" },
  ] as const;

  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.totalReported, 0);
  const totalWithdrawalSum = withdrawals.reduce((acc, w) => acc + w.totalReported, 0);
  const totalTopupSum = topups.reduce((acc, t) => acc + t.totalReported, 0);

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Petty Cash, Expenses & Withdrawals
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Manage daily kitchen procurement, staff advances, owner drawings, and cash drawer float top-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success("Exporting expense ledger to Excel...")}
          />

          {isMasterTab ? (
            <button
              type="button"
              onClick={openAddMasterModal}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Master Category
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddEntryModal}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add {currentCategoryType} Entry
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-medium text-slate-500 block">Total Expenses Logged</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-slate-900">
              ₹{totalExpenseSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">{expenses.length} entries</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-medium text-slate-500 block">Total Withdrawals & Drawings</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-slate-900">
              ₹{totalWithdrawalSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">{withdrawals.length} entries</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <span className="text-[11.5px] font-medium text-slate-500 block">Total Cash Top-Ups</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold font-mono text-teal-700">
              ₹{totalTopupSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11.5px] text-teal-600 font-bold">{topups.length} entries</span>
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className={`px-4 py-2.5 text-[12.5px] font-semibold transition cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? "border-teal-600 text-teal-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Filter Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[220px]">
            <label className="text-[11.5px] font-semibold text-slate-600">
              Search {isMasterTab ? "Master Category" : "Entry / Beneficiary"}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${activeTab.replace("_", " ")}...`}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${totalCount} matching records`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
                toast.info("Showing all records");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 5. Full Table with PosDataGrid */}
      <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
        {isMasterTab ? (
          <PosDataGrid
            data={filteredMasters}
            columns={masterColumns}
            keyField="id"
            selectable
            selectedRowIds={selectedIds}
            onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
            storageKey={`pos-accounting-expense-master-${currentCategoryType.toLowerCase()}`}
            pageSize={10}
            themeVariant="primary"
            emptyMessage="No master categories found."
          />
        ) : (
          <PosDataGrid
            data={filteredListings}
            columns={listingColumns}
            keyField="id"
            selectable
            selectedRowIds={selectedIds}
            onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
            storageKey={`pos-accounting-expense-listing-${currentCategoryType.toLowerCase()}`}
            pageSize={10}
            themeVariant="primary"
            emptyMessage={`No ${currentCategoryType.toLowerCase()} records found.`}
          />
        )}
      </div>

      {/* 6. Add / Edit Listing Entry Modal */}
      <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-2xs">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
                  {editingEntryId ? `Edit ${currentCategoryType} Entry` : `Record New ${currentCategoryType}`}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  Enter authentic payment amount, vendor, and cash register details.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveEntry} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Title / Description */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">
                Title / Expense Description <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Daily Groceries & Vegetables Mandi"
                value={formTitle}
                onBlur={() => markEntryTouched("title")}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  markEntryTouched("title");
                }}
                className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                  entryTouched.title && entryErrors.title ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                }`}
              />
              {entryTouched.title && entryErrors.title && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{entryErrors.title}</span>
                </div>
              )}
            </div>

            {/* Amount & Beneficiary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onBlur={() => markEntryTouched("amount")}
                  onChange={(e) => {
                    setFormAmount(e.target.value);
                    markEntryTouched("amount");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    entryTouched.amount && entryErrors.amount ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {entryTouched.amount && entryErrors.amount && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{entryErrors.amount}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Paid To / Beneficiary <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local Mandi Vendor / Chef Ramesh"
                  value={formPaidTo}
                  onBlur={() => markEntryTouched("paidTo")}
                  onChange={(e) => {
                    setFormPaidTo(e.target.value);
                    markEntryTouched("paidTo");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    entryTouched.paidTo && entryErrors.paidTo ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {entryTouched.paidTo && entryErrors.paidTo && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{entryErrors.paidTo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Mode & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Payment Mode <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={formPaymentMode}
                  onBlur={() => markEntryTouched("paymentMode")}
                  onChange={(e) => {
                    setFormPaymentMode(e.target.value);
                    markEntryTouched("paymentMode");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer shadow-2xs"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Entry Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onBlur={() => markEntryTouched("date")}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    markEntryTouched("date");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    entryTouched.date && entryErrors.date ? "border-rose-400 bg-rose-50/20" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {entryTouched.date && entryErrors.date && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{entryErrors.date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ref No & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Receipt / Voucher Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. VCH-98210"
                  value={formRefNo}
                  onChange={(e) => setFormRefNo(e.target.value)}
                  className="w-full font-mono rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Remarks / Purpose</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11.5px] text-slate-400">
                {!isEntryFormValid ? (
                  <span className="text-amber-600 font-medium">Fill mandatory fields (*) to enable</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Ready to save</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isEntryFormValid}
                  className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition ${
                    isEntryFormValid
                      ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] cursor-pointer shadow-sm shadow-teal-600/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                  }`}
                >
                  {editingEntryId ? "Save Changes" : `Save ${currentCategoryType}`}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Add / Edit Master Category Modal */}
      <Dialog open={isMasterModalOpen} onOpenChange={setIsMasterModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
              {editingMasterId ? "Edit Master Category" : "Add Master Category"}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
              Register predefined expense or withdrawal categories for billing classification.
            </DialogDescription>
          </div>

          <form onSubmit={handleSaveMaster} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">
                Category Title <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dairy & Milk Supplies"
                value={formMasterTitle}
                onBlur={() => markMasterTouched("title")}
                onChange={(e) => {
                  setFormMasterTitle(e.target.value);
                  markMasterTouched("title");
                }}
                className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                  masterTouched.title && masterErrors.title
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-300 focus:border-teal-500"
                }`}
              />
              {masterTouched.title && masterErrors.title && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{masterErrors.title}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">Master Type</label>
              <select
                value={formMasterCategory}
                onChange={(e) => setFormMasterCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Expense">Expense Master</option>
                <option value="Withdrawal">Withdrawal Master</option>
                <option value="Cash Top-Up">Cash Top-Up Master</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="masterStatus"
                checked={formMasterStatus}
                onChange={(e) => setFormMasterStatus(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 cursor-pointer"
              />
              <label htmlFor="masterStatus" className="text-[12.5px] font-medium text-slate-700 cursor-pointer">
                Active Category
              </label>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isMasterFormValid}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-sm shadow-teal-600/20"
              >
                Save Category
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
