import { createFileRoute } from "@tanstack/react-router";
import { PurchaseBillPaymentsView } from "@/components/shared/pos/inventory/views/PurchaseBillPaymentsView";

export const Route = createFileRoute("/pos/inventory/masters/purchase-payments")({
  
  component: PurchaseBillPaymentsView,
});
