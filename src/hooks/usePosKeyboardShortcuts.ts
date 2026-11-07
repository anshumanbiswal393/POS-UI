import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export interface PosKeyboardShortcutOptions {
  onKot?: () => void;
  onPaySettle?: () => void;
  onNewBill?: () => void;
  onHoldBill?: () => void;
  disableGlobalNav?: boolean;
}

/**
 * POS Central Keyboard Shortcuts Hook
 *
 * Operational Shortcuts:
 * - F1: Help Guide (3D Operating Manual)
 * - F2: New Order / POS Billing
 * - F3 / Ctrl+K: Focus Global Search
 * - F4: Pending Payments / Dues Settlement (or Hold Check in Billing)
 * - F8: Send KOT to Kitchen
 * - F9: Pay & Settle Bill
 * - Esc: Close Dialogs / Dismiss Drawer
 */
export function usePosKeyboardShortcuts(options?: PosKeyboardShortcutOptions) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable);

      // F1: Always open Help Guide
      if (event.key === "F1") {
        event.preventDefault();
        navigate({ to: "/pos/help" });
        return;
      }

      // F2: New Order / POS Billing
      if (event.key === "F2") {
        event.preventDefault();
        if (options?.onNewBill) {
          options.onNewBill();
        } else {
          navigate({ to: "/pos/billing" });
        }
        return;
      }

      // F3 or Ctrl+K / Cmd+K: Focus Global Search
      if (event.key === "F3" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        const searchInput = (document.getElementById("pos-global-search") ||
          document.querySelector("[data-pos-search]")) as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // F4: Hold Bill (if on Billing page with onHoldBill) or Jump to Settlement
      if (event.key === "F4") {
        event.preventDefault();
        if (options?.onHoldBill) {
          options.onHoldBill();
        } else if (!options?.disableGlobalNav) {
          navigate({ to: "/pos/settlement" });
        }
        return;
      }

      // F8: Send KOT to kitchen
      if (event.key === "F8") {
        event.preventDefault();
        if (options?.onKot) {
          options.onKot();
        } else {
          // Dispatch custom event for child components
          window.dispatchEvent(new CustomEvent("pos:send-kot"));
        }
        return;
      }

      // F9: Settle / Pay Bill
      if (event.key === "F9") {
        event.preventDefault();
        if (options?.onPaySettle) {
          options.onPaySettle();
        } else {
          // Dispatch custom event for child components
          window.dispatchEvent(new CustomEvent("pos:pay-settle"));
        }
        return;
      }

      // Escape: Dismiss focused input or dispatch cancel
      if (event.key === "Escape") {
        if (isInputFocused && activeElement) {
          activeElement.blur();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, pathname, options]);
}
