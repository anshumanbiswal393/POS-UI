import type {
  SpecialNote,
  MenuCategory,
  MenuItemCommission,
  MenuItem,
  MenuItemImage,
  PhysicalMenuRecord,
  MenuScheduleItem,
  VirtualOutlet,
  ScheduleMenuItem,
  ScheduleCategoryItem,
  ScheduleVariantItem,
  ScheduleTableItem,
} from "@/types/posMenu";
import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { isBackendOutletId } from "@/utils/outletId";

const SAMPLE_IMAGES: Record<string, MenuItemImage[]> = {
  butter_chicken: [
    {
      id: "img-bc-1",
      url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      name: "butter_chicken_plate.jpg",
      isPrimary: true,
      size: "1.2 MB",
      type: "image/jpeg",
      uploadedAt: "Today, 10:30 AM",
    },
    {
      id: "img-bc-2",
      url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80",
      name: "butter_chicken_curry_bowl.jpg",
      isPrimary: false,
      size: "940 KB",
      type: "image/jpeg",
      uploadedAt: "Yesterday",
    },
  ],
  paneer_tikka: [
    {
      id: "img-pt-1",
      url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80",
      name: "paneer_tikka_skewers.jpg",
      isPrimary: true,
      size: "820 KB",
      type: "image/jpeg",
      uploadedAt: "Today, 09:15 AM",
    },
  ],
  dal_makhani: [
    {
      id: "img-dm-1",
      url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
      name: "dal_makhani_handi.jpg",
      isPrimary: true,
      size: "1.1 MB",
      type: "image/jpeg",
      uploadedAt: "3 days ago",
    },
  ],
  biryani: [
    {
      id: "img-by-1",
      url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      name: "dum_biryani_pot.jpg",
      isPrimary: true,
      size: "1.4 MB",
      type: "image/jpeg",
      uploadedAt: "2 days ago",
    },
    {
      id: "img-by-2",
      url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80",
      name: "biryani_serving_dish.jpg",
      isPrimary: false,
      size: "880 KB",
      type: "image/jpeg",
      uploadedAt: "3 days ago",
    },
  ],
  burger: [
    {
      id: "img-bg-1",
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      name: "smash_burger_deluxe.jpg",
      isPrimary: true,
      size: "1.3 MB",
      type: "image/jpeg",
      uploadedAt: "Yesterday",
    },
  ],
  mojito: [
    {
      id: "img-mj-1",
      url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
      name: "mint_virgin_mojito.jpg",
      isPrimary: true,
      size: "650 KB",
      type: "image/jpeg",
      uploadedAt: "4 days ago",
    },
  ],
};

const initialMenuItems: MenuItem[] = [];
const initialSpecialNotes: SpecialNote[] = [];
const initialCommissions: MenuItemCommission[] = [];
const initialSchedules: MenuScheduleItem[] = [];
const initialPhysicalMenus: PhysicalMenuRecord[] = [];
const initialScheduleItems: ScheduleMenuItem[] = [];
const initialScheduleCategories: ScheduleCategoryItem[] = [];
const initialScheduleVariants: ScheduleVariantItem[] = [];
const initialScheduleTables: ScheduleTableItem[] = [];

const STORAGE_KEY_MENU_ITEMS = "retrod_pos_menu_items_store";

function isLegacyMockDishId(id: string): boolean {
  return (
    id.startsWith("itm-10") ||
    id.startsWith("itm-be-") ||
    id.startsWith("itm-bl-") ||
    id.startsWith("itm-pt-") ||
    id.startsWith("itm-bc-") ||
    id.startsWith("itm-cb-") ||
    id.startsWith("itm-dm-") ||
    id.startsWith("itm-bm-") ||
    id.startsWith("itm-gj-")
  );
}

function loadMenuItemsFromStorage(): MenuItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MENU_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (item) =>
              item &&
              item.id &&
              !isLegacyMockDishId(item.id) &&
              item.outletId !== "outlet-primary" &&
              !item.outletId?.startsWith("vo-"),
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_MENU_ITEMS, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function saveMenuItemsToStorage(items: MenuItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_MENU_ITEMS, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}

// In-memory runtime store with localStorage persistence
let menuItemsStore: MenuItem[] = loadMenuItemsFromStorage();
let specialNotesStore: SpecialNote[] = [];

