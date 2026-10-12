import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/menu/schedule")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/menu" });
  },
});
