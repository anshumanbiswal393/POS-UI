import { createFileRoute } from "@tanstack/react-router";
import { DeviceMappingView } from "@/components/shared/pos/management/views/devices/DeviceMappingView";

export const Route = createFileRoute("/pos/management/device-mapping")({
  
  component: DeviceMappingView,
});
