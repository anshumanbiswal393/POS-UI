import { createFileRoute } from "@tanstack/react-router";
import { CategoriesManagementView } from "@/components/shared/pos/inventory/views/CategoriesManagementView";

export const Route = createFileRoute("/pos/inventory/masters/categories")({
  component: CategoriesManagementView,
});
