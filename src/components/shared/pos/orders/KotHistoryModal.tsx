import React, { useState, useMemo } from "react";
import {
  History,
  X,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  ChefHat,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { useKotOrders, useCancelKotMutation } from "@/hooks/queries/usePosOrders";
import { printKotTicket } from "@/utils/printKotTicket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
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

interface KotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletName?: string;
}

export function KotHistoryModal({ isOpen, onClose, outletName }: KotHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [ticketToCancel, setTicketToCancel] = useState<any | null>(null);

  const cancelMutation = useCancelKotMutation();

  // Fetch KOTs from database/API with 3 main statuses (READY, PREPARING, CANCELLED) or ALL, plus date filtering
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

  const records = useMemo(() => {
    const list = allKotData?.records || [];
    return list.filter((kot) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = String(kot.kotId || "").includes(q) || String(kot.kotNumber || "").toLowerCase().includes(q);
        const matchesOrder = String(kot.orderNumber || "").toLowerCase().includes(q);
        const matchesCustomer = String(kot.customerName || "").toLowerCase().includes(q);
        const matchesTable = String(kot.tableOrRoom || "").toLowerCase().includes(q);
        const matchesItems = String(kot.itemsText || "").toLowerCase().includes(q);
        return matchesNum || matchesOrder || matchesCustomer || matchesTable || matchesItems;
      }
      return true;
    });
  }, [allKotData, searchQuery]);

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
        isHistory: true,
        status: kot.status || "COMPLETED",
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

  const columns: PosDataGridColumn<any>[] = useMemo(
    () => [
      {
        key: "kotNumber",
        header: "KOT #",
        width: 120,
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-foreground">
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
        key: "orderNumber",
        header: "Order / Source",
        width: 150,
        sortable: true,
        render: (row) => (
          <div className="flex flex-col text-left">
            <span className="font-semibold text-foreground text-xs">
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
        key: "itemsText",
        header: "Items",
        width: 320,
        sortable: false,
        render: (row) => (
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
        key: "status",
        header: "Status",
        width: 120,
        sortable: true,
        render: (row) => {
          if (!row) return "--";
          const rowStatus = String(row?.status || "");
          const isReady = rowStatus === "Ready" || rowStatus === "Prepared";
          const isServed = rowStatus === "Served";
          const isCancelled = rowStatus === "Cancelled";

          if (isServed) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="h-3 w-3" />
                Served
              </span>
            );
          }
          if (isReady) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </span>
            );
          }
          if (isCancelled) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Cancelled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-3 w-3" />
              Preparing
            </span>
          );
        },
      },
      {
        key: "createdAt",
        header: "Date & Time",
        width: 150,
        sortable: true,
        render: (row) => (
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {row.createdAt || "Recently"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: 150,
        sortable: false,
        render: (row) => {
          if (!row) return null;
          const isCancelled = String(row?.status || "") === "Cancelled";
          return (
            <div className="flex items-center gap-1.5 justify-center">
              {!isCancelled && (
                <button
                  type="button"
                  onClick={() => setTicketToCancel(row)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                  title="Cancel this KOT ticket"
                >
                  <Ban className="h-3.5 w-3.5 text-rose-600" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePrint(row)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface border border-border text-foreground hover:bg-surface-2 transition cursor-pointer shadow-2xs"
                title="Print KOT"
              >
                <Printer className="h-3.5 w-3.5 text-text-secondary" />
                <span>Print</span>
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">KOT History & Completed Tickets</h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-primary text-primary-foreground">
                  {records.length} Tickets
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                View previous completed, ready, and past kitchen tickets in a structured data table with reprint and cancel options
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Bar: Search, Calendar Date Picker, 3 Statuses (Ready, Preparing, Cancelled) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-b border-border bg-surface shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by KOT #, order #, table, customer or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Calendar Option: Past & Today dates only (future dates strictly disabled) */}
            <div className="w-[200px] sm:w-[220px]">
              <PosDateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) => setDateRange(range)}
                placeholder="Filter by Date"
                allowFutureDates={false}
                showClear={Boolean(dateRange.from || dateRange.to)}
                showPresets={true}
                size="sm"
              />
            </div>

            {/* Exactly 3 statuses: Ready, Preparing, Cancelled (plus All Statuses) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">Ready</option>
              <option value="PREPARING">Preparing</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground transition cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabular Data Table View using standard PosDataGrid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-background">
          <PosDataGrid
            data={records}
            columns={columns}
            keyField="id"
            loading={isLoading}
            pageSize={10}
            pageSizeOptions={[10, 20, 50]}
            storageKey="pos_kot_history_table"
            emptyMessage={
              searchQuery || dateRange.from
                ? "No matching KOT records found for the selected search or date range."
                : "No KOT history found. Completed kitchen orders will appear here."
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface shrink-0">
          <p className="text-xs text-text-secondary">
            KOTs are permanently saved in the database when created from Billing or Table orders.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-foreground bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

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
              Are you sure you want to cancel this kitchen order ticket? This will mark the ticket as
              Cancelled in the kitchen history and database.
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
