import { createFileRoute } from "@tanstack/react-router";
import { ProductionExecutionView } from "@/components/shared/pos/inventory/views/ProductionExecutionView";

export const Route = createFileRoute("/pos/inventory/production/execution")({
  
  component: ProductionExecutionView,
});
