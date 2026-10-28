import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/outlet/ho")({
  component: () => <Navigate to="/pos/management/configuration/outlet/add" replace />,
});
