import { createFileRoute } from "@tanstack/react-router";
import { OutletDetailsConfigView } from "@/components/shared/pos/management/views/outlet/OutletDetailsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/details")({
  
  component: OutletDetailsConfigView,
});
