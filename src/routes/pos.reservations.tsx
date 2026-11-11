import { createFileRoute } from "@tanstack/react-router";
import { PosReservationsManager } from "@/components/shared/pos/reservations/PosReservationsManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/reservations")({
  component: PosReservationsRoute,
});

function PosReservationsRoute() {
  return (
    <GuardedRoute anyPermissions={["pos.reservations.manage", "pos.reservations.view", "pos.orders.view"]}>
      <PosReservationsManager />
    </GuardedRoute>
  );
}
