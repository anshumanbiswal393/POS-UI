import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/logs/online-store")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/management/logs/notifications" });
  },
  component: () => null,
});
