import { useState, useMemo } from "react";
import { Clock, BarChart3, Package } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import {
  useStockItems,
  useStockPurchases,
  useWastageEntries,
  useStockMovements,
} from "@/hooks/queries/usePosInventory";
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
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const { data: stockItems = [], isLoading } = useStockItems();
  const { data: purchases = [] } = useStockPurchases();
  const { data: wastageList = [] } = useWastageEntries();
  const { data: movements = [] } = useStockMovements({ from: fromDate, to: toDate });

  const rows: StockSummaryRow[] = useMemo(() => {
    return stockItems.map((item) => {
      // 1. Calculate purchase quantity for this item
      const itemPurchases = purchases.reduce((acc: number, p: any) => {
        const matchingLines = (p.items || []).filter(
          (line: any) =>
            line.stockItemId === item.id ||
            line.name === item.rawMaterial ||
            line.name === item.name,
        );
        return (
          acc +
          matchingLines.reduce(
            (sum: number, l: any) => sum + Number(l.quantity || 0),
            0,
          )
        );
      }, 0);

      // 2. Calculate wastage quantity for this item
      const itemWastage = wastageList.reduce((acc: number, w: any) => {
        if (
          w.stockItemId === item.id ||
          w.rawMaterialId === item.id ||
          w.itemName === item.rawMaterial ||
          w.itemName === item.name
        ) {
          return acc + Number(w.quantity || 0);
        }
        return acc;
      }, 0);

      // 3. Calculate consumption quantity from movements
      const itemConsumed = movements.reduce((acc: number, m: any) => {
        if (
          (m.stockItemId === item.id ||
            m.name === item.rawMaterial ||
            m.name === item.name) &&
          (m.type === "SETTLE_DEDUCT" ||
            m.type === "CONSUMPTION" ||
            m.type === "USAGE")
        ) {
          return acc + Math.abs(Number(m.signedQty ?? m.quantity ?? 0));
        }
        return acc;
      }, 0);

      const purchase = Number(
        item.purchaseQty ?? (itemPurchases > 0 ? itemPurchases : 0),
      );
      const wastage = Number(
        item.wastageQty ?? (itemWastage > 0 ? itemWastage : 0),
      );
      const consumed = Number(
        item.consumedQty ?? (itemConsumed > 0 ? itemConsumed : 0),
      );
      const closing = Number(item.closingStock ?? item.availableStock ?? 0);
      const opening = Number(
        item.openingBalance ??
          item.openingStock ??
          Math.max(0, closing - purchase + consumed + wastage),
      );
      const totalIn = opening + purchase;
      const totalOut = consumed + wastage;
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
  }, [stockItems, purchases, wastageList, movements]);

  return (
    <div className="space-y-4">
      {/* 1. Single Top Header with Date Period filter placed in same row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Stock Summary
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[200px] sm:w-[220px]">
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
            onClick={() => toast.info("Period updated")}
            className="rounded-xl border border-border bg-surface hover:bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition cursor-pointer"
          >
            Apply Period
          </button>
        </div>
      </div>

      {/* 2. Unified Ledger & Real-Time Stock Balance Table */}
      <PosDataGrid
        data={rows}
        columns={SUMMARY_COLUMNS}
        keyField="name"
        showToolbar
        selectable
        loading={isLoading}
        storageKey="pos-stock-summary-unified"
        themeVariant="primary"
        pageSize={10}
      />
    </div>
  );
}
