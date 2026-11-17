import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("POS Cross Line Divider & Outlet Border Consistency", () => {
  const sidebarPath = path.resolve(__dirname, "../../../layout/pos/PosSidebar.tsx");
  const topBarPath = path.resolve(__dirname, "../../../layout/pos/PosTopBar.tsx");

  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
  const topBarContent = fs.readFileSync(topBarPath, "utf-8");

  it("ensures PosSidebar top header uses h-14 with border-b border-border", () => {
    expect(sidebarContent).toContain("flex h-14 shrink-0 items-center justify-between border-b border-border px-3");
  });

  it("ensures PosTopBar inner header uses h-14 with border-b border-border to seamlessly align with PosSidebar", () => {
    expect(topBarContent).toContain("flex h-14 items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-4 lg:px-5 border-b border-border");
  });

  it("ensures PosTopBar outer header has shadow-2xs removed to prevent drop-shadow offset", () => {
    expect(topBarContent).not.toMatch(/<header[^>]*shadow-2xs[^>]*>/);
    expect(topBarContent).toContain('<header className="sticky top-0 z-40 shrink-0 overflow-x-clip bg-surface print:hidden">');
  });

  it("ensures PosSidebar aside container uses border-r border-border matching topbar line", () => {
    expect(sidebarContent).toContain("border-r border-border");
    expect(sidebarContent).not.toContain("border-r border-sidebar-border");
    expect(sidebarContent).not.toContain("shadow-xs transition-[width]");
  });

  it("ensures outlet switcher buttons use border border-border without shadow-2xs darkening", () => {
    // Expanded outlet button
    expect(sidebarContent).toContain(
      'className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-border bg-sidebar-hover/40 px-3 py-2 text-left transition hover:bg-sidebar-hover outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"'
    );
    // Collapsed outlet button
    expect(sidebarContent).toContain(
      'className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-sidebar-hover/40 text-sidebar-foreground transition hover:bg-sidebar-hover outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"'
    );
  });
});
