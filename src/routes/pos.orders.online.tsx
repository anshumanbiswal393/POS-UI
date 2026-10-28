import { createFileRoute, redirect } from "@tanstack/react-router";
// import { PosOnlineOrdersManager } from "@/components/shared/pos/orders/PosOnlineOrdersManager";

export const Route = createFileRoute("/pos/orders/online")({
  beforeLoad: () => {
    throw redirect({ to: "/pos/orders" });
  },
  // Online orders temporarily commented out until Zomato/Swiggy integration
  // 
  // component: PosOnlineOrdersManager,
});
