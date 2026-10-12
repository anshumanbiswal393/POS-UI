import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Store,
  Check,
  Plus,
  Settings,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOutletContext } from "@/context/PosOutletContext";
import { ThemePreference } from "@/components/shared/pos/ThemePreference";

export function PosTopBar({
  onOpenMobileNav,
  onToggleSidebar,
  sidebarCollapsed = false,
}: {
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}) {
  const { user } = useAuth();
  const { activeOutlet, outlets, setActiveOutlet } = useOutletContext();
  const [showOutletMenu, setShowOutletMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn("Fullscreen toggle error", e);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOutletMenu(false);
      }
    }
    if (showOutletMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOutletMenu]);

  const primaryOutlets = outlets.filter((o) => o.type === "Primary Outlet");
  const virtualOutlets = outlets.filter((o) => o.type === "Virtual Outlet");

  return (
    <header className="sticky top-0 z-40 flex h-13 sm:h-14 items-center justify-between border-b border-border bg-surface px-3 sm:px-4 lg:px-5 shadow-2xs transition-colors duration-200">
      {/* Left: Mobile Nav Toggle, Desktop Sidebar Toggle & Search Bar */}
      <div className="flex flex-1 items-center gap-2 sm:gap-2.5">
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

        {/* Desktop Sidebar Toggle for Full Screen Width View */}
        {onToggleSidebar && (
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar (Full width)"}
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar (Full Screen width)"}
            className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5 text-primary" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
        )}

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search orders, tables, rooms, menu..."
            aria-label="Search orders, tables, rooms"
            className="h-8.5 w-full rounded-lg border border-border bg-surface-2 pl-8.5 pr-3 text-[12.5px] text-text-primary placeholder:text-text-disabled focus:border-primary focus:bg-surface focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Right: Outlet Selector, Appearance, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Outlet Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowOutletMenu(!showOutletMenu)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium text-text-primary hover:bg-surface-2 hover:border-border-strong shadow-2xs transition cursor-pointer"
            title={`Active: ${activeOutlet.name}`}
          >
            <Store className="h-4 w-4 text-primary shrink-0" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-semibold text-text-primary">
              {activeOutlet.name}
            </span>
            <span
              className={`hidden md:inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                activeOutlet.type === "Primary Outlet"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              {activeOutlet.type === "Primary Outlet" ? "Primary" : "Virtual"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>

          {showOutletMenu && (
            <div className="absolute right-0 mt-1.5 w-76 sm:w-84 rounded-xl border border-border bg-surface p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95">
              {/* Header inside dropdown */}
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-disabled">
                  Switch Outlet Context
                </span>
                <span className="text-[11px] font-medium text-primary">
                  {outlets.length} Total
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                {/* Primary Outlet Section */}
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
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-bold">{outlet.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
                          <span className="font-mono text-[10.5px] bg-surface-2 px-1 rounded text-text-secondary">
                            {outlet.code}
                          </span>
                          <span>•</span>
                          <span>{outlet.cuisine}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9.5px] font-bold text-primary">
                          Primary
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })}

                {/* Virtual Outlets Section */}
                {virtualOutlets.length > 0 && (
                  <>
                    <div className="px-2 pt-2.5 pb-0.5 text-[10.5px] font-semibold text-text-disabled uppercase tracking-wider border-t border-border">
                      Virtual Outlets & Cloud Brands
                    </div>
                    {virtualOutlets.map((outlet) => {
                      const isSelected = activeOutlet.id === outlet.id;
                      const isOutletActive = outlet.status === "Active";
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
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[12.5px] font-semibold">
                                {outlet.name}
                              </span>
                              {!isOutletActive && (
                                <span className="rounded bg-surface-2 px-1 py-0.2 text-[9px] font-semibold text-text-disabled">
                                  Paused
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-secondary">
                              <span className="font-mono text-[10px] bg-surface-2 px-1 rounded text-text-secondary">
                                {outlet.code}
                              </span>
                              <span>•</span>
                              <span className="truncate">{outlet.cuisine}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-bold text-text-secondary">
                              Virtual
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary stroke-[2.5]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Dropdown Footer: Shortcut to Settings */}
              <div className="pt-1.5 border-t border-border">
                <Link
                  to="/pos/settings"
                  onClick={() => setShowOutletMenu(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary-tint transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Manage Outlets & Virtual Brands
                  </span>
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Full Screen Mode Button */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          title={isFullscreen ? "Exit Full Screen Mode (Esc)" : "Full Screen Mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer shadow-xs"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4 text-primary" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>

        {/* Theme Preference Quick Switcher in Top Bar */}
        <ThemePreference variant="header" />

        {/* Notifications Bell with Badge */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-white shadow-xs">
            12
          </span>
        </button>

        {/* User Profile / Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 border border-border font-bold text-[11px] text-text-primary">
            {user?.initials ?? "RA"}
          </div>
          <div className="hidden text-left sm:block">
            <div className="flex items-center gap-1 text-[13px] font-semibold text-text-primary leading-tight">
              <span>{user?.name ?? "Retrod Admin"}</span>
              <ChevronDown className="h-3 w-3 text-text-disabled" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
