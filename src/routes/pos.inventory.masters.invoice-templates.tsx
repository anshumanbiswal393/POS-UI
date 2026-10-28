import { createFileRoute } from "@tanstack/react-router";
import { InvoiceTemplatesView } from "@/components/shared/pos/inventory/views/InvoiceTemplatesView";

export const Route = createFileRoute("/pos/inventory/masters/invoice-templates")({
  
  component: InvoiceTemplatesView,
});
