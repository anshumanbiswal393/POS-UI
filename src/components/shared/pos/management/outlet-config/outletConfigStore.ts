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

export type OutletStepStatus = "not_started" | "in_progress" | "completed";

export type OutletSetupStepId =
  | "details"
  | "contact"
  | "timings"
  | "payment"
  | "invoice-sequence"
  | "service-mode"
  | "integrations"
  | "billing-preferences"
  | "display"
  | "calculations"
  | "print-logo"
  | "connected-services"
  | "customer"
  | "print";

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
  serviceMode: {
    dineIn: YesNo;
    takeaway: YesNo;
    roomService: YesNo;
    delivery: YesNo;
    autoAcceptDelivery: YesNo;
    printToken: YesNo;
  };
  integrations: {
    aggregatorSync: YesNo;
    pmsRoomService: YesNo;
    whatsappBill: YesNo;
    smsBill: YesNo;
    paymentGateway: YesNo;
  };
  billingPreferences: {
    currency: string;
    symbol: string;
    decimalPlaces: string;
    symbolPosition: "Before" | "After";
    allowSplitPayment: YesNo;
    roundOffBills: YesNo;
  };
  stepStatus: Record<string, OutletStepStatus>;
  /** Local-only: true when the user edited a step without clicking Save. */
  draftDirty: Record<string, boolean>;
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
  serviceMode: {
    dineIn: "Yes",
    takeaway: "Yes",
    roomService: "Yes",
    delivery: "Yes",
    autoAcceptDelivery: "No",
    printToken: "Yes",
  },
  integrations: {
    aggregatorSync: "No",
    pmsRoomService: "Yes",
    whatsappBill: "No",
    smsBill: "No",
    paymentGateway: "No",
  },
  billingPreferences: {
    currency: "INR",
    symbol: "₹",
    decimalPlaces: "2",
    symbolPosition: "Before",
    allowSplitPayment: "Yes",
    roundOffBills: "Yes",
  },
  stepStatus: {},
  draftDirty: {},
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
    serviceMode: {
      dineIn: "Yes",
      takeaway: "Yes",
      roomService: "Yes",
      delivery: "Yes",
      autoAcceptDelivery: "No",
      printToken: "Yes",
    },
    integrations: {
      aggregatorSync: "No",
      pmsRoomService: "Yes",
      whatsappBill: "No",
      smsBill: "No",
      paymentGateway: "No",
    },
    billingPreferences: {
      currency: "INR",
      symbol: "₹",
      decimalPlaces: "2",
      symbolPosition: "Before",
      allowSplitPayment: "Yes",
      roundOffBills: "Yes",
    },
    stepStatus: {},
    draftDirty: {},
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const STEP_DRAFT_KEYS: Record<OutletSetupStepId, Array<keyof OutletConfigState>> = {
  details: ["details"],
  contact: ["contact"],
  timings: ["timings"],
  payment: ["payment"],
  "invoice-sequence": ["invoiceSequences"],
  "service-mode": ["serviceMode"],
  integrations: ["integrations"],
  "billing-preferences": ["billingPreferences"],
  display: ["billingDisplay", "print"],
  calculations: ["calculations"],
  "print-logo": ["printLogo"],
  "connected-services": ["connectedServices"],
  customer: ["customer"],
  print: ["print"],
};

function mergeStepStatus(
  local?: Record<string, OutletStepStatus>,
  remote?: Record<string, OutletStepStatus>,
  draftDirty?: Record<string, boolean>,
): Record<string, OutletStepStatus> {
  const rank: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2 };
  const merged: Record<string, OutletStepStatus> = {};
  for (const source of [remote, local]) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value !== "not_started" && value !== "in_progress" && value !== "completed") continue;
      if (rank[value] >= rank[merged[key] || "not_started"]) merged[key] = value;
    }
  }
  if (draftDirty) {
    for (const [key, dirty] of Object.entries(draftDirty)) {
      if (dirty) merged[key] = "in_progress";
    }
  }
  return merged;
}

