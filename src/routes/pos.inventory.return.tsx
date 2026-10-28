import { createFileRoute } from "@tanstack/react-router";
import { PurchaseReturnView } from "@/components/shared/pos/inventory/views/PurchaseReturnView";

export const Route = createFileRoute("/pos/inventory/return")({
  
  component: PurchaseReturnView,
});
