import { createFileRoute } from "@tanstack/react-router";
import { PosReservationsManager } from "@/components/shared/pos/reservations/PosReservationsManager";

export const Route = createFileRoute("/pos/reservations")({
  component: PosReservationsRoute,
});

function PosReservationsRoute() {
  return <PosReservationsManager />;
}