const STORAGE_KEY_CATEGORIES = "retrod_pos_menu_categories_store";

type CategoryApiDto = {
  id: string;
  outlet?: string;
  outlet_id?: string;
  name: string;
  code?: string | null;
  sort_order?: number;
  is_active?: boolean;
  item_count?: number;
};

function mapCategoryDto(dto: CategoryApiDto, fallbackOutletId: string): MenuCategory {
  return {
    id: String(dto.id),
    outletId: String(dto.outlet || dto.outlet_id || fallbackOutletId),
    name: dto.name,
    code: dto.code ?? null,
    sortOrder: dto.sort_order ?? 0,
    isActive: dto.is_active !== false,
    itemCount: dto.item_count ?? 0,
  };
}

function seedCategoriesForOutlet(outletId: string): MenuCategory[] {
  const names = new Set<string>();
  for (const item of initialMenuItems) {
    if (item.outletId === outletId && item.category?.trim()) {
      names.add(item.category.trim());
    }
  }
  // Also pull any runtime menu items for this outlet
  for (const item of menuItemsStore) {
    if (item.outletId === outletId && item.category?.trim()) {
      names.add(item.category.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b)).map((name, idx) => ({
    id: `cat-${outletId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx}`,
    outletId,
    name,
    sortOrder: idx,
    isActive: true,
    itemCount: menuItemsStore.filter((i) => i.outletId === outletId && i.category === name)
      .length,
  }));
}

function loadLocalCategories(outletId: string): MenuCategory[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) {
        const all = JSON.parse(raw) as MenuCategory[];
        if (Array.isArray(all)) {
          const forOutlet = all.filter((c) => c.outletId === outletId);
          if (forOutlet.length > 0) return forOutlet;
        }
      }
    } catch {
      // ignore
    }
  }
  return seedCategoriesForOutlet(outletId);
}

function saveLocalCategories(outletId: string, categories: MenuCategory[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const all: MenuCategory[] = raw ? (JSON.parse(raw) as MenuCategory[]) : [];
    const others = Array.isArray(all) ? all.filter((c) => c.outletId !== outletId) : [];
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify([...others, ...categories]));
  } catch {
    // ignore
  }
}

