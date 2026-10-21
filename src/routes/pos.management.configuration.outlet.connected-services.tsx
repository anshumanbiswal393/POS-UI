import { createFileRoute } from "@tanstack/react-router";
import { ConnectedServicesConfigView } from "@/components/shared/pos/management/views/outlet/ConnectedServicesConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/connected-services")({
  head: () => ({ meta: [{ title: "Connected Services — Retrod POS" }] }),
  component: ConnectedServicesConfigView,
});
