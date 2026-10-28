import { createFileRoute } from "@tanstack/react-router";
import { DataManagementView } from "@/components/shared/pos/management/views/data/DataManagementView";

export const Route = createFileRoute("/pos/management/data-management")({
  
  component: DataManagementView,
});
