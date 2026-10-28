import { createFileRoute } from "@tanstack/react-router";
import { PosPanel } from "@/components/shared/pos/PosPanel";

export const Route = createFileRoute("/pos/help")({
  
  component: () => (
    <div className="p-6 space-y-6">
      <PosPanel title="Help & Support" hint="POS documentation, knowledge base, and live support.">
        <p className="text-sm text-slate-500">24/7 technical support and hardware setup guides.</p>
      </PosPanel>
    </div>
  ),
});
