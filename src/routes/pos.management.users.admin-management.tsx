import { createFileRoute } from "@tanstack/react-router";
import { AdminManagementView } from "@/components/shared/pos/management/views/users/AdminManagementView";

export const Route = createFileRoute("/pos/management/users/admin-management")({
  
  component: AdminManagementView,
});
