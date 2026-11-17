import { useState, useMemo } from "react";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { KpiCard } from "@/components/ui/Primitives";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";

export function AvailableStockView() {
  const { data: stockItems } = useStockItems();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const availableStockColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "rawMaterial",
        label: "Raw Material / Item",
        sortable: true,
        filterable: true,
        defaultWidth: 240,
        getValue: (r) => r.rawMaterial,
      },
      {
        id: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        defaultWidth: 160,
        getValue: (r) => r.category,
      },
      {
        id: "availableStock",
        label: "Available Stock",
        sortable: true,
        align: "right",
        defaultWidth: 150,
        getValue: (r) => String(r.availableStock),
      },
      {
        id: "unit",
        label: "Unit",
        sortable: true,
        defaultWidth: 100,
        getValue: (r) => r.unit,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (r) => (r.availableStock > 0 ? "In Stock" : "Zero Stock"),
      },
    ],
    [],
  );

  const items = stockItems ?? [];
  const inStockCount = items.filter((i) => (i.availableStock || 0) > 0).length;
  const lowStockCount = items.filter(
    (i) => (i.availableStock || 0) <= (i.alertQuantity || 5) && (i.availableStock || 0) > 0,
  ).length;
  const zeroStockCount = items.filter((i) => (i.availableStock || 0) <= 0).length;

  return (
    <div className="space-y-4">
      {/* KPI Cards (PMS Standard) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Tracked Materials"
          value={String(items.length)}
          accent="brand"
          subtitle="Active stock catalog"
        />
        <KpiCard
          label="In Stock"
          value={String(inStockCount)}
          accent="success"
          subtitle="Available for consumption"
        />
        <KpiCard
          label="Low Stock Alert"
          value={String(lowStockCount)}
          accent="warning"
          subtitle="Near reorder par level"
        />
        <KpiCard
          label="Zero Stock"
          value={String(zeroStockCount)}
          accent="error"
          subtitle="Requires purchase order"
        />
      </div>

      {/* Manual Available Stock Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-[14.5px] font-bold text-slate-900">
              Current On-Hand Available Stock
            </h3>
            <span className="text-[12px] text-slate-500">
              {stockItems?.length} raw materials tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <DataTableHeader
                columns={availableStockColumns}
                data={stockItems ?? []}
                themeVariant="primary"
              />
              <tbody className="divide-y divide-slate-100">
                {(!stockItems || stockItems.length === 0) ? (
                  <tr>
                    <td colSpan={availableStockColumns.length} className="py-12 text-center text-slate-400">
                      No available stock items recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.rawMaterial}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {item.availableStock}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.availableStock > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.availableStock > 0 ? "In Stock" : "Zero Stock"}
                        </span>
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
