/**
 * Retrod POS Centralized API Endpoints
 * Defines all standard REST contracts for Menu, Billing, Operations, Tables, and Rooms.
 */
export const API_ENDPOINTS = {
  OUTLETS: {
    LIST: "/api/pos/outlets/",
    CREATE: "/api/pos/outlets/",
    BY_ID: (id: string) => `/api/pos/outlets/${id}/`,
  },
  MENU: {
    ITEMS: "/api/pos/menu/items/",
    ITEM_BY_ID: (id: string) => `/api/pos/menu/items/${id}/`,
    CREATE_ITEM: "/api/pos/menu/items/",
    UPDATE_ITEM: (id: string) => `/api/pos/menu/items/${id}/`,
    DELETE_ITEM: (id: string) => `/api/pos/menu/items/${id}/`,
    TOGGLE_STATUS: (id: string) => `/api/pos/menu/items/${id}/status/`,
    TOGGLE_PLATFORM: (id: string, platform: string) => `/api/pos/menu/items/${id}/platform/${platform}/`,
    BULK_PLATFORMS: "/api/pos/menu/items/bulk-platforms/",
    CATEGORIES: "/api/pos/menu/categories/",
    CATEGORY_BY_ID: (id: string) => `/api/pos/menu/categories/${id}/`,
    SPECIAL_NOTES: "/api/pos/menu/special-notes/",
    SPECIAL_NOTE_BY_ID: (id: string) => `/api/pos/menu/special-notes/${id}/`,
    COMMISSIONS: "/api/pos/menu/items/",
    ITEM_IMAGES: (id: string) => `/api/pos/menu/items/${id}/images/`,
    SYNC_POS: "/api/pos/menu/sync/",
  },
  BILLING: {
    MENU: "/api/pos/billing/menu/",
    ORDERS: "/api/pos/orders/",
    HELD_BILLS: "/api/pos/billing/held",
    HELD_BILL_BY_ID: (id: string) => `/api/pos/billing/held/${id}`,
    SETTLE_BILL: (id: string) => `/api/pos/orders/${id}/settle/`,
    SEND_KOT: (id: string) => `/api/pos/orders/${id}/kot/`,
    SPLIT_BILL: "/api/pos/billing/split",
    CUSTOMERS: "/api/pos/billing/customers",
  },
  TABLES: {
    LIST: "/api/pos/tables/",
    AREAS: "/api/pos/sections/",
    CREATE_ORDER: "/api/pos/orders/",
    UPDATE_ORDER: (id: string) => `/api/pos/orders/${id}/`,
    SEAT_GUESTS: "/api/pos/tables/seat",
    VACATE: (id: string) => `/api/pos/tables/${id}/status/`,
    RESERVATIONS: "/api/pos/tables/reservations",
    STATUS: (id: string) => `/api/pos/tables/${id}/status/`,
  },
  ROOM_SERVICE: {
    ROOMS: "/api/pos/integrations/occupied-rooms/",
    ORDERS: "/api/pos/orders/",
    CREATE_ORDER: "/api/pos/orders/",
    UPDATE_STATUS: (id: string) => `/api/pos/orders/${id}/advance-stage/`,
    CLEAR_TRAY: (id: string) => `/api/pos/room-service/orders/${id}/clear-tray`,
  },
  DASHBOARD: {
    METRICS: "/api/pos/dashboard/",
  },
  REPORTS: {
    DAY_END: "/api/pos/reports/day-end/",
    DAY_END_CLOSE: "/api/pos/reports/day-end/close/",
    SALES: "/api/pos/reports/sales/",
    STOCK: "/api/pos/reports/stock/",
    CONSUMPTION: "/api/pos/reports/consumption/",
  },
  ORDERS: {
    LIST: "/api/pos/orders/",
    BY_ID: (id: string) => `/api/pos/orders/${id}/`,
    CURRENT: "/api/pos/orders/current/",
    LIVE: "/api/pos/orders/live/",
    ALL: "/api/pos/orders/all/",
    HISTORY: "/api/pos/orders/history/",
    ONLINE: "/api/pos/orders/online/",
    KOT: "/api/pos/kot/",
    KOT_READY: (id: string) => `/api/pos/kot/${id}/ready/`,
    KOT_SERVED: (id: string) => `/api/pos/kot/${id}/served/`,
    ADVANCE: (id: string) => `/api/pos/orders/${id}/advance-stage/`,
    SETTLE: (id: string) => `/api/pos/orders/${id}/settle/`,
    SEND_KOT: (id: string) => `/api/pos/orders/${id}/kot/`,
    DUE_SETTLEMENT: "/api/pos/orders/due-settlement/",
    DUE_SETTLE: (id: string) => `/api/pos/orders/due-settlement/${id}/settle/`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
