import { createFileRoute } from "@tanstack/react-router";
import { RecipeManagementView } from "@/components/shared/pos/inventory/views/RecipeManagementView";

export const Route = createFileRoute("/pos/inventory/masters/recipes")({
  
  component: RecipeManagementView,
});
