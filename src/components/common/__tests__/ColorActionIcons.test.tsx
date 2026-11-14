import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ColorActionPrint,
  ColorActionEdit,
  ColorActionView,
  ColorActionDelete,
} from "../ColorActionIcons";

describe("ColorActionIcons (Reference Screenshots 3 & 4)", () => {
  it("renders ColorActionPrint matching Screenshot 3 with blue paper, dark casing and green status LED", () => {
    const html = renderToStaticMarkup(<ColorActionPrint className="w-5 h-5" />);
    expect(html).toContain("viewBox=\"0 0 24 24\"");
    // Top blue feed paper (#7dd3fc)
    expect(html).toContain('fill="#7dd3fc"');
    // Dark body (#334155)
    expect(html).toContain('fill="#334155"');
    // Green LED (#10b981)
    expect(html).toContain('fill="#10b981"');
    // Printed receipt (#38bdf8)
    expect(html).toContain('fill="#38bdf8"');
  });

  it("renders ColorActionEdit matching Screenshot 4 with dark pad frame and vibrant blue pencil", () => {
    const html = renderToStaticMarkup(<ColorActionEdit className="w-5 h-5" />);
    expect(html).toContain("viewBox=\"0 0 24 24\"");
    // Dark frame stroke (#0f172a)
    expect(html).toContain('stroke="#0f172a"');
    // Vibrant blue pencil body (#0284c7)
    expect(html).toContain('fill="#0284c7"');
    // Cyan cap (#38bdf8)
    expect(html).toContain('fill="#38bdf8"');
  });

  it("renders ColorActionView with colorful eye iris and highlight", () => {
    const html = renderToStaticMarkup(<ColorActionView className="w-5 h-5" />);
    expect(html).toContain("viewBox=\"0 0 24 24\"");
    // Vibrant iris (#0284c7)
    expect(html).toContain('fill="#0284c7"');
    // Pupil (#0f172a)
    expect(html).toContain('fill="#0f172a"');
  });

  it("renders ColorActionDelete with colorful red accents", () => {
    const html = renderToStaticMarkup(<ColorActionDelete className="w-5 h-5" />);
    expect(html).toContain("viewBox=\"0 0 24 24\"");
    expect(html).toContain('fill="#fee2e2"');
    expect(html).toContain('stroke="#ef4444"');
  });
});
