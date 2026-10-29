import { isHighwayDemoOutlet, isHighwayInnName } from "@/utils/outletId";
import type { MenuItem, MenuCategory } from "@/types/posMenu";
import type { HotelRoom } from "@/types/posRoomService";
import type { RestaurantTable } from "@/types/posTables";

/** Highway Inn name helpers (no seeded demo overlay). */
export function isHighwayInnOutlet(outlet?: {
  id?: string | null;
  name?: string | null;
  code?: string | null;
} | null): boolean {
  if (!outlet) return false;
  return isHighwayDemoOutlet(outlet.id) || isHighwayInnName(outlet.name, outlet.code);
}

/** Demo folio ids are never used — all charges go through the database. */
export function isHighwayDemoFolio(_reservationId?: string, _folioId?: string): boolean {
  return false;
}

export function getHighwayDemoMenu(_outletId: string): MenuItem[] {
  return [];
}

export function mergeHighwayDemoMenu(existing: MenuItem[], _outletId: string): MenuItem[] {
  return existing;
}

export function mergeHighwayDemoCategories(
  existing: MenuCategory[],
  _outletId: string,
): MenuCategory[] {
  return existing;
}

export const HIGHWAY_DEMO_ROOMS: HotelRoom[] = [];

export function mergeHighwayDemoRooms(apiRooms: HotelRoom[]): HotelRoom[] {
  return apiRooms;
}

export const HIGHWAY_DEMO_TABLES: RestaurantTable[] = [];

export const HIGHWAY_DEMO_AREAS: string[] = [];

export function mergeHighwayDemoTables(apiTables: RestaurantTable[]): RestaurantTable[] {
  return apiTables;
}

export function mergeHighwayDemoAreas(apiAreas: string[]): string[] {
  return apiAreas;
}
