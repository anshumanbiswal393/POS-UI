import { describe, it, expect, vi, beforeEach } from "vitest";
import { posRoomService } from "../posRoomService";
import httpClient from "@/utils/httpClient";

vi.mock("@/utils/httpClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("posRoomService operational date filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store: Record<string, string> = {};
    (globalThis as any).window = {
      location: { search: "", hostname: "localhost" },
    };
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
  });

  it("filters out past checkouts when operational date is Nov 12, 2026", async () => {
    localStorage.setItem("retrod:selected-pos-date", "2026-11-12");

    (httpClient.get as any).mockImplementation((url: string) => {
      if (url.includes("occupied-rooms")) {
        return Promise.resolve({
          data: {
            rooms: [
              {
                unit_id: "unit-002",
                room_number: "002",
                guest_name: "Sudhansu sekhar behera",
                arrival_date: "2026-11-11",
                departure_date: "2026-11-17",
                status: "CHECKED_IN",
              },
              {
                unit_id: "unit-005",
                room_number: "005",
                guest_name: "Sankar Mishra",
                arrival_date: "2026-11-03",
                departure_date: "2026-11-06",
                status: "CHECKED_IN",
              },
            ],
          },
        });
      }
      if (url.includes("/api/inventory/units/")) {
        return Promise.resolve({
          data: {
            results: [
              { id: "unit-002", name: "002" },
              { id: "unit-005", name: "005" },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const rooms = await posRoomService.getRooms(undefined, "2026-11-12");

    const room002 = rooms.find((r) => r.roomNumber === "002");
    const room005 = rooms.find((r) => r.roomNumber === "005");

    expect(room002?.isOccupied).toBe(true);
    expect(room002?.guest?.name).toBe("Sudhansu sekhar behera");

    expect(room005?.isOccupied).toBe(false);
    expect(room005?.guest).toBeUndefined();
  });
});
