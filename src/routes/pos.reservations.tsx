import { createFileRoute } from "@tanstack/react-router";
import { PosReservationsManager } from "@/components/shared/pos/reservations/PosReservationsManager";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/reservations")({
  component: PosReservationsRoute,
});

function PosReservationsRoute() {
  return (
    <GuardedRoute permission="pos.orders.view">
      <PosReservationsManager />
    </GuardedRoute>
  );
}
