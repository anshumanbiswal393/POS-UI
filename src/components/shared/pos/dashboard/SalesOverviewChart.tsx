import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import type { HourlySalesPoint } from "@/types/posDashboard";

interface SalesOverviewChartProps {
  data: HourlySalesPoint[];
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const [timeRange, setTimeRange] = useState("Today");
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-300 bg-white p-3.5 sm:p-4 shadow-2xs">
      {/* Card Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Sales overview</h2>
          {/* Legend */}
          <div className="mt-2 flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-0.5 w-3.5 rounded-full bg-primary" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-0.5 w-3.5 border-b-2 border-dashed border-slate-400" />
              <span>Yesterday</span>
            </div>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-7.5 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <span>{timeRange}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-20 animate-in fade-in zoom-in-95">
              {["Today", "Weekly", "Monthly"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTimeRange(t);
                    setShowMenu(false);
                  }}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-[12px] ${
                    timeRange === t
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area & Line Chart */}
      <div className="mt-4 h-[220px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="todaySalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val === 0 ? "₹0" : `₹${val / 1000}K`)}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[0, 20000]}
              />
              <Tooltip
                formatter={(val: number, name: string) => [
                  `₹${val.toLocaleString("en-IN")}`,
                  name === "todaySales" ? "Today" : "Yesterday",
                ]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "8px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              {/* Yesterday Dashed Line */}
              <Line
                type="monotone"
                dataKey="yesterdaySales"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {/* Today Primary Area */}
              <Area
                type="monotone"
                dataKey="todaySales"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#todaySalesGradient)"
                activeDot={{ r: 5, fill: "var(--primary)", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-[12px] text-slate-400">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}
