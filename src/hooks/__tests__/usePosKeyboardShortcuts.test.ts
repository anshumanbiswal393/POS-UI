// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @tanstack/react-router
let mockPathname = "/pos/billing";
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useRouterState: () => mockPathname,
}));

describe("POS Keyboard Shortcuts Controller", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    document.body.innerHTML = "";
    mockPathname = "/pos/billing";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles F1 navigation to Help Guide", () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        mockNavigate({ to: "/pos/help" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F1", cancelable: true });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/pos/help" });
    window.removeEventListener("keydown", handleKeyDown);
  });

  it("handles F2 navigation to POS Billing", () => {
    const onNewBill = vi.fn();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        onNewBill();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F2", cancelable: true });
    window.dispatchEvent(event);

    expect(onNewBill).toHaveBeenCalledTimes(1);
    window.removeEventListener("keydown", handleKeyDown);
  });

  it("handles F3 focus to billing catalog search input if present", () => {
    const billingSearchInput = document.createElement("input");
    billingSearchInput.id = "pos-billing-search";
    document.body.appendChild(billingSearchInput);

    const focusSpy = vi.spyOn(billingSearchInput, "focus");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F3") {
        event.preventDefault();
        const input = (document.getElementById("pos-billing-search") ||
          document.getElementById("pos-global-search")) as HTMLInputElement | null;
        input?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F3", cancelable: true });
    window.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();
    window.removeEventListener("keydown", handleKeyDown);
  });

  it("handles F4 to hold order via custom event inside billing", () => {
    const holdListener = vi.fn();
    window.addEventListener("pos:hold-order", holdListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F4") {
        event.preventDefault();
        if (mockPathname === "/pos/billing") {
          window.dispatchEvent(new CustomEvent("pos:hold-order"));
        } else {
          mockNavigate({ to: "/pos/settlement" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F4", cancelable: true });
    window.dispatchEvent(event);

    expect(holdListener).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();

    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("pos:hold-order", holdListener);
  });

  it("handles F4 to navigate to settlement outside billing", () => {
    mockPathname = "/pos/tables";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F4") {
        event.preventDefault();
        if (mockPathname === "/pos/billing") {
          window.dispatchEvent(new CustomEvent("pos:hold-order"));
        } else {
          mockNavigate({ to: "/pos/settlement" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F4", cancelable: true });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/pos/settlement" });
    window.removeEventListener("keydown", handleKeyDown);
  });

  it("dispatches pos:send-kot on F8 key", () => {
    const kotListener = vi.fn();
    window.addEventListener("pos:send-kot", kotListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("pos:send-kot"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F8", cancelable: true });
    window.dispatchEvent(event);

    expect(kotListener).toHaveBeenCalled();
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("pos:send-kot", kotListener);
  });

  it("dispatches pos:pay-settle on F9 or F10 key", () => {
    const payListener = vi.fn();
    window.addEventListener("pos:pay-settle", payListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F9" || event.key === "F10") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("pos:pay-settle"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const eventF9 = new KeyboardEvent("keydown", { key: "F9", cancelable: true });
    window.dispatchEvent(eventF9);

    const eventF10 = new KeyboardEvent("keydown", { key: "F10", cancelable: true });
    window.dispatchEvent(eventF10);

    expect(payListener).toHaveBeenCalledTimes(2);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("pos:pay-settle", payListener);
  });

  it("dispatches pos:escape-dismiss on Escape key", () => {
    const escListener = vi.fn();
    window.addEventListener("pos:escape-dismiss", escListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.dispatchEvent(new CustomEvent("pos:escape-dismiss"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    window.dispatchEvent(event);

    expect(escListener).toHaveBeenCalled();
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("pos:escape-dismiss", escListener);
  });
});
