import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  Calendar,
  ChevronDown,
  FileText,
  Filter,
  CheckCircle2,
  X,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";

interface SalesReturnRecord {
  id: string;
  date: string;
  invoiceNo: string;
  orderType: string;
  items: string;
  amount: number;
  restockAction: "Restocked to Inventory" | "Discarded as Wastage";
  reason: string;
  processedBy: string;
}

export function SalesReturnListView() {
  const [startDate, setStartDate] = useState("2026-08-26");
  const [endDate, setEndDate] = useState("2026-09-02");
  const [orderSource, setOrderSource] = useState("All");
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const salesReturnColumns: DataTableColumn<SalesReturnRecord>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Return ID",
        sortable: true,
        filterable: true,
        defaultWidth: 130,
        getValue: (r) => r.id,
      },
      {
        id: "date",
        label: "Date",
        sortable: true,
        defaultWidth: 120,
        getValue: (r) => r.date,
      },
      {
        id: "invoiceNo",
        label: "Invoice No.",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.invoiceNo,
      },
      {
        id: "orderType",
        label: "Channel / Source",
        sortable: true,
        filterable: true,
        defaultWidth: 150,
        getValue: (r) => r.orderType,
      },
      {
        id: "items",
        label: "Returned Items",
        sortable: false,
        defaultWidth: 200,
        getValue: (r) => r.items,
      },
      {
        id: "amount",
        label: "Refund Amount",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => `₹ ${r.amount}`,
      },
      {
        id: "restockAction",
        label: "Inventory Action",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 180,
        getValue: (r) => r.restockAction,
      },
      {
        id: "reason",
        label: "Reason",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.reason,
      },
      {
        id: "processedBy",
        label: "Processed By",
        sortable: true,
        filterable: true,
        defaultWidth: 130,
        getValue: (r) => r.processedBy,
      },
    ],
    [],
  );

  // Initial demo records
  const [returns, setReturns] = useState<SalesReturnRecord[]>([
    {
      id: "SR-2026-004",
      date: "02 Sep 2026",
      invoiceNo: "INV-88912",
      orderType: "Dine-In",
      items: "Sprite Can (330ml) x 2, French Fries x 1",
      amount: 320,
      restockAction: "Restocked to Inventory",
      reason: "Customer changed order before consumption",
      processedBy: "Cashier Amit",
    },
    {
      id: "SR-2026-003",
      date: "01 Sep 2026",
      invoiceNo: "INV-88845",
      orderType: "Delivery",
      items: "Paneer Butter Masala x 1",
      amount: 380,
      restockAction: "Discarded as Wastage",
      reason: "Food returned cold by delivery partner",
      processedBy: "Supervisor Rohit",
    },
  ]);

  // Form state for Create Return Modal
  const [newReturn, setNewReturn] = useState({
    invoiceNo: "",
    orderType: "Dine-In",
    items: "",
    amount: "",
    restockAction: "Restocked to Inventory" as "Restocked to Inventory" | "Discarded as Wastage",
    reason: "",
  });

  const filteredReturns = returns.filter((r) => {
    if (orderSource !== "All" && r.orderType !== orderSource) return false;
    if (invoiceQuery && !r.invoiceNo.toLowerCase().includes(invoiceQuery.toLowerCase()))
      return false;
    return true;
  });

  const handleClearFilters = () => {
    setStartDate("2026-08-26");
    setEndDate("2026-09-02");
    setOrderSource("All");
    setInvoiceQuery("");
    toast.info("Filters cleared");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturn.invoiceNo || !newReturn.items || !newReturn.amount) {
      toast.error("Please fill in invoice number, items, and return amount.");
      return;
    }

    const created: SalesReturnRecord = {
      id: `SR-2026-00${returns.length + 5}`,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      invoiceNo: newReturn.invoiceNo,
      orderType: newReturn.orderType,
      items: newReturn.items,
      amount: parseFloat(newReturn.amount) || 0,
      restockAction: newReturn.restockAction,
      reason: newReturn.reason || "Customer Return",
      processedBy: "Active Cashier",
    };

    setReturns([created, ...returns]);
    setIsCreateModalOpen(false);
    setNewReturn({
      invoiceNo: "",
      orderType: "Dine-In",
      items: "",
      amount: "",
      restockAction: "Restocked to Inventory",
      reason: "",
    });
    toast.success(`Sales Return ${created.id} created successfully.`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar matching Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Sales Return List</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>

          <ExportToExcelButton
            onClick={() => toast.success("Exporting sales returns to Excel...")}
          />
        </div>
      </div>

      {/* 2. Filter Bar matching Screenshot */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* From Dropdown */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">From</label>
            <div className="relative min-w-[120px]">
              <select
                value={orderSource}
                onChange={(e) => setOrderSource(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All</option>
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
                <option value="Delivery">Delivery</option>
                <option value="Room Service">Room Service</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Invoice No */}
          <div className="space-y-1 flex-1 min-w-[140px] max-w-xs">
            <label className="text-[11.5px] font-semibold text-slate-600">Invoice No.</label>
            <input
              type="text"
              placeholder="Enter invoice no."
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Additional date and customer filters available")}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              More Filters
            </button>

            <button
              type="button"
              onClick={() =>
                toast.info(`Found ${filteredReturns.length} matching sales return records`)
              }
              className="rounded-lg border border-teal-500 bg-white px-4 py-1.5 text-[12.5px] font-semibold text-teal-600 shadow-2xs hover:bg-teal-50 transition cursor-pointer"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table / Records with Always-Present Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-slate-800">Return Vouchers</h3>
          <span className="text-[12px] text-slate-500">{filteredReturns.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={salesReturnColumns}
              data={filteredReturns}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={salesReturnColumns.length} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="text-[14.5px] font-bold text-slate-700">
                        Purchases Return Record Not Found
                      </div>
                      <p className="text-[12px] text-slate-400 max-w-sm mx-auto">
                        No sales return records found for the selected invoice and date range.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 shadow-2xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Create Sales Return
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-600">{r.id}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{r.date}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {r.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.orderType}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium max-w-xs">{r.items}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">₹ {r.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          r.restockAction === "Restocked to Inventory"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {r.restockAction === "Restocked to Inventory" ? (
                          <PackageCheck className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {r.restockAction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">{r.reason}</td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">{r.processedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create Sales Return Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[16px] font-bold text-slate-900">Create Sales Return Voucher</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Invoice No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-88920"
                    value={newReturn.invoiceNo}
                    onChange={(e) => setNewReturn({ ...newReturn, invoiceNo: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Order Channel</label>
                  <select
                    value={newReturn.orderType}
                    onChange={(e) => setNewReturn({ ...newReturn, orderType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] focus:outline-none focus:border-teal-500"
                  >
                    <option value="Dine-In">Dine-In</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Room Service">Room Service</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">
                  Returned Items & Qty *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprite Can (330ml) x 2"
                  value={newReturn.items}
                  onChange={(e) => setNewReturn({ ...newReturn, items: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Refund Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="0"
                    value={newReturn.amount}
                    onChange={(e) => setNewReturn({ ...newReturn, amount: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Inventory Action
                  </label>
                  <select
                    value={newReturn.restockAction}
                    onChange={(e) =>
                      setNewReturn({
                        ...newReturn,
                        restockAction: e.target.value as
                          | "Restocked to Inventory"
                          | "Discarded as Wastage",
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] focus:outline-none focus:border-teal-500"
                  >
                    <option value="Restocked to Inventory">Restock to Available Stock</option>
                    <option value="Discarded as Wastage">Discard as Wastage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">
                  Reason for Return
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer changed mind / wrong order"
                  value={newReturn.reason}
                  onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
