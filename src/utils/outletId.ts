import type { PosOutlet } from "@/types/posMenu";

/**
 * True when outlet id is a persisted Postgres UUID (real backend outlet).
 * Outlets start clean without hardcoded dummy POS data; items and orders are populated dynamically.
 */
export function isBackendOutletId(outletId?: string | null): boolean {
  return Boolean(
    outletId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId),
  );
}

/** Legacy in-memory Highway Inn id — replaced by a Postgres UUID once the outlet is saved. */
export function isHighwayDemoOutlet(outletId?: string | null): boolean {
  return outletId === "outlet-primary";
}

export function isHighwayInnName(name?: string | null, code?: string | null): boolean {
  const n = (name || "").toUpperCase();
  const c = (code || "").toUpperCase();
  return c === "HI-MAIN" || n.includes("HIGHWAY INN");
}

export function getOutletDedupKey(outlet: PosOutlet): string {
  if (isHighwayInnName(outlet.name, outlet.code) || isHighwayDemoOutlet(outlet.id)) {
    return "highway-inn";
  }
  const code = (outlet.code || "").trim().toUpperCase();
  if (code) return `code:${code}`;
  const name = (outlet.name || "").trim().toUpperCase();
  if (name) return `name:${name}`;
  return `id:${outlet.id}`;
}

/**
 * Deduplicate a list of outlets ensuring each unique physical/virtual outlet
 * is maintained only ONCE.
 * - Highway Inn always collapses into a single entry (preferring real backend UUID if present).
 * - Other outlets are deduplicated by unique code or normalized name.
 */
export function deduplicateOutlets(outlets: PosOutlet[], activeId?: string): PosOutlet[] {
  const byKey = new Map<string, PosOutlet>();

  for (const o of outlets) {
    if (!o || !o.id) continue;
    const key = getOutletDedupKey(o);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, o);
      continue;
    }

    const existingIsBackend = isBackendOutletId(existing.id);
    const incomingIsBackend = isBackendOutletId(o.id);

    // Prefer backend UUID over local/demo ID
    if (!existingIsBackend && incomingIsBackend) {
      byKey.set(key, { ...existing, ...o });
    } else if (existingIsBackend && !incomingIsBackend) {
      // Keep existing backend outlet
      byKey.set(key, { ...o, ...existing });
    } else if (activeId && o.id === activeId) {
      // Prefer active outlet
      byKey.set(key, { ...existing, ...o });
    } else if (existing.status !== "Active" && o.status === "Active") {
      byKey.set(key, { ...existing, ...o });
    }
  }

  return Array.from(byKey.values());
}
