import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PosDashboardManager } from "@/components/shared/pos/PosDashboardManager";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Retrod | POS" },
      {
        name: "description",
        content: "Live sales, leakage, and online channel health for the outlet.",
      },
    ],
  }),
  component: PosLayoutRoute,
});

function PosLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/pos" || pathname === "/pos/") {
    return <PosDashboardManager />;
  }
  return <Outlet />;
}
