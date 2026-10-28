import { createFileRoute } from "@tanstack/react-router";
import { PosTakeOrderManager } from "@/components/shared/pos/PosTakeOrderManager";

export const Route = createFileRoute("/pos/tables")({
  
  component: PosTakeOrderManager,
});
