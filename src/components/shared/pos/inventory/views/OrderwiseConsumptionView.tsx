import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";
import { useStockMovements } from "@/hooks/queries/usePosInventory";

interface OrderConsumptionRow {
  id: string;
  orderNumber: string;
  time: string;
  table: string;
  item: string;
  recipeItems: string;
  balanceAfter: string;
  status: string;
}

export function OrderwiseConsumptionView() {
  const [search, setSearch] = useState("");
  const { data: movements = [], isLoading } = useStockMovements({ type: "SETTLE_DEDUCT" });

  const orders: OrderConsumptionRow[] = useMemo(() => {
    return (movements as Array<Record<string, any>>).map((mov, idx) => {
      const orderRef = mov.referenceId ? String(mov.referenceId).slice(0, 8).toUpperCase() : `ORD-${idx + 1}`;
      const notes = mov.notes || "";
      // Notes typically formatted as: "Settle ORD-XXX – Item Name"
      const itemMatch = notes.includes("–") ? notes.split("–")[1]?.trim() : (notes || mov.name);
      const timeStr = mov.createdAt
        ? new Date(mov.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      return {
        id: orderRef,
        orderNumber: orderRef,
        time: timeStr,
        table: mov.tableName || "Counter / Table",
        item: itemMatch || mov.name || "Menu Dish",
        recipeItems: `${mov.name} (${mov.quantity} ${mov.unit || ""})`,
        balanceAfter: `${mov.balanceAfter ?? "0"} ${mov.unit || ""}`,
        status: "Billed",
      };
    });
  }, [movements]);

  const orderColumns: DataTableColumn<OrderConsumptionRow>[] = useMemo(
    () => [
      {
        id: "id",
        label: "Order Ref",
        sortable: true,
        filterable: true,
        defaultWidth: 120,
        getValue: (r) => r.id,
      },
      {
        id: "time",
        label: "Time",
        sortable: true,
        defaultWidth: 110,
        getValue: (r) => r.time,
      },
      {
        id: "table",
        label: "Source / Table",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.table,
      },
      {
        id: "item",
        label: "Ordered Item",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.item,
      },
      {
        id: "recipeItems",
        label: "Ingredients Deducted",
        sortable: false,
        defaultWidth: 260,
        getValue: (r) => r.recipeItems,
      },
      {
        id: "balanceAfter",
        label: "Stock After Deduct",
        sortable: true,
        align: "right",
        defaultWidth: 150,
        getValue: (r) => r.balanceAfter,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 110,
        getValue: (r) => r.status,
      },
    ],
    [],
  );

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.item.toLowerCase().includes(search.toLowerCase()) ||
      o.table.toLowerCase().includes(search.toLowerCase()) ||
      o.recipeItems.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Usage by Order</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Billed bill-of-materials and recipe ingredient deduction broken down by individual settled orders.
          </p>
        </div>

        <ExportToExcelButton
          onClick={() => toast.success("Exporting Orderwise Consumption to Excel...")}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order ref, table, dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <span className="text-[12px] text-slate-500">
            {isLoading ? "Loading live movements..." : `${filtered.length} orders logged`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={orderColumns}
              data={filtered}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={orderColumns.length} className="py-12 text-center text-slate-400">
                    {isLoading
                      ? "Loading live consumption records..."
                      : "No order consumption records found for this outlet."}
                  </td>
                </tr>
              ) : (
                filtered.map((o, idx) => (
                  <tr key={`${o.id}-${idx}`} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-600">{o.id}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12px]">
                      <div className="font-semibold text-slate-800">{o.time}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{o.table}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{o.item}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12px] max-w-sm truncate">
                      {o.recipeItems}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{o.balanceAfter}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {o.status}
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
