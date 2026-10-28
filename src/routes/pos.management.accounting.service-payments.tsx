import { createFileRoute } from "@tanstack/react-router";
import { ServicePaymentHistoryView } from "@/components/shared/pos/management/views/accounting/ServicePaymentHistoryView";

export const Route = createFileRoute("/pos/management/accounting/service-payments")({
  
  component: ServicePaymentHistoryView,
});
