import { useState, useMemo } from "react";
import { Search, ChevronDown, FileText, Calendar, CreditCard, CheckCircle2 } from "lucide-react";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { toast } from "sonner";

export function PurchaseBillPaymentsView() {
  const [selectType, setSelectType] = useState("Select type");
  const [startDate, setStartDate] = useState("2026-08-26");
  const [endDate, setEndDate] = useState("2026-09-02");

  const [invoices, setInvoices] = useState([
    {
      id: "INV-PO-901",
      vendor: "Metro Fresh Farm Supplies",
      billDate: "28 Aug 2026",
      dueDate: "05 Sep 2026",
      total: 12400,
      paid: 5000,
      balance: 7400,
      status: "Partially Paid",
    },
    {
      id: "INV-PO-902",
      vendor: "Apex Beverage Distributors",
      billDate: "30 Aug 2026",
      dueDate: "07 Sep 2026",
      total: 5850,
      paid: 0,
      balance: 5850,
      status: "Unpaid",
    },
  ]);

  const billColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Invoice No.",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.id,
      },
      {
        id: "vendor",
        label: "Vendor / Supplier",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.vendor,
      },
      {
        id: "billDate",
        label: "Bill Date",
        sortable: true,
        defaultWidth: 120,
        getValue: (r) => r.billDate,
      },
      {
        id: "dueDate",
        label: "Due Date",
        sortable: true,
        defaultWidth: 120,
        getValue: (r) => r.dueDate,
      },
      {
        id: "total",
        label: "Total (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 120,
        getValue: (r) => `₹ ${r.total}`,
      },
      {
        id: "paid",
        label: "Paid (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 120,
        getValue: (r) => `₹ ${r.paid}`,
      },
      {
        id: "balance",
        label: "Balance Due",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹ ${r.balance}`,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 120,
        getValue: (r) => r.status,
      },
      {
        id: "actions",
        label: "Action",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 110,
      },
    ],
    [],
  );

  const filtered = invoices.filter((inv) => {
    if (selectType !== "Select type" && inv.status !== selectType) return false;
    return true;
  });

  const handlePay = (id: string, amount: number) => {
    toast.success(`Recording payment of ₹ ${amount} for ${id}...`);
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, paid: i.total, balance: 0, status: "Paid" } : i)),
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-[18px] font-bold text-slate-900 tracking-tight">
          Purchase Bill Payments
        </h2>
      </div>

      {/* 2. Filter Bar matching Screenshot 4 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          {/* From Dropdown */}
          <div className="space-y-1 min-w-[150px]">
            <label className="text-[11.5px] font-semibold text-slate-600">From</label>
            <div className="relative">
              <select
                value={selectType}
                onChange={(e) => setSelectType(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="Select type">Select type</option>
                <option value="Unpaid">Unpaid Invoices</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Settled</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

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

          {/* Search Button */}
          <button
            type="button"
            onClick={() => toast.info(`Filtered: ${filtered.length} invoice settlement records`)}
            className="rounded-lg border border-teal-500 bg-white px-5 py-1.5 text-[12.5px] font-semibold text-teal-600 shadow-2xs hover:bg-teal-50 transition cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* 3. Pending Purchase Invoices Table with Always-Present Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-slate-800">Pending Purchase Invoices</h3>
          <span className="text-[12px] text-slate-500">{filtered.length} invoices to settle</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={billColumns}
              data={filtered}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={billColumns.length} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div className="text-[14.5px] font-bold text-slate-700">
                        Purchase Invoice Settlement Record Not Found
                      </div>
                      <p className="text-[12px] text-slate-400 max-w-sm mx-auto">
                        No pending purchase invoices found for settlement in the selected date range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-600">{inv.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{inv.vendor}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{inv.billDate}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{inv.dueDate}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">₹ {inv.total}</td>
                    <td className="px-4 py-3 font-mono text-emerald-600">₹ {inv.paid}</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600">₹ {inv.balance}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : inv.status === "Partially Paid"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.balance > 0 ? (
                        <button
                          type="button"
                          onClick={() => handlePay(inv.id, inv.balance)}
                          className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-[11.5px] font-semibold shadow-2xs transition cursor-pointer"
                        >
                          Settle Bill
                        </button>
                      ) : (
                        <span className="text-[12px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
