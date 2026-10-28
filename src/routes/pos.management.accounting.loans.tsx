import { createFileRoute } from "@tanstack/react-router";
import { LoanInformationView } from "@/components/shared/pos/management/views/accounting/LoanInformationView";

export const Route = createFileRoute("/pos/management/accounting/loans")({
  
  component: LoanInformationView,
});
