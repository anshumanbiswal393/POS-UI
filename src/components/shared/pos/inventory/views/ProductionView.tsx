import { useState, useMemo } from "react";
import { Plus, Search, Factory, CheckCircle2, Clock } from "lucide-react";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { toast } from "sonner";

export function ProductionView() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const batches = [
    {
      id: "PRD-501",
      date: "02 Sep 2026",
      product: "Makhani Gravy Base",
      yieldQty: "25.0 L",
      status: "Ready",
      ingredients: "Butter, Cream, Tomatoes, Spices",
      chef: "Chef Vikram",
    },
    {
      id: "PRD-502",
      date: "02 Sep 2026",
      product: "Pizza Dough Balls (250g)",
      yieldQty: "40 pcs",
      status: "Fermenting",
      ingredients: "Flour, Yeast, Olive Oil",
      chef: "Sunita M.",
    },
    {
      id: "PRD-503",
      date: "01 Sep 2026",
      product: "Tandoori Chicken Marination",
      yieldQty: "15.0 kg",
      status: "Ready",
      ingredients: "Chicken Breast, Yogurt, Mustard Oil",
      chef: "Chef Vikram",
    },
    {
      id: "PRD-504",
      date: "01 Sep 2026",
      product: "Brown Onion Gravy Base",
      yieldQty: "20.0 L",
      status: "Ready",
      ingredients: "Onions, Cashew, Garam Masala",
      chef: "Karan D.",
    },
  ];

  const batchColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Batch ID",
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
        id: "product",
        label: "Prepared Item",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.product,
      },
      {
        id: "yieldQty",
        label: "Batch Yield",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => r.yieldQty,
      },
      {
        id: "ingredients",
        label: "Key Ingredients Consumed",
        sortable: false,
        defaultWidth: 240,
        getValue: (r) => r.ingredients,
      },
      {
        id: "chef",
        label: "In-Charge",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.chef,
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
    ],
    [],
  );

  const filtered = batches.filter(
    (b) =>
      b.product.toLowerCase().includes(search.toLowerCase()) ||
      b.ingredients.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[18px] font-bold text-slate-900 tracking-tight">Food Preparation</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Convert bulk raw ingredients into semi-finished recipes, gravies, and base preparations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Opening New Production Batch modal...")}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Production Batch
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product or recipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <span className="text-[12px] text-slate-500">{filtered.length} production batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={batchColumns}
              data={filtered}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={batchColumns.length} className="py-12 text-center text-slate-400">
                    No production batches found for this period.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-600 text-[12px]">
                      {b.id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{b.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{b.product}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{b.yieldQty}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12px] max-w-xs truncate">
                      {b.ingredients}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">{b.chef}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          b.status === "Ready"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {b.status === "Ready" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Unified DataTableFooter */}
        <DataTableFooter
          currentPage={currentPage}
          totalCount={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          itemName="batches"
        />
      </div>
    </div>
  );
}

