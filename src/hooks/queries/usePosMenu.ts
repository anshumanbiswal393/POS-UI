import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posMenuService, getStoredItemPlates } from "@/services/posMenuService";
import { liveGetBillingMenu } from "@/services/posOrderLive";
import { isBackendOutletId } from "@/utils/outletId";
import type { MenuItem, MenuItemImage } from "@/types/posMenu";
import { calculateEffectivePrice } from "@/utils/commissionUtils";

export const MENU_QUERY_KEYS = {
  menuItems: (outletId?: string) => ["pos", "menu", "items", outletId || "all"] as const,
  categories: (outletId?: string) => ["pos", "menu", "categories", outletId || "all"] as const,
  specialNotes: (outletId?: string) =>
    ["pos", "menu", "special-notes", outletId || "all"] as const,
  commissions: ["pos", "menu", "commissions"] as const,
  stockItems: (outletId?: string) => ["pos", "menu", "stock-items", outletId || "all"] as const,
  schedules: ["pos", "menu", "schedules"] as const,
  physicalMenus: ["pos", "menu", "physical-menus"] as const,
};

// 1. Menu Items
export function useMenuItems(outletId?: string) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.menuItems(outletId),
    queryFn: () => posMenuService.getMenuItems(outletId),
  });
}

export function useBillingMenuItems(outletId?: string) {
  const effectiveOutletId =
    outletId ||
    (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
    "";
  const live = isBackendOutletId(effectiveOutletId);
  return useQuery({
    queryKey: ["pos", "billing", "menu", effectiveOutletId || "all"] as const,
    queryFn: async (): Promise<MenuItem[]> => {
      let raw: MenuItem[] = [];
      if (live && effectiveOutletId) {
        try {
          raw = (await liveGetBillingMenu(effectiveOutletId)) as MenuItem[];
        } catch {
          raw = [];
        }
      } else if (effectiveOutletId) {
        raw = await posMenuService.getMenuItems(effectiveOutletId);
      }
      const platesMap = getStoredItemPlates(effectiveOutletId);
      return (raw || []).map((item) => {
        const basePrice = (item as any).originalPrice ?? item.price;
        const effectivePrice =
          (item as any).originalPrice !== undefined
            ? item.price
            : calculateEffectivePrice(
                basePrice,
                item.commissionType,
                item.commissionValue,
              );
        const plates = item.plates !== undefined ? item.plates : (platesMap[item.id] ?? 0);
        return {
          ...item,
          plates,
          originalPrice: basePrice,
          price: effectivePrice,
          variants: (item.variants || []).map((v: any) => {
            const vBase = v.originalPrice ?? v.price;
            return {
              ...v,
              originalPrice: vBase,
              price:
                v.originalPrice !== undefined
                  ? v.price
                  : calculateEffectivePrice(vBase, item.commissionType, item.commissionValue),
            };
          }),
        };
      });
    },
    enabled: Boolean(effectiveOutletId),
  });
}

export function useAddMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<MenuItem, "id" | "updatedAt">) => posMenuService.addMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      posMenuService.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

// 2. Channel & Platform Availability
export function useToggleItemPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      platform,
    }: {
      id: string;
      platform: "zomato" | "swiggy" | "direct" | "baseMenu";
    }) => posMenuService.toggleItemPlatform(id, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

export function useBulkUpdatePlatformAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: {
        zomato?: boolean;
        swiggy?: boolean;
        direct?: boolean;
        baseMenu?: boolean;
      };
    }) => posMenuService.bulkUpdatePlatformAvailability(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

// Backward-compat stock items
export function useMenuStockItems(outletId?: string) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.stockItems(outletId),
    queryFn: () => posMenuService.getStockItems(outletId),
  });
}

export function useToggleMenuStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.toggleStockStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "stock-items"] });
    },
  });
}

// Keep menu item lists in sync after local image mutations without refetching from API
function patchMenuItemInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updated: MenuItem | null | undefined,
) {
  if (!updated) return;
  queryClient.setQueriesData<MenuItem[]>(
    { queryKey: ["pos", "menu", "items"] },
    (old) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    },
  );
  queryClient.setQueriesData<MenuItem[]>(
    { queryKey: ["pos", "billing", "menu"] },
    (old) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    },
  );
  queryClient.setQueriesData<MenuItem[]>(
    { queryKey: ["pos", "menu", "stock-items"] },
    (old) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    },
  );
}

// 3. Multi-Image Management per Item
export function useAddItemImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      images,
      currentImages,
      outletId,
    }: {
      itemId: string;
      images: MenuItemImage[];
      currentImages?: MenuItemImage[];
      outletId?: string;
    }) => posMenuService.addItemImages(itemId, images, currentImages, outletId),
    onSuccess: (updated) => {
      patchMenuItemInCache(queryClient, updated);
      if (updated?.outletId) {
        queryClient.invalidateQueries({
          queryKey: MENU_QUERY_KEYS.menuItems(updated.outletId),
        });
      }
    },
  });
}

export function useRemoveItemImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      imageId,
      currentImages,
      outletId,
    }: {
      itemId: string;
      imageId: string;
      currentImages?: MenuItemImage[];
      outletId?: string;
    }) => posMenuService.removeItemImage(itemId, imageId, currentImages, outletId),
    onSuccess: (updated) => {
      patchMenuItemInCache(queryClient, updated);
      if (updated?.outletId) {
        queryClient.invalidateQueries({
          queryKey: MENU_QUERY_KEYS.menuItems(updated.outletId),
        });
      }
    },
  });
}

