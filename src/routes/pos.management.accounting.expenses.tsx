import { createFileRoute } from "@tanstack/react-router";
import { ExpenseManagementView } from "@/components/shared/pos/management/views/accounting/ExpenseManagementView";

export const Route = createFileRoute("/pos/management/accounting/expenses")({
  
  component: ExpenseManagementView,
});
