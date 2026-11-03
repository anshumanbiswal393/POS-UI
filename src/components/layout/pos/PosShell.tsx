import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { PosSidebar } from "@/components/layout/pos/PosSidebar";
import { PosTopBar } from "@/components/layout/pos/PosTopBar";
import { PosSubscriptionRenewalBanner } from "@/components/common/PosSubscriptionRenewalBanner";
// import { OnlineOrderAlertModal } from "@/components/shared/pos/orders/OnlineOrderAlertModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function PosShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBillingPage = pathname === "/pos/billing" || pathname.startsWith("/pos/billing");

  // On POS Billing, hide sidebar by default; on other routes, keep it open
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

  return (
    <div
      className={cn(
        "flex min-h-screen w-full bg-background text-foreground",
        mobileOpen && isMobile ? "h-screen overflow-hidden" : "",
      )}
    >
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/45"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container — matches PMS layout */}
      <div
        className={cn(
          "z-50 shrink-0 print:hidden",
          isMobile
            ? "fixed left-0 top-0 h-screen transition-transform duration-200"
            : "",
          isMobile && !showMobileSidebar ? "-translate-x-full" : "translate-x-0",
          !isMobile && isBillingPage && desktopCollapsed ? "hidden" : "block",
        )}
      >
        <PosSidebar
          collapsed={isSidebarCollapsed}
          onNavigate={isMobile ? () => setMobileOpen(false) : undefined}
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
