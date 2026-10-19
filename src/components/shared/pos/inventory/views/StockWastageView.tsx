import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
  Layers,
} from "lucide-react";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";
import {
  RecordWastageModal,
  type WastageFormValues,
} from "@/components/shared/pos/inventory/modals/RecordWastageModal";

type WastageEntry = {
  id: string;
  date: string;
  dateKey: string;
  item: string;
  category: string;
  quantity: string;
  costValue: number;
  cost: string;
  reason: string;
  approvedBy: string;
  notes?: string;
};

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatINR(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const INITIAL: WastageEntry[] = [
  {
    id: "WST-044",
    date: "02 Sep 2026",
    dateKey: "2026-09-02",
    item: "Tomatoes (Local)",
    category: "Vegetables",
    quantity: "4.2 kg",
    costValue: 168,
    cost: "₹ 168",
    reason: "Spoiled / Overripe",
    approvedBy: "Chef Vikram",
  },
  {
    id: "WST-043",
    date: "01 Sep 2026",
    dateKey: "2026-09-01",
    item: "Milk (Full Cream)",
    category: "Dairy",
    quantity: "3.0 L",
    costValue: 195,
    cost: "₹ 195",
    reason: "Curdled during power outage",
    approvedBy: "Store Mgr",
  },
  {
    id: "WST-042",
    date: "01 Sep 2026",
    dateKey: "2026-09-01",
    item: "Chicken Curry (Prepared)",
    category: "Prepared Food",
    quantity: "2 portions",
    costValue: 340,
    cost: "₹ 340",
    reason: "Customer order cancellation",
    approvedBy: "Supervisor Rohit",
  },
  {
    id: "WST-041",
    date: "31 Aug 2026",
    dateKey: "2026-08-31",
    item: "Burger Buns",
    category: "Bakery",
    quantity: "8 pcs",
    costValue: 96,
    cost: "₹ 96",
    reason: "Expired shelf life",
    approvedBy: "Chef Vikram",
  },
];

export function StockWastageView() {
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [entries, setEntries] = useState<WastageEntry[]>(INITIAL);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const wastageColumns: DataTableColumn<WastageEntry>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Wastage ID",
        sortable: true,
        filterable: true,
        defaultWidth: 120,
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
        defaultWidth: 200,
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
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 80,
      },
    ],
    [],
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.category))).sort()],
    [entries],
  );

  const reasons = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.reason))).sort()],
    [entries],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((w) => {
      if (categoryFilter !== "All" && w.category !== categoryFilter) return false;
      if (reasonFilter !== "All" && w.reason !== reasonFilter) return false;
      if (!q) return true;
      return (
        w.item.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.reason.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.approvedBy.toLowerCase().includes(q)
      );
    });
  }, [entries, search, categoryFilter, reasonFilter]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const kpis = useMemo(() => {
    const totalCost = entries.reduce((sum, e) => sum + e.costValue, 0);
    const byCategory = new Map<string, number>();
    for (const e of entries) {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.costValue);
    }
    let topCategory = "—";
    let topCost = 0;
    for (const [cat, cost] of byCategory) {
      if (cost > topCost) {
        topCost = cost;
        topCategory = cat;
      }
    }
    const purchaseBase = 158000;
    const pct = purchaseBase > 0 ? ((totalCost / purchaseBase) * 100).toFixed(1) : "0.0";
    return {
      totalCost,
      pct,
      topCategory,
      topCost,
      count: entries.length,
    };
  }, [entries]);

  const handleRecord = (values: WastageFormValues & { costLoss: number }) => {
    const nextNum =
      entries.reduce((max, e) => {
        const n = parseInt(e.id.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 40) + 1;

    const entry: WastageEntry = {
      id: `WST-${String(nextNum).padStart(3, "0")}`,
      date: formatDisplayDate(values.date),
      dateKey: values.date,
      item: values.item,
      category: values.category,
      quantity: `${values.quantity} ${values.unit}`,
      costValue: values.costLoss,
      cost: formatINR(values.costLoss),
      reason: values.reason,
      approvedBy: values.approvedBy,
      notes: values.notes,
    };

    setEntries((prev) => [entry, ...prev]);
    setCurrentPage(1);
    setIsRecordOpen(false);
    toast.success(`Wastage ${entry.id} recorded`, {
      description: `${entry.item} · ${entry.quantity} · ${entry.cost}`,
    });
  };

  const handleDelete = (entry: WastageEntry) => {
    if (!confirm(`Remove wastage entry ${entry.id} (${entry.item})?`)) return;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    toast.success(`${entry.id} removed`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
              Stock Wastage & Leakage
            </h2>
            <p className="text-[12.5px] text-slate-500 mt-0.5 max-w-xl">
              Record, monitor, and investigate damaged goods, kitchen prep shrinkage, and expired
              items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success(`Exporting ${filtered.length} wastage rows to Excel...`)}
          />
          <button
            type="button"
            onClick={() => setIsRecordOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-rose-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Wastage
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-linear-to-br from-rose-50 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700">
              Month-To-Date Wastage Cost
            </span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-[26px] font-extrabold text-rose-600 mt-1 tracking-tight">
            {formatINR(kpis.totalCost)}
          </div>
          <div className="text-[11.5px] text-slate-600 mt-0.5">
            {kpis.pct}% of gross ingredient purchases
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
              Highest Wastage Category
            </span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-[22px] font-extrabold text-slate-900 mt-1 tracking-tight truncate">
            {kpis.topCategory}
          </div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">
            {kpis.topCost > 0 ? `${formatINR(kpis.topCost)} lost in this category` : "No data yet"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
              Incidents Logged
            </span>
            <ClipboardList className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-[26px] font-extrabold text-slate-900 mt-1 tracking-tight">
            {kpis.count} recorded
          </div>
          <div className="text-[11.5px] text-teal-700 font-semibold mt-0.5">
            All entries require approver sign-off
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search item, reason, ID, or approver..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer max-w-[220px]"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r === "All" ? "All Reasons" : r}
              </option>
            ))}
          </select>

          <span className="ml-auto text-[12px] font-medium text-slate-500">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader columns={wastageColumns} data={filtered} themeVariant="primary" />
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={wastageColumns.length}
                    className="py-14 text-center text-slate-400"
                  >
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <div className="text-[13px] font-semibold text-slate-600">
                      No wastage incidents found
                    </div>
                    <p className="mt-1 text-[12px] text-slate-400">
                      Adjust filters or record a new wastage entry.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsRecordOpen(true)}
                      className="mt-3 rounded-lg bg-rose-600 px-3.5 py-1.5 text-[12px] font-bold text-white cursor-pointer"
                    >
                      + Record Wastage
                    </button>
                  </td>
                </tr>
              ) : (
                pageRows.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 text-[12px]">
                      {w.id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{w.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{w.item}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{w.category}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      {w.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      {w.cost}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-700">
                        {w.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">{w.approvedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(w)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Remove entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTableFooter
          currentPage={currentPage}
          totalCount={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
          itemName="entries"
        />
      </div>

      <RecordWastageModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onSave={handleRecord}
      />
    </div>
  );
}
