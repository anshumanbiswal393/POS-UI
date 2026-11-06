import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/inventory/settings")({
  component: () => <Navigate to="/pos/inventory" replace />,
});
