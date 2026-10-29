import { createFileRoute } from "@tanstack/react-router";
import { BillingPreferencesConfigView } from "@/components/shared/pos/management/views/outlet/BillingPreferencesConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/billing-preferences")({
  component: BillingPreferencesConfigView,
});
