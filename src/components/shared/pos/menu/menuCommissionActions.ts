type Handler = () => void;

let addCommissionHandler: Handler | null = null;

/** Register the Add Menu Commission action from SetItemCommissionView. */
export function registerAddMenuCommissionHandler(handler: Handler | null) {
  addCommissionHandler = handler;
}

/** Invoked by PosMenuHeader Add button on the commission page. */
export function triggerAddMenuCommission() {
  addCommissionHandler?.();
}
