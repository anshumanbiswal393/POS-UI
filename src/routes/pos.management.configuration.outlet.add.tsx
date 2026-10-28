import { createFileRoute } from "@tanstack/react-router";
import { OutletFormView } from "@/components/shared/pos/management/views/outlet/OutletFormView";

export const Route = createFileRoute("/pos/management/configuration/outlet/add")({
  
  component: OutletFormView,
});
