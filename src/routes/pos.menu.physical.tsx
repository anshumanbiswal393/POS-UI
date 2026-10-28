import { createFileRoute } from "@tanstack/react-router";
import { PhysicalMenuView } from "@/components/shared/pos/menu/views/PhysicalMenuView";

export const Route = createFileRoute("/pos/menu/physical")({
  
  component: PhysicalMenuView,
});
