import type { PosOutlet } from "@/types/posMenu";
import { isBackendOutletId } from "@/utils/outletId";

export const DINING_OUTLET_KINDS = new Set([
  "PRIMARY",
  "BAR",
  "CAFE",
  "BANQUET",
  "ROOM_SERVICE",
]);

export function normalizeOutletKind(raw?: string | null): string {
  return (raw || "PRIMARY").toUpperCase().replace(/\s+/g, "_");
}

/** Guest dining floors only — Take Order / Billing top-bar switcher. */
export function isDiningOutlet(outlet: PosOutlet): boolean {
  if (outlet.id === "outlet-primary") return true;
  const kind = normalizeOutletKind(outlet.outletKind);
  if (kind === "HO" || kind === "KITCHEN" || kind === "VIRTUAL") return false;
  if (DINING_OUTLET_KINDS.has(kind)) return true;
  return outlet.type === "Primary Outlet";
}

export function locationRoleLabel(outlet: PosOutlet): "HO" | "Kitchen" | "Outlet" {
  const kind = normalizeOutletKind(outlet.outletKind);
  if (kind === "HO") return "HO";
  if (kind === "KITCHEN") return "Kitchen";
  return "Outlet";
}

/** First live Postgres dining floor — use this so Take Order tables persist. */
export function firstLiveDiningOutlet(outlets: PosOutlet[]): PosOutlet | undefined {
  const live = outlets.filter((o) => isBackendOutletId(o.id) && o.status !== "Inactive");
  return (
    live.find(isDiningOutlet) || live.find((o) => locationRoleLabel(o) === "Outlet")
  );
}
