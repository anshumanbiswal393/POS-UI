import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Bug,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChefHat,
  CreditCard,
  Package,
  ShoppingBag,
  Wifi,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  formatNotificationTime,
  usePosNotifications,
  type PosNotificationCategory,
} from "@/hooks/usePosNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NOTIFICATION_ICONS: Record<PosNotificationCategory, LucideIcon> = {
  ORDER: ShoppingBag,
  KOT: ChefHat,
  PAYMENT: CreditCard,
  STOCK: Package,
  ONLINE: Wifi,
  SYSTEM: Bell,
};

const NOTIFICATION_TONES: Record<PosNotificationCategory, string> = {
  ORDER: "bg-emerald-100 text-emerald-700",
  KOT: "bg-amber-100 text-amber-700",
  PAYMENT: "bg-blue-100 text-blue-700",
  STOCK: "bg-rose-100 text-rose-700",
  ONLINE: "bg-violet-100 text-violet-700",
  SYSTEM: "bg-slate-100 text-slate-700",
};

function formatTodayLabel() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
  const rest = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Today · ${weekday}, ${rest}`;
}

export function PosTopBar({
  onOpenMobileNav,
  onToggleSidebar,
  sidebarCollapsed = false,
}: {
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}) {
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { user, roleLabel, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = usePosNotifications();

  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateLabel, setDateLabel] = useState(formatTodayLabel);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dateRef.current && !dateRef.current.contains(target)) {
        setShowDateMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleText = user ? roleLabel(user.role) : "Retrod Super Admin";

  const getBreadcrumbTitle = (pathname: string) => {
    if (pathname.includes("/take-order")) return "Take Order";
    if (pathname.includes("/billing")) return "Billing & Checkout";
    if (pathname.includes("/orders")) return "Orders";
    if (pathname.includes("/menu")) return "Food Menu";
    if (pathname.includes("/inventory")) return "Stock & Inventory";
    if (pathname.includes("/reports")) return "Reports & Graphs";
    if (pathname.includes("/management")) return "Management";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/help")) return "Help & Support";
    return "Point of Sale";
  };

  const breadcrumbTitle = getBreadcrumbTitle(currentPath);

  const dateOptions = [
    { label: formatTodayLabel(), value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this_week" },
    { label: "This Month", value: "this_month" },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4 lg:px-5 shadow-2xs">
      {/* Left: Nav toggles & Breadcrumbs */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenMobileNav}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-2 lg:hidden cursor-pointer"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}

        {onToggleSidebar && (
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex items-center justify-center rounded-md p-1.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5 text-primary" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
        )}

        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-[12px] sm:text-[13px]">
          <span className="text-text-secondary whitespace-nowrap">Main Modules</span>
          <span className="text-text-disabled">/</span>
          <span className="truncate font-medium text-text-primary max-w-[150px] sm:max-w-none">{breadcrumbTitle}</span>
        </nav>
      </div>

      {/* Center: Search input */}
      <div className="relative min-w-0 flex-1 max-w-xs sm:max-w-sm lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-disabled" />
        <input
          type="text"
          placeholder="Search orders, tables, rooms, menu..."
          aria-label="Search orders, tables, rooms"
          className="h-9 w-full rounded-md border border-border bg-surface-2/60 pl-9 pr-12 text-[12.5px] text-text-primary placeholder:text-text-disabled focus:border-primary focus:bg-surface focus:outline-hidden transition-all"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-disabled">
          ⌘K
        </kbd>
      </div>

      {/* Right: Actions + Date + Notifications + User Guide + Profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <Link
          to="/pos/billing"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold leading-none text-primary-foreground hover:bg-primary-pressed transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Date pill */}
        <div className="relative hidden md:block" ref={dateRef}>
          <button
            type="button"
            onClick={() => setShowDateMenu((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12.5px] font-medium text-text-primary hover:bg-surface-2 transition cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-text-secondary" />
            <span className="max-w-[180px] truncate">{dateLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-text-disabled" />
          </button>
          {showDateMenu && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-border bg-surface p-1 shadow-lg z-30 animate-in fade-in zoom-in-95">
              {dateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDateLabel(opt.label);
                    setShowDateMenu(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left text-[12.5px] transition cursor-pointer ${
                    dateLabel === opt.label
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text-primary hover:bg-surface-2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) markAllAsRead();
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer outline-none"
            >
              <Bell
                className={`h-4.5 w-4.5 ${unreadCount > 0 ? "animate-bell-ring text-primary" : ""}`}
              />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 sm:w-96 overflow-hidden rounded-xl border border-border bg-white p-0 text-text-primary shadow-2xl data-[state=closed]:animate-none"
          >
            <div className="flex items-center justify-between border-b border-primary/10 bg-primary-tint px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-text-primary">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary">
                    {unreadCount} new
                  </span>
                ) : null}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = NOTIFICATION_ICONS[item.category];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markAsRead(item.id);
                        if (item.link) navigate({ to: item.link as never });
                      }}
                      className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition cursor-pointer hover:bg-primary-tint/60 ${
                        !item.isRead ? "bg-primary-tint/80" : "bg-white"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${NOTIFICATION_TONES[item.category]}`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div
                            className={`truncate text-[12px] leading-snug ${
                              !item.isRead
                                ? "font-bold text-text-primary"
                                : "font-medium text-text-secondary"
                            }`}
                          >
                            {item.title}
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatNotificationTime(item.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                          {item.message}
                        </div>
                      </div>
                      {!item.isRead ? (
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Guide pill */}
        <button
          type="button"
          onClick={() => navigate({ to: "/pos/help" })}
          className="hidden xl:inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary-tint/60 px-2.5 py-1.5 text-[12px] font-medium text-primary hover:bg-primary-tint transition cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>User Guide</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 hover:bg-surface-2 transition cursor-pointer outline-none"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-[11px] text-primary-foreground">
                {user?.initials ?? "AD"}
              </div>
              <div className="hidden text-left md:block min-w-0">
                <div className="text-[12.5px] font-semibold text-text-primary leading-tight truncate max-w-[130px]">
                  Admin
                </div>
                <div className="text-[10.5px] text-text-secondary leading-tight truncate max-w-[130px]">
                  Hotel Admin
                </div>
              </div>
              <ChevronRight className="hidden md:block h-3.5 w-3.5 text-text-disabled shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-md border border-border bg-white p-1.5 text-text-primary shadow-2xl data-[state=closed]:animate-none"
          >
            <DropdownMenuItem
              onClick={() => navigate({ to: "/pos/settings" })}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Upgrade plan</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate({ to: "/pos/settings" })}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium"
            >
              <Settings className="h-4 w-4 text-text-secondary" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium">
                <HelpCircle className="h-4 w-4 text-text-secondary" />
                <span>Help</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52 rounded-xl border border-border bg-white p-1.5 text-text-primary shadow-2xl data-[state=closed]:animate-none">
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/pos/help" })}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium"
                >
                  <HelpCircle className="h-4 w-4 text-text-secondary" />
                  <span>Help center</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast.info("Retrod POS user guide — documentation is available in Help & Support.")
                  }
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium"
                >
                  <ScrollText className="h-4 w-4 text-text-secondary" />
                  <span>User guide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border" />
                <DropdownMenuItem
                  onClick={() => toast.info("Terms of Service")}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium"
                >
                  <FileText className="h-4 w-4 text-text-secondary" />
                  <span>Terms of Service</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast.info("Privacy Policy")}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium"
                >
                  <ShieldCheck className="h-4 w-4 text-text-secondary" />
                  <span>Privacy Policy</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/pos/help" })}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium"
                >
                  <Bug className="h-4 w-4 text-text-secondary" />
                  <span>Report a bug</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator className="my-1 bg-border" />
            <DropdownMenuItem
              onClick={() => {
                const isRetrod = typeof window !== "undefined" && window.location.hostname.endsWith("retrod.in");
                window.location.href = isRetrod ? "https://app.dev.retrod.in/" : "http://localhost:3000/";
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-semibold text-primary hover:bg-primary/10"
            >
              <Building2 className="h-4 w-4" />
              <span>Back to PMS</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border" />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
