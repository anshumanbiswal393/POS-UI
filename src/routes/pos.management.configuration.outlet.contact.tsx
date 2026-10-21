import { createFileRoute } from "@tanstack/react-router";
import { ContactDetailsConfigView } from "@/components/shared/pos/management/views/outlet/ContactDetailsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/contact")({
  head: () => ({ meta: [{ title: "Contact Details — Retrod POS" }] }),
  component: ContactDetailsConfigView,
});
