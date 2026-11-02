import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { DayEndSummaryView } from "@/components/shared/pos/reports/views/DayEndSummaryView";
import { MainOtherReportsView } from "@/components/shared/pos/reports/views/MainOtherReportsView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/reports")({
  component: ReportsMainLayoutRoute,
});

function ReportsMainLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/pos/reports/day-end") {
    return (
      <GuardedRoute permission="pos.reports.view">
        <DayEndSummaryView />
      </GuardedRoute>
    );
  }
  const isRoot = pathname === "/pos/reports" || pathname === "/pos/reports/";
  return (
    <GuardedRoute permission="pos.reports.view">
      {isRoot ? <MainOtherReportsView /> : <Outlet />}
    </GuardedRoute>
  );
}
