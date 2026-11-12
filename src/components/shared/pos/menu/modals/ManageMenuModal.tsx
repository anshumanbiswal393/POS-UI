import { useState } from "react";
import { X, Search, Filter, Plus, Edit2, CheckCircle2 } from "lucide-react";
import { useMenuStockItems } from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";

export function ManageMenuModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: items } = useMenuStockItems();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  if (!isOpen) return null;

  const categories = ["All", ...Array.from(new Set(items?.map((i) => i.category) ?? []))];

  const filtered = (items ?? []).filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900">All In One Menu Management</h2>
            <p className="text-[12px] text-slate-500">
              Configure base items, categories, pricing, and variants
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 flex-1 w-full sm:min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search items by name or item code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => toast.info("New Item creation wizard opened")}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Item Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Stock Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(`Quick edit opened for ${item.name}`)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition"
                      title="Edit Item"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between text-[12.5px] text-slate-500">
          <span>Showing {filtered.length} menu items</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
