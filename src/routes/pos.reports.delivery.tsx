import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/reports/delivery")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/reports/day-end" });
  },
  component: () => null,
});
