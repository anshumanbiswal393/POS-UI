import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posInventoryService } from "@/services/posInventoryService";
import { useOutletContext } from "@/context/PosOutletContext";
import type {
  StockPurchaseRecord,
  PurchaseOrderRecord,
  PurchaseReturnRecord,
  StockItem,
  DishRecipe,
  InventorySettings,
} from "@/types/posInventory";

export const INVENTORY_QUERY_KEYS = {
  vendors: ["pos", "inventory", "vendors"] as const,
  purchases: ["pos", "inventory", "purchases"] as const,
  purchaseOrders: ["pos", "inventory", "purchase-orders"] as const,
  purchaseReturns: ["pos", "inventory", "purchase-returns"] as const,
  stockItems: ["pos", "inventory", "stock-items"] as const,
  overview: ["pos", "inventory", "overview"] as const,
  alerts: ["pos", "inventory", "alerts"] as const,
  recipes: ["pos", "inventory", "recipes"] as const,
  wastage: ["pos", "inventory", "wastage"] as const,
  consumption: ["pos", "inventory", "consumption"] as const,
  settings: ["pos", "inventory", "settings"] as const,
  units: ["pos", "inventory", "units"] as const,
};

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stockItems });
  queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.overview });
  queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.alerts });
  queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.consumption });
}

export function useInventoryVendors() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.vendors,
    queryFn: posInventoryService.getVendors,
  });
}

export const useVendors = useInventoryVendors;

export function useStockPurchases() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.purchases, activeOutlet.id],
    queryFn: () => posInventoryService.getPurchases(activeOutlet.id),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: Omit<StockPurchaseRecord, "id">) =>
      posInventoryService.createPurchase(data, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchases });
      invalidateStock(queryClient);
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deletePurchase(id, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchases });
      invalidateStock(queryClient);
    },
  });
}

export function usePurchaseOrders() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.purchaseOrders, activeOutlet.id],
    queryFn: () => posInventoryService.getPurchaseOrders(activeOutlet.id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: Omit<PurchaseOrderRecord, "id">) =>
      posInventoryService.createPurchaseOrder(data, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchaseOrders });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deletePurchaseOrder(id, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchaseOrders });
    },
  });
}

export function usePurchaseReturns() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.purchaseReturns, activeOutlet.id],
    queryFn: () => posInventoryService.getPurchaseReturns(activeOutlet.id),
  });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: Omit<PurchaseReturnRecord, "id">) =>
      posInventoryService.createPurchaseReturn(data, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchaseReturns });
      invalidateStock(queryClient);
    },
  });
}

export function useDeletePurchaseReturn() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deletePurchaseReturn(id, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchaseReturns });
      invalidateStock(queryClient);
    },
  });
}

export function useStockItems() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.stockItems, activeOutlet.id],
    queryFn: () => posInventoryService.getStockItems(activeOutlet.id),
  });
}

export function useStockOverview() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.overview, activeOutlet.id],
    queryFn: () => posInventoryService.getOverview(activeOutlet.id),
  });
}

export function useStockAlerts() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.alerts, activeOutlet.id],
    queryFn: () => posInventoryService.getAlerts(activeOutlet.id),
  });
}

export function useDishRecipes() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.recipes, activeOutlet.id],
    queryFn: () => posInventoryService.getRecipes(activeOutlet.id),
  });
}

export function useInventorySettings() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.settings, activeOutlet.id],
    queryFn: () => posInventoryService.getSettings(activeOutlet.id),
  });
}

export function useSaveInventorySettings() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (settings: Partial<InventorySettings>) =>
      posInventoryService.saveSettings(settings, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.settings });
    },
  });
}

export function useWastageEntries() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.wastage, activeOutlet.id],
    queryFn: () => posInventoryService.getWastage(activeOutlet.id),
  });
}

export function useConsumptionReport() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.consumption, activeOutlet.id],
    queryFn: () => posInventoryService.getConsumption(activeOutlet.id),
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: ({ id, newStock, notes }: { id: string; newStock: number; notes?: string }) =>
      posInventoryService.updateStockItem(id, newStock, notes, activeOutlet.id),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useSaveClosingStock() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (payload: {
      entries: { id: string; newStock: number; notes?: string }[];
      date?: string;
    }) => posInventoryService.saveClosingStock(payload.entries, activeOutlet.id, payload.date),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useUpsertStockItem() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: Partial<StockItem> & { code?: string; name?: string; rawMaterial?: string }) =>
      posInventoryService.upsertStockItem(data, activeOutlet.id),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useSaveDishRecipe() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: Partial<DishRecipe>) => posInventoryService.saveRecipe(data, activeOutlet.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.recipes }),
  });
}

export function useDeleteDishRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deleteRecipe(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.recipes }),
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deleteStockItem(id, activeOutlet.id),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function usePatchStockItem() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StockItem> }) =>
      posInventoryService.patchStockItem(id, data, activeOutlet.id),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useCreateWastage() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: {
      stockItemId: string;
      quantity: number;
      unit?: string;
      reason?: string;
      approvedBy?: string;
      date?: string;
      notes?: string;
    }) => posInventoryService.createWastage(data, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.wastage });
      invalidateStock(queryClient);
    },
  });
}

export function useDeleteWastage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deleteWastage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.wastage });
      invalidateStock(queryClient);
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.receivePurchaseOrder(id, activeOutlet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchaseOrders });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.purchases });
      invalidateStock(queryClient);
    },
  });
}

export function useStockUnits() {
  const { activeOutlet } = useOutletContext();
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.units, activeOutlet.id],
    queryFn: () => posInventoryService.getUnits(activeOutlet.id),
  });
}

export function useSaveUnit() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  return useMutation({
    mutationFn: (data: {
      id?: string;
      name: string;
      symbol: string;
      type?: string;
      baseUnit?: string;
      ratioToBase?: number;
    }) => posInventoryService.saveUnit(data, activeOutlet.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.units }),
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posInventoryService.deleteUnit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.units }),
  });
}
