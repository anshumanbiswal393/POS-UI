import { createFileRoute } from "@tanstack/react-router";
import { MainOtherReportsView } from "@/components/shared/pos/reports/views/MainOtherReportsView";

export const Route = createFileRoute("/pos/reports/other")({
  
  component: MainOtherReportsView,
});
