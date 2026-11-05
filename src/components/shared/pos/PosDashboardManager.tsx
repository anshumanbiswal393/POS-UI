import { useMemo } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { usePosDashboard } from "@/hooks/queries/usePosDashboard";
import { usePosDate } from "@/hooks/usePosDate";
import { useOutletContext } from "@/context/PosOutletContext";
import { DashboardKpiCards } from "./dashboard/DashboardKpiCards";
import { OrderTypesDonutChart } from "./dashboard/OrderTypesDonutChart";
import { LiveOrdersWidget } from "./dashboard/LiveOrdersWidget";
import { PaymentSummaryCard } from "./dashboard/PaymentSummaryCard";
import { TableStatusCard } from "./dashboard/TableStatusCard";
import { TopSellingItemsCard } from "./dashboard/TopSellingItemsCard";
import { AttentionNeededCard } from "./dashboard/AttentionNeededCard";
import { OperationalMetricsStrip } from "./dashboard/OperationalMetricsStrip";
import { PosDashboardSkeleton } from "./dashboard/PosDashboardSkeleton";
import type { DashboardFilterParams } from "@/types/posDashboard";

/**
 * POS Dashboard Manager
 * Orchestrates real backend data fetching via TanStack Query and coordinates all visual panels.
 * Synchronizes with the top navigation operational date picker.
 * Displays a high-fidelity skeleton while loading live operational data.
 */
export function PosDashboardManager() {
  const { selectedDateStr, isToday, formattedDate, resetToToday } = usePosDate();
  const { activeOutlet, isLoadingOutlets } = useOutletContext();

  const filters: DashboardFilterParams = useMemo(
    () => ({
      dateRange: (isToday ? "today" : selectedDateStr) as any,
      startDate: selectedDateStr,
      endDate: selectedDateStr,
      outletId: activeOutlet?.id,
    }),
    [isToday, selectedDateStr, activeOutlet?.id],
  );

  const { data, isLoading, isFetching } = usePosDashboard(filters);

  const dateNoticeBanner = !isToday ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800/80 px-4 py-2.5 shadow-xs shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
            Viewing Historical / Projected Dashboard Data for {formattedDate}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Showing actual confirmed database reservations, occupancy, revenue, arrivals, and departures for this date.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={resetToToday}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to Today
      </button>
    </div>
  ) : null;

  // If loading outlets, loading dashboard data, or no data yet: render the skeleton loader!
  if (isLoadingOutlets || isLoading || !data) {
    return <PosDashboardSkeleton banner={dateNoticeBanner} />;
  }

  return (
    <div className="relative flex flex-col flex-1 gap-2 p-3 sm:p-4 lg:p-5 pt-2 sm:pt-2.5 lg:pt-3 lg:min-h-0 lg:overflow-hidden">
      {/* Background sync progress bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-20">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}

      {dateNoticeBanner}

      <DashboardKpiCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-[1.15] lg:grid-cols-3">
        <LiveOrdersWidget orders={data.liveOrders} />
        <OrderTypesDonutChart orderTypes={data.orderTypes} totalCount={data.totalOrderTypesCount} />
        <TableStatusCard tables={data.tables} />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <PaymentSummaryCard paymentSummary={data.paymentSummary} />
        <TopSellingItemsCard items={data.topSellingItems} isToday={isToday} />
        <AttentionNeededCard alerts={data.attentionAlerts} />
      </div>

      <OperationalMetricsStrip operations={data.operations} />
    </div>
  );
}

export default PosDashboardManager;
