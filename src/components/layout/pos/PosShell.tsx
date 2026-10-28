import { useState } from "react";
import { PosSidebar } from "@/components/layout/pos/PosSidebar";
import { PosTopBar } from "@/components/layout/pos/PosTopBar";
// import { OnlineOrderAlertModal } from "@/components/shared/pos/orders/OnlineOrderAlertModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SIDEBAR_EXPANDED_WIDTH = 268;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function PosShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const sidebarWidth = isMobile ? 0 : desktopCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div
      className={cn(
        "h-dvh w-full overflow-hidden bg-background text-foreground",
        mobileOpen && isMobile ? "h-screen" : "",
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

      {/* Fixed sidebar — stays put while main content scrolls */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh transition-all duration-200 print:hidden",
          isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0",
        )}
        style={{ width: isMobile ? SIDEBAR_EXPANDED_WIDTH : sidebarWidth }}
      >
        <PosSidebar
          collapsed={!isMobile && desktopCollapsed}
          onNavigate={isMobile ? () => setMobileOpen(false) : undefined}
          onToggle={() => setDesktopCollapsed((prev) => !prev)}
        />
      </div>

      {/* Content column offset by sidebar width on desktop */}
      <div
        className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background text-text-primary transition-all duration-200 print:!m-0 print:!h-auto print:!overflow-visible print:!p-0 print:!w-full print:!min-h-0 print:!bg-white"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="print:hidden">
          <PosTopBar
            onOpenMobileNav={isMobile ? () => setMobileOpen(true) : undefined}
            onToggleSidebar={() => setDesktopCollapsed((prev) => !prev)}
            sidebarCollapsed={desktopCollapsed}
          />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-2.5 sm:p-3 lg:p-3 pb-[env(safe-area-inset-bottom)] print:!m-0 print:!p-0 print:!w-full print:!overflow-visible">
          {children}
        </main>
      </div>

      {/* Online orders alert modal commented out until Zomato/Swiggy integration */}
      {/* <OnlineOrderAlertModal /> */}
    </div>
  );
}
