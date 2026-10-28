import { createFileRoute } from "@tanstack/react-router";
import { ExpenseLogsView } from "@/components/shared/pos/management/views/logs/ExpenseLogsView";

export const Route = createFileRoute("/pos/management/logs/expenses")({
  
  component: ExpenseLogsView,
});
