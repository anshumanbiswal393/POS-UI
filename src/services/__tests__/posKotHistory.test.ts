import { describe, it, expect, vi, beforeEach } from "vitest";
import httpClient from "@/utils/httpClient";
import { liveGetKot } from "../posOrderLive";

vi.mock("@/utils/httpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/utils/outletId", () => ({
  isBackendOutletId: (id?: string) => Boolean(id && id !== "none"),
}));

describe("liveGetKot - History vs Cook Queue filtering", () => {
  const mockOutletId = "11111111-2222-3333-4444-555555555555";

  const rawKots = [
    {
      id: "kot-1",
      kotId: 1,
      kotNumber: "KOT-001",
      status: "PREPARING",
      statusLabel: "Preparing",
      createdAt: "23 Nov 2026 12:00:00",
    },
    {
      id: "kot-2",
      kotId: 2,
      kotNumber: "KOT-002",
      status: "READY",
      statusLabel: "Ready",
      createdAt: "23 Nov 2026 12:30:00",
    },
    {
      id: "kot-3",
      kotId: 3,
      kotNumber: "KOT-003",
      status: "SERVED",
      statusLabel: "Served",
      createdAt: "23 Nov 2026 13:00:00",
    },
    {
      id: "kot-4",
      kotId: 4,
      kotNumber: "KOT-004",
      status: "CANCELLED",
      statusLabel: "Cancelled",
      createdAt: "23 Nov 2026 13:30:00",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves ALL statuses (Prepared, Ready, Served, Cancelled) when querying history with status='ALL'", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        records: rawKots,
        totalCount: rawKots.length,
      },
    } as any);

    const result = await liveGetKot(mockOutletId, {
      status: "ALL",
      date_from: "2026-11-23",
      date_to: "2026-11-23",
      includeHistory: true,
      includeSettled: true,
    });

    expect(result.records).toHaveLength(4);
    const statuses = result.records.map((r) => r.status);
    expect(statuses).toContain("In Kitchen");
    expect(statuses).toContain("Prepared");
    expect(statuses).toContain("Served");
    expect(statuses).toContain("Cancelled");
  });

  it("preserves Prepared/Served records when querying completed history", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        records: [rawKots[1], rawKots[2]],
        totalCount: 2,
      },
    } as any);

    const result = await liveGetKot(mockOutletId, {
      status: "READY,SERVED",
      date_from: "2026-11-23",
      date_to: "2026-11-23",
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0].status).toBe("Prepared");
    expect(result.records[1].status).toBe("Served");
  });

  it("filters out Prepared, Ready, Served, and Cancelled tickets when querying live cook queue without history filters", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        records: rawKots,
        totalCount: rawKots.length,
      },
    } as any);

    // Call without history filters (active KDS screen)
    const result = await liveGetKot(mockOutletId);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe("kot-1");
    expect(result.records[0].status).toBe("In Kitchen");
  });
});
