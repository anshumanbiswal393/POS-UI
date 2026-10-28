import { createFileRoute } from "@tanstack/react-router";
import { ReportNotificationView } from "@/components/shared/pos/reports/views/ReportNotificationView";

export const Route = createFileRoute("/pos/reports/notifications")({
  
  component: ReportNotificationView,
});
