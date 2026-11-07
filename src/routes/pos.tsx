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

  useEffect(() => {
    if ((pathname === "/pos" || pathname === "/pos/") && isKitchen) {
      navigate({ to: "/pos/kot", replace: true });
    }
  }, [pathname, isKitchen, navigate]);

  if (pathname === "/pos" || pathname === "/pos/") {
    if (isKitchen) {
      return null;
    }
    return <PosDashboardManager />;
  }
  return <Outlet />;
}
