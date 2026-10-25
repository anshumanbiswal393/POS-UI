export type StockPurchaseLine = {
  stockItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

export type StockPurchaseRecord = {
  id: string;
  invoiceNo: string;
  vendorName: string;
  purchaseDate: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  itemCount: number;
  status: "Completed" | "Draft" | "Pending";
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  notes?: string;
  items?: StockPurchaseLine[];
};

export type PurchaseOrderRecord = {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  itemCount: number;
  estimatedAmount: number;
  status: "Sent" | "Approved" | "Received" | "Cancelled" | "Draft";
  notes?: string;
  items?: StockPurchaseLine[];
};

export type PurchaseReturnRecord = {
  id: string;
  debitNoteNo: string;
  vendorName: string;
  returnDate: string;
  reason: "Damaged / Expired" | "Wrong Item" | "Excess Quantity" | "Quality Issue";
  itemCount: number;
  returnAmount: number;
  status: "Issued" | "Approved" | "Settled";
  notes?: string;
  items?: StockPurchaseLine[];
};

export type InventoryVendor = {
  id: string;
  name: string;
  phone: string;
  category: string;
};

export type StockItem = {
  id: string;
  code?: string;
  name?: string;
  rawMaterial: string;
  category: string;
  unit: string;
  availableStock: number;
  closingStock: number;
  quantityOnHand?: number;
  parLevel?: number;
  reorderLevel?: number;
  minThreshold?: number;
  unitCost?: number;
  itemKind?: "RAW" | "PREPARED";
  isFavorite?: boolean;
  isLow?: boolean;
  isAtPar?: boolean;
  isActive?: boolean;
  newStock?: number;
  variance?: number;
  notes?: string;
};

export type StockOverview = {
  success: boolean;
  skuActive: number;
  valuation: number;
  lowStockCount: number;
  atParCount: number;
  critical: number;
  wastageTodayQty: number;
  lowStock: StockItem[];
  atPar: StockItem[];
  items: StockItem[];
  movements: Array<{
    id: string;
    stockItemId: string;
    name: string;
    type: string;
    quantity: number;
    signedQty: number;
    unit: string;
    notes: string;
    createdAt?: string;
  }>;
};

export type StockAlert = {
  id: string;
  title: string;
  message: string;
  category: "STOCK";
  link?: string;
  stockItemId?: string;
  severity: "critical" | "warning";
};

export type DishRecipe = {
  id: string;
  name: string;
  category: string;
  menuItemId?: string | null;
  menuItem?: string;
  yieldQty?: number | string;
  yieldUnit?: string;
  prepTimeMinutes?: string;
  notes?: string;
  ingredients: Array<{
    id: string;
    stockItemId?: string;
    name: string;
    quantity: number | string;
    unit: string;
  }>;
};

export type InventorySettings = {
  recipeBasedConsumption: string;
  consumptionType: string;
  atParStockNotification: string;
  minStockOutOfStockNotify: string;
  notifyKitchenBelowPar: string;
  reverseConsumptionCancelled: string;
  restrictNegativeStockProduction: string;
};
