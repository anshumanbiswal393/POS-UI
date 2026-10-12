export type BillingOrderType = "dine_in" | "takeaway" | "delivery" | "room_service";

export type BillingDietType = "all" | "veg" | "non_veg" | "egg" | "drinks";

export type BillingCategory =
  | "All Items"
  | "Starters"
  | "Main Course"
  | "Breads & Rice"
  | "Continental & Pasta"
  | "Desserts"
  | "Beverages & Shakes"
  | "Bar & Cocktails"
  | "Combos"
  | (string & {});

export type BillingItemVariant = {
  id: string;
  name: string; // e.g. "Regular", "Large", "Half", "Full"
  price: number;
};

export type BillingModifierGroup = {
  id: string;
  name: string; // e.g. "Spice Level", "Add-ons", "Preparation"
  maxSelect: number;
  options: {
    id: string;
    name: string;
    price: number;
  }[];
};

export type BillingMenuItem = {
  id: string;
  code: string;
  name: string;
  category: BillingCategory;
  diet: "veg" | "non_veg" | "egg" | "drinks";
  price: number;
  inStock: boolean;
  stockCount?: number;
  prepTimeMinutes: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  variants?: BillingItemVariant[];
  modifierGroups?: BillingModifierGroup[];
  imageUrl?: string;
  description?: string;
};

export type BillingSelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type BillingCartItem = {
  cartId: string;
  item: BillingMenuItem;
  quantity: number;
  selectedVariant?: BillingItemVariant;
  selectedModifiers: BillingSelectedModifier[];
  specialInstructions?: string;
  discountPercentage?: number;
  isComplimentary?: boolean;
  addedAt: string;
};

export type BillingPaymentMethod = "cash" | "upi" | "card" | "room_post" | "split" | "due";

export type HeldBill = {
  id: string;
  billNumber: string;
  orderType: BillingOrderType;
  tableNumber?: string;
  roomNumber?: string;
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
  items: BillingCartItem[];
  heldAt: string;
  subtotal: number;
  tax: number;
  grandTotal: number;
  captainName: string;
  notes?: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  tier: "Silver" | "Gold" | "Platinum VIP";
  loyaltyPoints: number;
  visitCount: number;
  lastVisit: string;
  creditLimit?: number;
  currentCredit?: number;
  roomNumber?: string;
};

export type BillSettlementRecord = {
  billNumber: string;
  orderType: BillingOrderType;
  tableNumber?: string;
  roomNumber?: string;
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
  captainName: string;
  terminal: string;
  shift: string;
  items: BillingCartItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  cgst: number;
  sgst: number;
  serviceCharge: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: BillingPaymentMethod;
  tenderedAmount: number;
  changeDue: number;
  settledAt: string;
};
