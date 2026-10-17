import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/order")({
  head: () => ({ meta: [{ title: "Purchases — Retrod POS" }] }),
  component: () => <Navigate to="/pos/inventory/purchase" replace />,
});
