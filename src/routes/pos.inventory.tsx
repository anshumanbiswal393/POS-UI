import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { InventoryDashboardView } from "@/components/shared/pos/inventory/views/InventoryDashboardView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/inventory")({
  component: InventoryLayoutRoute,
});

function InventoryLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRootInventory = pathname === "/pos/inventory" || pathname === "/pos/inventory/";

  if (isRootInventory) {
    return (
      <GuardedRoute permission="pos.inventory.view">
        <InventoryDashboardView />
      </GuardedRoute>
    );
  }

  return (
    <GuardedRoute permission="pos.inventory.view">
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
        <div className="responsive-page-x py-4 sm:py-5 space-y-3">
          <Outlet />
        </div>
      </div>
    </GuardedRoute>
  );
}
