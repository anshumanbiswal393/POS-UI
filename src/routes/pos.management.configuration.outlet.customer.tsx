import { createFileRoute } from "@tanstack/react-router";
import { CustomerConfigView } from "@/components/shared/pos/management/views/outlet/CustomerConfigView";

export const Route = createFileRoute("/pos/management/configuration/outlet/customer")({
  
  component: CustomerConfigView,
});
