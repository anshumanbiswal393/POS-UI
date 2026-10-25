import type { PosOutlet } from "@/types/posMenu";

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
