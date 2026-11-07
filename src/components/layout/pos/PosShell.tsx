import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { PosSidebar } from "@/components/layout/pos/PosSidebar";
import { PosTopBar } from "@/components/layout/pos/PosTopBar";
import { PosSubscriptionRenewalBanner } from "@/components/common/PosSubscriptionRenewalBanner";
// import { OnlineOrderAlertModal } from "@/components/shared/pos/orders/OnlineOrderAlertModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePosKeyboardShortcuts } from "@/hooks/usePosKeyboardShortcuts";
import { cn } from "@/lib/utils";

export function PosShell({ children }: { children: React.ReactNode }) {
  usePosKeyboardShortcuts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBillingPage = pathname === "/pos/billing" || pathname.startsWith("/pos/billing");

  // On POS Billing, default to collapsed so full workspace is visible; on other routes keep open
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => isBillingPage);

  useEffect(() => {
    if (isBillingPage) {
      setDesktopCollapsed(true);
    } else {
      setDesktopCollapsed(false);
    }
  }, [pathname, isBillingPage]);

  const isSidebarCollapsed = isMobile ? false : desktopCollapsed;
  const showMobileSidebar = isMobile && mobileOpen;

  // On billing page, when user opens/expands the sidebar, it floats above the content on the left
  const isFloatingSidebar = !isMobile && isBillingPage && !desktopCollapsed;

  return (
    <div
      className={cn(
        "flex min-h-screen w-full bg-background text-foreground",
        mobileOpen && isMobile ? "h-screen overflow-hidden" : "",
      )}
    >
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/45"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop floating backdrop on POS billing page */}
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
          - Mobile: fixed off-canvas drawer
          - POS Billing: fixed floating overlay on left side when opened, hidden when collapsed
      */}
      <div
        className={cn(
          "print:hidden",
          isMobile
            ? "fixed left-0 top-0 h-screen z-50 transition-transform duration-200"
            : isBillingPage
              ? isFloatingSidebar
                ? "fixed left-0 top-0 h-screen z-50 shadow-2xl animate-in slide-in-from-left duration-200"
                : "hidden"
              : "z-30 shrink-0 block",
          isMobile && !showMobileSidebar ? "-translate-x-full" : "translate-x-0",
        )}
      >
        <PosSidebar
          collapsed={isSidebarCollapsed}
          onNavigate={() => {
            if (isMobile) setMobileOpen(false);
            if (isBillingPage) setDesktopCollapsed(true);
          }}
          onToggle={() =>
            isMobile ? setMobileOpen(false) : setDesktopCollapsed((c) => !c)
          }
        />
      </div>

      {/* Content column spanning the remaining length/width — matches PMS */}
      <div className="flex min-w-0 flex-1 flex-col bg-background text-text-primary print:!m-0 print:!h-auto print:!overflow-visible print:!p-0 print:!w-full print:!min-h-0 print:!bg-white">
        <PosSubscriptionRenewalBanner />
        <PosTopBar
          onOpenMobileNav={isMobile ? () => setMobileOpen(true) : undefined}
          onToggleSidebar={() => setDesktopCollapsed((c) => !c)}
          sidebarCollapsed={desktopCollapsed}
        />
        <main className="flex-1 min-w-0 flex flex-col pb-[env(safe-area-inset-bottom)] print:!m-0 print:!p-0 print:!w-full print:!overflow-visible">
          {children}
        </main>
      </div>

      {/* Online orders alert modal commented out until Zomato/Swiggy integration */}
      {/* <OnlineOrderAlertModal /> */}
    </div>
  );
}
