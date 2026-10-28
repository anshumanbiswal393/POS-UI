import { createFileRoute } from "@tanstack/react-router";
import { SalesConsumptionView } from "@/components/shared/pos/inventory/views/SalesConsumptionView";

export const Route = createFileRoute("/pos/inventory/sales")({
  
  component: SalesConsumptionView,
});
