import { createFileRoute } from "@tanstack/react-router";
import { AvailableStockView } from "@/components/shared/pos/inventory/views/AvailableStockView";

export const Route = createFileRoute("/pos/inventory/available-stock")({
  
  component: AvailableStockView,
});
