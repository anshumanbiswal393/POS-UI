import { createFileRoute } from "@tanstack/react-router";
import { NotificationsLogsView } from "@/components/shared/pos/management/views/logs/NotificationsLogsView";

export const Route = createFileRoute("/pos/management/logs/notifications")({
  
  component: NotificationsLogsView,
});
