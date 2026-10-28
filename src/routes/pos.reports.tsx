import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { DayEndSummaryView } from "@/components/shared/pos/reports/views/DayEndSummaryView";
import { MainOtherReportsView } from "@/components/shared/pos/reports/views/MainOtherReportsView";

export const Route = createFileRoute("/pos/reports")({
  
  component: ReportsMainLayoutRoute,
});

function ReportsMainLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/pos/reports/day-end") {
    return <DayEndSummaryView />;
  }
  const isRoot = pathname === "/pos/reports" || pathname === "/pos/reports/";
  return isRoot ? <MainOtherReportsView /> : <Outlet />;
}
