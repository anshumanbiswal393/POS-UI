import { createFileRoute, Navigate } from "@tanstack/react-router";
// Recipe module commented out completely
// import { RecipeManagementView } from "@/components/shared/pos/inventory/views/RecipeManagementView";

export const Route = createFileRoute("/pos/inventory/masters/recipes")({
  component: () => <Navigate to="/pos/inventory/masters/raw-materials" replace />,
});
