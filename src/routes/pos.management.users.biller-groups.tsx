import { createFileRoute } from "@tanstack/react-router";
import { BillerGroupManagementView } from "@/components/shared/pos/management/views/users/BillerGroupManagementView";

export const Route = createFileRoute("/pos/management/users/biller-groups")({
  
  component: BillerGroupManagementView,
});
