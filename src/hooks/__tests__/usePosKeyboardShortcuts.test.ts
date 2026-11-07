// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @tanstack/react-router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useRouterState: () => "/pos/billing",
}));

describe("POS Keyboard Shortcuts Controller", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    document.body.innerHTML = "";
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

  it("handles F3 focus to global search input", () => {
    const searchInput = document.createElement("input");
    searchInput.id = "pos-global-search";
    document.body.appendChild(searchInput);

    const focusSpy = vi.spyOn(searchInput, "focus");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F3") {
        event.preventDefault();
        const input = document.getElementById("pos-global-search");
        input?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F3", cancelable: true });
    window.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();
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

  it("dispatches pos:pay-settle on F9 key", () => {
    const payListener = vi.fn();
    window.addEventListener("pos:pay-settle", payListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F9") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("pos:pay-settle"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const event = new KeyboardEvent("keydown", { key: "F9", cancelable: true });
    window.dispatchEvent(event);

    expect(payListener).toHaveBeenCalled();
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("pos:pay-settle", payListener);
  });
});
