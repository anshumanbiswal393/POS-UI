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
  Building2,
  Mail,
  Landmark,
  Receipt,
  Smartphone,
  UserCog,
  Coins,
  PlusCircle,
} from "lucide-react";

export type PosNavChild = {
  id: string;
  label: string;
  to?: string;
  icon?: LucideIcon;
  children?: PosNavChild[];
};

export type PosNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: PosNavChild[];
};

/** SRS module nav — Exact alignment with POS Design System */
export const POS_NAV_ITEMS: PosNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/pos",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "take-order",
    label: "Take Order",
    to: "/pos/take-order",
    icon: Grid3X3,
  },
  {
    id: "billing",
    label: "Billing",
    to: "/pos/billing",
    icon: CreditCard,
  },
  {
    id: "daily",
    label: "Orders",
    to: "/pos/orders",
    icon: ShoppingBag,
    children: [
      { id: "live-orders", label: "Current Orders", to: "/pos/orders", icon: ClipboardList },
      { id: "kot", label: "Kitchen Orders", to: "/pos/kot", icon: ChefHat },
      { id: "settlement", label: "Pending Payments", to: "/pos/settlement", icon: Wallet },
      { id: "all-orders", label: "Order History", to: "/pos/orders/all", icon: History },
    ],
  },

  {
    id: "menu",
    label: "Food Menu",
    to: "/pos/menu",
    icon: UtensilsCrossed,
    children: [
      { id: "menu-list", label: "Menu List", to: "/pos/menu", icon: List },
      { id: "menu-notes", label: "Special Notes", to: "/pos/menu/special-notes", icon: StickyNote },
      { id: "menu-commission", label: "Set Item Commission", to: "/pos/menu/commission", icon: Percent },
      { id: "menu-physical", label: "Printed Menu", to: "/pos/menu/physical", icon: BookOpen },
    ],
  },
  {
    id: "inventory",
    label: "Stock",
    to: "/pos/inventory",
    icon: Package,
    children: [
      { id: "inv-dashboard", label: "Stock Overview", to: "/pos/inventory", icon: LayoutGrid },
      {
        id: "purchase-group",
        label: "Purchases",
        icon: ShoppingCart,
        children: [
          { id: "stock-purchase", label: "Purchases", to: "/pos/inventory/purchase", icon: ShoppingCart },
          { id: "purchase-return", label: "Purchase Returns", to: "/pos/inventory/return", icon: ArrowLeftRight },
        ],
      },
      {
        id: "manage-stock-group",
        label: "Manage Stock",
        icon: Boxes,
        children: [
          { id: "available-stock", label: "Available Stock", to: "/pos/inventory/available-stock", icon: Boxes },
          { id: "closing-stock", label: "Daily Stock Count", to: "/pos/inventory/closing-stock", icon: ClipboardList },
        ],
      },
      {
        id: "consumption-group",
        label: "Stock Usage",
        icon: ArrowLeftRight,
        children: [
          { id: "inv-sales", label: "Items Sold", to: "/pos/inventory/sales", icon: ShoppingBag },
          { id: "inv-wastage", label: "Stock Wastage", to: "/pos/inventory/wastage", icon: Package },
        ],
      },
      {
        id: "production-group",
        label: "Food Preparation",
        icon: CookingPot,
        children: [
          { id: "inv-prod-master", label: "Preparation Setup", to: "/pos/inventory/production", icon: SlidersHorizontal },
          {
            id: "inv-prod-exec",
            label: "Prepare Items",
            to: "/pos/inventory/production/execution",
            icon: CookingPot,
          },
        ],
      },
      {
        id: "reports-group",
        label: "Reports",
        icon: BarChart3,
        children: [
          { id: "inv-rep-current", label: "Stock Report", to: "/pos/inventory/reports", icon: BarChart3 },
          {
            id: "inv-rep-summary",
            label: "Stock Summary",
            to: "/pos/inventory/reports/stock-summary",
            icon: PieChart,
          },
          {
            id: "inv-rep-orderwise",
            label: "Usage by Order",
            to: "/pos/inventory/reports/orderwise-consumption",
            icon: ClipboardList,
          },
          {
            id: "inv-rep-other",
            label: "More Reports",
            to: "/pos/inventory/reports/other-reports",
            icon: FileText,
          },
        ],
      },
      {
        id: "masters-group",
        label: "Stock Setup",
        icon: Settings2,
        children: [
          {
            id: "inv-raw-materials",
            label: "Raw Materials",
            to: "/pos/inventory/masters/raw-materials",
            icon: Package,
          },
          { id: "inv-recipes", label: "Recipes", to: "/pos/inventory/masters/recipes", icon: BookOpen },
          { id: "inv-suppliers-list", label: "Suppliers", to: "/pos/inventory/masters/suppliers", icon: Store },
          {
            id: "inv-invoice-templates",
            label: "Invoice Format",
            to: "/pos/inventory/masters/invoice-templates",
            icon: FileText,
          },
          { id: "inv-units", label: "Units", to: "/pos/inventory/masters/units", icon: SlidersHorizontal },
        ],
      },
      { id: "inv-settings", label: "Stock Settings", to: "/pos/inventory/settings", icon: Settings },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    to: "/pos/reports",
    icon: PieChart,
    children: [
      { id: "rep-day-end", label: "Day End Summary", to: "/pos/reports/day-end", icon: ClipboardList },
      { id: "rep-other", label: "Other Reports", to: "/pos/reports/other", icon: FileText },
      { id: "rep-notifications", label: "Report Notification", to: "/pos/reports/notifications", icon: StickyNote },
    ],
  },
  {
    id: "management",
    label: "Management",
    to: "/pos/management",
    icon: Settings2,
    children: [
      {
        id: "configuration-group",
        label: "Configuration",
        icon: SlidersHorizontal,
        children: [
          {
            id: "cfg-outlet-group",
            label: "Outlet",
            icon: Store,
            children: [
              {
                id: "cfg-outlet-list",
                label: "Outlet List",
                to: "/pos/management/configuration/outlet/list",
                icon: List,
              },
              {
                id: "cfg-outlet-add",
                label: "+ Add Outlet",
                to: "/pos/management/configuration/outlet/add",
                icon: PlusCircle,
              },
              {
                id: "cfg-outlet-setup",
                label: "Outlet Setup",
                to: "/pos/management/configuration/outlet",
                icon: Store,
              },
            ],
          },
          {
            id: "cfg-email-template",
            label: "Email Template Settings",
            to: "/pos/management/configuration/email-templates",
            icon: Mail,
          },
        ],
      },
      {
        id: "accounting-group",
        label: "Accounting",
        icon: Wallet,
        children: [
          {
            id: "payments-group",
            label: "Payments",
            icon: CreditCard,
            children: [
              {
                id: "acc-pay-info",
                label: "Payment Information",
                to: "/pos/management/accounting/payments/information",
                icon: CreditCard,
              },
              {
                id: "acc-pay-wallet",
                label: "Virtual Wallet",
                to: "/pos/management/accounting/payments/wallet",
                icon: Wallet,
              },
            ],
          },
          { id: "acc-gst", label: "GST Information", to: "/pos/management/accounting/gst", icon: FileText },
          { id: "acc-bank", label: "Bank Details", to: "/pos/management/accounting/bank-details", icon: Landmark },
          { id: "acc-kyc", label: "KYC Details", to: "/pos/management/accounting/kyc", icon: Users },
          {
            id: "acc-utility",
            label: "Utility Bills",
            to: "/pos/management/accounting/utility-bills",
            icon: Receipt,
          },
          {
            id: "acc-expenses",
            label: "Expense & Withdrawal",
            to: "/pos/management/accounting/expenses",
            icon: Wallet,
          },
          {
            id: "acc-service",
            label: "Service Payment History",
            to: "/pos/management/accounting/service-payments",
            icon: History,
          },
          { id: "acc-loans", label: "Loan Information", to: "/pos/management/accounting/loans", icon: FileText },
          { id: "acc-denom", label: "Denomination", to: "/pos/management/accounting/denomination", icon: Coins },
        ],
      },
      {
        id: "user-management-group",
        label: "User Management",
        icon: Users,
        children: [
          { id: "usr-biller-app", label: "Biller App", to: "/pos/management/users/biller-app", icon: Smartphone },
          {
            id: "usr-biller-groups",
            label: "Biller Group Management",
            to: "/pos/management/users/biller-groups",
            icon: Users,
          },
          {
            id: "usr-admin-groups",
            label: "Admin Group Management",
            to: "/pos/management/users/admin-groups",
            icon: Users,
          },
          {
            id: "usr-admin-mgmt",
            label: "Admin Management",
            to: "/pos/management/users/admin-management",
            icon: UserCog,
          },
        ],
      },
      {
        id: "user-logs-group",
        label: "User Logs",
        icon: ScrollText,
        children: [
          { id: "log-support", label: "Support Management", to: "/pos/management/logs/support", icon: HelpCircle },
          { id: "log-notifications", label: "Notification", to: "/pos/management/logs/notifications", icon: StickyNote },
          {
            id: "log-menu-trigger",
            label: "Menu Trigger Logs",
            to: "/pos/management/logs/menu-trigger",
            icon: ScrollText,
          },
          {
            id: "log-closing-hours",
            label: "Closing Hour Logs",
            to: "/pos/management/logs/closing-hours",
            icon: History,
          },
          { id: "log-expense", label: "Expense Logs", to: "/pos/management/logs/expenses", icon: Wallet },
          {
            id: "log-withdrawal",
            label: "Withdrawal Logs",
            to: "/pos/management/logs/withdrawals",
            icon: Wallet,
          },
          {
            id: "log-cash-topup",
            label: "Cash Top-Up Logs",
            to: "/pos/management/logs/cash-topup",
            icon: Coins,
          },
        ],
      },
      {
        id: "explore-products-group",
        label: "Explore Products",
        icon: Store,
        children: [
          { id: "prod-marketplace", label: "Marketplace", to: "/pos/management/marketplace", icon: Store },
          {
            id: "prod-marketplace-setting",
            label: "Marketplace Setting",
            to: "/pos/management/marketplace/settings",
            icon: Settings,
          },
        ],
      },
      { id: "mgmt-audit", label: "Audit Trail", to: "/pos/management/audit-trail", icon: ScrollText },
      { id: "mgmt-data", label: "Data Management", to: "/pos/management/data-management", icon: FileText },
      { id: "mgmt-device", label: "Device Mapping", to: "/pos/management/device-mapping", icon: Settings2 },
    ],
  },
];

export const POS_FOOTER_NAV_ITEMS: PosNavItem[] = [
  { id: "help", label: "Help & Support", to: "/pos/help", icon: HelpCircle },
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
