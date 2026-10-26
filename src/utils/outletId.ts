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
