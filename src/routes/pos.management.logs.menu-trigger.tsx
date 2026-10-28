import { createFileRoute } from "@tanstack/react-router";
import { MenuTriggerLogsView } from "@/components/shared/pos/management/views/logs/MenuTriggerLogsView";

export const Route = createFileRoute("/pos/management/logs/menu-trigger")({
  
  component: MenuTriggerLogsView,
});