export function useSetPrimaryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      imageId,
      currentImages,
      outletId,
    }: {
      itemId: string;
      imageId: string;
      currentImages?: MenuItemImage[];
      outletId?: string;
    }) => posMenuService.setPrimaryImage(itemId, imageId, currentImages, outletId),
    onSuccess: (updated) => {
      patchMenuItemInCache(queryClient, updated);
      if (updated?.outletId) {
        queryClient.invalidateQueries({
          queryKey: MENU_QUERY_KEYS.menuItems(updated.outletId),
        });
      }
    },
  });
}

// 3b. Menu Categories
export function useMenuCategories(outletId?: string) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.categories(outletId),
    queryFn: () => posMenuService.getCategories(outletId || ""),
    enabled: Boolean(outletId),
  });
}

export function useAddMenuCategory(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => posMenuService.addCategory(outletId || "", name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.categories(outletId) });
    },
  });
}

export function useUpdateMenuCategory(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      posMenuService.updateCategory(outletId || "", id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.categories(outletId) });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "items"] });
    },
  });
}

export function useDeleteMenuCategory(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.deleteCategory(outletId || "", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.categories(outletId) });
    },
  });
}

// 4. Special Notes
export function useSpecialNotes(outletId?: string) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.specialNotes(outletId),
    queryFn: () => posMenuService.getSpecialNotes(outletId),
  });
}

export function useAddSpecialNote(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, available }: { name: string; available?: boolean }) =>
      posMenuService.addSpecialNote(name, available, outletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.specialNotes(outletId) });
    },
  });
}

export function useToggleSpecialNote(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.toggleSpecialNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.specialNotes(outletId) });
    },
  });
}

export function useDeleteSpecialNote(outletId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.deleteSpecialNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.specialNotes(outletId) });
    },
  });
}

// 5. Item Commissions
export function useItemCommissions(outletId?: string) {
  return useQuery({
    queryKey: [...MENU_QUERY_KEYS.commissions, outletId || "all"],
    queryFn: () => posMenuService.getCommissions(outletId),
  });
}

export function useUpdateItemCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      commissionType,
      commissionValue,
    }: {
      id: string;
      commissionType: "Not Configured" | "Percentage" | "Fixed Amount";
      commissionValue: number | null;
    }) => posMenuService.updateCommission(id, commissionType, commissionValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.commissions });
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: ["pos", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu"] });
    },
  });
}

export function useBulkUpdateItemCommissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      commissionType,
      commissionValue,
    }: {
      ids: string[];
      commissionType: "Not Configured" | "Percentage" | "Fixed Amount";
      commissionValue: number | null;
    }) => posMenuService.bulkUpdateCommissions(ids, commissionType, commissionValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.commissions });
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: ["pos", "billing"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "menu"] });
    },
  });
}

// 6. Schedules
export function useMenuSchedules() {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.schedules,
    queryFn: posMenuService.getSchedules,
  });
}

// 7. Physical Menus
export function usePhysicalMenus() {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.physicalMenus,
    queryFn: posMenuService.getPhysicalMenus,
  });
}

export function useAddPhysicalMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type, fileSize }: { name: string; type: string; fileSize: string }) =>
      posMenuService.addPhysicalMenu(name, type, fileSize),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.physicalMenus });
    },
  });
}

export function useDeletePhysicalMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.deletePhysicalMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.physicalMenus });
    },
  });
}

// 8. Sync POS
export function useSyncPos() {
  return useMutation({
    mutationFn: posMenuService.syncPos,
  });
}

// 9. Schedule Items & Details
export function useScheduleItems() {
  return useQuery({
    queryKey: ["pos", "menu", "schedule-items"],
    queryFn: posMenuService.getScheduleItems,
  });
}

export function useToggleScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.toggleScheduleItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-items"] });
    },
  });
}

export function useAddScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: posMenuService.addScheduleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-items"] });
    },
  });
}

export function useScheduleCategories() {
  return useQuery({
    queryKey: ["pos", "menu", "schedule-categories"],
    queryFn: posMenuService.getScheduleCategories,
  });
}

export function useAddScheduleCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentCategory }: { name: string; parentCategory?: string }) =>
      posMenuService.addScheduleCategory(name, parentCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-categories"] });
    },
  });
}

export function useScheduleVariants() {
  return useQuery({
    queryKey: ["pos", "menu", "schedule-variants"],
    queryFn: posMenuService.getScheduleVariants,
  });
}

export function useAddScheduleVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, departmentName }: { name: string; departmentName: string }) =>
      posMenuService.addScheduleVariant(name, departmentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-variants"] });
    },
  });
}

export function useScheduleTables() {
  return useQuery({
    queryKey: ["pos", "menu", "schedule-tables"],
    queryFn: posMenuService.getScheduleTables,
  });
}

export function useToggleScheduleTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posMenuService.toggleScheduleTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-tables"] });
    },
  });
}

export function useAddScheduleTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableNo,
      areaName,
      noOfPersons,
    }: {
      tableNo: string;
      areaName: string;
      noOfPersons?: number;
    }) => posMenuService.addScheduleTable(tableNo, areaName, noOfPersons),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "schedule-tables"] });
    },
  });
}

// 10. Virtual Outlets
export function useVirtualOutlets() {
  return useQuery({
    queryKey: ["pos", "menu", "virtual-outlets"],
    queryFn: posMenuService.getVirtualOutlets,
  });
}

export function useAddVirtualOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outlet: { name: string; cuisine?: string }) =>
      posMenuService.addVirtualOutlet(outlet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "menu", "virtual-outlets"] });
    },
  });
}

