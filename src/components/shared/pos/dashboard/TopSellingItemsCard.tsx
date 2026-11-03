import { Link } from "@tanstack/react-router";
import { Utensils } from "lucide-react";
import type { TopDishItem } from "@/types/posDashboard";

interface TopSellingItemsCardProps {
  items: TopDishItem[];
}

export function TopSellingItemsCard({ items }: TopSellingItemsCardProps) {
  const top3 = items.slice(0, 3);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[13.5px] font-bold text-slate-900">Top selling items</h2>
          <span className="text-[10.5px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
            Top 3
          </span>
        </div>
        <Link
          to="/pos/menu"
          className="text-[11.5px] font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {top3.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-4 text-slate-400 text-center">
          <Utensils className="w-6 h-6 mb-1 opacity-30 text-slate-400" />
          <span className="text-[12px] font-semibold text-slate-500">No dish sales recorded today</span>
          <span className="text-[10.5px] text-slate-400">Top 3 selling items will reflect here live</span>
        </div>
      ) : (
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around divide-y divide-slate-100">
          {top3.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Ranking Badge */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-[11px] shadow-2xs ${
                    idx === 0
                      ? "bg-primary text-white"
                      : idx === 1
                        ? "bg-primary/75 text-white"
                        : "bg-slate-600 text-white"
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{item.platesText}</div>
                </div>
              </div>

              <div className="text-[13.5px] font-extrabold text-slate-900 shrink-0">
                {item.revenueFormatted}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
