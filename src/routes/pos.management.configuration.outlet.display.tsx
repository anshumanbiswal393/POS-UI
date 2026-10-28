import { createFileRoute } from "@tanstack/react-router";
import { BillingDisplayConfigView } from "@/components/shared/pos/management/views/outlet/BillingDisplayConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/display")({
  
  component: BillingDisplayConfigView,
});
