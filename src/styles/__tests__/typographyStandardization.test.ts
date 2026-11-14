import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Typography Standardization - Inter as Single Global Font", () => {
  it("styles.css defines Inter as the global font and loads Inter from Google Fonts", () => {
    const stylesPath = path.resolve(__dirname, "../../styles.css");
    const content = fs.readFileSync(stylesPath, "utf-8");

    // Inter font import
    expect(content).toContain("family=Inter");

    // CSS variables / tokens
    expect(content).toContain('--font-sans: "Inter"');
    expect(content).toContain('--font-display: "Inter"');
    expect(content).toContain('--font-serif: "Inter"');

    // Root inheritance
    expect(content).toContain("font-family: var(--font-sans)");
  });

  it("__root.tsx preconnects and loads Inter stylesheet in HTML head", () => {
    const rootPath = path.resolve(__dirname, "../../routes/__root.tsx");
    const content = fs.readFileSync(rootPath, "utf-8");

    expect(content).toContain("family=Inter");
    expect(content).toContain("fonts.googleapis.com");
  });

  it("MenuItemEditModal imports cn to prevent runtime undefined errors", () => {
    const modalPath = path.resolve(__dirname, "../../components/shared/pos/menu/modals/MenuItemEditModal.tsx");
    const content = fs.readFileSync(modalPath, "utf-8");

    expect(content).toMatch(/import\s+.*?\{.*?\bcn\b.*?\}\s+from/);
  });
});

