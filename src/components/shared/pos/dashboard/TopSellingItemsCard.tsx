import { Link } from "@tanstack/react-router";
import { Utensils } from "lucide-react";
import type { TopDishItem } from "@/types/posDashboard";

interface TopSellingItemsCardProps {
  items: TopDishItem[];
}

export function TopSellingItemsCard({ items }: TopSellingItemsCardProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[14px] font-bold text-slate-900">Top selling items</h2>
        <Link
          to="/pos/menu"
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-3">
              {/* Dish Icon / Thumbnail */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-[12px] shadow-2xs ${
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : idx === 1
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-slate-700 text-white"
                }`}
              >
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13.5px] font-bold text-slate-900">{item.name}</div>
                <div className="text-[11.5px] text-slate-400">{item.platesText}</div>
              </div>
            </div>

            <div className="text-[14px] font-bold text-slate-900">{item.revenueFormatted}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
