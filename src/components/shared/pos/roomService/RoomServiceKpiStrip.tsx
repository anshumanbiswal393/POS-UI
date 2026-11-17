import React from "react";
import type { RoomServiceKpis } from "@/types/posRoomService";
import { KpiCard } from "@/components/ui/Primitives";

interface RoomServiceKpiStripProps {
  kpis?: RoomServiceKpis;
}

export function RoomServiceKpiStrip({ kpis }: RoomServiceKpiStripProps) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:p-6 pb-2 bg-surface border-b border-border">
      {/* 1. Active Orders */}
      <KpiCard
        label="Active Orders"
        value={String(kpis.activeOrdersCount)}
        accent="brand"
        subtitle="In-flight room checks"
      />

      {/* 2. Kitchen Queue */}
      <KpiCard
        label="Kitchen Prep"
        value={String(kpis.kitchenQueueCount)}
        accent="warning"
        subtitle="Cooking for rooms"
      />

      {/* 3. Dispatched / En Route */}
      <KpiCard
        label="On The Way"
        value={String(kpis.dispatchedCount)}
        accent="info"
        subtitle="Out for delivery"
      />

      {/* 4. Tray Clearance Alerts */}
      <KpiCard
        label="Tray Clearance"
        value={`${kpis.pendingClearancesCount} Rooms`}
        accent="warning"
        subtitle="Trays ready for pickup"
      />

      {/* 5. Avg Delivery Speed */}
      <KpiCard
        label="Avg Speed"
        value={`${kpis.avgDeliveryMinutes}m`}
        accent="brand"
        subtitle="Delivery target <30m"
      />

      {/* 6. Today's Revenue */}
      <KpiCard
        label="Today Revenue"
        value={`₹${kpis.todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        accent="success"
        subtitle="Room service billed"
      />
    </div>
  );
}
