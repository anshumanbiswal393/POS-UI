import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";
import { useSyncPos } from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";
import { triggerAddMenuCommission } from "@/components/shared/pos/menu/menuCommissionActions";

export function PosMenuHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [lastSyncText, setLastSyncText] = useState("12 hr ago");
  const syncMutation = useSyncPos();
  const isCommission = pathname.includes("/commission");

  const getTitle = () => {
    if (pathname.includes("/special-notes")) return "Special Notes";
    if (isCommission) return "Set Item Commission";
    if (pathname.includes("/physical")) return "Printed Menu";
    return "Menu List";
  };

  const handleSyncPos = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data) => {
        setLastSyncText(data.lastSync);
        toast.success(`POS Synced successfully! ${data.totalItemsSynced} items updated.`);
      },
      onError: () => {
        toast.error("Failed to sync POS data");
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        {isCommission ? (
          <button
            type="button"
            onClick={() => triggerAddMenuCommission()}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Menu Commission
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-[12px] text-amber-800 shadow-2xs">
              <RefreshCw
                className={`h-3.5 w-3.5 text-amber-600 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              <span>
                Last Menu Sync <strong className="font-semibold">{lastSyncText}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSyncPos}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              {syncMutation.isPending ? "Syncing..." : "Sync POS"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
