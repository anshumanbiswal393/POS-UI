import { createFileRoute } from "@tanstack/react-router";
import { InvoiceSequenceConfigView } from "@/components/shared/pos/management/views/outlet/InvoiceSequenceConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/invoice-sequence")({
  head: () => ({ meta: [{ title: "Invoice Sequence — Retrod POS" }] }),
  component: InvoiceSequenceConfigView,
});
