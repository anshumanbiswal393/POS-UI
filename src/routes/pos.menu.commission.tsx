import { createFileRoute } from "@tanstack/react-router";
import { SetItemCommissionView } from "@/components/shared/pos/menu/views/SetItemCommissionView";

export const Route = createFileRoute("/pos/menu/commission")({
  
  component: SetItemCommissionView,
});
