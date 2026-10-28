import { createFileRoute } from "@tanstack/react-router";
import { CashTopUpLogsView } from "@/components/shared/pos/management/views/logs/CashTopUpLogsView";

export const Route = createFileRoute("/pos/management/logs/cash-topup")({
  
  component: CashTopUpLogsView,
});
