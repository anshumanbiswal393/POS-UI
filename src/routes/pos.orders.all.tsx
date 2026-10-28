import { createFileRoute } from "@tanstack/react-router";
import { PosAllOrdersManager } from "@/components/shared/pos/orders/PosAllOrdersManager";

export const Route = createFileRoute("/pos/orders/all")({
  
  component: PosAllOrdersManager,
});
