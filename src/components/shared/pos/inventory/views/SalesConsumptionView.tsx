import { useMemo, useState } from "react";
import { useConsumptionReport } from "@/hooks/queries/usePosInventory";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { Search } from "lucide-react";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";

const DEMO_CONSUMPTION: Array<{
  id: string;
  item: string;
  category: string;
  quantity: string;
  salesVolume: string;
  cost: string;
  wastage: string;
}> = [];

export function SalesConsumptionView() {
  const { activeOutlet } = useOutletContext();
  const isLive = isBackendOutletId(activeOutlet.id);
  const { data: apiRows = [] } = useConsumptionReport();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const consumptionRecords = isLive
    ? (apiRows as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.code || row.stockItemId || row.id || ""),
        item: String(row.item || row.name || ""),
        category: String(row.category || ""),
        quantity: `${row.consumedQty ?? row.qtyUsed ?? 0} ${row.unit || ""}`.trim(),
        salesVolume: "Movements",
        cost: "—",
        wastage: "—",
      }))
    : DEMO_CONSUMPTION;

  const consumptionColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Code",
        sortable: true,
        filterable: true,
        defaultWidth: 110,
        getValue: (r) => r.id,
      },
      {
        id: "item",
        label: "Raw Material",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
        getValue: (r) => r.item,
      },
      {
        id: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        defaultWidth: 150,
        getValue: (r) => r.category,
      },
      {
        id: "quantity",
        label: "Quantity Consumed",
        sortable: true,
        align: "right",
        defaultWidth: 160,
        getValue: (r) => r.quantity,
      },
      {
        id: "salesVolume",
        label: "Billed In",
        sortable: true,
        defaultWidth: 140,
        getValue: (r) => r.salesVolume,
      },
      {
        id: "cost",
        label: "Cost Value",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => r.cost,
      },
      {
        id: "wastage",
        label: "Prep Variance",
        sortable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (r) => r.wastage,
      },
    ],
    [],
  );

  const filtered = consumptionRecords.filter(
    (r) =>
      r.item.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Sales Consumption</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Automatic consumption calculated from billed recipes, item sales, and add-ons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
          />

          <ExportToExcelButton
            onClick={() => toast.success("Exporting consumption summary to Excel...")}
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500">Total Ingredients Consumed</div>
          <div className="text-[22px] font-extrabold text-slate-900 mt-1">94.7 kg / L</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Across 277 customer orders
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500">Total Consumption Value</div>
          <div className="text-[22px] font-extrabold text-teal-600 mt-1">₹ 11,900</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Calculated at purchase rate</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500">Recorded Prep Wastage</div>
          <div className="text-[22px] font-extrabold text-amber-600 mt-1">1.6 kg</div>
          <div className="text-[11px] text-slate-500 mt-0.5">1.3% of total consumption</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search raw material or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <span className="text-[12px] text-slate-500">{filtered.length} items consumed today</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={consumptionColumns}
              data={filtered}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={consumptionColumns.length} className="py-12 text-center text-slate-400">
                    No ingredient consumption logs found for this date.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{r.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{r.item}</td>
                    <td className="px-4 py-3 text-slate-600">{r.category}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{r.salesVolume}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.cost}</td>
                    <td className="px-4 py-3 font-mono text-amber-600 text-[12px]">{r.wastage}</td>
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

