export type YesNo = "Yes" | "No";

export type StaffContact = {
  id: string;
  role: string;
  name: string;
  mobile: string;
  email: string;
};

export type DayTiming = {
  day: string;
  closed: boolean;
  open: string;
  close: string;
  lunchStart: string;
  lunchEnd: string;
  dinnerStart: string;
  dinnerEnd: string;
};

export type PaymentTypeRow = {
  id: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  surchargePct: string;
};

export type InvoiceSequenceRow = {
  id: string;
  name: string;
  orderType: string;
  prefix: string;
  nextNumber: string;
  padding: string;
  suffix: string;
  active: boolean;
};

export type OutletConfigState = {
  details: {
    outletName: string;
    alias: string;
    email: string;
    logoDataUrl: string;
    gstin: string;
    fssai: string;
    tinNo: string;
    website: string;
    cuisine: string;
    seatingCapacity: string;
    landmark: string;
    zipCode: string;
    fax: string;
    country: string;
    state: string;
    city: string;
    timezone: string;
    address: string;
    area: string;
    latitude: string;
    longitude: string;
    additionalInfo: string;
  };
  contact: {
    ownerName: string;
    ownerMobile: string;
    ownerEmail: string;
    managerName: string;
    managerMobile: string;
    managerEmail: string;
    accountsName: string;
    accountsMobile: string;
    accountsEmail: string;
    staff: StaffContact[];
  };
  timings: {
    sameAllDays: YesNo;
    displayOnBill: YesNo;
    displayOnline: YesNo;
    days: DayTiming[];
  };
  payment: {
    currency: string;
    symbol: string;
    decimalPlaces: string;
    symbolPosition: "Before" | "After";
    allowSplitPayment: YesNo;
    roundOffBills: YesNo;
    types: PaymentTypeRow[];
  };
  invoiceSequences: InvoiceSequenceRow[];
  billingDisplay: {
    showItemImages: YesNo;
    showCategoryImages: YesNo;
    showItemCode: YesNo;
    showKotNumber: YesNo;
    showTaxBreakup: YesNo;
    showRunningTableAmount: YesNo;
    showOutOfStock: YesNo;
    confirmBeforeSettle: YesNo;
    menuLayout: "Grid" | "List";
    itemColumns: "3" | "4" | "5";
    defaultOrderType: string;
    density: "Comfortable" | "Compact";
    themeAccent: "Teal" | "Slate";
  };
  printLogo: {
    logoDataUrl: string;
    alignment: "Left" | "Center" | "Right";
    widthMm: string;
    printOnBill: YesNo;
    printOnKot: YesNo;
    printOutletName: YesNo;
    headerText: string;
    footerText: string;
  };
  calculations: {
    taxInclusive: YesNo;
    applyServiceCharge: YesNo;
    serviceChargePct: string;
    serviceChargeOn: "All orders" | "Dine In only";
    gstOnServiceCharge: YesNo;
    applyPackingCharge: YesNo;
    packingCharge: string;
    gstOnPacking: YesNo;
    applyDeliveryCharge: YesNo;
    deliveryCharge: string;
    discountBeforeTax: YesNo;
    autoRoundOff: YesNo;
    roundOffMethod: "Nearest" | "Round off up" | "Round off down";
  };
  connectedServices: {
    pmsRoomService: YesNo;
    inventoryConsumption: YesNo;
    onlineOrdering: YesNo;
    aggregatorSync: YesNo;
    whatsappBill: YesNo;
    smsBill: YesNo;
    paymentGateway: YesNo;
  };
  print: {
    billCopies: string;
    kotCopies: string;
    paperSize: "80mm" | "58mm" | "A4";
    autoPrintOnSettle: YesNo;
    autoPrintKot: YesNo;
    printTokenNumber: YesNo;
    printCustomerCopy: YesNo;
    printGstin: YesNo;
    printFssai: YesNo;
    printTableNumber: YesNo;
    printCashierName: YesNo;
    cutAfterPrint: YesNo;
  };
  customer: {
    mandatoryMobile: YesNo;
    mandatoryName: YesNo;
    allowGstOnBill: YesNo;
    enableLoyalty: YesNo;
    allowWalkInWithoutCustomer: YesNo;
    captureAddress: YesNo;
    captureBirthday: YesNo;
    searchByMobile: YesNo;
    autoCreateOnBill: YesNo;
    showLastOrders: YesNo;
  };
};

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function defaultDay(day: string): DayTiming {
  return {
    day,
    closed: false,
    open: "11:00",
    close: "23:30",
    lunchStart: "12:00",
    lunchEnd: "15:30",
    dinnerStart: "19:00",
    dinnerEnd: "23:00",
  };
}

