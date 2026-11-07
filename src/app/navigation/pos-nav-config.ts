import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  Grid3X3,
  UtensilsCrossed,
  Package,
  PieChart,
  Settings2,
  HelpCircle,
  Settings,
  ClipboardList,
  ChefHat,
  Wallet,
  History,
  List,
  StickyNote,
  Percent,
  BookOpen,
  LayoutGrid,
  ShoppingCart,
  Boxes,
  ArrowLeftRight,
  CookingPot,
  BarChart3,
  SlidersHorizontal,
  Store,
  FileText,
  Users,
  ScrollText,
  Mail,
  Landmark,
  Receipt,
  Smartphone,
  UserCog,
  Coins,
  PlusCircle,
  CalendarCheck2,
  FolderTree,
  ShieldCheck,
} from "lucide-react";
import type { Permission } from "@/types/rbac";

export type PosNavChild = {
  id: string;
  label: string;
  to?: string;
  icon?: LucideIcon;
  children?: PosNavChild[];
  permission?: Permission;
  anyPermissions?: Permission[];
};

export type PosNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: PosNavChild[];
  permission?: Permission;
  anyPermissions?: Permission[];
};

/** SRS module nav — Exact alignment with POS Design System & RBAC permissions */
export const POS_NAV_ITEMS: PosNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/pos",
    icon: LayoutDashboard,
    exact: true,
    anyPermissions: [
      "pos.orders.view",
      "pos.kot.view",
      "pos.billing.view",
      "pos.inventory.view",
      "pos.menu.view",
      "dashboard.view",
    ],
  },
  {
    id: "take-order",
    label: "Take Order",
    to: "/pos/take-order",
    icon: Grid3X3,
    permission: "pos.orders.create",
  },
  {
    id: "billing",
    label: "POS",
    to: "/pos/billing",
    icon: CreditCard,
    permission: "pos.billing.view",
  },
  {
    id: "daily",
    label: "Orders",
    to: "/pos/orders",
    icon: ShoppingBag,
    anyPermissions: ["pos.orders.view", "pos.kot.view", "pos.billing.settle"],
    children: [
      { id: "live-orders", label: "Current Orders", to: "/pos/orders", icon: ClipboardList, permission: "pos.orders.view" },
      { id: "kot", label: "Kitchen Orders", to: "/pos/kot", icon: ChefHat, permission: "pos.kot.view" },
      { id: "settlement", label: "Pending Payments", to: "/pos/settlement", icon: Wallet, permission: "pos.billing.settle" },
      { id: "all-orders", label: "Order History", to: "/pos/orders/all", icon: History, permission: "pos.orders.view" },
    ],
  },
  {
    id: "reservations",
    label: "Reservations",
    to: "/pos/reservations",
    icon: CalendarCheck2,
    permission: "pos.orders.view",
  },
  {
    id: "menu",
    label: "Food Menu",
    to: "/pos/menu",
    icon: UtensilsCrossed,
    permission: "pos.menu.view",
    children: [
      { id: "menu-list", label: "Menu List", to: "/pos/menu", icon: List, permission: "pos.menu.view" },
      { id: "menu-notes", label: "Special Notes", to: "/pos/menu/special-notes", icon: StickyNote, permission: "pos.menu.manage" },
      { id: "menu-commission", label: "Set Item Commission", to: "/pos/menu/commission", icon: Percent, permission: "pos.menu.manage" },
      { id: "menu-physical", label: "Printed Menu", to: "/pos/menu/physical", icon: BookOpen, permission: "pos.menu.view" },
    ],
  },
  {
    id: "inventory",
    label: "Stock",
    to: "/pos/inventory",
    icon: Package,
    permission: "pos.inventory.view",
    children: [
      { id: "inv-dashboard", label: "Stock Overview", to: "/pos/inventory", icon: LayoutGrid, permission: "pos.inventory.view" },
      {
        id: "purchase-group",
        label: "Purchases",
        icon: ShoppingCart,
        permission: "pos.inventory.manage",
        children: [
          { id: "stock-purchase", label: "Purchases", to: "/pos/inventory/purchase", icon: ShoppingCart, permission: "pos.inventory.manage" },
          { id: "purchase-return", label: "Purchase Returns", to: "/pos/inventory/return", icon: ArrowLeftRight, permission: "pos.inventory.manage" },
        ],
      },
      {
        id: "manage-stock-group",
        label: "Manage Stock",
        icon: Boxes,
        permission: "pos.inventory.view",
        children: [
          { id: "available-stock", label: "Available Stock", to: "/pos/inventory/available-stock", icon: Boxes, permission: "pos.inventory.view" },
          { id: "closing-stock", label: "Daily Stock Count", to: "/pos/inventory/closing-stock", icon: ClipboardList, permission: "pos.inventory.manage" },
        ],
      },
      {
        id: "consumption-group",
        label: "Stock Usage",
        icon: ArrowLeftRight,
        permission: "pos.inventory.view",
        children: [
          { id: "inv-sales", label: "Items Sold", to: "/pos/inventory/sales", icon: ShoppingBag, permission: "pos.inventory.view" },
          { id: "inv-wastage", label: "Stock Wastage", to: "/pos/inventory/wastage", icon: Package, permission: "pos.inventory.wastage" },
        ],
      },
      {
        id: "production-group",
        label: "Food Preparation",
        icon: CookingPot,
        permission: "pos.inventory.production",
        children: [
          { id: "inv-prod-master", label: "Preparation Setup", to: "/pos/inventory/production", icon: SlidersHorizontal, permission: "pos.inventory.production" },
          {
            id: "inv-prod-exec",
            label: "Prepare Items",
            to: "/pos/inventory/production/execution",
            icon: CookingPot,
            permission: "pos.inventory.production",
          },
        ],
      },
      {
        id: "masters-group",
        label: "Stock Setup",
        icon: Settings2,
        permission: "pos.inventory.manage",
        children: [
          {
            id: "inv-categories",
            label: "Categories",
            to: "/pos/inventory/masters/categories",
            icon: FolderTree,
            permission: "pos.inventory.manage",
          },
          {
            id: "inv-raw-materials",
            label: "Raw Materials",
            to: "/pos/inventory/masters/raw-materials",
            icon: Package,
            permission: "pos.inventory.manage",
          },
          // { id: "inv-recipes", label: "Recipes", to: "/pos/inventory/masters/recipes", icon: BookOpen, permission: "pos.recipes.view" },
          { id: "inv-suppliers-list", label: "Suppliers", to: "/pos/inventory/masters/suppliers", icon: Store, permission: "pos.inventory.manage" },
          {
            id: "inv-invoice-templates",
            label: "Invoice Format",
            to: "/pos/inventory/masters/invoice-templates",
            icon: FileText,
            permission: "pos.inventory.manage",
          },
          { id: "inv-units", label: "Units", to: "/pos/inventory/masters/units", icon: SlidersHorizontal, permission: "pos.inventory.manage" },
        ],
      },
      // { id: "inv-settings", label: "Stock Settings", to: "/pos/inventory/settings", icon: Settings, permission: "pos.settings.manage" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    to: "/pos/reports",
    icon: PieChart,
    permission: "pos.reports.view",
    children: [
      { id: "rep-day-end", label: "Day End Summary", to: "/pos/reports/day-end", icon: ClipboardList, permission: "pos.reports.view" },
      { id: "rep-other", label: "Other Reports", to: "/pos/reports/other", icon: FileText, permission: "pos.reports.view" },
      {
        id: "stock-reports-group",
        label: "Stock Reports",
        icon: Boxes,
        permission: "pos.reports.view",
        children: [
          {
            id: "inv-rep-summary",
            label: "Stock Summary",
            to: "/pos/inventory/reports/stock-summary",
            icon: PieChart,
            permission: "pos.reports.view",
          },
          {
            id: "inv-rep-orderwise",
            label: "Usage by Order",
            to: "/pos/inventory/reports/orderwise-consumption",
            icon: ClipboardList,
            permission: "pos.reports.view",
          },
          {
            id: "inv-rep-other",
            label: "More Reports",
            to: "/pos/inventory/reports/other-reports",
            icon: FileText,
            permission: "pos.reports.view",
          },
        ],
      },
      { id: "rep-notifications", label: "Report Notification", to: "/pos/reports/notifications", icon: StickyNote, permission: "pos.settings.manage" },
    ],
  },
  {
    id: "management",
    label: "Management",
    to: "/pos/management",
    icon: Settings2,
    permission: "pos.settings.manage",
    children: [
      {
        id: "configuration-group",
        label: "Configuration",
        icon: SlidersHorizontal,
        permission: "pos.settings.manage",
        children: [
          {
            id: "cfg-outlet-group",
            label: "Outlet",
            icon: Store,
            permission: "pos.settings.manage",
            children: [
              {
                id: "cfg-outlet-list",
                label: "Outlet List",
                to: "/pos/management/configuration/outlet/list",
                icon: List,
                permission: "pos.settings.manage",
              },
              {
                id: "cfg-outlet-add",
                label: "+ Add Outlet",
                to: "/pos/management/configuration/outlet/add",
                icon: PlusCircle,
                permission: "pos.settings.manage",
              },
              {
                id: "cfg-outlet-setup",
                label: "Outlet Setup",
                to: "/pos/management/configuration/outlet",
                icon: Store,
                permission: "pos.settings.manage",
              },
            ],
          },
          {
            id: "cfg-email-template",
            label: "Email Template Settings",
            to: "/pos/management/configuration/email-templates",
            icon: Mail,
            permission: "pos.settings.manage",
          },
        ],
      },
      {
        id: "accounting-group",
        label: "Accounting",
        icon: Wallet,
        permission: "pos.billing.settle",
        children: [
          {
            id: "payments-group",
            label: "Payments",
            icon: CreditCard,
            permission: "pos.billing.settle",
            children: [
              {
                id: "acc-pay-info",
                label: "Payment Information",
                to: "/pos/management/accounting/payments/information",
                icon: CreditCard,
                permission: "pos.billing.view",
              },
              {
                id: "acc-pay-wallet",
                label: "Virtual Wallet",
                to: "/pos/management/accounting/payments/wallet",
                icon: Wallet,
                permission: "pos.billing.settle",
              },
            ],
          },
          { id: "acc-gst", label: "GST Information", to: "/pos/management/accounting/gst", icon: FileText, permission: "pos.reports.view" },
          { id: "acc-bank", label: "Bank Details", to: "/pos/management/accounting/bank-details", icon: Landmark, permission: "pos.settings.manage" },
          { id: "acc-kyc", label: "KYC Details", to: "/pos/management/accounting/kyc", icon: Users, permission: "pos.settings.manage" },
          {
            id: "acc-utility",
            label: "Utility Bills",
            to: "/pos/management/accounting/utility-bills",
            icon: Receipt,
            permission: "pos.settings.manage",
          },
          {
            id: "acc-expenses",
            label: "Expense & Withdrawal",
            to: "/pos/management/accounting/expenses",
            icon: Wallet,
            permission: "pos.shift.manage",
          },
          {
            id: "acc-service",
            label: "Service Payment History",
            to: "/pos/management/accounting/service-payments",
            icon: History,
            permission: "pos.reports.view",
          },
          { id: "acc-loans", label: "Loan Information", to: "/pos/management/accounting/loans", icon: FileText, permission: "pos.settings.manage" },
          { id: "acc-denom", label: "Denomination", to: "/pos/management/accounting/denomination", icon: Coins, permission: "pos.shift.manage" },
        ],
      },
      {
        id: "user-management-group",
        label: "User Management",
        icon: Users,
        permission: "pos.users.manage",
        children: [
          {
            id: "usr-users",
            label: "Users",
            to: "/pos/management/users",
            icon: Users,
            permission: "pos.users.manage",
          },
          {
            id: "usr-roles",
            label: "User roles",
            to: "/pos/management/users/roles",
            icon: ShieldCheck,
            permission: "pos.users.manage",
          },
        ],
      },
      {
        id: "user-logs-group",
        label: "User Logs",
        icon: ScrollText,
        permission: "pos.settings.manage",
        children: [
          { id: "log-support", label: "Support Management", to: "/pos/management/logs/support", icon: HelpCircle, permission: "pos.settings.manage" },
          { id: "log-notifications", label: "Notification", to: "/pos/management/logs/notifications", icon: StickyNote, permission: "pos.settings.manage" },
          {
            id: "log-menu-trigger",
            label: "Menu Trigger Logs",
            to: "/pos/management/logs/menu-trigger",
            icon: ScrollText,
            permission: "pos.settings.manage",
          },
          {
            id: "log-closing-hours",
            label: "Closing Hour Logs",
            to: "/pos/management/logs/closing-hours",
            icon: History,
            permission: "pos.settings.manage",
          },
          { id: "log-expense", label: "Expense Logs", to: "/pos/management/logs/expenses", icon: Wallet, permission: "pos.shift.manage" },
          {
            id: "log-withdrawal",
            label: "Withdrawal Logs",
            to: "/pos/management/logs/withdrawals",
            icon: Wallet,
            permission: "pos.shift.manage",
          },
          {
            id: "log-cash-topup",
            label: "Cash Top-Up Logs",
            to: "/pos/management/logs/cash-topup",
            icon: Coins,
            permission: "pos.shift.manage",
          },
        ],
      },
      { id: "mgmt-audit", label: "Audit Trail", to: "/pos/management/audit-trail", icon: ScrollText, permission: "pos.settings.manage" },
      { id: "mgmt-data", label: "Data Management", to: "/pos/management/data-management", icon: FileText, permission: "pos.settings.manage" },
      { id: "mgmt-device", label: "Device Mapping", to: "/pos/management/device-mapping", icon: Settings2, permission: "pos.settings.manage" },
    ],
  },
];

