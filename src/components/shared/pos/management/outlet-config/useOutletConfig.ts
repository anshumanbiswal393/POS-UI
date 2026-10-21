import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  loadOutletConfig,
  saveOutletConfig,
  type OutletConfigState,
} from "./outletConfigStore";

export function useOutletConfig() {
  const { activeOutlet } = useOutletContext();
  const [config, setConfig] = useState<OutletConfigState>(() => loadOutletConfig(activeOutlet.id));

  const persist = useCallback(
    (next: OutletConfigState, message = "Configuration saved") => {
      saveOutletConfig(activeOutlet.id, next);
      setConfig(next);
      toast.success(message);
    },
    [activeOutlet.id],
  );

  return { outletId: activeOutlet.id, outlet: activeOutlet, config, setConfig, persist };
}
