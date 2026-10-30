import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import {
  Download,
  Search,
  FileText,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  IndianRupee,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reason: string;
  orderRef?: string;
  date: string;
  mode: string;
}

interface WalletRecord {
  id: string;
  customerName: string;
  mobile: string;
  amount: number;
  totalCredited: number;
  totalDebited: number;
  lastUsedDate: string;
  created: string;
  transactions: WalletTransaction[];
}

const INITIAL_WALLETS: WalletRecord[] = [];

export function VirtualWalletView() {
  const { activeOutlet } = useOutletContext();
  const [mobileFilter, setMobileFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  const [records, setRecords] = useState<WalletRecord[]>(INITIAL_WALLETS);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getWallets(activeOutlet.id).then((res) => {
      setRecords(
        (res || []).map((w) => ({
          id: w.id,
          customerName: w.customer_name,
          mobile: w.customer_mobile,
          amount: parseFloat(w.balance) || 0,
          totalCredited: parseFloat(w.total_credited) || 0,
          totalDebited: parseFloat(w.total_debited) || 0,
          lastUsedDate: w.last_transaction_at ? new Date(w.last_transaction_at).toLocaleString("en-IN") : "",
          created: w.created_at ? new Date(w.created_at).toLocaleString("en-IN") : "",
          transactions: [],
        }))
      );
    }).catch(() => {});
  }, [activeOutlet?.id]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statementWallet, setStatementWallet] = useState<WalletRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    mobile: "",
    customerName: "",
    amount: "",
    mode: "UPI" as "Cash" | "UPI" | "Card" | "Bank Transfer" | "Promotional Credit",
    reason: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Form Validation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!formData.mobile.trim()) {
      errs.mobile = "Customer mobile number is required.";
    } else if (cleanMobile.length < 10 || cleanMobile.length > 12) {
      errs.mobile = "Enter a valid 10-digit mobile number.";
    }

    if (!formData.customerName.trim()) {
      errs.customerName = "Customer full name is required.";
    } else if (formData.customerName.trim().length < 3) {
      errs.customerName = "Customer name must be at least 3 characters.";
    }

    const amt = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      errs.amount = "Top-up amount is required.";
    } else if (isNaN(amt) || amt <= 0) {
      errs.amount = "Enter a valid amount greater than ₹0.";
    }

    if (!formData.reason.trim()) {
      errs.reason = "Deposit reason or purpose is required.";
    }

    return errs;
  }, [formData]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      mobile: "",
      customerName: "",
      amount: "",
      mode: "UPI",
      reason: "",
    });
    setTouched({});
    setIsAddModalOpen(true);
  };

  const handleSubmitTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({
        mobile: true,
        customerName: true,
        amount: true,
        reason: true,
      });
      toast.error("Please fill all required mandatory fields correctly.");
      return;
    }

    const amt = parseFloat(formData.amount);
    const formattedMobile = formData.mobile.startsWith("+91")
      ? formData.mobile
      : `+91 ${formData.mobile.replace(/\D/g, "").slice(-10)}`;

    const now = new Date();
    const dateStr = now.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Check if wallet exists
    const existingIndex = records.findIndex(
      (r) => r.mobile.replace(/\s+/g, "") === formattedMobile.replace(/\s+/g, "")
    );

    if (existingIndex >= 0) {
      const existing = records[existingIndex];
      const newTx: WalletTransaction = {
        id: `tx-w-${Date.now()}`,
        type: "credit",
        amount: amt,
        balanceAfter: existing.amount + amt,
        reason: formData.reason,
        date: dateStr,
        mode: formData.mode,
      };

      const updated = [...records];
      updated[existingIndex] = {
        ...existing,
        customerName: formData.customerName,
        amount: existing.amount + amt,
        totalCredited: existing.totalCredited + amt,
        lastUsedDate: dateStr,
        transactions: [newTx, ...existing.transactions],
      };
      setRecords(updated);
      toast.success(`Successfully added ₹${amt.toLocaleString("en-IN")} to ${formData.customerName}'s wallet!`);
    } else {
      const newTx: WalletTransaction = {
        id: `tx-w-${Date.now()}`,
        type: "credit",
        amount: amt,
        balanceAfter: amt,
        reason: formData.reason,
        date: dateStr,
        mode: formData.mode,
      };

      const newWallet: WalletRecord = {
        id: `w-${Date.now()}`,
        customerName: formData.customerName,
        mobile: formattedMobile,
        amount: amt,
        totalCredited: amt,
        totalDebited: 0,
        lastUsedDate: dateStr,
        created: dateStr,
        transactions: [newTx],
      };
      setRecords([newWallet, ...records]);
      toast.success(`New wallet created & credited with ₹${amt.toLocaleString("en-IN")} for ${formData.customerName}!`);
    }

    setIsAddModalOpen(false);
  };

  // KPIs
  const totalBalance = useMemo(() => records.reduce((acc, r) => acc + r.amount, 0), [records]);
  const totalCredits = useMemo(() => records.reduce((acc, r) => acc + r.totalCredited, 0), [records]);
  const totalDebits = useMemo(() => records.reduce((acc, r) => acc + r.totalDebited, 0), [records]);

  const columns: PosDataGridColumn<WalletRecord>[] = useMemo(
    () => [
      {
        id: "customerName",
        header: "Customer Name",
        accessorKey: "customerName",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">{row.customerName}</div>
            <div className="text-[11px] text-slate-500">Last activity: {row.lastUsedDate}</div>
          </div>
        ),
      },
      {
        id: "mobile",
        header: "Mobile No.",
        accessorKey: "mobile",
        sortable: true,
        filterable: true,
        defaultWidth: 170,
        render: (_, row) => <span className="font-medium text-slate-800 font-mono text-[12.5px]">{row.mobile}</span>,
      },
      {
        id: "amount",
        header: "Remaining Balance (₹)",
        accessorKey: "amount",
        sortable: true,
        align: "right",
        defaultWidth: 180,
        render: (_, row) => (
          <div className="font-mono font-bold text-teal-700">
            ₹{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        id: "totalCredited",
        header: "Total Credited (₹)",
        accessorKey: "totalCredited",
        sortable: true,
        align: "right",
        defaultWidth: 160,
        render: (_, row) => (
          <div className="font-mono text-emerald-600">
            ₹{row.totalCredited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        id: "totalDebited",
        header: "Total Redeemed (₹)",
        accessorKey: "totalDebited",
        sortable: true,
        align: "right",
        defaultWidth: 160,
        render: (_, row) => (
          <div className="font-mono text-slate-600">
            ₹{row.totalDebited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        id: "created",
        header: "Registered On",
        accessorKey: "created",
        sortable: true,
        defaultWidth: 180,
        render: (_, row) => <span className="text-slate-500 font-mono text-[12px]">{row.created}</span>,
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
            onClick={() => setStatementWallet(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition cursor-pointer inline-flex items-center justify-center"
            title="View Passbook Statement"
          >
            <FileText className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (mobileFilter.trim()) {
        const q = mobileFilter.toLowerCase();
        const match = r.mobile.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, mobileFilter]);

  return (
    <div className="w-full space-y-4">
      {/* 1. Header with Add Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Customer Virtual Wallet</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Manage prepaid customer deposits, loyalty store credits, and real-time passbook ledger settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Issue / Top-Up Wallet
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Total Active Float</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Customer balance payable</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Total Credited</p>
            <h3 className="text-xl font-bold font-mono text-emerald-700 mt-1">
              ₹{totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> Cumulative top-ups
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Total Redeemed</p>
            <h3 className="text-xl font-bold font-mono text-amber-700 mt-1">
              ₹{totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-0.5">
              <ArrowDownLeft className="h-3 w-3" /> Settled against bills
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Active Wallets</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">{records.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered members</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[240px] flex-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Customer / Mobile</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={mobileFilter}
                onChange={(e) => {
                  setMobileFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Registered From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Registered To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredRecords.length} wallet accounts`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileFilter("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
                toast.info("Showing all wallet balances");
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
        storageKey="pos-accounting-virtual-wallet"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="wallet accounts"
        emptyState={
          <div className="py-12 text-center text-slate-400">
            <Wallet className="mx-auto h-8 w-8 mb-2 opacity-50 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No customer wallet accounts found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or issue a new wallet credit.</p>
          </div>
        }
      />

      <PosCreatePanel
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue / Top-Up Customer Wallet"
        description="Credit prepaid balance or customer loyalty float."
        icon={Wallet}
        onSubmit={handleSubmitTopUp}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsAddModalOpen(false)} />
            <PosCreateSubmitButton disabled={!isFormValid}>Save & Issue Credit</PosCreateSubmitButton>
          </>
        }
      >
              {/* Customer Mobile */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Customer Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    onBlur={() => handleBlur("mobile")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none ${
                      touched.mobile && errors.mobile
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {touched.mobile && errors.mobile && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.mobile}</span>
                  </div>
                )}
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Customer Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    onBlur={() => handleBlur("customerName")}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none ${
                      touched.customerName && errors.customerName
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {touched.customerName && errors.customerName && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.customerName}</span>
                  </div>
                )}
              </div>

              {/* Amount & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">
                    Deposit Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      onBlur={() => handleBlur("amount")}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] font-mono text-slate-900 shadow-2xs focus:outline-none ${
                        touched.amount && errors.amount
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-slate-300 focus:border-teal-500"
                      }`}
                    />
                    <IndianRupee className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {touched.amount && errors.amount && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.amount}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold text-slate-800">Payment Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Promotional Credit">Complimentary / Reward Credit</option>
                  </select>
                </div>
              </div>

              {/* Deposit Purpose / Reason */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Purpose / Deposit Reason <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Advance Dining Deposit, Banquet advance..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  onBlur={() => handleBlur("reason")}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none ${
                    touched.reason && errors.reason
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.reason && errors.reason && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.reason}</span>
                  </div>
                )}
              </div>

      </PosCreatePanel>

      {/* 6. Passbook Statement Modal Dialog */}
      {statementWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  Wallet Passbook Statement — {statementWallet.customerName}
                </h3>
                <p className="text-[12px] text-slate-500 font-mono mt-0.5">
                  Mobile: {statementWallet.mobile} • Available Balance: ₹
                  {statementWallet.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatementWallet(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Type / Mode</th>
                      <th className="px-4 py-2.5">Description & Reference</th>
                      <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                      <th className="px-4 py-2.5 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementWallet.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11.5px]">{tx.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              tx.type === "credit"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {tx.type === "credit" ? "+" : "-"} {tx.mode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{tx.reason}</div>
                          {tx.orderRef && (
                            <div className="text-[11px] font-mono text-slate-400">Order: {tx.orderRef}</div>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            tx.type === "credit" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{tx.balanceAfter.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => toast.success(`Statement for ${statementWallet.customerName} downloaded.`)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Download Statement PDF
              </button>
              <button
                type="button"
                onClick={() => setStatementWallet(null)}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