export const POS_FOOTER_NAV_ITEMS: PosNavItem[] = [
  { id: "help", label: "Help Guide", to: "/pos/help", icon: BookOpen },
  { id: "settings", label: "Settings", to: "/pos/settings", icon: Settings },
];

export function getPosRouteMeta(pathname: string): { label: string; linkTo: string } {
  const allItems = [...POS_NAV_ITEMS, ...POS_FOOTER_NAV_ITEMS];
  for (const item of allItems) {
    if (item.children?.length) {
      const flattenChildren = (children: PosNavChild[]): Array<{ label: string; to: string }> => {
        const res: Array<{ label: string; to: string }> = [];
        for (const c of children) {
          if (c.to) res.push({ label: c.label, to: c.to });
          if (c.children?.length) res.push(...flattenChildren(c.children));
        }
        return res;
      };
      const allChildren = flattenChildren(item.children);
      const matched = [...allChildren]
        .sort((a, b) => b.to.length - a.to.length)
        .find((c) => pathname === c.to || pathname.startsWith(c.to + "/"));
      if (matched) return { label: matched.label, linkTo: matched.to };
    }
    if (item.exact) {
      if (pathname === item.to || pathname === `${item.to}/`) {
        return { label: item.label, linkTo: item.to };
      }
      continue;
    }
    if (pathname === item.to || pathname.startsWith(item.to + "/")) {
      return { label: item.label, linkTo: item.to };
    }
  }
  return { label: "Dashboard", linkTo: "/pos" };
}
