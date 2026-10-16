/**
 * True when outlet id is a persisted Postgres UUID (real HO/Kitchen).
 * False for Highway demo (`outlet-primary`) and other local mock ids —
 * those keep full dummy POS data; UUID outlets stay blank until you feed them.
 */
export function isBackendOutletId(outletId?: string | null): boolean {
  return Boolean(
    outletId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outletId),
  );
}

/** Highway Inn demo flagship — owns all existing mock/dummy POS data. */
export function isHighwayDemoOutlet(outletId?: string | null): boolean {
  return outletId === "outlet-primary";
}
