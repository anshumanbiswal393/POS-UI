import { useState, useMemo } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  Receipt,
  User,
  Phone,
  Banknote,
  QrCode,
  Building2,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { useDueBills, useSettleDueBillMutation } from "@/hooks/queries/usePosOrders";
import { type DueBill } from "@/services/posOrdersService";
import {
  PosDataGrid,
  ChooseColumnsMenu,
  type PosDataGridColumn,
  type DataTableColumn,
} from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { exportToExcel } from "@/utils/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const VISIBLE_COLUMNS_KEY = "retrod:pos-due-settlement:visible-columns";

type PayMode = "Cash" | "UPI" | "Card" | "Room Charge" | "Wallet";

const PAY_METHODS: Array<{
  id: PayMode;
  label: string;
  hint: string;
  icon: typeof Banknote;
}> = [
  { id: "Cash", label: "Cash", hint: "Cash drawer", icon: Banknote },
  { id: "UPI", label: "UPI", hint: "QR / PhonePe / GPay", icon: QrCode },
  { id: "Card", label: "Card", hint: "Debit / Credit", icon: CreditCard },
  { id: "Room Charge", label: "Room charge", hint: "Post to guest folio", icon: Building2 },
  { id: "Wallet", label: "Other", hint: "Wallet / voucher", icon: Wallet },
];

