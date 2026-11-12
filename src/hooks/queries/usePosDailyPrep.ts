import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posDailyPrepService, type DailyPreparationRecord } from "@/services/posDailyPrepService";
import { useOutletContext } from "@/context/PosOutletContext";
import { INVENTORY_QUERY_KEYS } from "./usePosInventory";

export const DAILY_PREP_QUERY_KEYS = {
  all: ["pos", "daily_prep"] as const,
  list: (outletId?: string) => ["pos", "daily_prep", outletId || "default"] as const,
};

export function useDailyPreps(outletId?: string) {
  const { activeOutlet } = useOutletContext();
  const effectiveId = outletId || activeOutlet?.id;

  return useQuery({
    queryKey: DAILY_PREP_QUERY_KEYS.list(effectiveId),
    queryFn: () => posDailyPrepService.getDailyPreps(effectiveId),
  });
}

export function useCreateDailyPrep() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();

  return useMutation({
    mutationFn: (data: {
      date: string;
      menuItemId: string;
      menuItemName: string;
      menuItemCode: string;
      category?: string;
      diet?: string;
      plates: number;
      ingredients: Array<{
        rawMaterialId: string;
        rawMaterialName: string;
        quantity: number;
        unit: string;
      }>;
      notes?: string;
      preparedBy?: string;
    }) => posDailyPrepService.createDailyPrep(data, activeOutlet?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DAILY_PREP_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "billing", "menu"] });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pos", "stock"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "inventory"] });
    },
  });
}

export function useDeleteDailyPrep() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();

  return useMutation({
    mutationFn: ({ id, rollbackStock }: { id: string; rollbackStock?: boolean }) =>
      posDailyPrepService.deleteDailyPrep(id, rollbackStock, activeOutlet?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DAILY_PREP_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "billing", "menu"] });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pos", "stock"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "inventory"] });
    },
  });
}

