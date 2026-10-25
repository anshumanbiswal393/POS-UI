import { createFileRoute } from "@tanstack/react-router";
import { OutletListView } from "@/components/shared/pos/management/views/outlet/OutletListView";

export const Route = createFileRoute("/pos/management/configuration/outlet/list")({
  head: () => ({ meta: [{ title: "Outlet List — Retrod POS" }] }),
  component: OutletListView,
});
