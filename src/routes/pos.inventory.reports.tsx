import { Outlet, createFileRoute, useRouterState, Navigate } from "@tanstack/react-router";
import { StockSummaryReportView } from "@/components/shared/pos/inventory/views/StockSummaryReportView";

export const Route = createFileRoute("/pos/inventory/reports")({
  component: ReportsLayoutRoute,
});

function ReportsLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/pos/inventory/reports" || pathname === "/pos/inventory/reports/";
  return isRoot ? <Navigate to="/pos/inventory/reports/stock-summary" replace /> : <Outlet />;
}
