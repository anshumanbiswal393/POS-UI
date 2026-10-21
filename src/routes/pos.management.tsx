import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { OutletConfigurationHubView } from "@/components/shared/pos/management/views/OutletConfigurationHubView";

export const Route = createFileRoute("/pos/management")({
  head: () => ({ meta: [{ title: "Management — Retrod POS" }] }),
  component: ManagementLayoutRoute,
});

function ManagementLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot =
    pathname === "/pos/management" ||
    pathname === "/pos/management/" ||
    pathname === "/pos/management/configuration" ||
    pathname === "/pos/management/configuration/";

  return isRoot ? <OutletConfigurationHubView /> : <Outlet />;
}
