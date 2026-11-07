import { createFileRoute } from "@tanstack/react-router";
import { PosUsersView } from "@/components/shared/pos/management/views/users/PosUsersView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/management/users/")({
  head: () => ({
    meta: [
      { title: "Users | Retrod POS" },
      { name: "description", content: "POS staff users management and credentials." },
    ],
  }),
  component: PosUsersRoute,
});

function PosUsersRoute() {
  return (
    <GuardedRoute permission="pos.users.manage">
      <PosUsersView />
    </GuardedRoute>
  );
}
