import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PosLiveOrdersManager } from "@/components/shared/pos/orders/PosLiveOrdersManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/orders")({
  component: OrdersLayout,
});

function OrdersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/pos/orders" || pathname === "/pos/orders/") {
    return (
      <GuardedRoute permission="pos.orders.view">
        <PosLiveOrdersManager />
      </GuardedRoute>
    );
  }
  return <Outlet />;
}
