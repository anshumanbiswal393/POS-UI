import { createFileRoute } from "@tanstack/react-router";
import { PrintConfigView } from "@/components/shared/pos/management/views/outlet/PrintConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/print")({
  
  component: PrintConfigView,
});
