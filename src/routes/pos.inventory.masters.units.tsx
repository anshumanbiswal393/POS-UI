import { createFileRoute } from "@tanstack/react-router";
import { UnitsMasterView } from "@/components/shared/pos/inventory/views/UnitsMasterView";

export const Route = createFileRoute("/pos/inventory/masters/units")({
  
  component: UnitsMasterView,
});
