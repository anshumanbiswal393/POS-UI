import { Link } from "@tanstack/react-router";
import { Utensils } from "lucide-react";
import type { TopDishItem } from "@/types/posDashboard";
import { toTitleCase } from "@/utils/textUtils";

interface TopSellingItemsCardProps {
  items: TopDishItem[];
  isToday?: boolean;
}

export function TopSellingItemsCard({ items, isToday = true }: TopSellingItemsCardProps) {
  const top3Items = (items || []).slice(0, 3);

  return (
    <div className="flex min-h-[175px] flex-col rounded-xl border border-slate-400/80 bg-white p-2.5 sm:p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[13.5px] font-bold text-slate-900">Top selling items</h2>
        <Link
          to="/pos/menu"
          className="text-[11.5px] font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {top3Items.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center p-2 text-slate-400">
          <Utensils className="h-5 w-5 stroke-[1.5] mb-1 opacity-40 text-slate-400" />
          <p className="text-[11.5px] font-medium text-slate-600">{isToday ? "No dishes sold today" : "No dishes sold on this date"}</p>
          <p className="text-[10px] text-slate-400">Items will appear here as bills are placed</p>
        </div>
      ) : (
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around divide-y divide-slate-100">
          {top3Items.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between py-1 first:pt-0.5 last:pb-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Dish Icon / Thumbnail */}
                <div
                  className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] shadow-2xs ${
                    idx === 0
                      ? "bg-primary text-primary-foreground"
                      : idx === 1
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-slate-700 text-white"
                  }`}
                >
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-slate-900 truncate">
                    {toTitleCase(item.name)}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[11.5px] font-bold text-slate-700 shrink-0">
                {item.platesText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopSellingItemsCard;
