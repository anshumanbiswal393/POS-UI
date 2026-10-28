import { createFileRoute } from "@tanstack/react-router";
import { SupportManagementView } from "@/components/shared/pos/management/views/logs/SupportManagementView";

export const Route = createFileRoute("/pos/management/logs/support")({
  
  component: SupportManagementView,
});
