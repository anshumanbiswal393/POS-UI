import { createFileRoute } from "@tanstack/react-router";
import { StockPurchaseView } from "@/components/shared/pos/inventory/views/StockPurchaseView";

export const Route = createFileRoute("/pos/inventory/return")({
  component: () => <StockPurchaseView initialTab="returns" />,
});
