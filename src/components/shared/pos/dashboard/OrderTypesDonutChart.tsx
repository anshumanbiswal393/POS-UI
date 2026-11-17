import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { OrderTypeMixItem } from "@/types/posDashboard";

interface OrderTypesDonutChartProps {
  orderTypes: OrderTypeMixItem[];
  totalCount: number;
}

export function OrderTypesDonutChart({ orderTypes }: OrderTypesDonutChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { slices, totalCount } = useMemo(() => {
    const withoutDelivery = orderTypes.filter((item) => item.type !== "delivery");
    const total = withoutDelivery.reduce((sum, item) => sum + item.count, 0);
    const slices = withoutDelivery.map((item) => ({
      ...item,
      percentage: total ? Math.round((item.count / total) * 1000) / 10 : 0,
    }));
    return { slices, totalCount: total };
  }, [orderTypes]);

  const resolveSliceColor = (entry: OrderTypeMixItem) => {
    if (entry.type === "dine_in") return "var(--primary, #006a4e)";
    if (entry.type === "takeaway") return "#f59e0b"; // warm amber - distinctive from green & blue, visible and not too dark
    return entry.color;
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-400/80 bg-white p-2.5 sm:p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-1">
        <h2 className="text-[13px] font-bold text-slate-900">Order Types</h2>
        <span className="text-[10.5px] font-semibold text-slate-500">{totalCount} Orders</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-row items-center justify-between gap-2.5 pt-1">
        {/* Donut Chart with Center Text */}
        <div className="relative aspect-square h-[98px] sm:h-[108px] max-h-[114px] w-auto shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={48}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {slices.map((entry) => (
                    <Cell key={entry.id} fill={resolveSliceColor(entry)} stroke="#fff" strokeWidth={1.5} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-slate-100" />
          )}

          {/* Centered Total Overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[16px] font-black tracking-tight text-slate-900 leading-none">
              {totalCount}
            </span>
            <span className="text-[9px] font-medium text-slate-400 mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex w-full min-w-0 flex-1 flex-col justify-center space-y-1.5 pl-0.5">
          {slices.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-1.5 text-[11px] min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: resolveSliceColor(item) }}
                />
                <span className="truncate font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="shrink-0 font-bold text-slate-900 whitespace-nowrap">
                {item.count}{" "}
                <span className="font-normal text-slate-400 text-[10px]">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderTypesDonutChart;
