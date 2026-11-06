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
        <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
          <div className="responsive-page-x py-5 pb-12 space-y-5 flex-1">
            <DayEndSummaryView />
          </div>
        </div>
      </GuardedRoute>
    );
  }
  const isRoot = pathname === "/pos/reports" || pathname === "/pos/reports/";
  return (
    <GuardedRoute permission="pos.reports.view">
      {isRoot ? (
        <MainOtherReportsView />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
          <div className="responsive-page-x py-5 pb-12 space-y-5 flex-1">
            <Outlet />
          </div>
        </div>
      )}
    </GuardedRoute>
  );
}
