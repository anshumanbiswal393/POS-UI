import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceSettingsView } from "@/components/shared/pos/management/views/marketplace/MarketplaceSettingsView";

export const Route = createFileRoute("/pos/management/marketplace/settings")({
  
  component: MarketplaceSettingsView,
});
