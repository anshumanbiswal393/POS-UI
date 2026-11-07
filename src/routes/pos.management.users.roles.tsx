import { createFileRoute } from "@tanstack/react-router";
import { PosUserRolesView } from "@/components/shared/pos/management/views/users/PosUserRolesView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/management/users/roles")({
  head: () => ({
    meta: [
      { title: "User Roles | Retrod POS" },
      { name: "description", content: "POS staff roles and permissions configuration." },
    ],
  }),
  component: PosUserRolesRoute,
});

function PosUserRolesRoute() {
  return (
    <GuardedRoute permission="pos.users.manage">
      <PosUserRolesView />
    </GuardedRoute>
  );
}
