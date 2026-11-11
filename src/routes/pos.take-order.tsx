import { createFileRoute } from "@tanstack/react-router";
import { PosTakeOrderManager } from "@/components/shared/pos/PosTakeOrderManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/take-order")({
  component: PosTakeOrderRoute,
});

function PosTakeOrderRoute() {
  return (
    <GuardedRoute anyPermissions={["pos.orders.take", "pos.orders.create", "pos.orders.view"]}>
      <PosTakeOrderManager />
    </GuardedRoute>
  );
}
