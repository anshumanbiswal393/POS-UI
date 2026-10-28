import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/production/barcode")({
  
  component: () => <Navigate to="/pos/inventory/production" replace />,
});
