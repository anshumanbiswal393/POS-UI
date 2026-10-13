import { usePosDashboard } from "@/hooks/queries/usePosDashboard";
import { DashboardKpiCards } from "./dashboard/DashboardKpiCards";
import { OrderTypesDonutChart } from "./dashboard/OrderTypesDonutChart";
import { LiveOrdersWidget } from "./dashboard/LiveOrdersWidget";
import { PaymentSummaryCard } from "./dashboard/PaymentSummaryCard";
import { TableStatusCard } from "./dashboard/TableStatusCard";
import { TopSellingItemsCard } from "./dashboard/TopSellingItemsCard";
import { AttentionNeededCard } from "./dashboard/AttentionNeededCard";
import { OperationalMetricsStrip } from "./dashboard/OperationalMetricsStrip";
import type { DashboardFilterParams } from "@/types/posDashboard";

const DEFAULT_FILTERS: DashboardFilterParams = { dateRange: "today" };

/**
 * POS Dashboard Manager
 * Orchestrates real backend data fetching via TanStack Query and coordinates all visual panels.
 */
export function PosDashboardManager() {
  const { data } = usePosDashboard(DEFAULT_FILTERS);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
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
