import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pos/management/configuration/sub-order-type")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/management/configuration/outlet" });
  },
  component: () => null,
});
