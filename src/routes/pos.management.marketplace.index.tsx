import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceHubView } from "@/components/shared/pos/management/views/marketplace/MarketplaceHubView";

export const Route = createFileRoute("/pos/management/marketplace/")({
  
  component: MarketplaceHubView,
});
