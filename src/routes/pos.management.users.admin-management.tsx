import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/users/admin-management")({
  component: () => <Navigate to="/pos/management/users" replace />,
});
