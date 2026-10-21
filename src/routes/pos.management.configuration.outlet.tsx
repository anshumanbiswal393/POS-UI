import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { OutletConfigurationHubView } from "@/components/shared/pos/management/views/OutletConfigurationHubView";

export const Route = createFileRoute("/pos/management/configuration/outlet")({
  head: () => ({ meta: [{ title: "Outlet Configuration — Retrod POS" }] }),
  component: OutletConfigLayoutRoute,
});

function OutletConfigLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex =
    pathname === "/pos/management/configuration/outlet" ||
    pathname === "/pos/management/configuration/outlet/";
  return isIndex ? <OutletConfigurationHubView /> : <Outlet />;
}
