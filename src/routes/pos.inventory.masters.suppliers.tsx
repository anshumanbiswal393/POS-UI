import { createFileRoute } from "@tanstack/react-router";
import { SupplierManagementView } from "@/components/shared/pos/inventory/views/SupplierManagementView";

export const Route = createFileRoute("/pos/inventory/masters/suppliers")({
  
  component: SupplierManagementView,
});
