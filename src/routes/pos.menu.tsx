import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PosMenuHeader } from "@/components/shared/pos/menu/PosMenuHeader";
import { MenuListManagerView } from "@/components/shared/pos/menu/views/MenuListManagerView";

export const Route = createFileRoute("/pos/menu")({
  
  component: MenuLayoutRoute,
});

function MenuLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRootMenu = pathname === "/pos/menu" || pathname === "/pos/menu/";

  return (
    <div className="space-y-4">
      <PosMenuHeader />
      {isRootMenu ? <MenuListManagerView /> : <Outlet />}
    </div>
  );
}
