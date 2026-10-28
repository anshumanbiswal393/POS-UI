import { createFileRoute } from "@tanstack/react-router";
import { BankDetailsView } from "@/components/shared/pos/management/views/accounting/BankDetailsView";

export const Route = createFileRoute("/pos/management/accounting/bank-details")({
  
  component: BankDetailsView,
});
