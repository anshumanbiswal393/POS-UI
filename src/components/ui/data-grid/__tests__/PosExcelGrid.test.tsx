import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PosDataGrid } from "../PosDataGrid";
import { ColorActionView } from "@/components/common/ColorActionIcons";

describe("POS Excel Table Grid Standard & View Action", () => {
  it("renders ColorActionView with black silhouette eye matching user reference", () => {
    const html = renderToStaticMarkup(<ColorActionView className="w-4 h-4" />);
    expect(html).toContain('fill="#000000"');
    expect(html).toContain('fill="#ffffff"');
  });

  it("renders PosDataGrid with Excel format column and row borders and center alignment", () => {
    const columns = [
      { id: "id", header: "Order ID", accessorKey: "id" },
      { id: "guest", header: "Guest Name", accessorKey: "guest" },
      { id: "amount", header: "Amount", accessorKey: "amount" },
    ];
    const data = [
      { id: "1001", guest: "Rohan Verma", amount: "₹450" },
      { id: "1002", guest: "Debarchan Mishra", amount: "₹1,200" },
    ];

    const html = renderToStaticMarkup(
      <PosDataGrid columns={columns} data={data} keyField="id" />
    );

    // Outer table container has border-2 border-black and pos-excel-grid
    expect(html).toContain("pos-excel-grid");
    expect(html).toContain("border-2 border-black");

    // Table tag has border-collapse border border-black text-center
    expect(html).toContain("border-collapse border border-black text-center");

    // Header cells have column border (border-r) and row border (border-b-2) in black, center aligned
    expect(html).toContain("border-r border-b-2 border-black text-center");

    // Data cells have column border (border-r) and row border (border-b) in black, center aligned
    expect(html).toContain("border-r border-b border-black align-middle text-center");

    // Cell data elements are center-aligned
    expect(html).toContain("flex items-center justify-center text-center mx-auto");
  });
});