export function PosDueSettlementManager() {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBill, setSelectedBill] = useState<DueBill | null>(null);
  const [settlementMode, setSettlementMode] = useState<PayMode>("Cash");
  const [settlementAmount, setSettlementAmount] = useState("");

  const { data: dueBills = [] } = useDueBills();
  const settleMutation = useSettleDueBillMutation();

  const totalOpenDues = useMemo(
    () => dueBills.reduce((acc, curr) => acc + curr.dueAmount, 0),
    [dueBills],
  );

  // List follows top-nav business day — no month/aging timelines
  const filteredRecords = useMemo(() => {
    return dueBills.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !r.billNo.toLowerCase().includes(q) &&
          !r.customerName.toLowerCase().includes(q) &&
          !r.tableOrRoom.toLowerCase().includes(q) &&
          !r.customerPhone.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [dueBills, searchQuery]);

  const handleOpenSettle = (bill: DueBill) => {
    setSelectedBill(bill);
    setSettlementAmount(bill.dueAmount.toString());
    setSettlementMode("Cash");
  };

  const handleCloseSettle = () => {
    setSelectedBill(null);
    setSettlementAmount("");
  };

  const dueColumns: PosDataGridColumn<DueBill>[] = useMemo(
    () => [
      {
        id: "billNo",
        header: "Bill No & Location",
        accessorKey: "billNo",
        sortable: true,
        filterable: true,
        defaultWidth: 190,
        render: (_, bill) => (
          <div>
            <div className="font-mono text-[13px] font-black text-slate-900">{bill.billNo}</div>
            <div className="text-[11.5px] font-bold text-teal-800 mt-0.5">{bill.tableOrRoom}</div>
            <div className="text-[10.5px] text-slate-400">Date: {bill.dueDate}</div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Guest & Waiter Details",
        accessorKey: "customerName",
        sortable: true,
        filterable: true,
        defaultWidth: 210,
        render: (_, bill) => (
          <div>
            <div className="font-bold text-slate-900 text-[12.5px] flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              <span>{bill.customerName}</span>
            </div>
            {bill.customerPhone && bill.customerPhone !== "--" && (
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                <Phone className="h-2.5 w-2.5 text-slate-400" />
                <span>{bill.customerPhone}</span>
              </div>
            )}
            <div className="text-[10.5px] text-slate-500 mt-0.5">
              Waiter:{" "}
              <span className="font-semibold text-slate-700">{bill.waiterName || "Captain"}</span>
            </div>
          </div>
        ),
      },
      {
        id: "itemsSummary",
        header: "Items Summary",
        accessorKey: "itemsSummary",
        sortable: false,
        filterable: false,
        defaultWidth: 230,
        render: (_, bill) => (
          <div className="font-semibold text-slate-700 max-w-xs text-[11.5px] leading-relaxed">
            {bill.itemsSummary || "Dishes & Beverages"}
          </div>
        ),
      },
      {
        id: "totalAmount",
        header: "Total Bill",
        accessorKey: "totalAmount",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        render: (_, bill) => (
          <div>
            <div className="font-bold text-slate-900 text-[12.5px]">
              ₹ {bill.totalAmount.toLocaleString("en-IN")}.00
            </div>
            {bill.paidAmount > 0 && (
              <div className="text-[10.5px] text-slate-500">
                Paid: ₹{bill.paidAmount.toLocaleString()}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "dueAmount",
        header: "Balance Due",
        accessorKey: "dueAmount",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        render: (_, bill) => (
          <div className="font-black text-[14px] text-teal-800">
            ₹ {bill.dueAmount.toLocaleString("en-IN")}.00
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 110,
        render: (_, bill) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${
              bill.status === "Partial"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-teal-50 text-teal-800 border-teal-300"
            }`}
          >
            {bill.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 100,
        render: (_, bill) => (
          <button
            type="button"
            onClick={() => handleOpenSettle(bill)}
            className="flex h-8 items-center justify-center rounded-lg bg-teal-700 px-4 text-[12px] font-bold text-white hover:bg-teal-800 active:scale-98 transition cursor-pointer shadow-xs ml-auto"
          >
            Settle
          </button>
        ),
      },
    ],
    [],
  );

  const chooseColumnDefs: DataTableColumn[] = useMemo(
    () =>
      dueColumns.map((col, idx) => {
        const id =
          col.id ||
          col.key ||
          (typeof col.accessorKey === "string" ? col.accessorKey : `col-${idx}`);
        const label =
          typeof col.header === "string"
            ? col.header
            : typeof col.label === "string"
              ? col.label
              : id;
        return { id, key: id, label };
      }),
    [dueColumns],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    const initial: Record<string, boolean> = {};
    for (const col of dueColumns) {
      if (col.id) initial[col.id] = true;
    }
    return initial;
  });

  const handleColumnVisibilityChange = (updated: Record<string, boolean>) => {
    setColumnVisibility(updated);
    try {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedBill) return;
    const settleAmt = parseFloat(settlementAmount) || selectedBill.dueAmount;
    // Map Wallet → Split for existing service type (stored as other)
    const modeForApi =
      settlementMode === "Wallet" ? ("Split" as const) : settlementMode;

    settleMutation.mutate(
      {
        billId: selectedBill.id,
        paymentMode: modeForApi,
        paidAmount: settleAmt,
      },
      {
        onSuccess: (data) => {
          const fullyPaid = data.settledBill.status === "Settled";
          if (fullyPaid) {
            toast.success(`Paid · ${selectedBill.billNo} → Order History`, {
              description: `${settlementMode} · ₹${settleAmt.toLocaleString("en-IN")}`,
            });
            handleCloseSettle();
          } else {
            toast.success(`Partial payment recorded`, {
              description: `Balance ₹${data.settledBill.dueAmount.toLocaleString("en-IN")} still due`,
            });
            setSelectedBill(data.settledBill);
            setSettlementAmount(data.settledBill.dueAmount.toString());
          }
        },
        onError: () => toast.error("Payment failed"),
      },
    );
  };

  const handleExportExcel = () => {
    const headers = [
      "Bill No",
      "Order Type",
      "Table / Room",
      "Customer Name",
      "Total Amount",
      "Paid Amount",
      "Due Amount",
      "Due Date",
      "Status",
    ];
    const rows = filteredRecords.map((r) => [
      r.billNo,
      r.orderType,
      r.tableOrRoom,
      r.customerName,
      r.totalAmount,
      r.paidAmount,
      r.dueAmount,
      r.dueDate,
      r.status,
    ]);

    exportToExcel({
      filename: `Pending_Payments_${new Date().toISOString().slice(0, 10)}`,
      title: "Pending Payments",
      subtitle: "Today (business day from top nav)",
      columns: headers,
      rows,
    });
    toast.success(`Exported ${rows.length} bills`);
  };

  // Full-screen payment UI with method sidebar
  if (selectedBill) {
    const amt = parseFloat(settlementAmount) || selectedBill.dueAmount;
    return (
      <div className="flex flex-col gap-3 pb-6 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCloseSettle}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12px] font-bold text-text-primary hover:bg-surface-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold text-text-primary leading-tight">
              Collect payment
            </h1>
            <p className="text-[11.5px] text-text-secondary truncate">
              {selectedBill.billNo} · {selectedBill.tableOrRoom} · {selectedBill.customerName}
            </p>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 gap-3 flex-col md:flex-row">
          {/* Sidebar — payment methods */}
          <aside className="md:w-56 shrink-0 rounded-xl border border-border bg-surface shadow-e1 overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-border bg-surface-2/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Payment method
              </p>
            </div>
            <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-y-auto">
              {PAY_METHODS.map((m) => {
                const Icon = m.icon;
                const active = settlementMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSettlementMode(m.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition cursor-pointer min-w-[9.5rem] md:min-w-0",
                      active
                        ? "bg-primary text-white shadow-e1"
                        : "bg-transparent text-text-primary hover:bg-surface-2",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-primary")} />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-bold leading-tight">{m.label}</span>
                      <span
                        className={cn(
                          "block text-[10.5px] leading-tight mt-0.5",
                          active ? "text-white/80" : "text-text-secondary",
                        )}
                      >
                        {m.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main — bill + amount + Done */}
          <section className="flex-1 min-h-0 rounded-xl border border-border bg-surface shadow-e1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-center">
              <div>
                <div className="text-[10.5px] font-bold uppercase text-text-secondary">Total</div>
                <div className="mt-0.5 text-[15px] font-black text-text-primary">
                  ₹{selectedBill.totalAmount.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase text-text-secondary">Paid</div>
                <div className="mt-0.5 text-[15px] font-bold text-text-secondary">
                  ₹{selectedBill.paidAmount.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase text-primary">Due</div>
                <div className="mt-0.5 text-[16px] font-black text-primary">
                  ₹{selectedBill.dueAmount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {selectedBill.itemsSummary ? (
              <div className="rounded-xl border border-border px-3 py-2.5">
                <p className="text-[10.5px] font-bold uppercase text-text-secondary mb-1">Items</p>
                <p className="text-[12.5px] font-semibold text-text-primary leading-relaxed">
                  {selectedBill.itemsSummary}
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-text-primary">
                Amount ({settlementMode})
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="number"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[16px] font-bold text-text-primary focus:border-primary focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => setSettlementAmount(selectedBill.dueAmount.toString())}
                className="text-[11.5px] font-bold text-primary hover:underline cursor-pointer"
              >
                Use full due ₹{selectedBill.dueAmount.toLocaleString("en-IN")}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={settleMutation.isPending || !amt || amt <= 0}
                className="inline-flex h-10 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-[13px] font-bold text-white hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </button>
              <button
                type="button"
                onClick={handleCloseSettle}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-[13px] font-bold text-text-primary hover:bg-surface-2 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-text-secondary">
              Full payment removes this bill from Pending Payments and saves it in Order History.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-teal-50 border border-teal-300 text-teal-700">
            <CreditCard className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Pending Payments</h1>
            <p className="text-[11px] text-slate-500">
              Settle open bills · paid orders move to Order History
            </p>
          </div>
        </div>

        <ExportToExcelButton onClick={handleExportExcel} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Open dues</span>
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold leading-none text-white">
                {dueBills.length}
              </span>
            </div>
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          </div>
          <div className="mt-0.5 text-[17px] font-black leading-tight text-slate-900">
            ₹ {totalOpenDues.toLocaleString("en-IN")}.00
          </div>
        </div>
        <div className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 text-slate-500">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">After payment</span>
            <Receipt className="h-3.5 w-3.5 shrink-0" />
          </div>
          <div className="mt-0.5 text-[13px] font-bold leading-tight text-teal-800">
            Moves to Order History
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bill #, Customer, Phone, or Table/Room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>
          <ChooseColumnsMenu
            columns={chooseColumnDefs}
            visibleColumns={columnVisibility}
            onVisibleColumnsChange={handleColumnVisibilityChange}
            className="h-8.5 whitespace-nowrap shrink-0"
          />
        </div>
      </div>

      <PosDataGrid
        data={filteredRecords}
        columns={dueColumns}
        storageKey="pos-due-settlement"
        itemName="bills"
        themeVariant="primary"
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
    </div>
  );
}

export default PosDueSettlementManager;
