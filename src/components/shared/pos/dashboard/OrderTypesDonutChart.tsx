import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { OrderTypeMixItem } from "@/types/posDashboard";

interface OrderTypesDonutChartProps {
  orderTypes: OrderTypeMixItem[];
  totalCount: number;
}

export function OrderTypesDonutChart({ orderTypes, totalCount }: OrderTypesDonutChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolveSliceColor = (entry: OrderTypeMixItem) => {
    if (entry.type === "dine_in") return "var(--primary)";
    if (entry.type === "takeaway") return "var(--color-primary-pressed, var(--primary))";
    return entry.color;
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-300 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="text-[13.5px] font-bold text-slate-900">Order Types</h2>
        <span className="text-[11px] font-semibold text-slate-500">{totalCount} Orders</span>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 pt-1.5">
        {/* Donut Chart with Center Text */}
        <div className="relative h-[135px] w-[135px] shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {orderTypes.map((entry) => (
                    <Cell key={entry.id} fill={resolveSliceColor(entry)} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-6 border-slate-100" />
          )}

          {/* Centered Total Overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[18px] font-black tracking-tight text-slate-900 leading-none">
              {totalCount}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-1 flex-col justify-center space-y-2 pl-1">
          {orderTypes.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-[11.5px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: resolveSliceColor(item) }}
                />
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="font-bold text-slate-900">
                {item.count}{" "}
                <span className="font-normal text-slate-400 text-[10.5px]">
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
