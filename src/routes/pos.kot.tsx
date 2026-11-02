import { createFileRoute } from "@tanstack/react-router";
import { PosKotManager } from "@/components/shared/pos/orders/PosKotManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/kot")({
  component: PosKotRoute,
});

function PosKotRoute() {
  return (
    <GuardedRoute permission="pos.kot.view">
      <PosKotManager />
    </GuardedRoute>
  );
}
