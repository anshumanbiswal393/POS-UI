import { X, Image as ImageIcon, CheckCircle2, XCircle, Star, Edit2 } from "lucide-react";
import type { MenuItem } from "@/types/posMenu";

export function MenuItemViewModal({
  isOpen,
  onClose,
  item,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onEdit: (item: MenuItem) => void;
}) {
  if (!isOpen || !item) return null;

  const primaryImage = item.images.find((i) => i.isPrimary) || item.images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold ${
                item.itemType === "Veg"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : item.itemType === "Non-Veg"
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-amber-600 bg-amber-50 text-amber-700"
              }`}
            >
              ●
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">{item.name}</h2>
              <p className="text-[12px] text-slate-500 font-mono">SKU: {item.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Primary Photo & Thumbnail Strip */}
          <div className="space-y-2">
            <div className="relative h-56 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12 stroke-[1.5]" />
                  <span className="text-[12px] mt-1">No Image Available</span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {item.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {item.images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border ${
                      img.isPrimary ? "border-teal-600 ring-2 ring-teal-500/30" : "border-slate-200"
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Price
              </div>
              <div className="text-[18px] font-bold text-slate-900 mt-0.5">₹{item.price}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Tax Rate
              </div>
              <div className="text-[16px] font-bold text-slate-900 mt-0.5">{item.taxRate}% GST</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Category
              </div>
              <div
                className="text-[13px] font-bold text-slate-900 mt-1 truncate"
                title={item.category}
              >
                {item.category}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    item.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      item.status === "Active" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {item.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="text-[12px] font-bold text-slate-700 mb-1">
                Description & Ingredients
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Menu & QR Availability Status */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="text-[12.5px] font-bold text-slate-800">
              Menu Availability Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-semibold text-slate-700">POS Counter Menu</span>
                <span className="text-emerald-600 font-bold">Active on Counter</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-semibold text-slate-700">Direct QR Menu</span>
                <span className={item.direct ? "text-teal-700 font-bold" : "text-slate-400 font-semibold"}>
                  {item.direct ? "Direct Live" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Item
          </button>
        </div>
      </div>
    </div>
  );
}
