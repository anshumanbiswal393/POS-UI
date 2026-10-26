import type {
  BillingMenuItem,
  CustomerProfile,
  HeldBill,
  BillingCategory,
} from "@/types/posBilling";

export const BILLING_CATEGORIES: BillingCategory[] = [
  "All Items",
  "Starters",
  "Main Course",
  "Breads & Rice",
  "Continental & Pasta",
  "Desserts",
  "Beverages & Shakes",
  "Bar & Cocktails",
  "Combos",
];

export const MOCK_MENU_ITEMS: BillingMenuItem[] = [];

export const MOCK_CUSTOMERS: CustomerProfile[] = [];

export const MOCK_HELD_BILLS: HeldBill[] = [];

export const MOCK_TABLES_LIST: { id: string; tableNumber: string; capacity: number; area: string }[] = [];
