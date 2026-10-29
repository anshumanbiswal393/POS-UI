import { createFileRoute } from "@tanstack/react-router";
import { ServiceModeConfigView } from "@/components/shared/pos/management/views/outlet/ServiceModeConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/service-mode")({
  component: ServiceModeConfigView,
});