export const DEFAULT_OUTLET_CONFIG: OutletConfigState = {
  details: {
    outletName: "HIGHWAY INN BAR & RESTAURANT",
    alias: "HI-MAIN",
    email: "hello@highwayinn.in",
    logoDataUrl: "",
    gstin: "27AABCU9603R1ZX",
    fssai: "11519001000123",
    tinNo: "",
    website: "https://highwayinn.in",
    cuisine: "Multi-Cuisine & Bar",
    seatingCapacity: "86",
    landmark: "Mumbai - Pune Expressway",
    zipCode: "410208",
    fax: "",
    country: "India",
    state: "Maharashtra",
    city: "Khalapur",
    timezone: "Asia/Calcutta",
    address: "National Highway 48, Mumbai - Pune Expressway, Sector 4",
    area: "Highway corridor",
    latitude: "18.8301",
    longitude: "73.3204",
    additionalInfo: "Flagship dining, bar lounge, banquet and room service.",
  },
  contact: {
    ownerName: "Ayush Mishra",
    ownerMobile: "+91 98765 43210",
    ownerEmail: "owner@highwayinn.in",
    managerName: "Chef Vikram",
    managerMobile: "+91 98765 43211",
    managerEmail: "manager@highwayinn.in",
    accountsName: "Accounts Desk",
    accountsMobile: "+91 98765 43212",
    accountsEmail: "accounts@highwayinn.in",
    staff: [
      {
        id: "st-1",
        role: "Front Desk",
        name: "Rohit Sharma",
        mobile: "+91 98765 43213",
        email: "frontdesk@highwayinn.in",
      },
    ],
  },
  timings: {
    sameAllDays: "Yes",
    displayOnBill: "Yes",
    displayOnline: "No",
    days: WEEK_DAYS.map(defaultDay),
  },
  payment: {
    currency: "INR",
    symbol: "₹",
    decimalPlaces: "2",
    symbolPosition: "Before",
    allowSplitPayment: "Yes",
    roundOffBills: "Yes",
    types: [
      { id: "cash", name: "Cash", enabled: true, isDefault: true, surchargePct: "0" },
      { id: "upi", name: "UPI", enabled: true, isDefault: false, surchargePct: "0" },
      { id: "card", name: "Card", enabled: true, isDefault: false, surchargePct: "0" },
      { id: "wallet", name: "Wallet", enabled: false, isDefault: false, surchargePct: "0" },
      { id: "credit", name: "Credit / Room Charge", enabled: true, isDefault: false, surchargePct: "0" },
      { id: "comp", name: "Complimentary", enabled: true, isDefault: false, surchargePct: "0" },
      { id: "neft", name: "NEFT / Bank", enabled: false, isDefault: false, surchargePct: "0" },
    ],
  },
  invoiceSequences: [
    { id: "seq-dine", name: "Dine In", orderType: "Dine In", prefix: "HI", nextNumber: "1042", padding: "4", suffix: "", active: true },
    { id: "seq-take", name: "Takeaway", orderType: "Takeaway", prefix: "TK", nextNumber: "318", padding: "4", suffix: "", active: true },
    { id: "seq-room", name: "Room Service", orderType: "Room Service", prefix: "RS", nextNumber: "87", padding: "4", suffix: "", active: true },
    { id: "seq-del", name: "Delivery", orderType: "Delivery", prefix: "DL", nextNumber: "56", padding: "4", suffix: "", active: true },
  ],
  billingDisplay: {
    showItemImages: "Yes",
    showCategoryImages: "Yes",
    showItemCode: "No",
    showKotNumber: "Yes",
    showTaxBreakup: "Yes",
    showRunningTableAmount: "Yes",
    showOutOfStock: "No",
    confirmBeforeSettle: "Yes",
    menuLayout: "Grid",
    itemColumns: "4",
    defaultOrderType: "Dine In",
    density: "Comfortable",
    themeAccent: "Teal",
  },
  printLogo: {
    logoDataUrl: "",
    alignment: "Center",
    widthMm: "42",
    printOnBill: "Yes",
    printOnKot: "No",
    printOutletName: "Yes",
    headerText: "Thank you for dining with us",
    footerText: "Visit again · GST invoice",
  },
  calculations: {
    taxInclusive: "No",
    applyServiceCharge: "No",
    serviceChargePct: "5",
    serviceChargeOn: "Dine In only",
    gstOnServiceCharge: "Yes",
    applyPackingCharge: "No",
    packingCharge: "20",
    gstOnPacking: "Yes",
    applyDeliveryCharge: "No",
    deliveryCharge: "40",
    discountBeforeTax: "Yes",
    autoRoundOff: "Yes",
    roundOffMethod: "Nearest",
  },
  connectedServices: {
    pmsRoomService: "Yes",
    inventoryConsumption: "Yes",
    onlineOrdering: "No",
    aggregatorSync: "No",
    whatsappBill: "No",
    smsBill: "No",
    paymentGateway: "No",
  },
  print: {
    billCopies: "1",
    kotCopies: "1",
    paperSize: "80mm",
    autoPrintOnSettle: "Yes",
    autoPrintKot: "Yes",
    printTokenNumber: "Yes",
    printCustomerCopy: "No",
    printGstin: "Yes",
    printFssai: "Yes",
    printTableNumber: "Yes",
    printCashierName: "Yes",
    cutAfterPrint: "Yes",
  },
  customer: {
    mandatoryMobile: "No",
    mandatoryName: "No",
    allowGstOnBill: "Yes",
    enableLoyalty: "No",
    allowWalkInWithoutCustomer: "Yes",
    captureAddress: "No",
    captureBirthday: "No",
    searchByMobile: "Yes",
    autoCreateOnBill: "Yes",
    showLastOrders: "Yes",
  },
};

