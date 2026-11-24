import { useState, useMemo } from "react";
import {
  BellRing,
  History,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Search,
  Calendar,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
  User,
  ChefHat,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";
import { useWaiterNotifications } from "@/hooks/useWaiterNotifications";
import { posWaiterNotificationService } from "@/services/posWaiterNotificationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleSimulateTestNotice = () => {
    const tableNum = `Table #${Math.floor(Math.random() * 12) + 1}`;
    const orderNum = `ORD-20261124-${String(Math.floor(Math.random() * 900) + 100)}`;
    posWaiterNotificationService.dispatchTestReadyNotice({
      title: `Order ${orderNum} is ready`,
      message: `Dine In · ${tableNum} · 2x Butter Chicken, 4x Garlic Naan ready to serve.`,
      tableNumber: tableNum,
      orderNumber: orderNum,
      itemsText: "2x Butter Chicken, 4x Garlic Naan",
      orderType: "Dine In",
      customerName: "Table Guest",
    });
    toast.info(`Simulated Ready KOT for ${tableNum}!`);
  };

  const handleQuickDate = (mode: "today" | "yesterday" | "week") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (mode === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yestStr = yesterday.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (mode === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(weekAgo.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

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

  const handleExportCsv = () => {
    if (history.length === 0) {
      toast.error("No history to export");
      return;
    }
    const headers = [
      "SI No",
      "Date",
      "Ready Time",
      "Served Time",
      "Order Number",
      "Table/Room",
      "Items",
      "Status",
      "Steward Name",
      "Turnaround",
    ];
    const rows = history.map((r, i) => [
      i + 1,
      formatDate(r.servedAt),
      formatTime(r.readyAt),
      formatTime(r.servedAt),
      r.orderNumber,
      r.tableNumber,
      `"${r.itemsText.replace(/"/g, '""')}"`,
      r.status,
      `"${r.stewardName.replace(/"/g, '""')}"`,
      formatDuration(r.turnaroundSeconds),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `waiter_served_history_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Notification history exported to CSV");
  };

  return (
    <div className="flex h-full flex-col space-y-4 p-4 lg:p-6 overflow-y-auto">
      {/* ── Top Header & Tab Controls ─────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Order Ready Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 animate-pulse">
                {unreadCount} Ready to Serve
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Live food ready pickup alerts & served history for floor stewards
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <button
              onClick={() => setActiveTab("current")}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "current"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BellRing className="h-3.5 w-3.5 text-amber-500" />
              Current Notifications
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5 text-emerald-600" />
              Notification History
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
            className="cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateTestNotice}
            title="Simulate kitchen ready KOT"
            className="cursor-pointer hidden sm:inline-flex text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1" />
            Test Ready Alert
          </Button>
        </div>
      </div>

      {/* ── TAB 1: CURRENT NOTIFICATIONS ────────────────────── */}
      {activeTab === "current" && (
        <div className="flex-1 space-y-4">
          {activeNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-12 text-center">
              <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                All Orders Caught Up!
              </h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                No food is currently waiting on the kitchen counter. When kitchen chefs mark a KOT ready, it will appear here immediately for pickup.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateTestNotice}
                className="mt-4 text-xs cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1" />
                Simulate Demo Order Ready
              </Button>
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
                        ? "border-amber-400/80 bg-amber-50/10 ring-1 ring-amber-400/50"
                        : "border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {notice.orderType || "Dine In"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Ready {formatTime(notice.createdAt)} ({formatDuration(elapsedSec)} ago)
                        </span>
                      </div>

                      {/* Destination & Order Number */}
                      <div className="border-b pb-2">
                        <div className="text-lg font-bold text-foreground flex items-center justify-between">
                          <span>{notice.tableNumber || "Dine-In"}</span>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {notice.orderNumber || "ORD-001"}
                          </span>
                        </div>
                        {notice.customerName && (
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
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
                        <p className="text-xs text-foreground/90 font-medium bg-muted/30 p-2 rounded-lg">
                          {notice.itemsText || "Food is prepared and ready on kitchen counter."}
                        </p>
                      </div>

                      {/* Notes if any */}
                      {notice.notes && (
                        <div className="text-[11px] bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-2 rounded-md border border-amber-200/50">
                          <strong>Note:</strong> {notice.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action: Serve Button */}
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        onClick={() => markServed(notice.id)}
                        disabled={isServing === notice.id}
                        className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-sm flex items-center justify-center gap-2"
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

      {/* ── TAB 2: NOTIFICATION HISTORY ─────────────────────── */}
      {activeTab === "history" && (
        <div className="flex-1 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                <Calendar className="h-3.5 w-3.5" /> Date:
              </div>
              <button
                onClick={() => handleQuickDate("today")}
                className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickDate("yesterday")}
                className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Yesterday
              </button>
              <button
                onClick={() => handleQuickDate("week")}
                className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Last 7 Days
              </button>

              <div className="flex items-center gap-1 ml-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search order, table, steward..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="h-8 text-xs cursor-pointer flex items-center gap-1"
                title="Export history to CSV"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* History Data Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">SI No.</th>
                    <th className="py-3 px-3">Date & Ready Time</th>
                    <th className="py-3 px-3">Served Time</th>
                    <th className="py-3 px-3">Order / KOT #</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3 min-w-[180px]">Items Served</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 font-bold text-foreground">Steward Name</th>
                    <th className="py-3 px-3 text-right">Turnaround</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        <History className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="font-medium text-sm">No served notification history found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Try adjusting the date range or search keyword.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    history.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                          {formatDate(row.readyAt)}
                          <span className="block text-[11px] text-muted-foreground">
                            {formatTime(row.readyAt)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {formatTime(row.servedAt)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground whitespace-nowrap">
                          {row.orderNumber}
                          {row.kotId && (
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              KOT #{row.kotId}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                            {row.tableNumber}
                          </span>
                          {row.customerName && (
                            <span className="block text-[10px] text-muted-foreground">
                              {row.customerName}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-medium max-w-[240px] truncate" title={row.itemsText}>
                          {row.itemsText}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{row.stewardName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {formatDuration(row.turnaroundSeconds)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
