import { useState, useMemo } from "react";
import { Plus, Search, Trash2, AlertTriangle, Calendar } from "lucide-react";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";

export function StockWastageView() {
  const [search, setSearch] = useState("");

  const wastageEntries = [
    {
      id: "WST-044",
      date: "02 Sep 2026",
      item: "Tomatoes (Local)",
      category: "Vegetables",
      quantity: "4.2 kg",
      cost: "₹ 168",
      reason: "Spoiled / Overripe",
      approvedBy: "Chef Vikram",
    },
    {
      id: "WST-043",
      date: "01 Sep 2026",
      item: "Milk (Full Cream)",
      category: "Dairy",
      quantity: "3.0 L",
      cost: "₹ 195",
      reason: "Curdled during power outage",
      approvedBy: "Store Mgr",
    },
    {
      id: "WST-042",
      date: "01 Sep 2026",
      item: "Chicken Curry (Prepared)",
      category: "Prepared Food",
      quantity: "2 portions",
      cost: "₹ 340",
      reason: "Customer order cancellation",
      approvedBy: "Supervisor Rohit",
    },
    {
      id: "WST-041",
      date: "31 Aug 2026",
      item: "Burger Buns",
      category: "Bakery",
      quantity: "8 pcs",
      cost: "₹ 96",
      reason: "Expired shelf life",
      approvedBy: "Chef Vikram",
    },
  ];

  const wastageColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Wastage ID",
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
        id: "item",
        label: "Raw Material / Item",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.item,
      },
      {
        id: "quantity",
        label: "Quantity Wasted",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => r.quantity,
      },
      {
        id: "cost",
        label: "Cost Loss",
        sortable: true,
        align: "right",
        defaultWidth: 120,
        getValue: (r) => r.cost,
      },
      {
        id: "reason",
        label: "Reason / Cause",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
        getValue: (r) => r.reason,
      },
      {
        id: "approvedBy",
        label: "Approved By",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.approvedBy,
      },
    ],
    [],
  );

  const filtered = wastageEntries.filter(
    (w) =>
      w.item.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase()) ||
      w.reason.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Stock Wastage & Leakage
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Record, monitor, and investigate damaged goods, kitchen prep shrinkage, and expired
            items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success("Exporting wastage report to Excel...")}
          />

          <button
            type="button"
            onClick={() => toast.success("Opening Record Wastage dialog...")}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-red-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Wastage
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-2xs">
          <div className="text-[12px] font-semibold text-red-700">Month-To-Date Wastage Cost</div>
          <div className="text-[22px] font-extrabold text-red-600 mt-1">₹ 2,840</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            1.8% of gross ingredient purchases
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500">Highest Wastage Category</div>
          <div className="text-[22px] font-extrabold text-slate-900 mt-1">Dairy & Vegetables</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Perishable short shelf life</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500">Incidents Logged</div>
          <div className="text-[22px] font-extrabold text-slate-800 mt-1">12 recorded</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            All 12 authorized by Head Chef
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search item, reason, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <span className="text-[12px] text-slate-500">{filtered.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={wastageColumns}
              data={filtered}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={wastageColumns.length} className="py-12 text-center text-slate-400">
                    No stock wastage incidents recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-red-600 text-[12px]">{w.id}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{w.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{w.item}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{w.quantity}</td>
                    <td className="px-4 py-3 font-mono font-bold text-red-600">{w.cost}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{w.reason}</td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">{w.approvedBy}</td>
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

