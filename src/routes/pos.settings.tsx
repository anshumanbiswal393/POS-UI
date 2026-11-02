import { createFileRoute } from "@tanstack/react-router";
import { PosSettingsScreen } from "@/components/shared/pos/settings/PosSettingsScreen";

export const Route = createFileRoute("/pos/settings")({
  
  component: () => <div className="responsive-page-x pt-2.5 pb-6 sm:pt-3"><PosSettingsScreen /></div>,
});
