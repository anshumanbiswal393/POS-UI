import { createFileRoute } from "@tanstack/react-router";
import { StockPurchaseView } from "@/components/shared/pos/inventory/views/StockPurchaseView";

export const Route = createFileRoute("/pos/inventory/purchase")({
  head: () => ({ meta: [{ title: "Purchases — Retrod POS" }] }),
  component: StockPurchaseView,
});
