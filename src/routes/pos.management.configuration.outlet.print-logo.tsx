import { createFileRoute } from "@tanstack/react-router";
import { PrintLogoConfigView } from "@/components/shared/pos/management/views/outlet/PrintLogoConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/print-logo")({
  
  component: PrintLogoConfigView,
});
