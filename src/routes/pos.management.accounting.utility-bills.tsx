import { createFileRoute } from "@tanstack/react-router";
import { UtilityBillsView } from "@/components/shared/pos/management/views/accounting/UtilityBillsView";

export const Route = createFileRoute("/pos/management/accounting/utility-bills")({
  
  component: UtilityBillsView,
});
