import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Typography Standardization - DM Sans as Single Global Font", () => {
  it("styles.css defines DM Sans as the global font and loads DM Sans from Google Fonts", () => {
    const stylesPath = path.resolve(__dirname, "../../styles.css");
    const content = fs.readFileSync(stylesPath, "utf-8");

    // DM Sans font import
    expect(content).toContain("family=DM+Sans");

    // CSS variables / tokens
    expect(content).toContain('--font-sans: "DM Sans"');
    expect(content).toContain('--font-display: "DM Sans"');
    expect(content).toContain('--font-serif: "DM Sans"');

    // Root inheritance
    expect(content).toContain("font-family: var(--font-sans)");
  });

  it("__root.tsx preconnects and loads DM Sans stylesheet in HTML head", () => {
    const rootPath = path.resolve(__dirname, "../../routes/__root.tsx");
    const content = fs.readFileSync(rootPath, "utf-8");

    expect(content).toContain("family=DM+Sans");
    expect(content).toContain("fonts.googleapis.com");
  });

  it("MenuItemEditModal imports cn to prevent runtime undefined errors", () => {
    const modalPath = path.resolve(__dirname, "../../components/shared/pos/menu/modals/MenuItemEditModal.tsx");
    const content = fs.readFileSync(modalPath, "utf-8");

    expect(content).toMatch(/import\s+.*?\{.*?\bcn\b.*?\}\s+from/);
  });
});

