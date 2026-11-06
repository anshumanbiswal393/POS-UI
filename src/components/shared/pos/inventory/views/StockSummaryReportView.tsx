import { useState, useMemo } from "react";
import { Clock, BarChart3, Package } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";

interface StockSummaryRow {
  name: string;
  category: string;
  opening: string;
  purchase: string;
  excess: string;
  total1: string;
  consumed: string;
  wastage: string;
  normalLoss: string;
  transfer: string;
  shortage: string;
  production: string;
  total2: string;
  closingStock: string;
  closingSummary: string;
  difference: string;
}

const SUMMARY_COLUMNS: DataGridColumn<StockSummaryRow>[] = [
  {
    id: "name",
    header: "Raw Material",
    sortable: true,
    filterable: true,
    pinned: "left",
    width: 240,
    render: (val: any) => <span className="font-semibold text-foreground">{val}</span>,
  },
  {
    id: "category",
    header: "Category",
    sortable: true,
    filterable: true,
    width: 160,
    render: (val: any) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-surface-2 text-foreground">
        {val || "General"}
      </span>
    ),
  },
  {
    id: "opening",
    header: "Opening (A)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "purchase",
    header: "Purchase (B)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "excess",
    header: "Excess (C)",
    sortable: true,
    align: "center",
    width: 110,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "total1",
    header: "Total (A+B+C)",
    sortable: true,
    align: "center",
    width: 130,
    render: (val: any) => (
      <span className="font-mono font-bold text-foreground bg-primary/5 px-2 py-0.5 rounded">
        {val}
      </span>
    ),
  },
  {
    id: "consumed",
    header: "Consumed (D)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "wastage",
    header: "Wastage (E)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "normalLoss",
    header: "Normal Loss (F)",
    sortable: true,
    align: "center",
    width: 130,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "transfer",
    header: "Transfer (G)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "shortage",
    header: "Shortage (H)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "production",
    header: "Production (I)",
    sortable: true,
    align: "center",
    width: 120,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "total2",
    header: "Total Out (D..I)",
    sortable: true,
    align: "center",
    width: 140,
    render: (val: any) => (
      <span className="font-mono font-bold text-foreground bg-primary/5 px-2 py-0.5 rounded">
        {val}
      </span>
    ),
  },
  {
    id: "closingStock",
    header: "Closing Stock",
    sortable: true,
    align: "center",
    width: 130,
    render: (val: any) => <span className="font-mono text-foreground font-semibold">{val}</span>,
  },
  {
    id: "closingSummary",
    header: "Closing Summary",
    sortable: true,
    align: "center",
    width: 140,
    render: (val: any) => <span className="font-mono text-muted-foreground">{val}</span>,
  },
  {
    id: "difference",
    header: "Variance",
    sortable: true,
    align: "right",
    pinned: "right",
    width: 120,
    render: (val: any) => <span className="font-mono font-bold text-foreground">{val}</span>,
  },
];

const CURRENT_BALANCES_COLUMNS: DataGridColumn<any>[] = [
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
        {val || "General"}
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

export function StockSummaryReportView() {
  const [activeTab, setActiveTab] = useState<"summary" | "current">("summary");
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const { data: stockItems = [], isLoading } = useStockItems();

  const rows: StockSummaryRow[] = useMemo(() => {
    return stockItems.map((item) => {
      const opening = Number(item.openingBalance ?? item.availableStock ?? 0);
      const purchase = Number(item.purchaseQty ?? 0);
      const totalIn = opening + purchase;
      const consumed = Number(item.consumedQty ?? 0);
      const wastage = Number(item.wastageQty ?? 0);
      const totalOut = consumed + wastage;
      const closing = Number(item.availableStock ?? 0);
      const variance = Number(item.variance ?? 0);

      return {
        name: `${item.rawMaterial || item.name} [${item.unit || "unit"}]`,
        category: item.category || "General",
        opening: opening.toFixed(3),
        purchase: purchase.toFixed(3),
        excess: "0.000",
        total1: totalIn.toFixed(3),
        consumed: consumed.toFixed(3),
        wastage: wastage.toFixed(3),
        normalLoss: "0.000",
        transfer: "0.000",
        shortage: "0.000",
        production: "0.000",
        total2: totalOut.toFixed(3),
        closingStock: closing.toFixed(3),
        closingSummary: closing.toFixed(3),
        difference: variance.toFixed(3),
      };
    });
  }, [stockItems]);

  return (
    <div className="space-y-4">
      {/* 1. Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground tracking-tight">
            Stock Summary
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time balances, ingredient categories, and full reconciliation of opening stock, purchases, consumption, and closing variance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Switcher */}
          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "summary"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Summary Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "current"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Current Balances</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => toast.info("Automated daily report scheduling opened")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/15 transition cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Schedule Daily Report</span>
          </button>
        </div>
      </div>

      {activeTab === "summary" ? (
        <>
          {/* 2. Date Filter Bar for Ledger */}
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-muted-foreground mb-1">
                  Stock Period
                </label>
                <PosDateRangePicker
                  from={fromDate}
                  to={toDate}
                  onSelect={({ from, to }) => {
                    setFromDate(from);
                    setToDate(to);
                  }}
                  size="sm"
                />
              </div>

              <button
                type="button"
                onClick={() => toast.info("Filters applied")}
                className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2 transition cursor-pointer"
              >
                Apply Period
              </button>
            </div>
          </div>

          {/* 3. Interactive Data Grid */}
          <PosDataGrid
            data={rows}
            columns={SUMMARY_COLUMNS}
            keyField="name"
            title="Stock Summary Ledger"
            subtitle={isLoading ? "Loading live ledger records..." : "Multi-column ledger balance and reconciliation report"}
            showToolbar
            selectable
            storageKey="pos-stock-summary-report"
            themeVariant="primary"
            pageSize={10}
          />
        </>
      ) : (
        /* Current Balances & Status Data Grid */
        <PosDataGrid
          data={stockItems}
          columns={CURRENT_BALANCES_COLUMNS}
          keyField="id"
          title="Current Stock Balances"
          subtitle="Real-time balances, categories, and stock status radar"
          showToolbar
          selectable
          loading={isLoading}
          storageKey="pos-current-stock-balances"
          themeVariant="primary"
          pageSize={10}
        />
      )}
    </div>
  );
}
