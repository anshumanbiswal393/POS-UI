import { createFileRoute } from "@tanstack/react-router";
import { PosAllOrdersManager } from "@/components/shared/pos/orders/PosAllOrdersManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/orders/all")({
  component: PosAllOrdersRoute,
});

function PosAllOrdersRoute() {
  return (
    <GuardedRoute permission="pos.orders.view">
      <PosAllOrdersManager />
    </GuardedRoute>
  );
}
