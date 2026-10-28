import { createFileRoute } from "@tanstack/react-router";
import { PaymentInformationView } from "@/components/shared/pos/management/views/accounting/PaymentInformationView";

export const Route = createFileRoute("/pos/management/accounting/payments/information")({
  
  component: PaymentInformationView,
});