function mergeConfig(
  base: OutletConfigState,
  local?: Partial<OutletConfigState>,
  remote?: Record<string, unknown>,
): OutletConfigState {
  const remoteCs = asRecord(remote?.connected_services);
  const remoteStep =
    (asRecord(remote?.step_status) as Record<string, OutletStepStatus>) ||
    (asRecord(remoteCs.step_status) as Record<string, OutletStepStatus>);
  const remoteServiceMode = asRecord(remote?.service_mode).dineIn
    ? asRecord(remote?.service_mode)
    : asRecord(remoteCs.service_modes);
  const merged: OutletConfigState = {
    ...structuredClone(base),
    ...local,
    details: { ...base.details, ...local?.details, ...asRecord(remote?.details) } as OutletConfigState["details"],
    contact: { ...base.contact, ...local?.contact, ...asRecord(remote?.contact) } as OutletConfigState["contact"],
    timings: { ...base.timings, ...local?.timings, ...asRecord(remote?.timings) } as OutletConfigState["timings"],
    payment: { ...base.payment, ...local?.payment, ...asRecord(remote?.payment) } as OutletConfigState["payment"],
    billingDisplay: {
      ...base.billingDisplay,
      ...local?.billingDisplay,
      ...asRecord(remote?.billing_display),
    } as OutletConfigState["billingDisplay"],
    printLogo: {
      ...base.printLogo,
      ...local?.printLogo,
      ...asRecord(remote?.print_logo),
    } as OutletConfigState["printLogo"],
    calculations: {
      ...base.calculations,
      ...local?.calculations,
      ...asRecord(remote?.calculations),
    } as OutletConfigState["calculations"],
    connectedServices: {
      ...base.connectedServices,
      ...local?.connectedServices,
      ...asRecord(remote?.connected_services),
    } as OutletConfigState["connectedServices"],
    print: {
      ...base.print,
      ...local?.print,
      ...asRecord(remote?.print_settings),
    } as OutletConfigState["print"],
    customer: {
      ...base.customer,
      ...local?.customer,
      ...asRecord(remote?.customer_settings),
    } as OutletConfigState["customer"],
    serviceMode: {
      ...base.serviceMode,
      ...local?.serviceMode,
      ...remoteServiceMode,
    } as OutletConfigState["serviceMode"],
    integrations: {
      ...base.integrations,
      ...local?.integrations,
      ...asRecord(remote?.integrations),
    } as OutletConfigState["integrations"],
    billingPreferences: {
      ...base.billingPreferences,
      ...local?.billingPreferences,
      ...asRecord(remote?.billing_preferences),
    } as OutletConfigState["billingPreferences"],
    invoiceSequences: Array.isArray(remote?.invoice_sequences) && (remote?.invoice_sequences as unknown[]).length
      ? (remote?.invoice_sequences as OutletConfigState["invoiceSequences"])
      : local?.invoiceSequences?.length
        ? local.invoiceSequences
        : base.invoiceSequences,
    stepStatus: mergeStepStatus(local?.stepStatus, remoteStep, local?.draftDirty),
    draftDirty: { ...(local?.draftDirty || {}) },
  };

  const draftDirty = local?.draftDirty || {};
  for (const [step, dirty] of Object.entries(draftDirty)) {
    if (!dirty) continue;
    merged.stepStatus[step] = "in_progress";
    const keys = STEP_DRAFT_KEYS[step as OutletSetupStepId];
    if (!keys || !local) continue;
    for (const key of keys) {
      const value = local[key];
      if (value !== undefined) {
        (merged as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }
  return merged;
}

export function stepPayload(
  state: OutletConfigState,
  stepId?: OutletSetupStepId,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    step_status: completedStepStatus(state),
  };
  if (!stepId) {
    return {
      details: state.details,
      contact: state.contact,
      timings: state.timings,
      payment: state.payment,
      invoice_sequences: state.invoiceSequences,
      billing_display: state.billingDisplay,
      print_logo: state.printLogo,
      calculations: state.calculations,
      connected_services: state.connectedServices,
      print_settings: state.print,
      customer_settings: state.customer,
      service_mode: state.serviceMode,
      integrations: state.integrations,
      billing_preferences: state.billingPreferences,
      step_status: completedStepStatus(state),
    };
  }
  switch (stepId) {
    case "details":
      payload.details = state.details;
      break;
    case "contact":
      payload.contact = state.contact;
      break;
    case "timings":
      payload.timings = state.timings;
      break;
    case "payment":
      payload.payment = state.payment;
      break;
    case "invoice-sequence":
      payload.invoice_sequences = state.invoiceSequences;
      break;
    case "service-mode":
      payload.service_mode = state.serviceMode;
      break;
    case "integrations":
      payload.integrations = state.integrations;
      break;
    case "billing-preferences":
      payload.billing_preferences = state.billingPreferences;
      break;
    case "display":
      payload.billing_display = state.billingDisplay;
      payload.print_settings = state.print;
      break;
    case "calculations":
      payload.calculations = state.calculations;
      break;
    case "print-logo":
      payload.print_logo = state.printLogo;
      break;
    case "connected-services":
      payload.connected_services = state.connectedServices;
      break;
    case "customer":
      payload.customer_settings = state.customer;
      break;
    case "print":
      payload.print_settings = state.print;
      break;
  }
  return payload;
}

function completedStepStatus(state: OutletConfigState): Record<string, OutletStepStatus> {
  const out: Record<string, OutletStepStatus> = {};
  for (const [key, value] of Object.entries(state.stepStatus || {})) {
    if (value === "completed" && !state.draftDirty?.[key]) out[key] = "completed";
  }
  return out;
}

export function getStepStatus(
  config: OutletConfigState,
  stepId: OutletSetupStepId,
): OutletStepStatus {
  if (config.draftDirty?.[stepId]) return "in_progress";
  if (config.stepStatus?.[stepId] === "completed") return "completed";
  return "not_started";
}

export function saveDraft(outletId: string, state: OutletConfigState, stepId: OutletSetupStepId): OutletConfigState {
  const next: OutletConfigState = {
    ...state,
    draftDirty: { ...(state.draftDirty || {}), [stepId]: true },
    stepStatus: { ...state.stepStatus, [stepId]: "in_progress" },
  };
  cacheOutletConfig(outletId, next);
  return next;
}

export function loadOutletConfig(outletId: string): OutletConfigState {
  const isDemo = isHighwayDemoOutlet(outletId);
  const baseConfig = isDemo ? DEFAULT_OUTLET_CONFIG : getCleanOutletConfig(outletId);
  try {
    const raw = localStorage.getItem(`${OUTLET_CONFIG_STORAGE_KEY}.${outletId}`);
    if (!raw) return structuredClone(baseConfig);
    const parsed = JSON.parse(raw) as Partial<OutletConfigState>;
    return mergeConfig(baseConfig, parsed);
  } catch {
    return structuredClone(baseConfig);
  }
}

export function cacheOutletConfig(outletId: string, state: OutletConfigState) {
  localStorage.setItem(`${OUTLET_CONFIG_STORAGE_KEY}.${outletId}`, JSON.stringify(state));
}

export async function saveOutletConfig(
  outletId: string,
  state: OutletConfigState,
  stepId?: OutletSetupStepId,
  statusOnly = false,
): Promise<OutletConfigState> {
  cacheOutletConfig(outletId, state);
  try {
    const { posManagementService } = await import("@/services/posManagementService");
    const { isBackendOutletId } = await import("@/utils/outletId");
    if (!isBackendOutletId(outletId)) return state;
    const payload = statusOnly
      ? { step_status: completedStepStatus(state) }
      : stepPayload(state, stepId);
    await posManagementService.updateOutletConfig(outletId, payload);
  } catch (err) {
    console.warn("[OutletConfigStore] Backend save failed, kept local copy:", err);
    throw err;
  }
  return state;
}

export async function syncOutletConfigFromBackend(outletId: string): Promise<OutletConfigState> {
  const isDemo = isHighwayDemoOutlet(outletId);
  const baseConfig = isDemo ? DEFAULT_OUTLET_CONFIG : getCleanOutletConfig(outletId);
  const current = loadOutletConfig(outletId);
  try {
    const { posManagementService } = await import("@/services/posManagementService");
    const { isBackendOutletId } = await import("@/utils/outletId");
    if (!isBackendOutletId(outletId)) return current;
    const remote = await posManagementService.getOutletConfig(outletId);
    if (remote && typeof remote === "object") {
      const merged = mergeConfig(baseConfig, current, remote as Record<string, unknown>);
      cacheOutletConfig(outletId, merged);
      return merged;
    }
  } catch (err) {
    console.warn("[OutletConfigStore] Failed fetching remote config, using local cache:", err);
  }
  return current;
}

