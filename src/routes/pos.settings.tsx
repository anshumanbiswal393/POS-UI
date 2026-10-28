import { createFileRoute } from "@tanstack/react-router";
import { PosSettingsScreen } from "@/components/shared/pos/settings/PosSettingsScreen";

export const Route = createFileRoute("/pos/settings")({
  
  component: PosSettingsScreen,
});
