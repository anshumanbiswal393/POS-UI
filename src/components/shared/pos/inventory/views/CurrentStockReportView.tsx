import { useState } from "react";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";

const STOCK_COLUMNS: DataGridColumn<any>[] = [
  {
    id: "rawMaterial",
    header: "Raw Material",
    sortable: true,
    filterable: true,
    width: 240,
    render: (val: any) => <span className="font-bold text-foreground">{val}</span>,
  },
  {
    id: "category",
    header: "Category",
    sortable: true,
    filterable: true,
    width: 170,
    render: (val: any) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-surface-2 text-foreground">
        {val}
      </span>
    ),
  },
  {
    id: "availableStock",
    header: "Available Stock",
    sortable: true,
    align: "right",
    width: 150,
    render: (val: any) => <span className="font-mono font-bold text-foreground text-sm">{val}</span>,
  },
  {
    id: "closingStock",
    header: "Last Closing Stock",
    sortable: true,
    align: "right",
    width: 150,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "unit",
    header: "Unit",
    sortable: true,
    filterable: true,
    width: 110,
    render: (val: any) => <span className="text-muted-foreground text-xs font-semibold">{val}</span>,
  },
  {
    id: "stockStatus",
    header: "Stock Status",
    sortable: true,
    filterable: true,
    align: "center",
    width: 140,
    getValue: (item: any) => (item.availableStock > 5 ? "Normal" : item.availableStock > 0 ? "Low Stock" : "Zero Stock"),
    render: (_: any, item: any) => {
      const isNormal = item.availableStock > 5;
      const isLow = item.availableStock > 0 && !isNormal;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isNormal
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : isLow
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          }`}
        >
          {isNormal ? "Normal" : isLow ? "Low Stock" : "Zero Stock"}
        </span>
      );
    },
  },
];

export function CurrentStockReportView() {
  const { data: stockItems = [], isLoading } = useStockItems();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Current Stock Report</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time balance of all ingredients, raw materials, and beverage stock on hand.
          </p>
        </div>
      </div>

      {/* Interactive Data Grid */}
      <PosDataGrid
        data={stockItems}
        columns={STOCK_COLUMNS}
        keyField="id"
        title="Stock Balances"
        subtitle="Search raw materials, categories or filter low-stock ingredients"
        showToolbar
        selectable
        loading={isLoading}
        storageKey="pos-current-stock-report"
        themeVariant="primary"
        pageSize={10}
      />
    </div>
  );
}
