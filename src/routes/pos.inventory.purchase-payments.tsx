import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/purchase-payments")({
  
  component: () => <Navigate to="/pos/inventory/purchase" replace />,
});
