import {
  POS_NAV_ITEMS,
  POS_FOOTER_NAV_ITEMS,
  type PosNavChild,
  type PosNavItem,
} from "./pos-nav-config";
import type { LucideIcon } from "lucide-react";

export type FlatPosNavRouteNode = {
  id: string;
  label: string;
  to: string;
  exact?: boolean;
  icon?: LucideIcon;
};

const LS_PINNED = "retrod.pos.nav.pinned.v1";
const LS_PINNED_FALLBACK = "retrod.nav.pinned.v1";
const DEFAULT_PINNED_IDS = ["take-order", "billing"];

function readArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(values));
}

export function readPinnedNavNodeIds(): string[] {
  if (typeof window === "undefined") return DEFAULT_PINNED_IDS;
  const specific = readArray(LS_PINNED);
  if (specific.length > 0) return specific;
  const fallback = readArray(LS_PINNED_FALLBACK);
  if (fallback.length > 0) return fallback;
  const raw = localStorage.getItem(LS_PINNED);
  if (raw === null) {
    writeArray(LS_PINNED, DEFAULT_PINNED_IDS);
    return DEFAULT_PINNED_IDS;
  }
  return [];
}

export function togglePinnedNavNodeId(nodeId: string): string[] {
  const current = readPinnedNavNodeIds();
  const next = current.includes(nodeId)
    ? current.filter((id) => id !== nodeId)
    : [...current, nodeId];
  writeArray(LS_PINNED, next);
  return next;
}

export function movePinnedNavNode(fromIndex: number, toIndex: number): string[] {
  const current = readPinnedNavNodeIds();
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= current.length ||
    toIndex >= current.length ||
    fromIndex === toIndex
  ) {
    return current;
  }
  const cloned = [...current];
  const [picked] = cloned.splice(fromIndex, 1);
  cloned.splice(toIndex, 0, picked);
  writeArray(LS_PINNED, cloned);
  return cloned;
}

export function getAllPosRouteNodes(): FlatPosNavRouteNode[] {
  const list: FlatPosNavRouteNode[] = [];
  function walk(items: Array<PosNavItem | PosNavChild>) {
    for (const item of items) {
      if (item.to) {
        list.push({
          id: item.id,
          label: item.label,
          to: item.to,
          exact: (item as PosNavItem).exact,
          icon: item.icon,
        });
      }
      if (item.children?.length) {
        walk(item.children);
      }
    }
  }
  walk(POS_NAV_ITEMS);
  walk(POS_FOOTER_NAV_ITEMS);
  return list;
}
