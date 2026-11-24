import { useMemo } from "react";
import {
  BellRing,
  History,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  RefreshCw,
  User,
  MapPin,
} from "lucide-react";
import { useWaiterNotifications } from "@/hooks/useWaiterNotifications";
import type { WaiterServedRecord } from "@/services/posWaiterNotificationService";
import { Button } from "@/components/ui/button";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { exportToExcel } from "@/utils/exportUtils";
import { toast } from "sonner";

export function WaiterNotificationsView() {
  const {
    activeTab,
    setActiveTab,
    activeNotices,
    history,
    unreadCount,
    markServed,
    isServing,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    search,
    setSearch,
    refreshActive,
    refreshHistory,
    stewardName,
  } = useWaiterNotifications();

  const formatTime = (ts: number) => {
    if (!ts) return "--";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (ts: number) => {
    if (!ts) return "--";
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "< 1m";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleExportExcel = () => {
    if (history.length === 0) {
      toast.info("No notification history records to export");
      return;
    }
    exportToExcel({
      filename: `Waiter_Served_History_${startDate}_to_${endDate}`,
      title: "Order Ready Served History",
      subtitle: `Date: ${startDate} to ${endDate} | Steward: ${stewardName}`,
      columns: [
        "SI NO.",
        "DATE",
        "READY TIME",
        "SERVED TIME",
        "ORDER #",
        "KOT #",
        "DESTINATION",
        "GUEST",
        "ITEMS SERVED",
        "STATUS",
        "STEWARD NAME",
        "TURNAROUND",
      ],
      rows: history.map((r, i) => [
        i + 1,
        formatDate(r.servedAt),
        formatTime(r.readyAt),
        formatTime(r.servedAt),
        r.orderNumber,
        r.kotId ? `#${r.kotId}` : "—",
        r.tableNumber,
        r.customerName || "—",
        r.itemsText,
        "Completed",
        r.stewardName,
        formatDuration(r.turnaroundSeconds),
      ]),
    });
    toast.success(`Exported ${history.length} records to Excel`);
  };

  // Standard POS Data Grid column definitions
  const columns: PosDataGridColumn<WaiterServedRecord>[] = useMemo(
    () => [
      {
        id: "siNo",
        header: "SI No.",
        accessorKey: "id",
        width: 70,
        defaultWidth: 70,
        sortable: false,
        align: "center",
        cell: ({ index }) => (
          <span className="font-mono text-xs text-text-secondary font-semibold">
            {String(index + 1).padStart(2, "0")}
          </span>
        ),
      },
      {
        id: "readyTime",
        header: "Date & Ready Time",
        accessorKey: "readyAt",
        width: 150,
        defaultWidth: 160,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-bold text-foreground text-xs whitespace-nowrap">
              {formatDate(row.readyAt)}
            </span>
            <span className="text-[11px] text-text-secondary font-medium">
              {formatTime(row.readyAt)}
            </span>
          </div>
        ),
      },
      {
        id: "servedTime",
        header: "Served Time",
        accessorKey: "servedAt",
        width: 120,
        defaultWidth: 130,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <span className="font-bold text-emerald-700 text-xs whitespace-nowrap">
            {formatTime(row.servedAt)}
          </span>
        ),
      },
      {
        id: "orderNumber",
        header: "Order / KOT #",
        accessorKey: "orderNumber",
        width: 160,
        defaultWidth: 170,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-mono font-bold text-foreground text-xs">
              {row.orderNumber}
            </span>
            {row.kotId && (
              <span className="text-[10.5px] text-text-secondary font-mono">
                KOT #{row.kotId}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "destination",
        header: "Destination",
        accessorKey: "tableNumber",
        width: 150,
        defaultWidth: 160,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-bold text-foreground text-xs">
              {row.tableNumber}
            </span>
            {row.customerName && (
              <span className="text-[11px] text-text-secondary truncate max-w-[140px]">
                {row.customerName}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "itemsServed",
        header: "Items Served",
        accessorKey: "itemsText",
        minWidth: 220,
        defaultWidth: 280,
        sortable: false,
        align: "center",
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center text-center py-1">
            <span className="text-xs text-foreground font-medium leading-relaxed max-w-[280px]">
              {row.itemsText || "Dishes served"}
            </span>
            {row.notes && (
              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block truncate max-w-[240px]">
                Note: {row.notes}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        width: 130,
        defaultWidth: 130,
        sortable: true,
        align: "center",
        cell: () => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        ),
      },
      {
        id: "stewardName",
        header: "Steward Name",
        accessorKey: "stewardName",
        width: 150,
        defaultWidth: 160,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5 font-bold text-foreground text-xs">
            <User className="h-3.5 w-3.5 text-text-secondary" />
            <span>{row.stewardName}</span>
          </div>
        ),
      },
      {
        id: "turnaround",
        header: "Turnaround",
        accessorKey: "turnaroundSeconds",
        width: 110,
        defaultWidth: 110,
        sortable: true,
        align: "center",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-text-secondary">
            {formatDuration(row.turnaroundSeconds)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col space-y-4 p-4 lg:p-6 overflow-y-auto bg-background font-sans">
      {/* ── Top Header & Tab Controls (Same as Take Order Table-to-Room Tab Design) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Order Ready Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 animate-pulse border border-amber-300">
                {unreadCount} Ready to Serve
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Live food ready pickup alerts & served history for floor stewards
          </p>
        </div>

        {/* Tab switch buttons (Matching Take Order Table vs Room pill switch design) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`px-4 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "current"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Current Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Notification History</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshActive();
              refreshHistory();
              toast.success("Refreshed notifications");
            }}
            title="Refresh list"
            className="cursor-pointer h-9 px-3 border border-border bg-white hover:bg-surface-2 text-foreground shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── TAB 1: CURRENT NOTIFICATIONS ────────────────────── */}
      {activeTab === "current" && (
        <div className="flex-1 space-y-4">
          {activeNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface p-12 text-center shadow-2xs">
              <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600 mb-3 border border-emerald-200">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                All Orders Caught Up!
              </h3>
              <p className="mt-1 max-w-md text-xs text-text-secondary leading-relaxed">
                No food is currently waiting on the kitchen counter. When kitchen chefs mark a KOT ready, it will appear here immediately for pickup.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeNotices.map((notice) => {
                const elapsedSec = Math.max(0, Math.floor((Date.now() - notice.createdAt) / 1000));
                const isUrgent = elapsedSec > 300; // > 5 minutes

                return (
                  <div
                    key={notice.id}
                    className={`flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md ${
                      isUrgent
                        ? "border-amber-400/80 bg-amber-50/15 ring-1 ring-amber-400/50"
                        : "border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                          <MapPin className="h-3 w-3 text-text-secondary" />
                          {notice.orderType || "Dine In"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary">
                          <Clock className="h-3 w-3" />
                          Ready {formatTime(notice.createdAt)} ({formatDuration(elapsedSec)} ago)
                        </span>
                      </div>

                      {/* Destination & Order Number */}
                      <div className="border-b border-border pb-2">
                        <div className="text-lg font-bold text-foreground flex items-center justify-between">
                          <span>{notice.tableNumber || "Dine-In"}</span>
                          <span className="text-xs font-mono font-bold text-text-secondary">
                            {notice.orderNumber || "ORD-001"}
                          </span>
                        </div>
                        {notice.customerName && (
                          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3" /> Guest: {notice.customerName}
                          </div>
                        )}
                      </div>

                      {/* Dishes Ready */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-600" />
                          Dishes Ready:
                        </div>
                        <p className="text-xs text-foreground font-medium bg-muted/40 p-2.5 rounded-lg border border-border/60">
                          {notice.itemsText || "Food is prepared and ready on kitchen counter."}
                        </p>
                      </div>

                      {/* Notes if any */}
                      {notice.notes && (
                        <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-md border border-amber-200">
                          <strong>Note:</strong> {notice.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action: Serve Button */}
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button
                        onClick={() => markServed(notice.id)}
                        disabled={isServing === notice.id}
                        className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs flex items-center justify-center gap-2"
                      >
                        {isServing === notice.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Serve to Guest
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: NOTIFICATION HISTORY (Using Standard PosDataGrid & PosDateRangePicker) ── */}
      {activeTab === "history" && (
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          <PosDataGrid
            data={history}
            columns={columns}
            keyField="id"
            pageSize={15}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            storageKey="pos_waiter_notification_history_grid"
            showToolbar
            showToolbarSearch
            searchPlaceholder="Search order, table, steward, dishes..."
            onExport={handleExportExcel}
            toolbarActions={
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-56 sm:w-64">
                  <PosDateRangePicker
                    from={startDate}
                    to={endDate}
                    onSelect={(range) => {
                      setStartDate(range.from || "");
                      setEndDate(range.to || "");
                    }}
                    allowFutureDates={false}
                    placeholder="Filter by date..."
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    refreshHistory();
                    toast.success("Refreshed notification history");
                  }}
                  className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold rounded-lg border border-border bg-white hover:bg-surface-2 text-foreground transition cursor-pointer shadow-2xs"
                  title="Refresh history"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  <span>Refresh</span>
                </button>
              </div>
            }
            emptyMessage="No served notification history found for the selected date range."
          />
        </div>
      )}
    </div>
  );
}
