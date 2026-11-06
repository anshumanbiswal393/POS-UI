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
        <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
          <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1">
            <DayEndSummaryView />
          </div>
        </div>
      </GuardedRoute>
    );
  }
  if (pathname === "/pos/reports/notifications") {
    return (
      <GuardedRoute permission="pos.reports.view">
        <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
          <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1">
            <Outlet />
          </div>
        </div>
      </GuardedRoute>
    );
  }
  const isReportsView =
    pathname === "/pos/reports" ||
    pathname === "/pos/reports/" ||
    pathname === "/pos/reports/other" ||
    pathname === "/pos/reports/other/";
  return (
    <GuardedRoute permission="pos.reports.view">
      {isReportsView ? <MainOtherReportsView /> : <Outlet />}
    </GuardedRoute>
  );
}
