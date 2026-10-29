import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsConfigView } from "@/components/shared/pos/management/views/outlet/IntegrationsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/integrations")({
  component: IntegrationsConfigView,
});
