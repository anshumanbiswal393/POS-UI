import { createFileRoute } from "@tanstack/react-router";
import { CashDenominationView } from "@/components/shared/pos/management/views/accounting/CashDenominationView";

export const Route = createFileRoute("/pos/management/accounting/denomination")({
  
  component: CashDenominationView,
});
