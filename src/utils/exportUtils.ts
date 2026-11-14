import { toast } from "sonner";
import { getActivePropertyFallback } from "./printReceipt";

/**
 * Universal Excel Export Engine for Retrod POS
 * Generates beautifully styled spreadsheets with:
 * - Luxury Teal (#0F766E) colored headings with bold white typography
 * - Generous column widths (min 140pt - 220pt) preventing all '####' cutoff
 * - Title and period metadata banner
 * - Proper alignments (Currency right-aligned, Dates centered, Text left-aligned)
 * - Soft alternating zebra striping and clean gridlines
 */

export interface ExportToExcelOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  dateRange?: string;
  propertyName?: string;
  columns?: string[];
  rows?: (string | number | boolean | null | undefined)[][];
  summaryFooter?: (string | number | boolean | null | undefined)[];
}

export interface ExportExtraOptions {
  sheetName?: string;
  title?: string;
  subtitle?: string;
  dateRange?: string;
  propertyName?: string;
  summaryFooter?: (string | number | boolean | null | undefined)[] | Record<string, any>;
}

/**
 * Clean HTML tags and special entities
 */
export function cleanExportCell(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val)
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Escape HTML special chars
 */
function escapeHtml(val: any): string {
  const s = cleanExportCell(val);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Check if a column represents monetary/currency values
 */
function isCurrencyColumn(colName: string): boolean {
  const name = colName.toLowerCase();
  return ["amount", "price", "total", "cost", "sale", "tax", "gst", "discount", "net", "gross", "due", "paid", "bill", "revenue", "₹", "inr"].some(
    (kw) => name.includes(kw)
  );
}

/**
 * Check if a column represents date / timestamp
 */
function isDateColumn(colName: string): boolean {
  const name = colName.toLowerCase();
  return ["date", "time", "created", "updated", "period", "expiry", "at", "timestamp"].some((kw) => name.includes(kw));
}

/**
 * Check if a string is pure numeric
 */
function isNumeric(val: string): boolean {
  if (!val) return false;
  const cleaned = val.replace(/^[₹$€£\s,]+/, "").replace(/,/g, "").trim();
  return cleaned !== "" && !isNaN(Number(cleaned));
}

/**
 * Build rich HTML-Excel spreadsheet with colored headings and generous column spacing
 */
function buildHtmlSpreadsheet(options: ExportToExcelOptions): string {
  const columns = options.columns && options.columns.length > 0 ? options.columns : ["Data"];
  const rows = options.rows || [];
  const sheetName = options.sheetName || "POS Report";
  const title = options.title || options.filename || "Report Export";
  const rawPropName = options.propertyName || getActivePropertyFallback().name || "Anshu Suite Restaurant";
  const propertyName = rawPropName.toLowerCase().includes("retrod") ? "Anshu Suite Restaurant" : rawPropName;
  const summaryFooter = options.summaryFooter;
  const colCount = Math.max(columns.length, 1);

  // 1. Calculate Generous Column Widths (in points)
  const colWidths: number[] = columns.map((colName) => {
    let maxCharLen = colName.length;
    for (let r = 0; r < rows.length; r++) {
      const val = cleanExportCell(rows[r]?.[columns.indexOf(colName)]);
      if (val.length > maxCharLen) maxCharLen = val.length;
    }

    let minWidth = 120;
    if (isCurrencyColumn(colName)) {
      minWidth = 145; // Ample width for large rupee values (e.g. ₹ 1,50,000.00)
    } else if (isDateColumn(colName)) {
      minWidth = 140; // Ample width for full date & time (e.g. 2026-09-02 14:30)
    } else if (
      colName.toLowerCase().includes("outlet") ||
      colName.toLowerCase().includes("item") ||
      colName.toLowerCase().includes("name") ||
      colName.toLowerCase().includes("customer") ||
      colName.toLowerCase().includes("description")
    ) {
      minWidth = 220; // Ample width for outlet names and dish titles
    }

    return Math.max(minWidth, Math.round(maxCharLen * 8.5 + 35));
  });

  const metaText = [
    propertyName ? `Hotel: ${propertyName}` : "",
    options.dateRange ? `Period: ${options.dateRange}` : "",
    options.subtitle || "",
    `Generated: ${new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    `Total Records: ${rows.length}`,
  ]
    .filter(Boolean)
    .join(" | ");

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${escapeHtml(sheetName.substring(0, 31))}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
     <x:Print>
      <x:ValidPrinterInfo/>
     </x:Print>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    color: #1E293B;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    mso-displayed-decimal-separator: ".";
    mso-displayed-thousand-separator: ",";
  }
  .title-row {
    background-color: #0F766E;
    color: #FFFFFF;
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    height: 38pt;
    vertical-align: middle;
    border: 1px solid #0D9488;
    letter-spacing: 0.5px;
  }
  .meta-row {
    background-color: #F0FDFA;
    color: #0F766E;
    font-size: 10pt;
    font-weight: bold;
    font-style: italic;
    text-align: center;
    height: 24pt;
    vertical-align: middle;
    border: 1px solid #0D9488;
  }
  th.col-header {
    background-color: #0F766E;
    color: #FFFFFF;
    font-size: 11pt;
    font-weight: bold;
    text-align: center;
    height: 30pt;
    vertical-align: middle;
    border: 1px solid #0D9488;
    padding: 6px 12px;
    white-space: normal;
  }
  td.cell-text {
    border: 1px solid #0D9488;
    font-size: 10.5pt;
    padding: 6px 10px;
    vertical-align: middle;
    text-align: left;
    mso-number-format: '\\@';
  }
  td.cell-date {
    border: 1px solid #0D9488;
    font-size: 10.5pt;
    padding: 6px 10px;
    vertical-align: middle;
    text-align: center;
    mso-number-format: '\\@';
  }
  td.cell-num {
    border: 1px solid #0D9488;
    font-size: 10.5pt;
    padding: 6px 10px;
    vertical-align: middle;
    text-align: right;
    mso-number-format: '#,##0';
  }
  td.cell-curr {
    border: 1px solid #0D9488;
    font-size: 10.5pt;
    font-weight: bold;
    color: #0F766E;
    padding: 6px 10px;
    vertical-align: middle;
    text-align: right;
    mso-number-format: '₹\\ #,##0.00';
  }
  .row-alt {
    background-color: #FFFFFF;
  }
  .summary-row td {
    background-color: #CCFBF1;
    color: #0F766E;
    font-size: 11pt;
    font-weight: bold;
    border: 2px solid #0F766E;
    padding: 8px 10px;
    vertical-align: middle;
  }
</style>
</head>
<body>
<table>
  <!-- Defined Generous Column Widths -->
  <colgroup>
`;

  colWidths.forEach((w) => {
    html += `    <col style="width: ${w}pt; min-width: ${w}pt;" width="${w}">\n`;
  });

  html += `  </colgroup>
  <tbody>
    <!-- Row 1: Merged Title Banner -->
    <tr>
      <td colspan="${colCount}" class="title-row">${escapeHtml(title.toUpperCase())}</td>
    </tr>
    <!-- Row 2: Metadata Subtitle -->
    <tr>
      <td colspan="${colCount}" class="meta-row">${escapeHtml(metaText)}</td>
    </tr>
    <!-- Row 3: Blank Spacer -->
    <tr style="height: 10pt;">
      <td colspan="${colCount}" style="border: none; height: 10pt;"></td>
    </tr>
    <!-- Row 4: Teal Column Headers -->
    <tr>
`;

  columns.forEach((c) => {
    html += `      <th class="col-header">${escapeHtml(c)}</th>\n`;
  });

  html += `    </tr>\n`;

  // Row 5+: Data Rows
  rows.forEach((row, rIdx) => {
    const isAlt = rIdx % 2 === 1;
    const rowClass = isAlt ? ' class="row-alt"' : "";
    html += `    <tr${rowClass}>\n`;

    columns.forEach((c, cIdx) => {
      const rawVal = row[cIdx];
      const val = cleanExportCell(rawVal);
      const isCurr = isCurrencyColumn(c);
      const isDate = isDateColumn(c);
      const isNum = isNumeric(val);

      if (isCurr && isNum) {
        const numVal = parseFloat(val.replace(/^[₹$€£\s,]+/, "").replace(/,/g, ""));
        html += `      <td class="cell-curr" style="mso-number-format: '₹\\ #,##0.00';">${isNaN(numVal) ? escapeHtml(val) : numVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>\n`;
      } else if (isDate) {
        html += `      <td class="cell-date">${escapeHtml(val)}</td>\n`;
      } else if (isNum && !c.toLowerCase().includes("phone") && !c.toLowerCase().includes("id") && !c.toLowerCase().includes("token") && !c.toLowerCase().includes("code")) {
        const numVal = parseFloat(val.replace(/,/g, ""));
        html += `      <td class="cell-num">${isNaN(numVal) ? escapeHtml(val) : numVal.toLocaleString("en-IN")}</td>\n`;
      } else {
        html += `      <td class="cell-text">${escapeHtml(val)}</td>\n`;
      }
    });

    html += `    </tr>\n`;
  });

  // Summary Footer (if present)
  if (summaryFooter && summaryFooter.length > 0) {
    html += `    <tr class="summary-row">\n`;
    columns.forEach((c, cIdx) => {
      const fVal = cleanExportCell(summaryFooter[cIdx]);
      const isNum = isNumeric(fVal);
      if (isNum && isCurrencyColumn(c)) {
        const numVal = parseFloat(fVal.replace(/^[₹$€£\s,]+/, "").replace(/,/g, ""));
        html += `      <td style="text-align: right; mso-number-format: '₹\\ #,##0.00';">${isNaN(numVal) ? escapeHtml(fVal) : numVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>\n`;
      } else if (isNum) {
        const numVal = parseFloat(fVal.replace(/,/g, ""));
        html += `      <td style="text-align: right;">${isNaN(numVal) ? escapeHtml(fVal) : numVal.toLocaleString("en-IN")}</td>\n`;
      } else {
        html += `      <td style="text-align: left;">${escapeHtml(fVal)}</td>\n`;
      }
    });
    html += `    </tr>\n`;
  }

  html += `  </tbody>
</table>
</body>
</html>`;

  return html;
}

/**
 * Universal Excel export function supporting:
 * 1. Options object: exportToExcel({ filename, title, columns, rows, ... })
 * 2. Array of objects: exportToExcel(data, filename, options)
 */
export function exportToExcel(
  arg1: ExportToExcelOptions | Record<string, any>[],
  arg2?: string,
  arg3?: string | ExportExtraOptions
): void {
  try {
    let defaultPropName = "";
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("retrod:active-property") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        defaultPropName = parsed?.name || "";
      }
    } catch {}

    let opts: ExportToExcelOptions;

    if (Array.isArray(arg1)) {
      const data = arg1;
      const filename = (arg2 || "POS_Report").replace(/\.(csv|xlsx|xls)$/i, "");
      const extra: ExportExtraOptions = typeof arg3 === "string" ? { sheetName: arg3 } : arg3 || {};

      if (data.length === 0) {
        opts = {
          filename,
          sheetName: extra.sheetName || filename.substring(0, 31),
          title: extra.title || filename.replace(/_/g, " "),
          subtitle: extra.subtitle,
          dateRange: extra.dateRange,
          propertyName: extra.propertyName || defaultPropName,
          columns: ["Data"],
          rows: [["No records to export"]],
        };
      } else {
        const rawKeys = Object.keys(data[0]);
        const columns = rawKeys.map((k) =>
          k
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim()
        );

        const rows = data.map((item) => rawKeys.map((k) => item[k]));

        let summaryFooter: (string | number | boolean | null | undefined)[] | undefined = undefined;
        if (extra.summaryFooter) {
          if (Array.isArray(extra.summaryFooter)) {
            summaryFooter = extra.summaryFooter;
          } else {
            const footerObj = extra.summaryFooter as Record<string, any>;
            summaryFooter = rawKeys.map((k, idx) => {
              if (idx === 0) return footerObj["Total"] ?? "Total";
              return footerObj[k] ?? "";
            });
          }
        }

        opts = {
          filename,
          sheetName: extra.sheetName || filename.substring(0, 31),
          title: extra.title || filename.replace(/_/g, " "),
          subtitle: extra.subtitle,
          dateRange: extra.dateRange,
          propertyName: extra.propertyName || defaultPropName,
          columns,
          rows,
          summaryFooter,
        };
      }
    } else {
      opts = {
        ...arg1,
        propertyName: arg1.propertyName || defaultPropName,
      };
    }

    const filename = (opts.filename || "POS_Export").replace(/\.(csv|xlsx|xls)$/i, "");
    const sanitizedFilename = filename.replace(/[/\\?%*:|"<>]/g, "_");
    const finalFilename = `${sanitizedFilename}.xls`;

    // Generate rich HTML-Excel spreadsheet
    const htmlContent = buildHtmlSpreadsheet(opts);

    // Create Blob with UTF-8 BOM so Excel opens with proper unicode/special characters (₹, symbols, etc.)
    const blob = new Blob(["\uFEFF" + htmlContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    if (typeof window !== "undefined") {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", finalFilename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }

    const rowCount = opts.rows ? opts.rows.length : 0;
    toast.success(`Exported ${rowCount} rows to ${finalFilename}`);
  } catch (error) {
    console.error("Failed to export Excel file:", error);
    toast.error("Failed to export Excel spreadsheet. Please try again.");
  }
}

/**
 * Standard table export helper
 */
export function exportTableData(options: ExportToExcelOptions): void {
  exportToExcel(options);
}

/**
 * Fallback wrapper
 */
export function exportToCsv(data: Record<string, any>[], filename = "Export") {
  exportToExcel(data, filename);
}

export { openPrintReportTable, generateReportPrintHtml } from "./printReportTable";
export type { PrintReportOptions, PrintReportColumn } from "./printReportTable";
