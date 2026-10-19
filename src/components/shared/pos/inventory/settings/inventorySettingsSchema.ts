export type YesNo = "Yes" | "No";

export type InventorySettingsSectionId =
  | "consumption_production"
  | "purchase_order"
  | "stock_purchase"
  | "sales_transfer"
  | "both_sales_purchases"
  | "closing_settings"
  | "other_settings"
  | "ledger_settings"
  | "batchwise_settings"
  | "configuration_logs";

export const INVENTORY_SETTINGS_SECTIONS: Array<{
  id: InventorySettingsSectionId;
  label: string;
}> = [
  { id: "consumption_production", label: "Consumption and production" },
  { id: "purchase_order", label: "Purchase Order" },
  { id: "stock_purchase", label: "Stock Purchase" },
  { id: "sales_transfer", label: "Sales and Transfer" },
  {
    id: "both_sales_purchases",
    label: "Settings applying to both sales and purchases.",
  },
  { id: "closing_settings", label: "Closing Related Settings" },
  { id: "other_settings", label: "Other Settings" },
  { id: "ledger_settings", label: "Ledger Settings" },
  { id: "batchwise_settings", label: "Batchwise Settings" },
  { id: "configuration_logs", label: "Configuration Logs" },
];

export type InventorySettings = {
  // Consumption and production
  recipeBasedConsumption: YesNo;
  consumptionType:
    | "Default (Applicable for print or Ebill status)"
    | "Online orders"
    | "Offline orders"
    | "Both Online and Offline Orders";
  atParStockNotification: YesNo;
  minStockOutOfStockNotify: YesNo;
  notifyKitchenBelowPar: YesNo;
  reverseConsumptionCancelled: YesNo;
  captureAvgPriceConverted: YesNo;
  restrictNegativeStockProduction: YesNo;
  addRmGroupsMultipleRecipes: YesNo;
  enableMultipleConversionRm: YesNo;
  enableActualProductionFlow: YesNo;
  editProductionExecution: YesNo;
  setProductionTimeSlot: YesNo;

  // Purchase Order
  displayTaxInPO: YesNo;
  deliverToOption: string;
  configureShipToBill: YesNo;
  allowPOWhenStockNegative: YesNo;
  enableIncompleteRejectPO: YesNo;
  addPurchaseWithoutTransferApproval: YesNo;
  restrictPOBelowMoQ: YesNo;
  setStandardTermsPaymentDelivery: YesNo;
  poAllowedDateOption: "None" | "Today's date" | "Future dates" | "Past dates (Last 60 days)";
  poPreviousDateDays: string;
  blockPOForDuration: YesNo;
  fixOtherChargesOnIncomingPO: YesNo;
  poSaveAsDraft: YesNo;
  allowZeroPricePO: YesNo;
  blockPOPendingTransactions: string;

  // Stock Purchase
  purchaseInvoiceLabel: string;
  avgPurchasePriceDays: "15" | "30" | "45" | "60" | "75" | "90" | "Till Now";
  allowEditDeletePurchase: YesNo;
  allowBackdatedPurchases: YesNo;
  allowedDaysBackdatedPurchase: string;
  allowRateCardsPurchaseReturn: YesNo;
  allowPurchaseByDeliveryDate: YesNo;
  allowZeroPricePurchase: YesNo;
  allowDirectSalesTransferFromPurchase: YesNo;

  // Sales and Transfer
  salesInvoiceLabel: string;
  transferPdfLabel: string;
  allowBackdatedSalesTransfer: YesNo;
  allowedDaysBackdatedSales: string;
  displayAvgPriceInternalTransfer: YesNo;
  useProformaInvoiceOption: YesNo;
  autoGenerateInvoiceNumber: YesNo;
  autoGenerateChallanNumber: YesNo;
  logoAndUpiOnInvoices: YesNo;
  transferCommissionMode: "Raw materials wise" | "No" | "Outlet wise";

  // Both sales and purchases
  useBarcodeInSalesTransferPurchase: YesNo;
  invoiceRoundOffType: "Normal" | "None" | "Round off up" | "Round off down";
  displayCurrentStockInModules: YesNo;
  lockPricesInModules: YesNo;
  activateCessTax: YesNo;
  restrictUncheckUpdateInventoryStock: YesNo;
  lastPurchasePriceDisplay: string;
  addAdditionalTaxesCharges: YesNo;
  addPreconfiguredTcs: YesNo;
  includeRawMaterialImages: YesNo;
  addOtherPaymentType: YesNo;
  supplierMappingSelection:
    | "Select raw materials one by one"
    | "Show all mapped raw materials";
  enableCrateWeight: YesNo;
  poProcessFlow:
    | "Track MRN & PO with Reference Number (old flow)"
    | "Track PO with Reference Number (new flow)";
  mandatoryInvoiceModules: string;
  autoEmailOnSalesPurchase: string;

  // Closing
  outletClosingTime: string;
  backdatedManualAdjDays: string;
  freezeClosingStock: YesNo;

  // Other
  restaurantMapping: string;
  outletOwnershipType: string;
  preferCompleteSalesWastageNegative: YesNo;
  allowRateCardsOther: YesNo;
  allowAddWastageFromPreviousDates: YesNo;
  wastagePreviousDateDays: string;
  wastageReasonCompulsory: YesNo;
  wastageItemLevelReasons: YesNo;
  returnsItemLevelReasons: YesNo;
  displayCommissionConversionFields: YesNo;
  usePhysicalStockAuditReport: YesNo;
  shippingAddress: string;
  enableTempOutOfStock: YesNo;
  notifyMaxStockExceeded: YesNo;

  // Ledger
  invoiceNumMandatorySalesReturn: YesNo;
  enableAutoPurchaseReturnEntry: YesNo;

  // Batchwise
  useFifoLifoMethod: YesNo;
  includeBatchCodeInModules: YesNo;
};

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  recipeBasedConsumption: "No",
  consumptionType: "Default (Applicable for print or Ebill status)",
  atParStockNotification: "No",
  minStockOutOfStockNotify: "No",
  notifyKitchenBelowPar: "No",
  reverseConsumptionCancelled: "Yes",
  captureAvgPriceConverted: "Yes",
  restrictNegativeStockProduction: "No",
  addRmGroupsMultipleRecipes: "No",
  enableMultipleConversionRm: "No",
  enableActualProductionFlow: "No",
  editProductionExecution: "No",
  setProductionTimeSlot: "No",

  displayTaxInPO: "No",
  deliverToOption: "Select options",
  configureShipToBill: "No",
  allowPOWhenStockNegative: "Yes",
  enableIncompleteRejectPO: "No",
  addPurchaseWithoutTransferApproval: "Yes",
  restrictPOBelowMoQ: "No",
  setStandardTermsPaymentDelivery: "No",
  poAllowedDateOption: "None",
  poPreviousDateDays: "60",
  blockPOForDuration: "No",
  fixOtherChargesOnIncomingPO: "No",
  poSaveAsDraft: "No",
  allowZeroPricePO: "Yes",
  blockPOPendingTransactions: "Select options",

  purchaseInvoiceLabel: "Invoice",
  avgPurchasePriceDays: "90",
  allowEditDeletePurchase: "Yes",
  allowBackdatedPurchases: "Yes",
  allowedDaysBackdatedPurchase: "60",
  allowRateCardsPurchaseReturn: "No",
  allowPurchaseByDeliveryDate: "No",
  allowZeroPricePurchase: "Yes",
  allowDirectSalesTransferFromPurchase: "No",

  salesInvoiceLabel: "TAX INVOICE",
  transferPdfLabel: "Transfer",
  allowBackdatedSalesTransfer: "Yes",
  allowedDaysBackdatedSales: "60",
  displayAvgPriceInternalTransfer: "No",
  useProformaInvoiceOption: "No",
  autoGenerateInvoiceNumber: "No",
  autoGenerateChallanNumber: "No",
  logoAndUpiOnInvoices: "No",
  transferCommissionMode: "No",

  useBarcodeInSalesTransferPurchase: "No",
  invoiceRoundOffType: "None",
  displayCurrentStockInModules: "Yes",
  lockPricesInModules: "No",
  activateCessTax: "No",
  restrictUncheckUpdateInventoryStock: "No",
  lastPurchasePriceDisplay: "",
  addAdditionalTaxesCharges: "No",
  addPreconfiguredTcs: "No",
  includeRawMaterialImages: "No",
  addOtherPaymentType: "No",
  supplierMappingSelection: "Select raw materials one by one",
  enableCrateWeight: "No",
  poProcessFlow: "Track PO with Reference Number (new flow)",
  mandatoryInvoiceModules: "",
  autoEmailOnSalesPurchase: "",

  outletClosingTime: "01:30",
  backdatedManualAdjDays: "30",
  freezeClosingStock: "No",

  restaurantMapping: "",
  outletOwnershipType: "COFO - Company Owned Franchisee Operated",
  preferCompleteSalesWastageNegative: "Yes",
  allowRateCardsOther: "No",
  allowAddWastageFromPreviousDates: "Yes",
  wastagePreviousDateDays: "60",
  wastageReasonCompulsory: "No",
  wastageItemLevelReasons: "No",
  returnsItemLevelReasons: "No",
  displayCommissionConversionFields: "No",
  usePhysicalStockAuditReport: "No",
  shippingAddress: "",
  enableTempOutOfStock: "No",
  notifyMaxStockExceeded: "No",

  invoiceNumMandatorySalesReturn: "No",
  enableAutoPurchaseReturnEntry: "No",

  useFifoLifoMethod: "No",
  includeBatchCodeInModules: "No",
};

