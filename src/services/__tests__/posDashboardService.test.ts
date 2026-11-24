import { describe, it, expect } from "vitest";
import { mapDtoToDashboardModel, formatINR } from "../posDashboardService";
import type { PosDashboardApiResponse } from "@/types/posDashboardApi";

describe("posDashboardService", () => {
  it("formats INR currency correctly", () => {
    expect(formatINR(5265)).toBe("₹5,265");
    expect(formatINR(0)).toBe("₹0");
  });

  it("maps completed dine-in order and aggregates collections and top selling items", () => {
    const mockApiResponse: PosDashboardApiResponse = {
      success: true,
      outletId: "8f7e6d5c-4b3a-210f-9e8d-7c6b5a4f3e2d",
      outletName: "Anshu Suite Restaurant",
      date: "17 Nov 2026",
      currency: "INR",
      stats: {
        totalCollections: 5265,
        totalOrders: 1,
        activeTablesCount: 0,
        totalTablesCount: 7,
        unpaidBillsAmount: 0,
        unpaidBillsCount: 0,
        roomChargesAmount: 0,
        roomChargesCount: 0,
      },
      salesGraph: [
        { hour: "12 AM", todaySales: 0, yesterdaySales: 0 },
        { hour: "4 AM", todaySales: 0, yesterdaySales: 0 },
        { hour: "8 AM", todaySales: 0, yesterdaySales: 0 },
        { hour: "12 PM", todaySales: 0, yesterdaySales: 0 },
        { hour: "4 PM", todaySales: 5265, yesterdaySales: 0 },
        { hour: "8 PM", todaySales: 0, yesterdaySales: 0 },
      ],
      orderTypes: [
        { type: "dine_in", label: "Dine-in", count: 1, percentage: 100, color: "#0f766e" },
        { type: "takeaway", label: "Takeaway", count: 0, percentage: 0, color: "#0d9488" },
        { type: "room_service", label: "Room service", count: 0, percentage: 0, color: "#94a3b8" },
      ],
      liveOrders: [],
      paymentSummary: {
        cash: { amount: 5265, percentage: 100 },
        card: { amount: 0, percentage: 0 },
        upiWallets: { amount: 0, percentage: 0 },
        other: { amount: 0, percentage: 0 },
        total: 5265,
      },
      tables: [
        { tableNumber: "1", status: "available", guests: 4, currentOrderAmount: 0 },
        { tableNumber: "2", status: "available", guests: 4, currentOrderAmount: 0 },
        { tableNumber: "3", status: "available", guests: 4, currentOrderAmount: 0 },
      ],
      topSellingItems: [
        {
          id: "chicken biryani",
          name: "chicken biryani",
          category: "Main Course",
          quantitySold: 3,
          unitLabel: "Plates",
          revenue: 1200,
        },
        {
          id: "masala colddrinks",
          name: "masala colddrinks",
          category: "Beverages",
          quantitySold: 12,
          unitLabel: "Plates",
          revenue: 600,
        },
        {
          id: "mushroom dum biryani",
          name: "mushroom dum biryani",
          category: "Main Course",
          quantitySold: 9,
          unitLabel: "Plates",
          revenue: 2700,
        },
      ],
      attentionAlerts: [],
      operationalMetrics: [
        {
          avgPrepTimeMinutes: 18,
          successfulOrdersCount: 1,
          complimentaryOrdersCount: 0,
          cancelledOrdersCount: 0,
          exceptionsCount: 0,
        },
      ],
    };

    const dashboardModel = mapDtoToDashboardModel(mockApiResponse, false);

    expect(dashboardModel.stats.totalCollections).toBe(5265);
    expect(dashboardModel.stats.totalCollectionsFormatted).toBe("₹5,265");
    expect(dashboardModel.stats.totalOrders).toBe(1);
    expect(dashboardModel.orderTypes.find((ot) => ot.type === "dine_in")?.count).toBe(1);
    expect(dashboardModel.orderTypes.find((ot) => ot.type === "dine_in")?.percentage).toBe(100);
    expect(dashboardModel.paymentSummary.cash.amount).toBe(5265);
    expect(dashboardModel.paymentSummary.totalAmount).toBe(5265);
    expect(dashboardModel.topSellingItems.length).toBe(3);
    expect(dashboardModel.topSellingItems[0].name).toBe("chicken biryani");
    expect(dashboardModel.topSellingItems[0].platesText).toBe("3 Plates");
    expect(dashboardModel.operations.avgPrepTimeMinutes).toBe(18);
    expect(dashboardModel.operations.successfulCount).toBe(1);
  });

  it("allocates room order and room charge payments under other category in payment summary", () => {
    const mockApiResponse: PosDashboardApiResponse = {
      success: true,
      outletId: "8f7e6d5c-4b3a-210f-9e8d-7c6b5a4f3e2d",
      outletName: "Anshu Suite Restaurant",
      date: "17 Nov 2026",
      currency: "INR",
      stats: {
        totalCollections: 1200,
        totalOrders: 1,
        activeTablesCount: 0,
        totalTablesCount: 7,
        unpaidBillsAmount: 0,
        unpaidBillsCount: 0,
        roomChargesAmount: 1200,
        roomChargesCount: 1,
      },
      salesGraph: [],
      orderTypes: [
        { type: "room_service", label: "Room service", count: 1, percentage: 100, color: "#94a3b8" },
      ],
      liveOrders: [],
      paymentSummary: {
        cash: { amount: 0, percentage: 0 },
        card: { amount: 0, percentage: 0 },
        upiWallets: { amount: 0, percentage: 0 },
        other: { amount: 1200, percentage: 100 },
        total: 1200,
      },
      tables: [],
      topSellingItems: [],
      attentionAlerts: [],
      operationalMetrics: [],
    };

    const dashboardModel = mapDtoToDashboardModel(mockApiResponse, false);
    expect(dashboardModel.paymentSummary.other.amount).toBe(1200);
    expect(dashboardModel.paymentSummary.other.percentage).toBe(100);
    expect(dashboardModel.paymentSummary.other.formatted).toBe("₹1,200");
  });
});
