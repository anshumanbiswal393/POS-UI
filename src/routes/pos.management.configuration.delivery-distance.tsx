import { createFileRoute } from "@tanstack/react-router";
import { DeliveryDistanceView } from "@/components/shared/pos/management/views/DeliveryDistanceView";

export const Route = createFileRoute("/pos/management/configuration/delivery-distance")({
  
  component: DeliveryDistanceView,
});
