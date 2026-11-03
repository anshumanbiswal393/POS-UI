import { createFileRoute } from "@tanstack/react-router";
import { PosSettingsScreen } from "@/components/shared/pos/settings/PosSettingsScreen";

export const Route = createFileRoute("/pos/settings")({
  component: PosSettingsRoute,
});

function PosSettingsRoute() {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="font-serif text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            Settings
          </h1>
          <p className="text-[11px] text-slate-500">
            Account preferences, security, printer configurations, and display options
          </p>
        </div>
      </div>
      <div className="responsive-page-x py-4 sm:py-5">
        <PosSettingsScreen />
      </div>
    </div>
  );
}
