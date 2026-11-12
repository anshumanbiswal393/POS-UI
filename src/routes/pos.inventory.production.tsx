import { createFileRoute } from "@tanstack/react-router";
import { DailyPreparationView } from "@/components/shared/pos/inventory/views/DailyPreparationView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/inventory/production")({
  component: DailyPreparationRoute,
});

function DailyPreparationRoute() {
  return (
    <GuardedRoute permission="pos.inventory.view">
      <DailyPreparationView />
    </GuardedRoute>
  );
}
