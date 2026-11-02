import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { InventoryDashboardView } from "@/components/shared/pos/inventory/views/InventoryDashboardView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/inventory")({
  component: InventoryLayoutRoute,
});

function InventoryLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRootInventory = pathname === "/pos/inventory" || pathname === "/pos/inventory/";

  return (
    <GuardedRoute permission="pos.inventory.view">
      <div className="space-y-3">
        {isRootInventory ? <InventoryDashboardView /> : <Outlet />}
      </div>
    </GuardedRoute>
  );
}
