/**
 * Retrod POS Centralized API Endpoints
 * Defines all standard REST contracts for Menu, Billing, Operations, Tables, and Rooms.
 */
export const API_ENDPOINTS = {
  MENU: {
    ITEMS: "/api/pos/menu/items",
    ITEM_BY_ID: (id: string) => `/api/pos/menu/items/${id}`,
    CREATE_ITEM: "/api/pos/menu/items",
    UPDATE_ITEM: (id: string) => `/api/pos/menu/items/${id}`,
    DELETE_ITEM: (id: string) => `/api/pos/menu/items/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/pos/menu/items/${id}/status`,
    TOGGLE_PLATFORM: (id: string, platform: string) => `/api/pos/menu/items/${id}/platform/${platform}`,
    BULK_PLATFORMS: "/api/pos/menu/items/bulk-platforms",
    SPECIAL_NOTES: "/api/pos/menu/special-notes",
    COMMISSIONS: "/api/pos/menu/commissions",
    ITEM_IMAGES: (id: string) => `/api/pos/menu/items/${id}/images`,
    SYNC_POS: "/api/pos/menu/sync",
  },
  BILLING: {
    MENU: "/api/pos/billing/menu",
    ORDERS: "/api/pos/billing/orders",
    HELD_BILLS: "/api/pos/billing/held",
    HELD_BILL_BY_ID: (id: string) => `/api/pos/billing/held/${id}`,
    SETTLE_BILL: "/api/pos/billing/settle",
    SEND_KOT: "/api/pos/billing/kot",
    SPLIT_BILL: "/api/pos/billing/split",
    CUSTOMERS: "/api/pos/billing/customers",
  },
  TABLES: {
    LIST: "/api/pos/tables",
    AREAS: "/api/pos/tables/areas",
    CREATE_ORDER: "/api/pos/tables/order",
    UPDATE_ORDER: (id: string) => `/api/pos/tables/order/${id}`,
    SEAT_GUESTS: "/api/pos/tables/seat",
    VACATE: (id: string) => `/api/pos/tables/${id}/vacate`,
    RESERVATIONS: "/api/pos/tables/reservations",
  },
  ROOM_SERVICE: {
    ROOMS: "/api/pos/rooms",
    ORDERS: "/api/pos/room-service/orders",
    CREATE_ORDER: "/api/pos/room-service/order",
    UPDATE_STATUS: (id: string) => `/api/pos/room-service/orders/${id}/status`,
    CLEAR_TRAY: (id: string) => `/api/pos/room-service/orders/${id}/clear-tray`,
  },
  DASHBOARD: {
    METRICS: "/api/pos/dashboard",
  },
  ORDERS: {
    LIVE: "/api/pos/orders/live",
    ALL: "/api/pos/orders/all",
    ONLINE: "/api/pos/orders/online",
    KOT: "/api/pos/kot",
    DUE_SETTLEMENT: "/api/pos/orders/due-settlement",
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
