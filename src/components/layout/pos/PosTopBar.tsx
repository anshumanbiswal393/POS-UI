import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  Store,
  Check,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOutletContext } from "@/context/PosOutletContext";

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
  const { user, roleLabel } = useAuth();
  const { activeOutlet, outlets, setActiveOutlet } = useOutletContext();

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

  const primaryOutlets = outlets.filter((o) => o.type === "Primary Outlet");
  const virtualOutlets = outlets.filter((o) => o.type === "Virtual Outlet");
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
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
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
            <Store className="h-3.5 w-3.5 text-primary shrink-0" />
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

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-white shadow-xs">
            12
          </span>
        </button>

        <div className="hidden sm:block h-7 w-px bg-border" />

        {/* Profile — name + role like reference */}
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-2 py-1.5 hover:bg-surface transition cursor-pointer"
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
      </div>
    </header>
  );
}
