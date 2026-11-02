import { createFileRoute } from "@tanstack/react-router";
import { PosDueSettlementManager } from "@/components/shared/pos/orders/PosDueSettlementManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/settlement")({
  component: PosSettlementRoute,
});

function PosSettlementRoute() {
  return (
    <GuardedRoute permission="pos.billing.settle">
      <PosDueSettlementManager />
    </GuardedRoute>
  );
}
