import { useState, useEffect } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { Store, Plus, RotateCw } from "lucide-react";
import { PosSidebar } from "@/components/layout/pos/PosSidebar";
import { PosTopBar } from "@/components/layout/pos/PosTopBar";
import { PosSubscriptionRenewalBanner } from "@/components/common/PosSubscriptionRenewalBanner";
// import { OnlineOrderAlertModal } from "@/components/shared/pos/orders/OnlineOrderAlertModal";
import { useOutletContext } from "@/context/PosOutletContext";
import { useIsCompactViewport } from "@/hooks/use-mobile";
import { usePosKeyboardShortcuts } from "@/hooks/usePosKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { toTitleCase, isExcludedFromTitleCase } from "@/utils/textUtils";

export function PosShell({ children }: { children: React.ReactNode }) {
  usePosKeyboardShortcuts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCompactNav = useIsCompactViewport();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasOutlets, isLoadingOutlets, refreshOutlets } = useOutletContext();
  const isBillingPage = pathname === "/pos/billing" || pathname.startsWith("/pos/billing");
  const isKotPage = pathname === "/pos/kot" || pathname.startsWith("/pos/kot");
  const isDashboard = pathname === "/pos" || pathname === "/pos/";
  const isFullWorkspacePage = isBillingPage || isKotPage;
  const isOutletOnboardingExempt =
    pathname.startsWith("/pos/management/configuration/outlet/add") ||
    pathname.startsWith("/pos/management/configuration/outlet/list") ||
    pathname.startsWith("/pos/settings") ||
    pathname.startsWith("/pos/help");
  const showEmptyOutletsState = !isLoadingOutlets && !hasOutlets && !isOutletOnboardingExempt;

  // On POS Billing & KOT, default to collapsed so full workspace is visible; on other routes keep open
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => isFullWorkspacePage);

  useEffect(() => {
    if (isFullWorkspacePage) {
      setDesktopCollapsed(true);
    } else {
      setDesktopCollapsed(false);
    }
    setMobileOpen(false);
  }, [pathname, isFullWorkspacePage]);

  // Centralized title-casing for all user text inputs across the entire POS application
  useEffect(() => {
    function handleGlobalInput(e: Event) {
      const target = e.target as HTMLInputElement | null;
      if (!target || target.tagName !== "INPUT") return;

      const type = target.type?.toLowerCase();
      // Only process text-like inputs
      if (type && !["text", "search", ""].includes(type)) return;

      const name = target.name;
      const id = target.id;
      const placeholder = target.placeholder;
      const noTitleCase =
        target.hasAttribute("data-no-title-case") ||
        target.hasAttribute("data-pos-search") ||
        target.id === "pos-global-search" ||
        target.id === "pos-global-search-mobile";

      if (isExcludedFromTitleCase(type, name, id, placeholder, noTitleCase)) {
        return;
      }

      const raw = target.value;
      if (!raw) return;

      const formatted = toTitleCase(raw);
      if (formatted !== raw) {
        const cursor = target.selectionStart;
        target.value = formatted;
        if (cursor !== null && target.setSelectionRange) {
          try {
            target.setSelectionRange(cursor, cursor);
          } catch {}
        }
      }
    }

    document.addEventListener("input", handleGlobalInput, true);
    return () => document.removeEventListener("input", handleGlobalInput, true);
  }, []);

  const isSidebarCollapsed = isCompactNav ? false : desktopCollapsed;
  const showMobileSidebar = isCompactNav && mobileOpen;

  // On billing page & KOT page, when user opens/expands the sidebar, it floats above the content on the left
  const isFloatingSidebar = !isCompactNav && isFullWorkspacePage && !desktopCollapsed;

  return (
    <div
      className={cn(
        "flex min-h-dvh w-full bg-background text-foreground",
        mobileOpen && isCompactNav ? "h-dvh max-h-dvh overflow-hidden" : "",
        isDashboard ? "lg:h-dvh lg:max-h-dvh lg:overflow-hidden" : "",
      )}
    >
      {/* Mobile / Tablet backdrop (<1024px) */}
      {isCompactNav && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/45"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop floating backdrop on POS billing & KOT pages */}
      {isFloatingSidebar && (
        <button
          type="button"
          aria-label="Close floating sidebar"
          className="fixed inset-0 z-45 bg-foreground/20 backdrop-blur-[1px] transition-opacity"
          onClick={() => setDesktopCollapsed(true)}
        />
      )}

      {/* Sidebar container:
          - Normal routes: standard flex column on left
          - Mobile & Tablet (<1024px): fixed off-canvas drawer
          - POS Billing & KOT (desktop): fixed floating overlay on left side when opened, hidden when collapsed
      */}
      <div
        className={cn(
          "print:hidden",
          isCompactNav
            ? "fixed left-0 top-0 h-dvh z-50 transition-transform duration-200"
            : isFullWorkspacePage
              ? isFloatingSidebar
                ? "fixed left-0 top-0 h-dvh z-50 shadow-2xl animate-in slide-in-from-left duration-200"
                : "hidden"
              : "z-30 shrink-0 block",
          isCompactNav && !showMobileSidebar ? "-translate-x-full" : "translate-x-0",
        )}
      >
        <PosSidebar
          collapsed={isSidebarCollapsed}
          onNavigate={() => {
            if (isCompactNav) setMobileOpen(false);
            if (isFullWorkspacePage) setDesktopCollapsed(true);
          }}
          onToggle={() =>
            isCompactNav ? setMobileOpen(false) : setDesktopCollapsed((c) => !c)
          }
        />
      </div>

      {/* Content column spanning the remaining length/width — matches PMS */}
      <div className={cn(
        "flex min-w-0 flex-1 flex-col bg-background text-text-primary print:!m-0 print:!h-auto print:!overflow-visible print:!p-0 print:!w-full print:!min-h-0 print:!bg-white",
        isDashboard ? "lg:h-dvh lg:max-h-dvh lg:overflow-hidden" : "",
      )}>
        <PosSubscriptionRenewalBanner />
        <PosTopBar
          onOpenMobileNav={isCompactNav ? () => setMobileOpen(true) : undefined}
          onToggleSidebar={
            !isCompactNav && isFullWorkspacePage
              ? () => setDesktopCollapsed((c) => !c)
              : undefined
          }
          sidebarCollapsed={desktopCollapsed}
        />
        <main className={cn(
          "flex-1 min-w-0 flex flex-col pb-[env(safe-area-inset-bottom)] print:!m-0 print:!p-0 print:!w-full print:!overflow-visible",
          isDashboard ? "lg:h-full lg:min-h-0 lg:overflow-hidden" : "",
        )}>
          {showEmptyOutletsState ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Store className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    No Outlets Registered Yet (0 Outlets)
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Your property does not have any dining or kitchen outlets configured in the database yet. Add your first outlet or have your Superadmin onboard one to begin POS operations.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <Link
                    to="/pos/management/configuration/outlet/add"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-xs hover:bg-primary-pressed transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Outlet
                  </Link>
                  <button
                    type="button"
                    onClick={() => void refreshOutlets()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Online orders alert modal commented out until Zomato/Swiggy integration */}
      {/* <OnlineOrderAlertModal /> */}
    </div>
  );
}
