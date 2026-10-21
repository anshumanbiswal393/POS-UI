import { createFileRoute } from "@tanstack/react-router";
import { OutletDetailsConfigView } from "@/components/shared/pos/management/views/outlet/OutletDetailsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/details")({
  head: () => ({ meta: [{ title: "Outlet Details — Retrod POS" }] }),
  component: OutletDetailsConfigView,
});
