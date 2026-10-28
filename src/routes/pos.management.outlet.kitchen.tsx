import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/outlet/kitchen")({
  component: () => <Navigate to="/pos/management/configuration/outlet/add" replace />,
});
