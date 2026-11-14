import { useState, useMemo } from "react";
import { Plus, Search, Database, Layers, Tag, Scale } from "lucide-react";
import { toast } from "sonner";
import { useInventoryVendors, useStockItems } from "@/hooks/queries/usePosInventory";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";

export function InventoryMastersView() {
  const [activeTab, setActiveTab] = useState<"raw_materials" | "vendors" | "units">(
    "raw_materials",
  );
  const { data: stockItems } = useStockItems();
  const { data: vendors } = useInventoryVendors();

  const rawMaterialColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "rawMaterial",
        label: "Item Name",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
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
        id: "unit",
        label: "Default Unit",
        sortable: true,
        defaultWidth: 130,
        getValue: (r) => r.unit,
      },
      {
        id: "threshold",
        label: "Min Threshold",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => `5 ${r.unit}`,
      },
      {
        id: "rate",
        label: "Closing Stock Rate",
        sortable: true,
        align: "right",
        defaultWidth: 160,
        getValue: (r) => `₹ ${Math.round(r.closingStock * 45 + 100)}`,
      },
    ],
    [],
  );

  const vendorColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Vendor / Company",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
        getValue: (r) => r.name,
      },
      {
        id: "category",
        label: "Supply Category",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.category,
      },
      {
        id: "phone",
        label: "Phone",
        sortable: true,
        defaultWidth: 150,
        getValue: (r) => r.phone,
      },
      {
        id: "id",
        label: "Vendor ID",
        sortable: true,
        defaultWidth: 130,
        getValue: (r) => r.id,
      },
      {
        id: "terms",
        label: "Payment Terms",
        sortable: true,
        defaultWidth: 140,
        getValue: () => "Net 15 Days",
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Stock Setup</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Configure raw ingredients, suppliers, units of measurement, and recipe linkages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success(`Opening Add New ${activeTab.replace("_", " ")} modal...`)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Master Record
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("raw_materials")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "raw_materials"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Raw Materials ({stockItems?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vendors")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "vendors"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Vendors / Suppliers ({vendors?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("units")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "units"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Units of Measure (UOM)
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {activeTab === "raw_materials" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <DataTableHeader
                columns={rawMaterialColumns}
                data={stockItems ?? []}
                themeVariant="primary"
              />
              <tbody className="divide-y divide-slate-100">
                {(!stockItems || stockItems.length === 0) ? (
                  <tr>
                    <td colSpan={rawMaterialColumns.length} className="py-12 text-center text-slate-400">
                      No raw materials found.
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.rawMaterial}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{item.unit}</td>
                      <td className="px-4 py-3 font-mono text-amber-600">5 {item.unit}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        ₹ {Math.round(item.closingStock * 45 + 100)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <DataTableHeader
                columns={vendorColumns}
                data={vendors ?? []}
                themeVariant="primary"
              />
              <tbody className="divide-y divide-slate-100">
                {(!vendors || vendors.length === 0) ? (
                  <tr>
                    <td colSpan={vendorColumns.length} className="py-12 text-center text-slate-400">
                      No vendors/suppliers registered yet.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{v.name}</td>
                      <td className="px-4 py-3 text-slate-700">{v.category}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{v.phone}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[12px]">{v.id}</td>
                      <td className="px-4 py-3 text-slate-600 text-[12px]">Net 15 Days</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "units" && (
          <div className="p-6 text-[13px] text-slate-600 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="font-bold text-slate-900">kg (Kilogram)</div>
                <div className="text-[11px] text-slate-500 mt-1">Base unit: 1000 grams</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="font-bold text-slate-900">L (Liter)</div>
                <div className="text-[11px] text-slate-500 mt-1">Base unit: 1000 ml</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="font-bold text-slate-900">pcs (Pieces)</div>
                <div className="text-[11px] text-slate-500 mt-1">Discrete item count</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div className="font-bold text-slate-900">Portion / Dish</div>
                <div className="text-[11px] text-slate-500 mt-1">Serving recipe unit</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

