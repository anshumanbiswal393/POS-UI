import { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";

interface StockSummaryRow {
  name: string;
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

export function StockSummaryReportView() {
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
            Stock Summary Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full comprehensive reconciliation of opening balances, purchases, sales consumption, wastage, and closing stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 2. Date Filter Bar */}
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
        title="Stock Summary"
        subtitle={isLoading ? "Loading live ledger records..." : "Multi-column ledger balance report"}
        showToolbar
        selectable
        storageKey="pos-stock-summary-report"
        themeVariant="primary"
        pageSize={10}
      />
    </div>
  );
}
