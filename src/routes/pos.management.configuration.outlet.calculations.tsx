import { createFileRoute } from "@tanstack/react-router";
import { CalculationsConfigView } from "@/components/shared/pos/management/views/outlet/CalculationsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/calculations")({
  head: () => ({ meta: [{ title: "Calculations — Retrod POS" }] }),
  component: CalculationsConfigView,
});
