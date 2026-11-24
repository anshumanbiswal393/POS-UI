import { createFileRoute } from "@tanstack/react-router";
import { WaiterNotificationsView } from "@/components/shared/pos/notifications/WaiterNotificationsView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/notifications")({
  component: PosNotificationsRoute,
});

function PosNotificationsRoute() {
  return (
    <GuardedRoute
      anyPermissions={[
        "pos.notifications.waiter",
        "pos.orders.view",
        "pos.orders.take",
        "pos.orders.kot",
        "dashboard.view",
      ]}
    >
      <WaiterNotificationsView />
    </GuardedRoute>
  );
}
