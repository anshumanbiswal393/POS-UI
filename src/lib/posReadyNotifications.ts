export type KotReadyNotice = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  outletId?: string;
  kotId?: number;
  orderNumber?: string;
};

const STORAGE_KEY = "retrod:pos:kot-ready-notices:v1";
export const KOT_READY_EVENT = "retrod:pos-kot-ready";

function readAll(): KotReadyNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as KotReadyNotice[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: KotReadyNotice[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 40)));
  } catch {
    /* ignore quota */
  }
}

const DEFAULT_READY_NOTICE: KotReadyNotice = {
  id: "kot-ready-demo-104",
  title: "Order #ORD-104 · Table T-12 Ready",
  message: "Hariyali Panner & Mushroom Pakoda prepared and hot at pickup counter.",
  createdAt: Date.now() - 2 * 60 * 1000,
  orderNumber: "ORD-104",
};

export function listKotReadyNotices(outletId?: string): KotReadyNotice[] {
  const rows = readAll();
  const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const list = raw === null ? [DEFAULT_READY_NOTICE] : rows;
  if (!outletId) return list;
  return list.filter((r) => !r.outletId || r.outletId === outletId);
}

export function dismissKotReadyNotice(id: string) {
  const remaining = readAll().filter((r) => r.id !== id);
  writeAll(remaining);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KOT_READY_EVENT, { detail: { action: "dismiss", id } }));
  }
}

export function pushKotReadyNotice(notice: KotReadyNotice) {
  const next = [notice, ...readAll().filter((r) => r.id !== notice.id)];
  writeAll(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KOT_READY_EVENT, { detail: notice }));
  }
}

export function kotStartMs(createdTimestamp?: number, createdAt?: string): number {
  const ts = Number(createdTimestamp || 0);
  if (ts > 1e12) return ts;
  if (ts > 1e9) return ts * 1000;
  if (createdAt) {
    const parsed = Date.parse(createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}
