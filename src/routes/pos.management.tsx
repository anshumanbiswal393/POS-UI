import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { OutletConfigurationHubView } from "@/components/shared/pos/management/views/OutletConfigurationHubView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/management")({
  component: ManagementLayoutRoute,
});

function ManagementLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot =
    pathname === "/pos/management" ||
    pathname === "/pos/management/" ||
    pathname === "/pos/management/configuration" ||
    pathname === "/pos/management/configuration/";

  return (
    <GuardedRoute permission="pos.settings.manage">
      {isRoot ? <OutletConfigurationHubView /> : <Outlet />}
    </GuardedRoute>
  );
}
