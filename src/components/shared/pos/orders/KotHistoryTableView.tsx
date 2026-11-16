import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Printer,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useKotOrders } from "@/hooks/queries/usePosOrders";
import { printKotTicket } from "@/utils/printKotTicket";
import { toast } from "sonner";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { exportToExcel } from "@/utils/exportUtils";

export interface KotHistoryTableViewProps {
  outletName?: string;
}

export function KotHistoryTableView({ outletName }: KotHistoryTableViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({
    from: todayStr,
    to: todayStr,
  });

  // Fetch KOTs with real database filtering: PREPARING, COMPLETED/READY, CANCELLED or ALL, plus date filtering
  const queryFilters = useMemo(() => {
    const f: Record<string, any> = {};
    if (statusFilter !== "ALL") {
      f.status = statusFilter === "READY" ? "READY,SERVED" : statusFilter;
    } else {
      f.status = "ALL";
    }
    if (dateRange.from) {
      f.date_from = dateRange.from;
      f.startDate = dateRange.from;
    }
    if (dateRange.to) {
      f.date_to = dateRange.to;
      f.endDate = dateRange.to;
    }
    return f;
  }, [statusFilter, dateRange]);

  const { data: allKotData, isLoading, refetch } = useKotOrders(queryFilters);

  // Map only real records from database
  const records = useMemo(() => {
    const list = allKotData?.records || [];
    return list.map((k, index) => {
      // Calculate preparation / elapsed duration
      let timeTaking = "--";
      const startMs = k.createdTimestamp || (k.createdAt ? new Date(k.createdAt).getTime() : 0);
      const endMs = k.readyTimestamp || (startMs ? Date.now() : 0);
      if (startMs && endMs >= startMs) {
        const diffMins = Math.floor((endMs - startMs) / 60000);
        const diffSecs = Math.floor(((endMs - startMs) % 60000) / 1000);
        timeTaking = `${diffMins}m ${diffSecs}s`;
      }

      return {
        ...k,
        serialNumber: index + 1,
        timeTaking: k.completeDuration && k.completeDuration !== "--" ? k.completeDuration : timeTaking,
      };
    });
  }, [allKotData]);

  const handlePrint = (kot: any) => {
    try {
      const parsedItems =
        kot.items && kot.items.length > 0
          ? kot.items
          : (kot.itemsText || "")
              .split(",")
              .map((p: string) => p.trim())
              .filter(Boolean)
              .map((line: string) => {
                const qtyMatch = line.match(/[×x*]\s*(\d+)\s*$/i);
                if (qtyMatch) {
                  return {
                    name: line.replace(/[×x*]\s*\d+\s*$/i, "").trim(),
                    quantity: Number(qtyMatch[1]) || 1,
                  };
                }
                return { name: line, quantity: 1 };
              });

      printKotTicket({
        kotId: kot.kotId,
        kotNumber: kot.kotNumber,
        orderNumber: kot.orderNumber,
        orderType: kot.orderType,
        tableOrRoom: kot.tableOrRoom,
        waiterName: kot.waiterName,
        customerName: kot.customerName,
        createdTimestamp: kot.createdTimestamp || Date.now(),
        createdAt: kot.createdAt,
        items: parsedItems,
        isModified: kot.isModified,
        specialNote: kot.notes || kot.orderNote,
        outletName,
      });
      toast.success(`Printing KOT #${kot.kotId || kot.kotNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to print KOT ticket");
    }
  };

  const handleExcelExport = () => {
    if (records.length === 0) {
      toast.info("No KOT records to export");
      return;
    }
    const headers = ["SL NO.", "KOT #", "ORDER ID", "ORDER ITEMS", "TIME TAKING", "STATUS", "DATE & TIME"];
    const rows = records.map((r) => [
      r.serialNumber,
      `#${r.kotId || r.kotNumber}`,
      r.orderNumber || "—",
      r.itemsText || "—",
      r.timeTaking || "—",
      r.status === "Prepared" || r.status === "Ready" || r.status === "Served" ? "Completed" : r.status,
      r.createdAt || "—",
    ]);

    exportToExcel({
      filename: `KOT_History_${new Date().toISOString().slice(0, 10)}`,
      title: "Kitchen Order History (KOT)",
      subtitle: `Outlet: ${outletName || "All"} | Status: ${statusFilter}`,
      columns: headers,
      rows,
    });
    toast.success(`Exported ${records.length} KOT records to Excel`);
  };

  // Required columns: Serial Number, Order ID, Order Item, Time Taking, Status (Preparing or Completed), Action to print KOT
  const columns: PosDataGridColumn<any>[] = useMemo(
    () => [
      {
        id: "serialNumber",
        header: "Sl No.",
        accessorKey: "serialNumber",
        width: 80,
        defaultWidth: 80,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <span className="font-semibold text-text-secondary text-xs">{row.serialNumber}</span>
        ),
      },
      {
        id: "kotNumber",
        header: "KOT #",
        accessorKey: "kotNumber",
        width: 110,
        defaultWidth: 110,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono font-bold text-foreground text-xs">
              #{row.kotId || row.kotNumber}
            </span>
            {row.isModified && (
              <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                MOD
              </span>
            )}
          </div>
        ),
      },
      {
        id: "orderNumber",
        header: "Order ID",
        accessorKey: "orderNumber",
        width: 160,
        defaultWidth: 170,
        sortable: true,
        align: "center",
        cell: ({ row }) => {
          const typeStr = String(row?.orderType || "").trim();
          const tableStr = String(row?.tableOrRoom || "").trim();
          const alreadyIncludesTable = tableStr && typeStr.toLowerCase().includes(tableStr.toLowerCase());
          const displaySub = alreadyIncludesTable || !tableStr ? typeStr : `${typeStr} · ${tableStr}`;

          return (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-bold text-foreground text-xs">
                {row.orderNumber || "—"}
              </span>
              {displaySub && (
                <span className="text-[11px] text-text-secondary truncate max-w-[150px]">
                  {displaySub}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "itemsText",
        header: "Order Item",
        accessorKey: "itemsText",
        minWidth: 260,
        defaultWidth: 320,
        sortable: false,
        align: "center",
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center text-center py-1">
            <span className="text-xs text-foreground font-medium leading-relaxed">
              {row.itemsText || "No items recorded"}
            </span>
            {(row.notes || row.orderNote) && (
              <span className="text-[10.5px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1 inline-block">
                Note: {row.notes || row.orderNote}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "timeTaking",
        header: "Time Taking",
        accessorKey: "timeTaking",
        width: 120,
        defaultWidth: 130,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span>{row.timeTaking}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        width: 130,
        defaultWidth: 140,
        sortable: true,
        align: "center",
        cell: ({ row }) => {
          if (!row) return "--";
          const rowStatus = String(row?.status || "");
          const isCompleted = rowStatus === "Ready" || rowStatus === "Prepared" || rowStatus === "Served";
          const isCancelled = rowStatus === "Cancelled";

          if (isCompleted) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            );
          }
          if (isCancelled) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                Cancelled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <Clock className="h-3 w-3" />
              Preparing
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        width: 100,
        defaultWidth: 100,
        sortable: false,
        align: "center",
        cell: ({ row }) => {
          if (!row) return null;
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => handlePrint(row)}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-foreground hover:bg-surface-2 border border-border bg-white transition cursor-pointer shadow-2xs hover:border-primary/40"
                title="Print KOT Ticket"
              >
                <Printer className="h-4 w-4 text-primary" />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden p-4 sm:p-5 bg-background font-sans">
      <PosDataGrid
        data={records}
        columns={columns}
        keyField="id"
        loading={isLoading}
        pageSize={15}
        pageSizeOptions={[10, 15, 25, 50, 100]}
        storageKey="pos_kot_history_main_grid"
        showToolbar
        showToolbarSearch
        searchPlaceholder="Search KOT #, order #, table, customer or item..."
        onExport={handleExcelExport}
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56 sm:w-64">
              <PosDateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) =>
                  setDateRange({
                    from: range.from || undefined,
                    to: range.to || undefined,
                  })
                }
                allowFutureDates={false}
                placeholder="Filter by date..."
                className="h-8 text-xs font-semibold"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold rounded-lg border border-border bg-white hover:bg-surface-2 text-foreground transition cursor-pointer shadow-2xs"
              title="Refresh KOT history"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              <span>Refresh</span>
            </button>
          </div>
        }
        emptyMessage={
          dateRange.from
            ? "No KOT history found for the selected date range."
            : "No kitchen order history found. Completed kitchen orders will appear here automatically."
        }
      />
    </div>
  );
}
