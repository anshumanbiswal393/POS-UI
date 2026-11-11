import { Outlet, createFileRoute, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PosDashboardManager } from "@/components/shared/pos/PosDashboardManager";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleStr = String(user?.role || "").toLowerCase();
  const isKitchen = roleStr === "pos_kitchen" || roleStr.includes("kitchen");
  const isWaiter = roleStr === "pos_waiter" || roleStr === "waiter" || roleStr.includes("waiter");

  useEffect(() => {
    if ((pathname === "/pos" || pathname === "/pos/") && isKitchen) {
      navigate({ to: "/pos/kot", replace: true });
    } else if ((pathname === "/pos" || pathname === "/pos/") && isWaiter) {
      navigate({ to: "/pos/billing", replace: true });
    } else if (
      isWaiter &&
      (pathname.startsWith("/pos/inventory") ||
        pathname.startsWith("/pos/management") ||
        pathname.startsWith("/pos/reports") ||
        pathname.startsWith("/pos/menu"))
    ) {
      navigate({ to: "/pos/billing", replace: true });
    }
  }, [pathname, isKitchen, isWaiter, navigate]);

  if (pathname === "/pos" || pathname === "/pos/") {
    if (isKitchen || isWaiter) {
      return null;
    }
    return <PosDashboardManager />;
  }
  return <Outlet />;
}