export const OUTLET_CONFIG_STORAGE_KEY = "retrod.pos.outletConfiguration.v1";

import { isHighwayDemoOutlet } from "@/utils/outletId";

export function getCleanOutletConfig(outletId?: string): OutletConfigState {
  return {
    details: {
      outletName: "",
      alias: "",
      email: "",
      logoDataUrl: "",
      gstin: "",
      fssai: "",
      tinNo: "",
      website: "",
      cuisine: "",
      seatingCapacity: "",
      landmark: "",
      zipCode: "",
      fax: "",
      country: "India",
      state: "",
      city: "",
      timezone: "Asia/Calcutta",
      address: "",
      area: "",
      latitude: "",
      longitude: "",
      additionalInfo: "",
    },
    contact: {
      ownerName: "",
      ownerMobile: "",
      ownerEmail: "",
      managerName: "",
      managerMobile: "",
      managerEmail: "",
      accountsName: "",
      accountsMobile: "",
      accountsEmail: "",
      staff: [],
    },
    timings: {
      sameAllDays: "Yes",
      displayOnBill: "Yes",
      displayOnline: "No",
      days: WEEK_DAYS.map((day) => ({
        day,
        closed: false,
        open: "09:00",
        close: "23:00",
        lunchStart: "12:00",
        lunchEnd: "15:00",
        dinnerStart: "19:00",
        dinnerEnd: "23:00",
      })),
    },
    payment: {
      currency: "INR",
      symbol: "₹",
      decimalPlaces: "2",
      symbolPosition: "Before",
      allowSplitPayment: "Yes",
      roundOffBills: "Yes",
      types: [
        { id: "cash", name: "Cash", enabled: true, isDefault: true, surchargePct: "0" },
        { id: "upi", name: "UPI", enabled: true, isDefault: false, surchargePct: "0" },
        { id: "card", name: "Card", enabled: true, isDefault: false, surchargePct: "0" },
        { id: "wallet", name: "Wallet", enabled: false, isDefault: false, surchargePct: "0" },
        { id: "credit", name: "Credit / Room Charge", enabled: true, isDefault: false, surchargePct: "0" },
        { id: "comp", name: "Complimentary", enabled: false, isDefault: false, surchargePct: "0" },
        { id: "neft", name: "NEFT / Bank", enabled: false, isDefault: false, surchargePct: "0" },
      ],
    },
    invoiceSequences: [
      { id: "seq-dine", name: "Dine In", orderType: "Dine In", prefix: "INV", nextNumber: "1", padding: "4", suffix: "", active: true },
      { id: "seq-take", name: "Takeaway", orderType: "Takeaway", prefix: "TK", nextNumber: "1", padding: "4", suffix: "", active: true },
      { id: "seq-room", name: "Room Service", orderType: "Room Service", prefix: "RS", nextNumber: "1", padding: "4", suffix: "", active: true },
      { id: "seq-del", name: "Delivery", orderType: "Delivery", prefix: "DL", nextNumber: "1", padding: "4", suffix: "", active: true },
    ],
    billingDisplay: {
      showItemImages: "Yes",
      showCategoryImages: "Yes",
      showItemCode: "No",
      showKotNumber: "Yes",
      showTaxBreakup: "Yes",
      showRunningTableAmount: "Yes",
      showOutOfStock: "No",
      confirmBeforeSettle: "Yes",
      menuLayout: "Grid",
      itemColumns: "4",
      defaultOrderType: "Dine In",
      density: "Comfortable",
      themeAccent: "Teal",
    },
    printLogo: {
      logoDataUrl: "",
      alignment: "Center",
      widthMm: "42",
      printOnBill: "Yes",
      printOnKot: "No",
      printOutletName: "Yes",
      headerText: "",
      footerText: "Thank you · Visit again",
    },
    calculations: {
      taxInclusive: "No",
      applyServiceCharge: "No",
      serviceChargePct: "5",
      serviceChargeOn: "Dine In only",
      gstOnServiceCharge: "Yes",
      applyPackingCharge: "No",
      packingCharge: "0",
      gstOnPacking: "Yes",
      applyDeliveryCharge: "No",
      deliveryCharge: "0",
      discountBeforeTax: "Yes",
      autoRoundOff: "Yes",
      roundOffMethod: "Nearest",
    },
    connectedServices: {
      pmsRoomService: "No",
      inventoryConsumption: "Yes",
      onlineOrdering: "No",
      aggregatorSync: "No",
      whatsappBill: "No",
      smsBill: "No",
      paymentGateway: "No",
    },
    print: {
      billCopies: "1",
      kotCopies: "1",
      paperSize: "80mm",
      autoPrintOnSettle: "Yes",
      autoPrintKot: "Yes",
      printTokenNumber: "Yes",
      printCustomerCopy: "No",
      printGstin: "Yes",
      printFssai: "Yes",
      printTableNumber: "Yes",
      printCashierName: "Yes",
      cutAfterPrint: "Yes",
    },
    customer: {
      mandatoryMobile: "No",
      mandatoryName: "No",
      allowGstOnBill: "Yes",
      enableLoyalty: "No",
      allowWalkInWithoutCustomer: "Yes",
      captureAddress: "No",
      captureBirthday: "No",
      searchByMobile: "Yes",
      autoCreateOnBill: "Yes",
      showLastOrders: "Yes",
    },
  };
}

