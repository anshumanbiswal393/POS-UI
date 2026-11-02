import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, X, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  checkSubscriptionRenewalNotice,
  recordSubscriptionNoticeShown,
  type SubscriptionRenewalNotice,
} from "@/lib/subscriptionNotifier";

export function PosSubscriptionRenewalBanner() {
  const { user } = useAuth();
  const [notice, setNotice] = useState<SubscriptionRenewalNotice | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const toastFiredRef = useRef(false);

  useEffect(() => {
    const expiry = user?.subscription_expiry;
    if (!expiry) return;

    const evaluation = checkSubscriptionRenewalNotice(expiry);
    if (!evaluation) {
      setNotice(null);
      return;
    }

    setNotice(evaluation);

    if (evaluation.shouldNotify && !toastFiredRef.current) {
      toastFiredRef.current = true;
      recordSubscriptionNoticeShown();

      const toastFn =
        evaluation.severity === "critical"
          ? toast.error
          : evaluation.severity === "warning"
          ? toast.warning
          : toast.info;

      toastFn(evaluation.title, {
        description: evaluation.message,
        duration: 10000,
      });
    }
  }, [user?.subscription_expiry]);

  if (!notice || dismissed) return null;

  const isCritical = notice.severity === "critical";
  const isWarning = notice.severity === "warning";

  return (
    <div
      role="alert"
      className={`relative z-40 flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium transition-all shadow-sm ${
        isCritical
          ? "bg-rose-600 text-white"
          : isWarning
          ? "bg-amber-500 text-slate-950"
          : "bg-teal-700 text-white"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isCritical ? (
          <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" />
        ) : isWarning ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : (
          <Clock className="h-4 w-4 shrink-0" />
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-bold uppercase tracking-wider text-[11px]">
            {notice.title}:
          </span>
          <span className="truncate">{notice.message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="https://app.dev.retrod.in/settings"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-bold transition shadow-xs ${
            isCritical
              ? "bg-white text-rose-700 hover:bg-rose-50"
              : isWarning
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "bg-white text-teal-800 hover:bg-teal-50"
          }`}
        >
          <span>Renew Subscription</span>
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-black/10 transition cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
