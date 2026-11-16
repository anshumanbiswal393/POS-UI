import React, { useState, useMemo } from "react";
import {
  Printer,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useKotOrders, useCancelKotMutation } from "@/hooks/queries/usePosOrders";
import { printKotTicket } from "@/utils/printKotTicket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { exportToExcel } from "@/utils/exportUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface KotHistoryTableViewProps {
  outletName?: string;
}

export function KotHistoryTableView({ outletName }: KotHistoryTableViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [ticketToCancel, setTicketToCancel] = useState<any | null>(null);

  const cancelMutation = useCancelKotMutation();

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

  const handleConfirmCancel = () => {
    if (!ticketToCancel) return;
    const ticket = ticketToCancel;
    cancelMutation.mutate(
      {
        ticketId: ticket.id,
        kotId: ticket.kotId,
        note: "Cancelled from KOT history",
      },
      {
        onSuccess: () => {
          toast.success(`KOT #${ticket.kotId || ticket.kotNumber} cancelled successfully`);
          setTicketToCancel(null);
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.data?.detail || err?.data?.ticket || err?.message || "Failed to cancel KOT";
          toast.error(typeof msg === "string" ? msg : "Failed to cancel KOT");
        },
      },
    );
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
        width: 140,
        defaultWidth: 150,
        sortable: true,
        align: "left",
        cell: ({ row }) => (
          <div className="flex flex-col text-left">
            <span className="font-bold text-foreground text-xs">
              {row.orderNumber || "—"}
            </span>
            <span className="text-[11px] text-text-secondary truncate">
              {row.orderType}
              {row.tableOrRoom ? ` · ${row.tableOrRoom}` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "itemsText",
        header: "Order Item",
        accessorKey: "itemsText",
        minWidth: 260,
        defaultWidth: 320,
        sortable: false,
        align: "left",
        cell: ({ row }) => (
          <div className="flex flex-col text-left py-1">
            <span className="text-xs text-foreground font-medium leading-relaxed">
              {row.itemsText || "No items recorded"}
            </span>
            {(row.notes || row.orderNote) && (
              <span className="text-[10.5px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1 inline-block w-fit">
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
        width: 140,
        defaultWidth: 150,
        sortable: false,
        align: "center",
        cell: ({ row }) => {
          if (!row) return null;
          const isCancelled = String(row?.status || "") === "Cancelled";
          return (
            <div className="flex items-center gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => handlePrint(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-border text-foreground hover:bg-surface-2 transition cursor-pointer shadow-2xs"
                title="Print KOT Ticket"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>Print</span>
              </button>
              {!isCancelled && (
                <button
                  type="button"
                  onClick={() => setTicketToCancel(row)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                  title="Cancel KOT ticket"
                >
                  <Ban className="h-3.5 w-3.5 text-rose-600" />
                  <span>Cancel</span>
                </button>
              )}
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

      {/* Confirmation Dialog for Cancelling KOT */}
      <AlertDialog open={Boolean(ticketToCancel)} onOpenChange={(open) => !open && setTicketToCancel(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-surface border border-border p-6 shadow-xl font-sans">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Cancel KOT #{ticketToCancel?.kotId || ticketToCancel?.kotNumber}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-text-secondary leading-relaxed pt-1">
              Are you sure you want to cancel this kitchen order ticket? This will cancel the ticket in
              the kitchen records and update the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex items-center justify-end gap-2">
            <AlertDialogCancel
              disabled={cancelMutation.isPending}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-2 cursor-pointer"
            >
              Keep Ticket
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel KOT"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
