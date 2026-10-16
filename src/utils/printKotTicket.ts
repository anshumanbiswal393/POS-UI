export type KotPrintLine = {
  name: string;
  quantity: number;
  notes?: string;
};

export type KotPrintPayload = {
  kotId: number;
  orderType: string;
  customerName?: string;
  /** Epoch ms when ticket was created */
  createdTimestamp: number;
  /** Display string if available (fallback formats from timestamp) */
  createdAt?: string;
  items: KotPrintLine[];
  isModified?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOrderTime(payload: KotPrintPayload) {
  if (payload.createdAt && payload.createdAt !== "--") return payload.createdAt;
  return new Date(payload.createdTimestamp).toLocaleString("en-GB", {
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
          ${
            line.notes
              ? `<div class="note">★ ${escapeHtml(line.notes)}</div>`
              : ""
          }
        </td>
        <td class="qty">×${line.quantity}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT #${payload.kotId}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace;
      color: #111;
      background: #fff;
    }
    .slip {
      width: 72mm;
      margin: 0 auto;
      padding: 2mm 0;
    }
    .center { text-align: center; }
    .title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .sub {
      font-size: 11px;
      margin-top: 2px;
    }
    .rule {
      border: none;
      border-top: 1px dashed #333;
      margin: 8px 0;
    }
    .meta {
      font-size: 11px;
      line-height: 1.45;
    }
    .meta strong { font-weight: 800; }
    .badge {
      display: inline-block;
      border: 1px solid #111;
      padding: 1px 5px;
      font-size: 10px;
      font-weight: 800;
      margin-left: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding-bottom: 4px;
      border-bottom: 1px solid #111;
    }
    td {
      vertical-align: top;
      padding: 5px 0;
      border-bottom: 1px dotted #bbb;
    }
    .idx { width: 14px; color: #555; }
    .qty {
      width: 28px;
      text-align: right;
      font-weight: 800;
      white-space: nowrap;
    }
    .name { font-weight: 700; }
    .note {
      font-size: 10px;
      margin-top: 2px;
      font-weight: 600;
    }
    .footer {
      margin-top: 10px;
      font-size: 10px;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="center">
      <div class="title">Kitchen Order Ticket</div>
      <div class="sub">Retrod POS · KOT</div>
    </div>
    <hr class="rule" />
    <div class="meta">
      <div><strong>KOT #${payload.kotId}</strong>${
        payload.isModified ? '<span class="badge">UPDATED</span>' : ""
      }</div>
      <div>${escapeHtml(payload.orderType)}</div>
      <div>Time: ${escapeHtml(formatOrderTime(payload))}</div>
      <div>Printed: ${escapeHtml(
        new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      )}</div>
    </div>
    <hr class="rule" />
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th class="qty">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || `<tr><td colspan="3" class="center">No items</td></tr>`}
      </tbody>
    </table>
    <hr class="rule" />
    <div class="footer">— End of KOT #${payload.kotId} —</div>
  </div>
</body>
</html>`;
}

const IFRAME_ID = "retrod-kot-print-frame";

/** Prints KOT via a hidden iframe (no popup — avoids browser blockers) */
export function printKotTicket(payload: KotPrintPayload) {
  if (typeof document === "undefined") {
    throw new Error("Print is only available in the browser");
  }

  let iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = IFRAME_ID;
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
