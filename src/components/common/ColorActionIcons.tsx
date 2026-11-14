import React from "react";

/**
 * Colorful Action Icons for POS Tables & Grids
 * Directly matches the reference imagery:
 * - ColorActionPrint: Sigven-style printer with top blue paper, dark casing, green LED, bottom output sheet
 * - ColorActionEdit: Document frame with angled vibrant blue pencil
 * - ColorActionView: Rich eye with vibrant iris, dark pupil, and gleam
 * - ColorActionDelete: Crisp red trash icon
 */

export function ColorActionPrint({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      {/* Top Paper */}
      <rect x="5.5" y="2" width="13" height="6.5" rx="1" fill="#7dd3fc" />
      {/* Printer Body */}
      <rect x="2" y="7.5" width="20" height="9" rx="2.5" fill="#334155" />
      {/* Status LED Dot */}
      <circle cx="19" cy="10" r="1.2" fill="#10b981" />
      {/* Paper Exit Slot */}
      <rect x="4.5" y="14" width="15" height="1.5" rx="0.5" fill="#0f172a" />
      {/* Bottom Printed Receipt */}
      <path
        d="M5.5 14.5H18.5V21.5C18.5 22.0523 18.0523 22.5 17.5 22.5H6.5C5.94772 22.5 5.5 22.0523 5.5 21.5V14.5Z"
        fill="#38bdf8"
      />
      {/* Receipt Text Lines */}
      <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="20" x2="14" y2="20" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ColorActionEdit({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      {/* Pad / Document frame */}
      <path
        d="M11 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H17C18.1046 20 19 19.1046 19 18V12"
        stroke="#0f172a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Underline */}
      <line x1="7" y1="15.5" x2="14" y2="15.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      {/* Pencil Body */}
      <path d="M13.5 12.5L20 6L17 3L10.5 9.5L10 13L13.5 12.5Z" fill="#0284c7" />
      {/* Pencil Cap / Eraser band */}
      <path
        d="M17 3L20 6L21.5 4.5C22.1 3.9 22.1 2.9 21.5 2.3C20.9 1.7 19.9 1.7 19.3 2.3L17 3Z"
        fill="#38bdf8"
      />
      {/* Pencil divider */}
      <line x1="16.5" y1="3.5" x2="19.5" y2="6.5" stroke="#ffffff" strokeWidth="1" />
      {/* Pencil Tip */}
      <path d="M10 13L11.5 12.8L10.2 11.5L10 13Z" fill="#0f172a" />
    </svg>
  );
}

export function ColorActionView({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      {/* Eye outer border */}
      <path
        d="M2 12C3.8 6.5 7.5 4 12 4C16.5 4 20.2 6.5 22 12C20.2 17.5 16.5 20 12 20C7.5 20 3.8 17.5 2 12Z"
        fill="#f0f9ff"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Iris */}
      <circle cx="12" cy="12" r="4.2" fill="#0284c7" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="2.2" fill="#0f172a" />
      {/* Gleam */}
      <circle cx="13.2" cy="10.8" r="1.1" fill="#ffffff" />
    </svg>
  );
}

export function ColorActionDelete({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M4 6H20" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 3H15" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 6L7 19C7.1 20.1 8 21 9.1 21H14.9C16 21 16.9 20.1 17 19L18 6"
        fill="#fee2e2"
        stroke="#ef4444"
        strokeWidth="2"
      />
      <line x1="10" y1="10" x2="10" y2="17" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="10" x2="14" y2="17" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

