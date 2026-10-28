import { createFileRoute } from "@tanstack/react-router";
import { AreaDeliveryChargesListView } from "@/components/shared/pos/management/views/AreaDeliveryChargesListView";

export const Route = createFileRoute("/pos/management/configuration/area-delivery-charges")({
  
  component: AreaDeliveryChargesListView,
});
