import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PosMenuHeader } from "@/components/shared/pos/menu/PosMenuHeader";
import { MenuListManagerView } from "@/components/shared/pos/menu/views/MenuListManagerView";
import { GuardedRoute } from "@/features/auth/components/GuardedRoute";

export const Route = createFileRoute("/pos/menu")({
  component: MenuLayoutRoute,
});

function MenuLayoutRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRootMenu = pathname === "/pos/menu" || pathname === "/pos/menu/";

  return (
    <GuardedRoute permission="pos.menu.view">
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
        <PosMenuHeader />
        <div className="responsive-page-x py-4 sm:py-5 space-y-4">
          {isRootMenu ? <MenuListManagerView /> : <Outlet />}
        </div>
      </div>
    </GuardedRoute>
  );
}