export const INVENTORY_SETTINGS_STORAGE_KEY = "retrod.pos.inventorySettings.v1";

export type SettingTip = { text: string; linkLabel?: string; linkAction?: string };

export type SettingFieldDef = {
  key: keyof InventorySettings;
  section: InventorySettingsSectionId;
  label: string;
  required?: boolean;
  info?: string;
  tip?: SettingTip;
  note?: string;
  type: "yesno" | "text" | "number" | "select" | "radio" | "textarea";
  options?: string[];
  showWhen?: (s: InventorySettings) => boolean;
};

export const INVENTORY_SETTING_FIELDS: SettingFieldDef[] = [
  // —— Consumption and production ——
  {
    key: "recipeBasedConsumption",
    section: "consumption_production",
    label: "Want inventory to be consumed automatically according to the recipe?",
    type: "yesno",
    tip: {
      text: "Before you enable this option, create Recipe.",
      linkLabel: "Click Here.",
      linkAction: "recipes",
    },
  },
  {
    key: "consumptionType",
    section: "consumption_production",
    label: "Add the type for which you require consumption on saved bills.",
    type: "radio",
    options: [
      "Default (Applicable for print or Ebill status)",
      "Online orders",
      "Offline orders",
      "Both Online and Offline Orders",
    ],
  },
  {
    key: "atParStockNotification",
    section: "consumption_production",
    label:
      "Get notified in the POS and inventory notification section when raw material stock hits the At par stock level?",
    type: "yesno",
  },
  {
    key: "minStockOutOfStockNotify",
    section: "consumption_production",
    label:
      "When the quantity of raw material falls below the minimum stock level, mark the item as out of stock. Also, do you want minimum stock level notifications in the inventory notification section?",
    type: "yesno",
  },
  {
    key: "notifyKitchenBelowPar",
    section: "consumption_production",
    label: "Send Notification to kitchen when raw material reaches below at par stock level?",
    type: "yesno",
    info: "Kitchen par notification",
  },
  {
    key: "reverseConsumptionCancelled",
    section: "consumption_production",
    label: "Reverse consumption as a result of an online order cancellation?",
    type: "yesno",
    tip: { text: 'If an order is marked "Food ready," consumption cannot be reversed.' },
  },
  {
    key: "captureAvgPriceConverted",
    section: "consumption_production",
    label:
      "Want to capture average purchase price for converted products based on raw materials used in production?",
    type: "yesno",
    info: "Average purchase price capture",
  },
  {
    key: "restrictNegativeStockProduction",
    section: "consumption_production",
    label:
      "If the stock of utilised raw materials is negative at the time of production, should it be restricted?",
    type: "yesno",
  },
  {
    key: "addRmGroupsMultipleRecipes",
    section: "consumption_production",
    label: "Wants to add raw material groups and multiple recipes?",
    type: "yesno",
  },
  {
    key: "enableMultipleConversionRm",
    section: "consumption_production",
    label: "Wants to enable multiple conversion at raw material level?",
    type: "yesno",
  },
  {
    key: "enableActualProductionFlow",
    section: "consumption_production",
    label: "Wants to enable actual production flow while convert raw material?",
    type: "yesno",
  },
  {
    key: "editProductionExecution",
    section: "consumption_production",
    label: "Do you want to Edit Production Execution?",
    type: "yesno",
  },
  {
    key: "setProductionTimeSlot",
    section: "consumption_production",
    label: "Do you want to set a specific time slot for production?",
    type: "yesno",
    info: "Production time slot",
  },

  // —— Purchase Order ——
  {
    key: "displayTaxInPO",
    section: "purchase_order",
    label: "Want to display Tax in Purchase Order?",
    type: "yesno",
    info: "Display tax",
  },
  {
    key: "deliverToOption",
    section: "purchase_order",
    label: 'In add Purchase Order "Deliver To"',
    type: "select",
    info: "Deliver to options",
    options: [
      "Select options",
      "Main Restaurant Kitchen",
      "Central Warehouse",
      "Bar Section",
    ],
  },
  {
    key: "configureShipToBill",
    section: "purchase_order",
    label: "Want to configure ship to bill?",
    type: "yesno",
  },
  {
    key: "allowPOWhenStockNegative",
    section: "purchase_order",
    label:
      "Allow the user to raise a Purchase Order when the stock at the kitchen/restaurant level is negative?",
    type: "yesno",
    tip: {
      text: "Before issuing a PO, ensure that the kitchen and restaurant have adequate stock.",
    },
  },
  {
    key: "enableIncompleteRejectPO",
    section: "purchase_order",
    label: "Want to enable incomplete or reject purchase order set up?",
    type: "yesno",
  },
  {
    key: "addPurchaseWithoutTransferApproval",
    section: "purchase_order",
    label:
      "Do you want to add a purchase from a PO without it being approved by the restaurant or kitchen in their internal transfer module?",
    type: "yesno",
  },
  {
    key: "restrictPOBelowMoQ",
    section: "purchase_order",
    label: "Restrict outlet to raise a purchase order below MoQ?",
    type: "yesno",
  },
  {
    key: "setStandardTermsPaymentDelivery",
    section: "purchase_order",
    label: "Set standard Terms Of Payment & Terms Of Delivery in purchase order",
    type: "yesno",
  },
  {
    key: "poAllowedDateOption",
    section: "purchase_order",
    label: "Please choose the allowed date option for raising purchase orders.",
    type: "radio",
    options: ["None", "Today's date", "Future dates", "Past dates (Last 60 days)"],
  },
  {
    key: "poPreviousDateDays",
    section: "purchase_order",
    label: "How many days are allowed for purchase orders previous dates?",
    type: "number",
  },
  {
    key: "blockPOForDuration",
    section: "purchase_order",
    label:
      "Would you prefer not to allow a Purchase Order for a set duration of time? During this, no user is allowed to submit a purchase order.",
    type: "yesno",
  },
  {
    key: "fixOtherChargesOnIncomingPO",
    section: "purchase_order",
    label:
      "Would you like to fix your other charges if a restaurant or kitchen sends you a purchase order?",
    type: "yesno",
  },
  {
    key: "poSaveAsDraft",
    section: "purchase_order",
    label: "Do you need a 'Save as Draft' option before the final save in the Purchase Order?",
    type: "yesno",
    tip: {
      text: "This configuration is applicable only for dashboard users. It will not be available for POS users, as the edit option is not supported in POS.",
    },
  },
  {
    key: "allowZeroPricePO",
    section: "purchase_order",
    label: "Do you want to allow users to raise a purchase order with a zero price?",
    type: "yesno",
  },
  {
    key: "blockPOPendingTransactions",
    section: "purchase_order",
    label: "Block New Purchase order for Pending Transactions",
    type: "select",
    info: "Pending transaction block",
    options: [
      "Select options",
      "Pending approvals",
      "Pending GRN",
      "All pending transactions",
    ],
  },

  // —— Stock Purchase ——
  {
    key: "purchaseInvoiceLabel",
    section: "stock_purchase",
    label: "Label for a Purchase invoice",
    type: "text",
    required: true,
  },
  {
    key: "avgPurchasePriceDays",
    section: "stock_purchase",
    label: "Choose how many days you want to use to obtain the latest average purchase price.",
    type: "radio",
    options: ["15", "30", "45", "60", "75", "90", "Till Now"],
  },
  {
    key: "allowEditDeletePurchase",
    section: "stock_purchase",
    label: "Allow user to edit or delete purchase once entries are completed?",
    type: "yesno",
  },
  {
    key: "allowBackdatedPurchases",
    section: "stock_purchase",
    label: "Would you like to allow user to add purchase from previous dates?",
    type: "yesno",
    info: "Backdated purchases",
  },
  {
    key: "allowedDaysBackdatedPurchase",
    section: "stock_purchase",
    label: "How many days are allowed for backdated purchases?",
    type: "number",
    showWhen: (s) => s.allowBackdatedPurchases === "Yes",
  },
  {
    key: "allowRateCardsPurchaseReturn",
    section: "stock_purchase",
    label: "Do you want to allow for rate cards in purchase return?",
    type: "yesno",
  },
  {
    key: "allowPurchaseByDeliveryDate",
    section: "stock_purchase",
    label: "Would you like to allow the user to create a purchase entry based on the delivery date?",
    type: "yesno",
    info: "Delivery-date purchase",
  },
  {
    key: "allowZeroPricePurchase",
    section: "stock_purchase",
    label: "Do you want to allow users to raise a purchase with a zero price?",
    type: "yesno",
  },
  {
    key: "allowDirectSalesTransferFromPurchase",
    section: "stock_purchase",
    label:
      "Do you want to allow users to perform direct sales or transfers from the Purchase Transaction screen?",
    type: "yesno",
  },

  // —— Sales and Transfer ——
  {
    key: "salesInvoiceLabel",
    section: "sales_transfer",
    label: "Label for a sales invoice",
    type: "text",
    required: true,
  },
  {
    key: "transferPdfLabel",
    section: "sales_transfer",
    label: "Label for a transfer pdf",
    type: "text",
    required: true,
  },
  {
    key: "allowBackdatedSalesTransfer",
    section: "sales_transfer",
    label: "Would you like to allow user to add sales or transfer from previous dates?",
    type: "yesno",
    info: "Backdated sales",
  },
  {
    key: "allowedDaysBackdatedSales",
    section: "sales_transfer",
    label: "How many days are allowed for backdated sales or transfer?",
    type: "number",
    showWhen: (s) => s.allowBackdatedSalesTransfer === "Yes",
  },
  {
    key: "displayAvgPriceInternalTransfer",
    section: "sales_transfer",
    label:
      "Want to display average purchase(without tax) price as internal transfer/sale/sale return price?",
    type: "yesno",
    tip: {
      text: "To maintain the average purchase price, include the correct raw material purchase price when adding the purchases.",
    },
  },
  {
    key: "useProformaInvoiceOption",
    section: "sales_transfer",
    label: "Do you want to use the proforma invoice option?",
    type: "yesno",
    tip: {
      text: "A proforma invoice is a preliminary/estimated invoice which is used to request payment from the buyer for goods before they are supplied.",
    },
  },
  {
    key: "autoGenerateInvoiceNumber",
    section: "sales_transfer",
    label: "Automatically generate an invoice number when creating a sales record with a prefix.",
    type: "yesno",
  },
  {
    key: "autoGenerateChallanNumber",
    section: "sales_transfer",
    label: "Automatically generate an challan number when creating a transfer record with a prefix.",
    type: "yesno",
  },
  {
    key: "logoAndUpiOnInvoices",
    section: "sales_transfer",
    label: "Do you want your company's logo and UPI QR code on your sales and transfer invoices?",
    type: "yesno",
  },
  {
    key: "transferCommissionMode",
    section: "sales_transfer",
    label: "Do you want to add a commission while creating a transfer or when a PO is raised to you?",
    type: "radio",
    options: ["Raw materials wise", "No", "Outlet wise"],
    tip: {
      text: "The commission will be applied based on the last purchase price, average purchase price, or the supplier mapping setup.",
    },
  },

  // —— Both sales and purchases ——
  {
    key: "useBarcodeInSalesTransferPurchase",
    section: "both_sales_purchases",
    label: "Do you want to use a barcode in sales, transfers, or purchases?",
    type: "yesno",
    tip: {
      text: "Before you enable this option, generate barcodes.",
      linkLabel: "Click Here.",
      linkAction: "barcodes",
    },
  },
  {
    key: "invoiceRoundOffType",
    section: "both_sales_purchases",
    label: "Want to round off or set the invoice total amount as a round figure?",
    type: "radio",
    options: ["Normal", "None", "Round off up", "Round off down"],
  },
  {
    key: "displayCurrentStockInModules",
    section: "both_sales_purchases",
    label:
      "Do you want the current stock of sellers and restaurants to be displayed in the Purchase and Consumption modules?",
    type: "yesno",
  },
  {
    key: "lockPricesInModules",
    section: "both_sales_purchases",
    label: "Do you want to lock prices in Purchase and Consumption modules?",
    type: "yesno",
  },
  {
    key: "activateCessTax",
    section: "both_sales_purchases",
    label: "Would you like to activate cess tax on invoices?",
    type: "yesno",
  },
  {
    key: "restrictUncheckUpdateInventoryStock",
    section: "both_sales_purchases",
    label:
      "Do you want to Restrict users to uncheck 'Update Inventory Stock' across all inventory modules?",
    type: "yesno",
  },
  {
    key: "lastPurchasePriceDisplay",
    section: "both_sales_purchases",
    label: "Last purchase price in purchase and sales module",
    type: "select",
    options: [
      "",
      "Show last purchase price",
      "Show average purchase price",
      "Hide price",
    ],
    tip: {
      text: "Last purchase price is based on latest conversion quantity. In case of purchase order module, if someone is raising a PO to you, the last purchase price against that raw material will be displayed. If you are raising a PO to a supplier, your last purchase price for that raw material will be displayed.",
    },
  },
  {
    key: "addAdditionalTaxesCharges",
    section: "both_sales_purchases",
    label: "Do you want to add/configure additional taxes or charges on the invoice?",
    type: "yesno",
    info: "Additional taxes",
  },
  {
    key: "addPreconfiguredTcs",
    section: "both_sales_purchases",
    label: "Do you want to add restaurant and kitchen preconfigured TCS?",
    type: "yesno",
  },
  {
    key: "includeRawMaterialImages",
    section: "both_sales_purchases",
    label:
      "Would you like to add an option to include images of raw materials in the Purchase Order, sales/transfer, wastage and purchase?",
    type: "yesno",
  },
  {
    key: "addOtherPaymentType",
    section: "both_sales_purchases",
    label: "Would you like to add a new option under the 'Other Payment Type' category?",
    type: "yesno",
  },
  {
    key: "supplierMappingSelection",
    section: "both_sales_purchases",
    label:
      "In supplier mapping, what type of selection would you like to use when creating an invoice?",
    type: "radio",
    options: ["Select raw materials one by one", "Show all mapped raw materials"],
  },
  {
    key: "enableCrateWeight",
    section: "both_sales_purchases",
    label: "Would you like to enable an option to include crate weight during invoice creation?",
    type: "yesno",
  },
  {
    key: "poProcessFlow",
    section: "both_sales_purchases",
    label: "Which process flow do you want to track using the PO number?",
    type: "radio",
    options: [
      "Track MRN & PO with Reference Number (old flow)",
      "Track PO with Reference Number (new flow)",
    ],
  },
  {
    key: "mandatoryInvoiceModules",
    section: "both_sales_purchases",
    label:
      "Would you like to make the invoice/challan number mandatory in the following modules?",
    type: "select",
    options: [
      "",
      "Purchase",
      "Sales",
      "Transfer",
      "Purchase & Sales",
      "All modules",
    ],
  },
  {
    key: "autoEmailOnSalesPurchase",
    section: "both_sales_purchases",
    label: "Would you like to auto send an Email while adding new Sales or Purchase?",
    type: "select",
    options: ["", "Sales only", "Purchase only", "Sales & Purchase"],
  },

  // —— Closing ——
  {
    key: "outletClosingTime",
    section: "closing_settings",
    label: "For inventory, Please provide your daily outlet closing time.[Time zone = Asia/Calcutta]",
    type: "select",
    options: [
      "00:00",
      "00:30",
      "01:00",
      "01:30",
      "02:00",
      "02:30",
      "03:00",
      "22:00",
      "22:30",
      "23:00",
      "23:30",
    ],
    tip: {
      text: "If the drop-down is disabled, it indicates that you have already changed the closing time; please try to change it after 10:00 am.",
    },
    note: "Note: If the timing in the above configuration is blank then your restaurant closes at 00:00 a.m. and your timezone is Asia/Calcutta.",
  },
  {
    key: "backdatedManualAdjDays",
    section: "closing_settings",
    label: "How many days are allowed for backdated manual adjustments?",
    type: "number",
  },
  {
    key: "freezeClosingStock",
    section: "closing_settings",
    label:
      "Do you want to freeze the closing stock? Once the closing stock is frozen, it remains unchanged.",
    type: "yesno",
  },

  // —— Other ——
  {
    key: "restaurantMapping",
    section: "other_settings",
    label: "Restaurant or kitchen mapping",
    type: "select",
    options: ["", "Main Restaurant", "Bar Section", "Pantry"],
    note: "Note: For all restaurants, please make it empty.",
  },
  {
    key: "outletOwnershipType",
    section: "other_settings",
    label: "Type of outlet (Ownership)",
    type: "select",
    options: [
      "COFO - Company Owned Franchisee Operated",
      "COCO - Company Owned Company Operated",
      "FOFO - Franchisee Owned Franchisee Operated",
      "FOCO - Franchisee Owned Company Operated",
    ],
  },
  {
    key: "preferCompleteSalesWastageNegative",
    section: "other_settings",
    label:
      "If raw material stock is negative, would you prefer that a user complete sales, wastage or a transfer?",
    type: "yesno",
  },
  {
    key: "allowRateCardsOther",
    section: "other_settings",
    label: "Do you want to allow for rate cards?",
    type: "yesno",
    tip: { text: "Maintain separate rates for COCO and FOFO locations." },
  },
  {
    key: "allowAddWastageFromPreviousDates",
    section: "other_settings",
    label: "Would you like to allow user to add wastage stock from previous dates?",
    type: "yesno",
  },
  {
    key: "wastagePreviousDateDays",
    section: "other_settings",
    label: "How many days are allowed for wastage previous dates?",
    type: "number",
    showWhen: (s) => s.allowAddWastageFromPreviousDates === "Yes",
  },
  {
    key: "wastageReasonCompulsory",
    section: "other_settings",
    label: "Do you want reasons to be compulsory while adding wastage?",
    type: "yesno",
  },
  {
    key: "wastageItemLevelReasons",
    section: "other_settings",
    label:
      "Enable pre-configured reasons at an item level to be in place for description while creating wastage.",
    type: "yesno",
  },
  {
    key: "returnsItemLevelReasons",
    section: "other_settings",
    label:
      "Enable pre-configured reasons at an item level to be in place for description while creating purchase & sales returns.",
    type: "yesno",
  },
  {
    key: "displayCommissionConversionFields",
    section: "other_settings",
    label:
      "Do you want to display the Commission Field, Conversion Quantity, and Total Conversion Quantity in all Purchase and Consumption modules?",
    type: "yesno",
  },
  {
    key: "usePhysicalStockAuditReport",
    section: "other_settings",
    label: "Would you like to use the 'physical stock audit report' on the available stock page?",
    type: "yesno",
    tip: {
      text: "It's always a good idea to compare your physical stock with the stock recorded in your system before making any manual adjustments for audit purposes. This can help you identify any discrepancies.",
    },
  },
  {
    key: "shippingAddress",
    section: "other_settings",
    label: "Add your shipping address",
    type: "textarea",
    tip: {
      text: "This address indicates where you want to receive the goods, which helps in the internal transfer like kitchen or restaurant.",
    },
  },
  {
    key: "enableTempOutOfStock",
    section: "other_settings",
    label: "Do you want to enable the 'Temporarily Out of Stock' function in the Raw Material Master?",
    type: "yesno",
  },
  {
    key: "notifyMaxStockExceeded",
    section: "other_settings",
    label:
      "Get notified in the inventory notification section and show an intimation popup during purchase and wastage entries when raw material stock exceeds the maximum stock level.",
    type: "yesno",
  },

  // —— Ledger ——
  {
    key: "invoiceNumMandatorySalesReturn",
    section: "ledger_settings",
    label: "Is an invoice number mandatory for both sales return and purchase return?",
    type: "yesno",
  },
  {
    key: "enableAutoPurchaseReturnEntry",
    section: "ledger_settings",
    label: "Do you want to enable automatic purchase return entry at the time of purchase?",
    type: "yesno",
    tip: {
      text: "If this setting is enabled, it is required to enter the invoice number in the purchase to ensure consistency in the purchase return.",
    },
  },

  // —— Batchwise ——
  {
    key: "useFifoLifoMethod",
    section: "batchwise_settings",
    label: "Would you like to use the FIFO or LIFO calculating method?",
    type: "yesno",
  },
  {
    key: "includeBatchCodeInModules",
    section: "batchwise_settings",
    label: "Would you like to include the batch code in all relevant inventory modules?",
    type: "yesno",
  },
];
