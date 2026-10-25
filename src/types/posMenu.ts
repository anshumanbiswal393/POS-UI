export type MenuTabKey =
  | "menu_list"
  | "menu_management"
  | "upload_item_images"
  | "special_note_list"
  | "menucommission_list"
  | "physical_menu";

export type MenuItemImage = {
  id: string;
  url: string;
  name: string;
  isPrimary: boolean;
  size?: string;
  type?: string;
  uploadedAt?: string;
};

export type MenuItemType = "Veg" | "Non-Veg" | "Egg";

export type MenuItem = {
  id: string;
  outletId: string;
  code: string;
  name: string;
  onlineDisplayName: string;
  category: string;
  categoryId?: string | null;
  itemType: MenuItemType;
  price: number;
  taxRate: number; // in percentage e.g. 5, 12, 18
  taxProfileId?: string | null;
  status: "Active" | "Inactive";
  description?: string;
  images: MenuItemImage[];
  variants?: Array<{ id: string; name: string; price: number }>;
  modifierGroups?: any[];
  // Channel availability
  baseMenu: boolean;
  zomato: boolean;
  swiggy: boolean;
  direct: boolean;
  nextAvailableTime?: string;
  updatedAt: string;
  commissionType?: MenuItemCommission["commissionType"];
  commissionValue?: number | null;
};

export type SpecialNote = {
  id: string;
  name: string;
  createdAt: string;
  available: boolean;
};

/** Outlet-scoped menu category (Starters, Main Course, etc.) */
export type MenuCategory = {
  id: string;
  outletId: string;
  name: string;
  code?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  itemCount?: number;
};

export type MenuItemCommission = {
  id: string;
  name: string;
  category: string;
  price: number;
  commissionType: "Not Configured" | "Percentage" | "Fixed Amount";
  commissionValue: number | null;
  addonCount?: number;
};

export type MenuItemStock = MenuItem;

export type PhysicalMenuRecord = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  fileSize: string;
  url?: string;
};

export type MenuScheduleItem = {
  id: string;
  title: string;
  type: "Base Menu" | "Home Delivery" | "Parcel" | "Dine In" | "Zomato" | "Swiggy";
  activeRulesCount: number;
  timingSummary: string;
  status: "Active" | "Scheduled" | "Paused";
};

export type PosOutletKind =
  | "PRIMARY"
  | "VIRTUAL"
  | "HO"
  | "KITCHEN"
  | "BAR"
  | "ROOM_SERVICE"
  | "BANQUET"
  | "CAFE"
  | string;

export type PosOutlet = {
  id: string;
  name: string;
  code: string;
  type: "Primary Outlet" | "Virtual Outlet";
  /** Raw POS outlet_type from Postgres (HO / KITCHEN / PRIMARY / …). */
  outletKind?: PosOutletKind;
  cuisine: string;
  description: string;
  address: string;
  contact: string;
  orderTypes: string[];
  status: "Active" | "Inactive";
  menuCount: number;
  city?: string;
  email?: string;
  /** Parent physical/HO outlet id for virtual / cloud brands */
  parentOutletId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
};

export type VirtualOutlet = PosOutlet;

export type ScheduleMenuItem = {
  id: string;
  name: string;
  category: string;
  shortCode: number;
  indicators: string;
  onlineDisplayName: string;
  price: number;
  description?: string;
  isVeg: boolean;
  available: boolean;
};

export type ScheduleCategoryItem = {
  id: string;
  name: string;
  parentCategory?: string;
  onlineDisplayName?: string;
  rank: number;
  status: "Active" | "Inactive";
  createdAt: string;
  modifiedAt: string;
  imageUploaded: boolean;
};

export type ScheduleVariantItem = {
  id: string;
  name: string;
  onlineDisplayName?: string;
  departmentName: string;
  status: "Active" | "Inactive";
  createdAt: string;
  modifiedAt: string;
};

export type ScheduleTableItem = {
  id: string;
  tableNo: string;
  noOfPersons?: number;
  extraInfo?: string;
  areaName: string;
  status: boolean;
  discountPct?: number;
};

export type ScheduleTaxItem = {
  id: string;
  title: string;
  onlineDisplayName?: string;
  taxType: "Forward Tax" | "Backward Tax";
  type: "Percentage" | "Fixed Amount";
  amount: number;
  status: "Active" | "Inactive";
  createdAt: string;
};

export type ScheduleDiscountItem = {
  id: string;
  title: string;
  discountType: "Percentage" | "Fixed Amount";
  value: number;
  minBillAmount?: number;
  status: "Active" | "Inactive";
  createdAt: string;
};
