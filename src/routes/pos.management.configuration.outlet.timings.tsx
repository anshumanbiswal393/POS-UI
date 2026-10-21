import { createFileRoute } from "@tanstack/react-router";
import { OutletTimingsConfigView } from "@/components/shared/pos/management/views/outlet/OutletTimingsConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/timings")({
  head: () => ({ meta: [{ title: "Outlet Timings — Retrod POS" }] }),
  component: OutletTimingsConfigView,
});
