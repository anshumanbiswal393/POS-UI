import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/production")({
  component: () => <Navigate to="/pos/inventory" replace />,
});
