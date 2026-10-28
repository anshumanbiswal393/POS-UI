import { createFileRoute } from "@tanstack/react-router";
import { AdminGroupManagementView } from "@/components/shared/pos/management/views/users/AdminGroupManagementView";

export const Route = createFileRoute("/pos/management/users/admin-groups")({
  
  component: AdminGroupManagementView,
});
