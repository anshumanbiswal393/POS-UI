import { Link } from "@tanstack/react-router";
import type { PosDashboardStats } from "@/types/posDashboard";

interface DashboardKpiCardsProps {
  stats: PosDashboardStats;
}

export function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  const cards = [
    {
      label: "TOTAL COLLECTIONS",
      value: stats.totalCollectionsFormatted,
      subtitle: "Paid today",
      accent: "#006a4e",
      href: undefined,
    },
    {
      label: "TOTAL ORDERS",
      value: String(stats.totalOrders),
      subtitle: "Placed today",
      accent: "#2563eb",
      href: undefined,
    },
    {
      label: "ACTIVE TABLES",
      value: `${stats.activeTablesCount}/${stats.totalTablesCount}`,
      subtitle: `${stats.occupancyPercentage}% occupied`,
      accent: "#d97706",
      href: "/pos/tables",
    },
    {
      label: "UNPAID DUES",
      value: stats.unpaidBillsFormatted,
      subtitle: "Pending settlement →",
      accent: "#dc2626",
      href: "/pos/settlement",
    },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
      {cards.map((c) => {
        const CardBody = (
          <div className="relative flex flex-col justify-between rounded-xl border border-slate-400/80 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-2xs hover:shadow-xs transition min-w-0">
            <div
              className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r"
              style={{ background: c.accent }}
            />
            <div className="text-[10px] sm:text-[10.5px] font-bold tracking-wider text-slate-500 uppercase truncate">
              {c.label}
            </div>
            <div className="my-0.5 font-mono text-[19px] sm:text-[21px] font-bold leading-tight tracking-tight text-slate-900 truncate">
              {c.value}
            </div>
            <div className="text-[10.5px] leading-tight text-slate-500 truncate">
              {c.subtitle}
            </div>
          </div>
        );

        if (c.href) {
          return (
            <Link key={c.label} to={c.href} className="block min-w-0">
              {CardBody}
            </Link>
          );
        }
        return (
          <div key={c.label} className="min-w-0">
            {CardBody}
          </div>
        );
      })}
    </div>
  );
}
