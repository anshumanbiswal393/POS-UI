import { createFileRoute } from "@tanstack/react-router";
import { OnlineOrderReconciliationView } from "@/components/shared/pos/management/views/accounting/OnlineOrderReconciliationView";

export const Route = createFileRoute("/pos/management/accounting/online-reconciliation")({
  
  component: OnlineOrderReconciliationView,
});
