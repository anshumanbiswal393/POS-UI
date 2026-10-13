import { Link } from "@tanstack/react-router";
import { Package, Clock, FileText } from "lucide-react";
import type { AttentionItem } from "@/types/posDashboard";

interface AttentionNeededCardProps {
  alerts: AttentionItem[];
}

export function AttentionNeededCard({ alerts }: AttentionNeededCardProps) {
  const getIcon = (type: AttentionItem["type"]) => {
    switch (type) {
      case "low_stock":
        return <Package className="h-4 w-4 text-amber-600" />;
      case "delayed_kot":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "unsettled_bills":
        return <FileText className="h-4 w-4 text-amber-600" />;
      default:
        return <Package className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      <h2 className="shrink-0 text-[14px] font-bold text-slate-900">Attention needed</h2>

      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                {getIcon(alert.type)}
              </div>
              <span className="text-[13px] font-semibold text-slate-800">{alert.title}</span>
            </div>

            <Link
              to={alert.actionRoute}
              className="text-[12px] font-medium text-primary hover:underline"
            >
              {alert.actionText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
