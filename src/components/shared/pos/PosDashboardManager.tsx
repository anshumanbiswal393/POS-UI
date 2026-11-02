import { useMemo } from "react";
import { usePosDashboard } from "@/hooks/queries/usePosDashboard";
import { usePosDate } from "@/hooks/usePosDate";
import { DashboardKpiCards } from "./dashboard/DashboardKpiCards";
import { OrderTypesDonutChart } from "./dashboard/OrderTypesDonutChart";
import { LiveOrdersWidget } from "./dashboard/LiveOrdersWidget";
import { PaymentSummaryCard } from "./dashboard/PaymentSummaryCard";
import { TableStatusCard } from "./dashboard/TableStatusCard";
import { TopSellingItemsCard } from "./dashboard/TopSellingItemsCard";
import { AttentionNeededCard } from "./dashboard/AttentionNeededCard";
import { OperationalMetricsStrip } from "./dashboard/OperationalMetricsStrip";
import type { DashboardFilterParams } from "@/types/posDashboard";

/**
 * POS Dashboard Manager
 * Orchestrates real backend data fetching via TanStack Query and coordinates all visual panels.
 * Synchronizes with the top navigation operational date picker.
 */
export function PosDashboardManager() {
  const { selectedDateStr, isToday } = usePosDate();

  const filters: DashboardFilterParams = useMemo(
    () => ({
      dateRange: (isToday ? "today" : selectedDateStr) as any,
      startDate: selectedDateStr,
      endDate: selectedDateStr,
    }),
    [isToday, selectedDateStr],
  );

  const { data } = usePosDashboard(filters);

  if (!data) return null;

  return (
    <div className="flex flex-col flex-1 gap-2 p-3 sm:p-4 lg:p-5 pt-2 sm:pt-2.5 lg:pt-3 lg:min-h-0 lg:overflow-hidden">
      <DashboardKpiCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-[1.15] lg:grid-cols-3">
        <LiveOrdersWidget orders={data.liveOrders} />
        <OrderTypesDonutChart orderTypes={data.orderTypes} totalCount={data.totalOrderTypesCount} />
        <TableStatusCard tables={data.tables} />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <PaymentSummaryCard paymentSummary={data.paymentSummary} />
        <TopSellingItemsCard items={data.topSellingItems} />
        <AttentionNeededCard alerts={data.attentionAlerts} />
      </div>

      <OperationalMetricsStrip operations={data.operations} />
    </div>
  );
}

export default PosDashboardManager;
