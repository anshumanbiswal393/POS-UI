import { createFileRoute } from "@tanstack/react-router";
import { PaymentConfigView } from "@/components/shared/pos/management/views/outlet/PaymentConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/payment")({
  head: () => ({ meta: [{ title: "Payment — Retrod POS" }] }),
  component: PaymentConfigView,
});
