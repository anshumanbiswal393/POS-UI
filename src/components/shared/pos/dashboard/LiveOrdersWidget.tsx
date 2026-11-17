import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { LiveOrderItem } from "@/types/posDashboard";

const VISIBLE_ORDER_ROWS = 3;

interface LiveOrdersWidgetProps {
  orders: LiveOrderItem[];
}

export function LiveOrdersWidget({ orders }: LiveOrdersWidgetProps) {
  const visibleOrders = orders.slice(0, VISIBLE_ORDER_ROWS);
  return (
    <div className="flex h-full min-h-[175px] flex-col rounded-xl border border-slate-400/80 bg-white p-2.5 sm:p-3 shadow-2xs">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-[13px] font-bold text-slate-900">Current Orders</h2>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary border border-primary/20">
            {orders.length} Active
          </span>
        </div>
        <Link
          to="/pos/orders"
          className="text-[11px] font-bold text-primary hover:underline"
        >
          View
        </Link>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="my-1 flex min-h-0 flex-1 flex-col items-center justify-center text-center p-2 text-slate-400">
          <Clock className="h-5 w-5 stroke-[1.5] mb-1 opacity-40 text-slate-400" />
          <p className="text-[11.5px] font-medium text-slate-600">No active kitchen orders</p>
          <p className="text-[10px] text-slate-400">Running dine-in and takeaway orders appear here</p>
        </div>
      ) : (
        <div className="my-1 flex min-h-0 flex-1 flex-col justify-center gap-1">
          {visibleOrders.map((ord) => (
            <div
              key={ord.id}
              className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-slate-300 text-[9.5px] font-extrabold text-slate-800 shadow-2xs">
                  {ord.title.replace(/[^0-9]/g, "")
                    ? `#${ord.title.replace(/[^0-9]/g, "")}`
                    : ord.title.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] font-bold text-slate-900 truncate">{ord.title}</span>
                    <span className="rounded px-1 py-0.2 text-[8.5px] font-semibold bg-white border border-slate-300 text-slate-600 shrink-0">
                      {ord.orderType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                    <span>{ord.elapsedMinutes}m elapsed</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {ord.statusLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Link */}
      <div className="shrink-0 border-t border-slate-200 pt-1 text-center">
        <Link
          to="/pos/orders"
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Open current orders →
        </Link>
      </div>
    </div>
  );
}

export default LiveOrdersWidget;
