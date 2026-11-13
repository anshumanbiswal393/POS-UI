export type KotPrintLine = {
  name: string;
  quantity: number;
  notes?: string;
  variant?: string;
};

export type KotPrintPayload = {
  kotId: number | string;
  kotNumber?: string;
  orderNumber?: string;
  orderType: string;
  tableOrRoom?: string;
  waiterName?: string;
  customerName?: string;
  pax?: number;
  /** Epoch ms when ticket was created */
  createdTimestamp: number;
  /** Display string if available (fallback formats from timestamp) */
  createdAt?: string;
  items: KotPrintLine[];
  isModified?: boolean;
  specialNote?: string;
  outletName?: string;
};

function escapeHtml(value: string | number | undefined | null) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOrderTime(payload: KotPrintPayload) {
  if (payload.createdAt && payload.createdAt !== "--") return payload.createdAt;
  return new Date(payload.createdTimestamp || Date.now()).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function buildKotHtml(payload: KotPrintPayload) {
  const itemsHtml = payload.items
    .map(
      (line, idx) => `
      <tr>
        <td class="idx">${idx + 1}</td>
        <td class="item">
          <div class="name">${escapeHtml(line.name)}</div>
          ${line.variant ? `<div class="variant">[${escapeHtml(line.variant)}]</div>` : ""}
          ${line.notes ? `<div class="note">★ ${escapeHtml(line.notes)}</div>` : ""}
        </td>
        <td class="qty">×${line.quantity}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT #${escapeHtml(payload.kotId)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace;
      color: #000;
      background: #fff;
      font-size: 12px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slip {
      width: 72mm;
      margin: 0 auto;
      padding: 2mm 0;
    }
    .center { text-align: center; }
    .title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .sub {
      font-size: 11px;
      font-weight: 600;
      margin-top: 2px;
    }
    .rule {
      border: none;
      border-top: 1.5px dashed #000;
      margin: 6px 0;
    }
    .meta-box {
      font-size: 11px;
      line-height: 1.45;
    }
    .kot-id-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }
    .kot-id {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.02em;
    }
    .badge {
      display: inline-block;
      border: 1.5px solid #000;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      border-radius: 3px;
    }
    .loc-highlight {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 3px 0;
      padding: 2px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 6px 0;
    }
    th {
      text-align: left;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #000;
      font-weight: 900;
    }
    td {
      vertical-align: top;
      padding: 5px 0;
      border-bottom: 1px dotted #888;
    }
    .idx { width: 14px; font-weight: 800; color: #444; }
    .item { text-align: left; }
    .name { font-size: 13px; font-weight: 900; }
    .variant { font-size: 11px; font-weight: 700; color: #333; }
    .note {
      font-size: 11px;
      margin-top: 2px;
      font-weight: 800;
      color: #000;
    }
    .qty {
      width: 32px;
      text-align: right;
      font-size: 15px;
      font-weight: 900;
      white-space: nowrap;
    }
    .special-note-box {
      margin: 8px 0;
      padding: 6px 8px;
      border: 1.5px dashed #000;
      border-radius: 4px;
      font-size: 11.5px;
    }
    .special-note-header {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .special-note-body {
      font-size: 12.5px;
      font-weight: 900;
      line-height: 1.3;
    }
    .footer {
      margin-top: 8px;
      font-size: 10.5px;
      font-weight: 700;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="center">
      <div class="title">KITCHEN ORDER TICKET</div>
      <div class="sub">${escapeHtml(payload.outletName || "RETROD KITCHEN")}</div>
    </div>

    <hr class="rule" />

    <div class="meta-box">
      <div class="kot-id-row">
        <span class="kot-id">KOT #${escapeHtml(payload.kotId)}</span>
        ${payload.isModified ? '<span class="badge">UPDATED / EXTRA</span>' : '<span class="badge">NEW</span>'}
      </div>

      ${
        payload.tableOrRoom
          ? `<div class="loc-highlight">${escapeHtml(payload.tableOrRoom)}</div>`
          : ""
      }

      <div class="row">
        <span>Order: <strong>#${escapeHtml(payload.orderNumber || payload.kotId)}</strong></span>
        <span>${escapeHtml(payload.orderType)}</span>
      </div>

      ${
        payload.waiterName
          ? `<div class="row">
          <span>Steward: <strong>${escapeHtml(payload.waiterName)}</strong></span>
          ${payload.pax ? `<span>PAX: ${escapeHtml(payload.pax)}</span>` : "<span></span>"}
        </div>`
          : ""
      }

      ${
        payload.customerName && payload.customerName !== "--" && payload.customerName !== "Guest"
          ? `<div>Guest: ${escapeHtml(payload.customerName)}</div>`
          : ""
      }

      <div class="row" style="font-size: 10px; color: #333; margin-top: 2px;">
        <span>Time: ${escapeHtml(formatOrderTime(payload))}</span>
        <span>Printed: ${escapeHtml(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
        )}</span>
      </div>
    </div>

    <hr class="rule" />

    {/* Order Items Table (STRICTLY NO PRICES) */}
    <table>
      <thead>
        <tr>
          <th style="width: 14px;">#</th>
          <th>Item</th>
          <th class="qty">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="3" class="center">No items</td></tr>'}
      </tbody>
    </table>

    ${
      payload.specialNote
        ? `<div class="special-note-box">
        <div class="special-note-header">★ Special Cooking Instructions:</div>
        <div class="special-note-body">${escapeHtml(payload.specialNote)}</div>
      </div>`
        : ""
    }

    <hr class="rule" />
    <div class="footer">— End of KOT #${escapeHtml(payload.kotId)} —</div>
  </div>
</body>
</html>`;
}

const KOT_IFRAME_ID = "retrod-kot-print-frame";

/** Prints KOT in 80mm bill size format without prices (only items & order identifiers) via a hidden iframe */
export function printKotTicket(payload: KotPrintPayload) {
  if (typeof document === "undefined") {
    throw new Error("Print is only available in the browser");
  }

  let iframe = document.getElementById(KOT_IFRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = KOT_IFRAME_ID;
    iframe.setAttribute("title", "KOT Print");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);
  }

  const html = buildKotHtml(payload);
  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument || frameWindow?.document;

  if (!frameWindow || !frameDoc) {
    throw new Error("Could not prepare print frame");
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const triggerPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      throw new Error("Print dialog could not be opened");
    }
  };

  // Wait a tick so the iframe document finishes painting
  if (frameDoc.readyState === "complete") {
    setTimeout(triggerPrint, 50);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 50);
  }
}
