import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
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
  Store,
  Check,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChefHat,
  CreditCard,
  Package,
  ShoppingBag,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { DINING_OUTLET_KINDS, normalizeOutletKind } from "@/utils/outletKind";
import { useAuth } from "@/hooks/useAuth";
import { useOutletContext } from "@/context/PosOutletContext";
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
  const { user, roleLabel, logout } = useAuth();
  const { activeOutlet, outlets, setActiveOutlet } = useOutletContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = usePosNotifications();

  const [showOutletMenu, setShowOutletMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateLabel, setDateLabel] = useState(formatTodayLabel);
  const outletRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (outletRef.current && !outletRef.current.contains(target)) {
        setShowOutletMenu(false);
      }
      if (dateRef.current && !dateRef.current.contains(target)) {
        setShowDateMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const diningOutlets = outlets.filter(isDiningOutlet);
  const primaryOutlets = diningOutlets.filter((o) => o.type === "Primary Outlet");
  const virtualOutlets = diningOutlets.filter((o) => o.type === "Virtual Outlet");
  const roleText = user ? roleLabel(user.role) : "Retrod Admin";

  const dateOptions = [
    { label: formatTodayLabel(), value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this_week" },
    { label: "This Month", value: "this_month" },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4 lg:px-5 shadow-2xs">
      {/* Left: nav toggles */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {onOpenMobileNav && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenMobileNav}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-2 lg:hidden cursor-pointer"
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
            className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5 text-primary" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
        )}
      </div>

      {/* Center: search */}
      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-disabled" />
        <input
          type="text"
          placeholder="Search orders, tables, rooms, menu..."
          aria-label="Search orders, tables, rooms"
          className="h-9 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-14 text-[12.5px] text-text-primary placeholder:text-text-disabled focus:border-primary focus:bg-surface focus:outline-hidden transition-all"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold text-text-disabled">
          ⌘K
        </kbd>
      </div>

      {/* Right: actions + profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <Link
          to="/pos/billing"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-2.5 text-[12.5px] font-semibold leading-none text-primary-foreground hover:bg-primary-pressed transition cursor-pointer sm:px-3"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Date pill (reference-style) */}
        <div className="relative hidden md:block" ref={dateRef}>
          <button
            type="button"
            onClick={() => {
              setShowDateMenu((v) => !v);
              setShowOutletMenu(false);
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 text-[12.5px] font-semibold text-text-primary hover:bg-surface transition cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-text-secondary" />
            <span className="max-w-[180px] truncate">{dateLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-text-disabled" />
          </button>
          {showDateMenu && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg z-30 animate-in fade-in zoom-in-95">
              {dateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDateLabel(opt.label);
                    setShowDateMenu(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[12.5px] transition cursor-pointer ${
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

        {/* Outlet switcher — compact, same pill language as date */}
        <div className="relative" ref={outletRef}>
          <button
            type="button"
            onClick={() => {
              setShowOutletMenu((v) => !v);
              setShowDateMenu(false);
            }}
            className="flex h-9 max-w-[200px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-2.5 text-[12.5px] font-semibold text-text-primary hover:bg-surface transition cursor-pointer"
            title={`Active: ${activeOutlet.name}`}
          >
            <ActiveOutletIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{activeOutlet.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-text-disabled shrink-0" />
          </button>

          {showOutletMenu && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-xl border border-border bg-surface p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-disabled">
                  Switch Outlet
                </span>
                <span className="text-[11px] font-medium text-primary">{outlets.length} Total</span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                <div className="px-2 pt-1 pb-0.5 text-[10.5px] font-semibold text-text-disabled uppercase tracking-wider">
                  Primary Outlet
                </div>
                {primaryOutlets.map((outlet) => {
                  const isSelected = activeOutlet.id === outlet.id;
                  return (
                    <button
                      key={outlet.id}
                      type="button"
                      onClick={() => {
                        setActiveOutlet(outlet.id);
                        setShowOutletMenu(false);
                      }}
                      className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20 text-text-primary font-semibold"
                          : "hover:bg-surface-2 text-text-primary"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-[13px] font-bold block">{outlet.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
                          <span className="font-mono text-[10.5px] bg-surface-2 px-1 rounded">
                            {outlet.code}
                          </span>
                          <span>•</span>
                          <span>{outlet.cuisine}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary stroke-[2.5] shrink-0" />}
                    </button>
                  );
                })}

                {virtualOutlets.length > 0 && (
                  <>
                    <div className="px-2 pt-2.5 pb-0.5 text-[10.5px] font-semibold text-text-disabled uppercase tracking-wider border-t border-border">
                      Virtual Outlets
                    </div>
                    {virtualOutlets.map((outlet) => {
                      const isSelected = activeOutlet.id === outlet.id;
                      return (
                        <button
                          key={outlet.id}
                          type="button"
                          onClick={() => {
                            setActiveOutlet(outlet.id);
                            setShowOutletMenu(false);
                          }}
                          className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border border-primary/20 text-text-primary font-semibold"
                              : "hover:bg-surface-2 text-text-primary"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="truncate text-[12.5px] font-semibold block">
                              {outlet.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-secondary">
                              <span className="font-mono text-[10px] bg-surface-2 px-1 rounded">
                                {outlet.code}
                              </span>
                              <span>•</span>
                              <span className="truncate">{outlet.cuisine}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary stroke-[2.5] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="pt-1.5 border-t border-border">
                <Link
                  to="/pos/settings"
                  onClick={() => setShowOutletMenu(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary-tint transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Manage Outlets
                  </span>
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

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
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer outline-none"
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

        <div className="hidden sm:block h-7 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-2 py-1.5 hover:bg-surface transition cursor-pointer outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-[11px] text-primary-foreground">
                {user?.initials ?? "RA"}
              </div>
              <div className="hidden text-left md:block min-w-0">
                <div className="text-[13px] font-bold text-text-primary leading-tight truncate max-w-[140px]">
                  {user?.name ?? "Retrod Admin"}
                </div>
                <div className="text-[11px] font-semibold text-primary leading-tight truncate max-w-[140px]">
                  {roleText}
                </div>
              </div>
              <ChevronRight className="hidden md:block h-4 w-4 text-text-disabled shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-border bg-white p-1.5 text-text-primary shadow-2xl data-[state=closed]:animate-none"
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
