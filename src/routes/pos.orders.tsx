import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PosLiveOrdersManager } from "@/components/shared/pos/orders/PosLiveOrdersManager";

export const Route = createFileRoute("/pos/orders")({
  
  component: OrdersLayout,
});

function OrdersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/pos/orders" || pathname === "/pos/orders/") {
    return <PosLiveOrdersManager />;
  }
  return <Outlet />;
}
