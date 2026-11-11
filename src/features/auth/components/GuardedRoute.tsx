import type { ReactNode } from "react";
import AccessDenied from "@/components/AccessDenied";
import { useAuth } from "@/hooks/useAuth";
import type { Permission } from "@/types/rbac";

interface GuardedRouteProps {
  permission?: Permission;
  anyPermissions?: Permission[];
  title?: string;
  description?: string;
  children: ReactNode;
}

export function GuardedRoute({
  permission,
  anyPermissions,
  title,
  description,
  children,
}: GuardedRouteProps) {
  const { can, user } = useAuth();

  if (!user) {
    return <AccessDenied title="Authentication Required" description="Please sign in to access this page." />;
  }

  const roleStr = String(user.role || "").toLowerCase();
  const isMaster =
    roleStr === "super_admin" ||
    roleStr === "owner" ||
    roleStr === "tenant_owner" ||
    roleStr === "general_manager" ||
    roleStr === "pos_admin" ||
    Boolean(user.is_superuser);

  if (isMaster) {
    return <>{children}</>;
  }

  const isWaiter =
    roleStr === "pos_waiter" ||
    roleStr === "waiter" ||
    roleStr.includes("waiter");

  const waiterAllowedPerms = new Set([
    "pos.orders.take",
    "pos.orders.create",
    "pos.orders.view",
    "pos.orders.kot",
    "pos.billing.view",
    "pos.billing.create",
    "pos.reservations.manage",
    "pos.reservations.view",
    "pos.settings.manage",
  ]);

  if (isWaiter) {
    if (permission && waiterAllowedPerms.has(permission)) {
      return <>{children}</>;
    }
    if (anyPermissions?.length && anyPermissions.some((p) => waiterAllowedPerms.has(p))) {
      return <>{children}</>;
    }
  }

  if (permission && !can(permission)) {
    return <AccessDenied title={title} description={description} />;
  }

  if (anyPermissions?.length && !anyPermissions.some((p) => can(p))) {
    return <AccessDenied title={title} description={description} />;
  }

  return <>{children}</>;
}
