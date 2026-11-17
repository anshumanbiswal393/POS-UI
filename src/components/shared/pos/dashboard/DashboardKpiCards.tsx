import { Link } from "@tanstack/react-router";
import type { PosDashboardStats } from "@/types/posDashboard";
import { KpiCard } from "@/components/ui/Primitives";

interface DashboardKpiCardsProps {
  stats: PosDashboardStats;
}

export function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
      {/* 1. Total collections */}
      <KpiCard
        label="Total Collections"
        value={stats.totalCollectionsFormatted}
        accent="brand"
        subtitle="Paid today"
      />

      {/* 2. Total orders */}
      <KpiCard
        label="Total Orders"
        value={String(stats.totalOrders)}
        accent="info"
        subtitle="Placed today"
      />

      {/* 3. Active tables */}
      <KpiCard
        label="Active Tables"
        value={`${stats.activeTablesCount} / ${stats.totalTablesCount}`}
        accent="warning"
        subtitle={`${stats.occupancyPercentage}% occupied`}
      />

      {/* 4. Unpaid dues */}
      <Link to="/pos/settlement" className="block">
        <KpiCard
          label="Unpaid Dues"
          value={stats.unpaidBillsFormatted}
          accent="error"
          subtitle="Pending settlement →"
        />
      </Link>
    </div>
  );
}
