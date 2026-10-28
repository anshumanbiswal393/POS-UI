import { createFileRoute } from "@tanstack/react-router";
import { FloorPlanManagementView } from "@/components/shared/pos/management/views/FloorPlanManagementView";

export const Route = createFileRoute("/pos/management/configuration/floor-plan")({
  
  component: FloorPlanManagementView,
});
