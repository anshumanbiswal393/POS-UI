import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/menu/on-off")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/menu" });
  },
});

