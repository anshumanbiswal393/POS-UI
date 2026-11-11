import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { OutletConfigurationHubView } from "@/components/shared/pos/management/views/OutletConfigurationHubView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/management")({
  component: ManagementLayoutRoute,
});

function ManagementLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOutletHub =
    pathname === "/pos/management" ||
    pathname === "/pos/management/" ||
    pathname === "/pos/management/configuration" ||
    pathname === "/pos/management/configuration/" ||
    pathname === "/pos/management/configuration/outlet" ||
    pathname === "/pos/management/configuration/outlet/";

  const isUsersSelfContained =
    pathname === "/pos/management/users" ||
    pathname === "/pos/management/users/" ||
    pathname === "/pos/management/users/roles" ||
    pathname === "/pos/management/users/roles/";

  return (
    <GuardedRoute permission="pos.settings.manage">
      {isOutletHub ? (
        <OutletConfigurationHubView />
      ) : isUsersSelfContained ? (
        <Outlet />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
          <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1">
            <Outlet />
          </div>
        </div>
      )}
    </GuardedRoute>
  );
}