export function loadOutletConfig(outletId: string): OutletConfigState {
  const isDemo = isHighwayDemoOutlet(outletId);
  const baseConfig = isDemo ? DEFAULT_OUTLET_CONFIG : getCleanOutletConfig(outletId);
  try {
    const raw = localStorage.getItem(`${OUTLET_CONFIG_STORAGE_KEY}.${outletId}`);
    if (!raw) return structuredClone(baseConfig);
    const parsed = JSON.parse(raw) as Partial<OutletConfigState>;
    return {
      ...structuredClone(baseConfig),
      ...parsed,
      details: { ...baseConfig.details, ...parsed.details },
      contact: { ...baseConfig.contact, ...parsed.contact },
      timings: { ...baseConfig.timings, ...parsed.timings },
      payment: { ...baseConfig.payment, ...parsed.payment },
      billingDisplay: { ...baseConfig.billingDisplay, ...parsed.billingDisplay },
      printLogo: { ...baseConfig.printLogo, ...parsed.printLogo },
      calculations: { ...baseConfig.calculations, ...parsed.calculations },
      connectedServices: { ...baseConfig.connectedServices, ...parsed.connectedServices },
      print: { ...baseConfig.print, ...parsed.print },
      customer: { ...baseConfig.customer, ...parsed.customer },
      invoiceSequences: parsed.invoiceSequences?.length
        ? parsed.invoiceSequences
        : baseConfig.invoiceSequences,
    };
  } catch {
    return structuredClone(baseConfig);
  }
}