function renameItemsCategoryLocal(outletId: string, oldName: string, newName: string) {
  menuItemsStore = menuItemsStore.map((item) =>
    item.outletId === outletId && item.category === oldName
      ? { ...item, category: newName }
      : item,
  );
  saveMenuItemsToStorage(menuItemsStore);
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function toMenuItemWritePayload(item: Partial<MenuItem> & { outletId?: string }) {
  const itemType =
    item.itemType === "Non-Veg" ? "NON_VEG" : item.itemType === "Egg" ? "EGG" : "VEG";
  const categoryId = isBackendOutletId(item.categoryId) ? item.categoryId : undefined;
  const taxProfileId = isBackendOutletId(item.taxProfileId) ? item.taxProfileId : undefined;
  return {
    outlet: item.outletId,
    outletId: item.outletId,
    category: categoryId || item.category || undefined,
    categoryId: categoryId || undefined,
    code: item.code,
    name: item.name,
    online_display_name: item.onlineDisplayName || item.name || undefined,
    onlineDisplayName: item.onlineDisplayName || item.name || undefined,
    item_type: itemType,
    itemType: item.itemType,
    price: item.price,
    taxRate: item.taxRate ?? 5,
    tax_profile: taxProfileId || undefined,
    taxProfileId: taxProfileId || undefined,
    status: item.status === "Inactive" ? "INACTIVE" : "ACTIVE",
    description: item.description || "",
    images: item.images || [],
    base_menu: item.baseMenu,
    baseMenu: item.baseMenu,
    zomato: item.zomato,
    swiggy: item.swiggy,
    direct: item.direct,
    variants: item.variants?.map((v, idx) => ({
      name: v.name,
      price: v.price,
      sort_order: idx,
      is_active: true,
    })),
    commissionType: item.commissionType,
    commissionValue: item.commissionValue,
  };
}
let commissionsStore: MenuItemCommission[] = [...initialCommissions];
let schedulesStore: MenuScheduleItem[] = [...initialSchedules];
let physicalMenusStore: PhysicalMenuRecord[] = [...initialPhysicalMenus];
let scheduleItemsStore: ScheduleMenuItem[] = [...initialScheduleItems];
let scheduleCategoriesStore: ScheduleCategoryItem[] = [...initialScheduleCategories];
let scheduleVariantsStore: ScheduleVariantItem[] = [...initialScheduleVariants];
let scheduleTablesStore: ScheduleTableItem[] = [...initialScheduleTables];

export const posMenuService = {
  // 1. Menu Items CRUD & Filtering by Outlet (calling defined API endpoints with local fallback)
  getMenuItems: async (outletId?: string) => {
    // Real HO/Kitchen (UUID): API only — blank until user feeds data. Never touch Highway store.
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.ITEMS, {
          params: { outletId, outlet_id: outletId, page_size: 500 },
        });
        return unwrapList<MenuItem>(res.data);
      } catch {
        return [];
      }
    }

    // Highway Inn + local mock outlets: restore demo catalog and filter by outlet
    if (!outletId) return [...menuItemsStore];
    return menuItemsStore.filter((item) => item.outletId === outletId);
  },

  getMenuItemById: async (id: string) => {
    try {
      const res = await httpClient.get<MenuItem>(API_ENDPOINTS.MENU.ITEM_BY_ID(id));
      if (res.data) return res.data;
    } catch {
      // Fallback
    }
    return menuItemsStore.find((i) => i.id === id) || null;
  },

  addMenuItem: async (item: Omit<MenuItem, "id" | "updatedAt">) => {
    const newItem: MenuItem = {
      ...item,
      outletId: item.outletId || "outlet-primary",
      id: `itm-${Date.now()}`,
      updatedAt: "Just now",
      images: item.images || [],
    };
    if (isBackendOutletId(newItem.outletId)) {
      const res = await httpClient.post<MenuItem>(
        API_ENDPOINTS.MENU.CREATE_ITEM,
        toMenuItemWritePayload(newItem),
      );
      return res.data;
    }
    menuItemsStore = [newItem, ...menuItemsStore];
    saveMenuItemsToStorage(menuItemsStore);
    return newItem;
  },

  updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
    if (isBackendOutletId(data.outletId) || /^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(
        API_ENDPOINTS.MENU.UPDATE_ITEM(id),
        toMenuItemWritePayload(data),
      );
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) =>
      item.id === id ? { ...item, ...data, updatedAt: "Just now" } : item,
    );
    saveMenuItemsToStorage(menuItemsStore);
    return menuItemsStore.find((i) => i.id === id);
  },

  deleteMenuItem: async (id: string) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      await httpClient.delete(API_ENDPOINTS.MENU.DELETE_ITEM(id));
      return true;
    }
    menuItemsStore = menuItemsStore.filter((i) => i.id !== id);
    saveMenuItemsToStorage(menuItemsStore);
    return true;
  },

  // 2. Channel & Platform Availability
  toggleItemPlatform: async (id: string, platform: "zomato" | "swiggy" | "direct" | "baseMenu") => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.TOGGLE_PLATFORM(id, platform));
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === id) {
        const nextVal = !item[platform];
        return {
          ...item,
          [platform]: nextVal,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    saveMenuItemsToStorage(menuItemsStore);
    return menuItemsStore.find((i) => i.id === id);
  },

  bulkUpdatePlatformAvailability: async (
    ids: string[],
    updates: {
      zomato?: boolean;
      swiggy?: boolean;
      direct?: boolean;
      baseMenu?: boolean;
    },
  ) => {
    if (ids.some((id) => /^[0-9a-f-]{36}$/i.test(id))) {
      await httpClient.post(API_ENDPOINTS.MENU.BULK_PLATFORMS, { ids, updates });
      return true;
    }
    const idSet = new Set(ids);
    menuItemsStore = menuItemsStore.map((item) => {
      if (idSet.has(item.id)) {
        return {
          ...item,
          ...updates,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    return true;
  },

  // Backward compatibility alias for stock items
  getStockItems: async (outletId?: string) => {
    if (!outletId) return [...menuItemsStore];
    return menuItemsStore.filter((item) => item.outletId === outletId);
  },

  toggleStockStatus: async (id: string) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.TOGGLE_STATUS(id));
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === id) {
        const nextStatus = item.status === "Active" ? "Inactive" : "Active";
        return {
          ...item,
          status: nextStatus,
          updatedAt: "Just now",
          nextAvailableTime: nextStatus === "Inactive" ? "Tomorrow 10:00 AM" : undefined,
        };
      }
      return item;
    });
    return menuItemsStore.find((i) => i.id === id);
  },

  // 3. Multi-Image Management per Item
  addItemImages: async (itemId: string, newImages: MenuItemImage[]) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        const existing = item.images || [];
        const hasExistingPrimary = existing.some((img) => img.isPrimary);
        const processed = newImages.map((img, idx) => ({
          ...img,
          isPrimary: !hasExistingPrimary && idx === 0 ? true : !!img.isPrimary,
        }));
        return {
          ...item,
          images: [...existing, ...processed],
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  removeItemImage: async (itemId: string, imageId: string) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        const filtered = (item.images || []).filter((img) => img.id !== imageId);
        // If we removed the primary image and there are remaining images, set the first as primary
        const hasPrimary = filtered.some((img) => img.isPrimary);
        if (!hasPrimary && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isPrimary: true };
        }
        return {
          ...item,
          images: filtered,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  setPrimaryImage: async (itemId: string, imageId: string) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          images: (item.images || []).map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          })),
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  // 4. Special Notes (outlet-scoped via API when outlet is a real UUID)
  // ---- Menu Categories (outlet-scoped) ----
  getCategories: async (outletId: string): Promise<MenuCategory[]> => {
    if (!outletId) return [];
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.CATEGORIES, {
          params: { outlet_id: outletId, outletId, page_size: 200 },
        });
        return unwrapList<CategoryApiDto>(res.data).map((d) => mapCategoryDto(d, outletId));
      } catch {
        return [];
      }
    }
    const local = loadLocalCategories(outletId);
    // Keep item counts fresh
    return local
      .map((c) => ({
        ...c,
        itemCount: menuItemsStore.filter(
          (i) => i.outletId === outletId && i.category === c.name,
        ).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addCategory: async (outletId: string, name: string): Promise<MenuCategory> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name is required");
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<CategoryApiDto>(API_ENDPOINTS.MENU.CATEGORIES, {
        outlet: outletId,
        name: trimmed,
        is_active: true,
      });
      return mapCategoryDto(res.data, outletId);
    }
    const existing = loadLocalCategories(outletId);
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const created: MenuCategory = {
      id: `cat-${Date.now()}`,
      outletId,
      name: trimmed,
      sortOrder: existing.length,
      isActive: true,
      itemCount: 0,
    };
    const next = [...existing, created].sort((a, b) => a.name.localeCompare(b.name));
    saveLocalCategories(outletId, next);
    return created;
  },

  updateCategory: async (
    outletId: string,
    categoryId: string,
    data: { name: string },
  ): Promise<MenuCategory> => {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error("Category name is required");
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.patch<CategoryApiDto>(
        API_ENDPOINTS.MENU.CATEGORY_BY_ID(categoryId),
        { name: trimmed },
      );
      return mapCategoryDto(res.data, outletId);
    }
    const existing = loadLocalCategories(outletId);
    const current = existing.find((c) => c.id === categoryId);
    if (!current) throw new Error("Category not found");
    if (
      existing.some(
        (c) => c.id !== categoryId && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const oldName = current.name;
    const next = existing.map((c) =>
      c.id === categoryId ? { ...c, name: trimmed } : c,
    );
    saveLocalCategories(outletId, next);
    if (oldName !== trimmed) {
      renameItemsCategoryLocal(outletId, oldName, trimmed);
    }
    return next.find((c) => c.id === categoryId)!;
  },

  deleteCategory: async (outletId: string, categoryId: string): Promise<void> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(API_ENDPOINTS.MENU.CATEGORY_BY_ID(categoryId));
      return;
    }
    const existing = loadLocalCategories(outletId);
    const current = existing.find((c) => c.id === categoryId);
    if (!current) return;
    const inUse = menuItemsStore.some(
      (i) => i.outletId === outletId && i.category === current.name,
    );
    if (inUse) {
      throw new Error(
        `Cannot remove "${current.name}" — menu items still use this category. Reassign or delete those items first.`,
      );
    }
    saveLocalCategories(
      outletId,
      existing.filter((c) => c.id !== categoryId),
    );
  },

  getSpecialNotes: async (outletId?: string) => {
    // UUID outlets: API only (empty until created). Do not wipe Highway notes store.
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.SPECIAL_NOTES, {
          params: { outletId, outlet_id: outletId, page_size: 200 },
        });
        return unwrapList<SpecialNote>(res.data).map((n) => ({
          id: String(n.id),
          name: n.name,
          createdAt:
            typeof n.createdAt === "string"
              ? n.createdAt
              : new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
          available: Boolean((n as SpecialNote).available ?? true),
        }));
      } catch {
        return [];
      }
    }

    if (specialNotesStore.length === 0) {
      specialNotesStore = [...initialSpecialNotes];
    }
    return [...specialNotesStore];
  },
  addSpecialNote: async (name: string, available = true, outletId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Special note name is required");
    try {
      const res = await httpClient.post<SpecialNote>(API_ENDPOINTS.MENU.SPECIAL_NOTES, {
        name: trimmed,
        available,
        outlet: outletId || null,
      });
      if (res.data?.id) {
        const note: SpecialNote = {
          id: String(res.data.id),
          name: res.data.name || trimmed,
          createdAt:
            typeof res.data.createdAt === "string"
              ? res.data.createdAt
              : new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
          available: Boolean(res.data.available ?? available),
        };
        specialNotesStore = [note, ...specialNotesStore.filter((n) => n.id !== note.id)];
        return note;
      }
    } catch {
      // local fallback for mock outlets
    }
    if (isBackendOutletId(outletId)) {
      throw new Error("Failed to save special note");
    }
    const newNote: SpecialNote = {
      id: `sn-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      available,
    };
    specialNotesStore = [newNote, ...specialNotesStore];
    return newNote;
  },
  toggleSpecialNote: async (id: string) => {
    const current = specialNotesStore.find((n) => n.id === id);
    const nextAvailable = !(current?.available ?? true);
    try {
      await httpClient.patch(API_ENDPOINTS.MENU.SPECIAL_NOTE_BY_ID(id), {
        available: nextAvailable,
      });
    } catch {
      // local toggle
    }
    specialNotesStore = specialNotesStore.map((note) =>
      note.id === id ? { ...note, available: !note.available } : note,
    );
    return specialNotesStore.find((n) => n.id === id);
  },
  deleteSpecialNote: async (id: string) => {
    try {
      await httpClient.delete(API_ENDPOINTS.MENU.SPECIAL_NOTE_BY_ID(id));
    } catch {
      // local delete
    }
    specialNotesStore = specialNotesStore.filter((n) => n.id !== id);
    return true;
  },

  // 5. Item Commissions
  getCommissions: async (outletId?: string) => {
    if (isBackendOutletId(outletId)) {
      const items = await posMenuService.getMenuItems(outletId);
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        commissionType: item.commissionType || "Not Configured",
        commissionValue: item.commissionValue ?? null,
      }));
    }
    return [...commissionsStore];
  },
  updateCommission: async (
    id: string,
    commissionType: "Not Configured" | "Percentage" | "Fixed Amount",
    commissionValue: number | null,
  ) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.UPDATE_ITEM(id), {
        commissionType,
        commissionValue,
      });
      return {
        id: res.data.id,
        name: res.data.name,
        category: res.data.category,
        price: res.data.price,
        commissionType: res.data.commissionType || commissionType,
        commissionValue: res.data.commissionValue ?? commissionValue,
      };
    }
    commissionsStore = commissionsStore.map((item) =>
      item.id === id ? { ...item, commissionType, commissionValue } : item,
    );
    return commissionsStore.find((i) => i.id === id);
  },

  // 6. Schedules
  getSchedules: async () => [...schedulesStore],

  // 7. Physical Menu
  getPhysicalMenus: async () => [...physicalMenusStore],
  addPhysicalMenu: async (name: string, type: string, fileSize: string) => {
    const newFile: PhysicalMenuRecord = {
      id: `pm-${Date.now()}`,
      name,
      type,
      uploadedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      fileSize,
      url: "#",
    };
    physicalMenusStore = [newFile, ...physicalMenusStore];
    return newFile;
  },
  deletePhysicalMenu: async (id: string) => {
    physicalMenusStore = physicalMenusStore.filter((f) => f.id !== id);
    return true;
  },

  // 8. Schedule Details Sub-Views
  getScheduleItems: async () => [...scheduleItemsStore],
  toggleScheduleItem: async (id: string) => {
    scheduleItemsStore = scheduleItemsStore.map((item) =>
      item.id === id ? { ...item, available: !item.available } : item,
    );
    return scheduleItemsStore.find((i) => i.id === id);
  },
  addScheduleItem: async (item: Omit<ScheduleMenuItem, "id">) => {
    const newItem: ScheduleMenuItem = {
      ...item,
      id: `smi-${Date.now()}`,
    };
    scheduleItemsStore = [newItem, ...scheduleItemsStore];
    return newItem;
  },

  getScheduleCategories: async () => [...scheduleCategoriesStore],
  addScheduleCategory: async (name: string, parentCategory?: string) => {
    const newCat: ScheduleCategoryItem = {
      id: `scat-${Date.now()}`,
      name,
      parentCategory,
      rank: scheduleCategoriesStore.length + 1,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      modifiedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      imageUploaded: false,
    };
    scheduleCategoriesStore = [...scheduleCategoriesStore, newCat];
    return newCat;
  },

  getScheduleVariants: async () => [...scheduleVariantsStore],
  addScheduleVariant: async (name: string, departmentName: string) => {
    const newVar: ScheduleVariantItem = {
      id: `svar-${Date.now()}`,
      name,
      departmentName,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      modifiedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    scheduleVariantsStore = [...scheduleVariantsStore, newVar];
    return newVar;
  },

  getScheduleTables: async () => [...scheduleTablesStore],
  toggleScheduleTable: async (id: string) => {
    scheduleTablesStore = scheduleTablesStore.map((table) =>
      table.id === id ? { ...table, status: !table.status } : table,
    );
    return scheduleTablesStore.find((t) => t.id === id);
  },
  addScheduleTable: async (tableNo: string, areaName: string, noOfPersons?: number) => {
    const newTab: ScheduleTableItem = {
      id: `stab-${Date.now()}`,
      tableNo,
      areaName,
      noOfPersons: noOfPersons || 4,
      status: true,
    };
    scheduleTablesStore = [...scheduleTablesStore, newTab];
    return newTab;
  },

  // 9. Sync POS
  syncPos: async () => {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      lastSync: "Just now",
      totalItemsSynced: menuItemsStore.length,
      categoriesSynced: scheduleCategoriesStore.length,
    };
  },

  // 10. Virtual Outlets
  getVirtualOutlets: async (): Promise<VirtualOutlet[]> => {
    return [...virtualOutletsStore];
  },

  addVirtualOutlet: async (outlet: { name: string; cuisine?: string }): Promise<VirtualOutlet> => {
    const newVo: VirtualOutlet = {
      id: `vo-${Date.now()}`,
      name: outlet.name,
      code: `VO-${Math.floor(100 + Math.random() * 900)}`,
      type: "Virtual Outlet",
      cuisine: outlet.cuisine || "Multi-Cuisine",
      description: "Cloud kitchen virtual brand",
      address: "Main Outlet Kitchen",
      contact: "+91 98765 00000",
      orderTypes: ["Delivery", "Takeaway"],
      status: "Active",
      menuCount: 0,
    };
    virtualOutletsStore = [...virtualOutletsStore, newVo];
    return newVo;
  },
};

let virtualOutletsStore: VirtualOutlet[] = [
  {
    id: "vo-1",
    name: "Biryani Blues (Cloud)",
    code: "BB-01",
    type: "Virtual Outlet",
    cuisine: "Hyderabadi / Biryani",
    description: "Cloud kitchen virtual outlet for biryani specials",
    address: "Central Kitchen, Block B",
    contact: "+91 98765 43210",
    orderTypes: ["Delivery", "Takeaway"],
    status: "Active",
    menuCount: 24,
  },
  {
    id: "vo-2",
    name: "Burger Bae (Cloud)",
    code: "BB-02",
    type: "Virtual Outlet",
    cuisine: "American / Fast Food",
    description: "Virtual burger brand",
    address: "Central Kitchen, Block B",
    contact: "+91 98765 43211",
    orderTypes: ["Delivery"],
    status: "Active",
    menuCount: 18,
  },
];
