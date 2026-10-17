import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/production/barcode")({
  head: () => ({ meta: [{ title: "Preparation Setup — Retrod POS" }] }),
  component: () => <Navigate to="/pos/inventory/production" replace />,
});
