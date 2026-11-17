import { Link } from "@tanstack/react-router";
import { Package, Clock, FileText, CheckCircle2 } from "lucide-react";
import type { AttentionItem } from "@/types/posDashboard";

interface AttentionNeededCardProps {
  alerts: AttentionItem[];
}

export function AttentionNeededCard({ alerts }: AttentionNeededCardProps) {
  const getIcon = (type: AttentionItem["type"]) => {
    switch (type) {
      case "low_stock":
        return <Package className="h-3.5 w-3.5 text-amber-600" />;
      case "delayed_kot":
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case "unsettled_bills":
        return <FileText className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Package className="h-3.5 w-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-2.5 sm:p-3 shadow-2xs">
      <h2 className="shrink-0 text-[13.5px] font-bold text-slate-900">Attention needed</h2>

      {alerts.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center p-2 text-slate-400">
          <CheckCircle2 className="h-5 w-5 stroke-[1.5] mb-1 text-emerald-500/80" />
          <p className="text-[11.5px] font-medium text-slate-600">All systems smooth</p>
          <p className="text-[10px] text-slate-400">No unsettled dues or delayed tickets</p>
        </div>
      ) : (
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  {getIcon(alert.type)}
                </div>
                <span className="text-[12px] font-semibold text-slate-800 truncate">{alert.title}</span>
              </div>

              <Link
                to={alert.actionRoute}
                className="shrink-0 text-[11px] font-medium text-primary hover:underline"
              >
                {alert.actionText}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AttentionNeededCard;
