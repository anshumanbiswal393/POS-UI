import { createFileRoute } from "@tanstack/react-router";
import { GstInformationView } from "@/components/shared/pos/management/views/accounting/GstInformationView";

export const Route = createFileRoute("/pos/management/accounting/gst")({
  
  component: GstInformationView,
});
