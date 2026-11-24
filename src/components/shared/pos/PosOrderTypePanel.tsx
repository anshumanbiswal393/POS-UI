import { PosPanel } from "@/components/shared/pos/PosPanel";
import { PosStatTile } from "@/components/shared/pos/PosStatTile";

/** §1.5 Order Type Counts */
export function PosOrderTypePanel() {
  return (
    <PosPanel title="Order type counts" hint="Dine-in · pickup · delivery · today">
      <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3">
        <PosStatTile label="Dine in" value={86} tone="info" />
        <PosStatTile label="Pick up" value={34} />
        <PosStatTile label="Delivery" value={41} tone="success" />
      </div>
    </PosPanel>
  );
}
