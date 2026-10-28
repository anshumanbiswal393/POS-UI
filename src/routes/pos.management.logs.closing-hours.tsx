import { createFileRoute } from "@tanstack/react-router";
import { ClosingHourLogsView } from "@/components/shared/pos/management/views/logs/ClosingHourLogsView";

export const Route = createFileRoute("/pos/management/logs/closing-hours")({
  
  component: ClosingHourLogsView,
});
