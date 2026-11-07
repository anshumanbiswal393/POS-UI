import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/users/biller-app")({
  component: () => <Navigate to="/pos/management/users" replace />,
});