export function saveOutletConfig(outletId: string, state: OutletConfigState) {
  localStorage.setItem(`${OUTLET_CONFIG_STORAGE_KEY}.${outletId}`, JSON.stringify(state));
  // Asynchronously synchronize with backend PostgreSQL
  import("@/services/posManagementService")
    .then(({ posManagementService }) => {
      posManagementService.updateOutletConfig(outletId, state).catch((err) => {
        console.warn("[OutletConfigStore] Background sync to backend notice:", err);
      });
    })
    .catch(() => {});
}

export async function syncOutletConfigFromBackend(outletId: string): Promise<OutletConfigState> {
  const isDemo = isHighwayDemoOutlet(outletId);
  const baseConfig = isDemo ? DEFAULT_OUTLET_CONFIG : getCleanOutletConfig(outletId);
  try {
    const { posManagementService } = await import("@/services/posManagementService");
    const remote = await posManagementService.getOutletConfig(outletId);
    if (remote && typeof remote === "object") {
      const current = loadOutletConfig(outletId);
      const merged: OutletConfigState = {
        ...structuredClone(baseConfig),
        ...current,
        details: { ...baseConfig.details, ...current.details, ...(remote.details as any) },
        contact: { ...baseConfig.contact, ...current.contact, ...(remote.contact as any) },
        timings: { ...baseConfig.timings, ...current.timings, ...(remote.timings as any) },
        payment: { ...baseConfig.payment, ...current.payment, ...(remote.payment as any) },
        billingDisplay: { ...baseConfig.billingDisplay, ...current.billingDisplay, ...(remote.billing_display as any) },
        printLogo: { ...baseConfig.printLogo, ...current.printLogo, ...(remote.print_logo as any) },
        calculations: { ...baseConfig.calculations, ...current.calculations, ...(remote.calculations as any) },
        connectedServices: { ...baseConfig.connectedServices, ...current.connectedServices, ...(remote.connected_services as any) },
        print: { ...baseConfig.print, ...current.print, ...(remote.print_settings as any) },
        customer: { ...baseConfig.customer, ...current.customer, ...(remote.customer_settings as any) },
        invoiceSequences: (remote.invoice_sequences as any)?.length
          ? (remote.invoice_sequences as any)
          : current.invoiceSequences?.length
          ? current.invoiceSequences
          : baseConfig.invoiceSequences,
      };
      localStorage.setItem(`${OUTLET_CONFIG_STORAGE_KEY}.${outletId}`, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("[OutletConfigStore] Failed fetching remote config, using local cache:", err);
  }
  return loadOutletConfig(outletId);
}

