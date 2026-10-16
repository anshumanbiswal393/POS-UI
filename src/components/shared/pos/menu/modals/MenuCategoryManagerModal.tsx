import { useEffect, useState } from "react";
import { X, Plus, Edit2, Trash2, Layers, Check, Ban } from "lucide-react";
import { toast } from "sonner";
import type { MenuCategory } from "@/types/posMenu";
import {
  useMenuCategories,
  useAddMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
} from "@/hooks/queries/usePosMenu";

type Mode = "menu" | "view" | "add";

export function MenuCategoryManagerModal({
  isOpen,
  onClose,
  outletId,
  outletName,
  initialMode = "menu",
}: {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories = [], isLoading, refetch } = useMenuCategories(outletId);
  const addMutation = useAddMenuCategory(outletId);
  const updateMutation = useUpdateMenuCategory(outletId);
  const deleteMutation = useDeleteMenuCategory(outletId);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setNewName("");
      setEditingId(null);
      setEditName("");
      void refetch();
    }
  }, [isOpen, initialMode, refetch]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Enter a category name");
      return;
    }
    try {
      await addMutation.mutateAsync(newName.trim());
      toast.success(`Category "${newName.trim()}" added`);
      setNewName("");
      setMode("view");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { name?: string[]; detail?: string } }; message?: string })
          ?.response?.data?.name?.[0] ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        "Failed to add category";
      toast.error(String(message));
    }
  };

  const startEdit = (cat: MenuCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async (cat: MenuCategory) => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    if (editName.trim() === cat.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: cat.id, name: editName.trim() });
      toast.success(`Category renamed to "${editName.trim()}"`);
      setEditingId(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { name?: string[]; detail?: string } }; message?: string })
          ?.response?.data?.name?.[0] ||
        (err as { message?: string })?.message ||
        "Failed to update category";
      toast.error(String(message));
    }
  };

  const handleDelete = async (cat: MenuCategory) => {
    if (
      !confirm(
        `Remove category "${cat.name}"?${
          (cat.itemCount ?? 0) > 0
            ? `\n\n${cat.itemCount} item(s) use this category — remove may be blocked.`
            : ""
        }`,
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(cat.id);
      toast.success(`Category "${cat.name}" removed`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data
          ?.detail ||
        (err as { message?: string })?.message ||
        "Failed to remove category";
      toast.error(String(message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                {mode === "add"
                  ? "Add New Category"
                  : mode === "view"
                    ? "View Categories"
                    : "Menu Categories"}
              </h2>
              <p className="text-[12px] text-slate-500">{outletName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === "menu" && (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-600">
                Manage categories for this outlet. They appear when adding menu items and as
                filters on Billing once items use them.
              </p>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-bold text-slate-900">View Categories</div>
                  <div className="text-[12px] text-slate-500">
                    See, rename, or remove existing categories ({categories.length})
                  </div>
                </div>
                <Layers className="h-5 w-5 text-teal-600" />
              </button>
              <button
                type="button"
                onClick={() => setMode("add")}
                className="flex w-full items-center justify-between rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3.5 text-left hover:bg-teal-50 transition cursor-pointer"
              >
                <div>
                  <div className="text-[14px] font-bold text-teal-900">Add New Category</div>
                  <div className="text-[12px] text-teal-700/80">
                    Create a category for dishes in this outlet
                  </div>
                </div>
                <Plus className="h-5 w-5 text-teal-700" />
              </button>
            </div>
          )}

          {mode === "add" && (
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Starters, Main Course, Desserts"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMode("menu")}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-[13px] font-bold text-white cursor-pointer disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {addMutation.isPending ? "Saving…" : "Save Category"}
                </button>
              </div>
            </form>
          )}

          {mode === "view" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] text-slate-500">
                  {isLoading ? "Loading…" : `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
                </p>
                <button
                  type="button"
                  onClick={() => setMode("add")}
                  className="flex items-center gap-1 text-[12.5px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                  <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-[13px] font-bold text-slate-700">No categories yet</p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Add a category, then assign it when creating menu items.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode("add")}
                    className="mt-3 rounded-lg bg-teal-700 px-3 py-1.5 text-[12px] font-bold text-white cursor-pointer"
                  >
                    Add First Category
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {categories.map((cat) => {
                    const isEditing = editingId === cat.id;
                    return (
                      <li
                        key={cat.id}
                        className="flex items-center gap-2 bg-white px-3 py-2.5 hover:bg-slate-50/80"
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-teal-400 px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 focus:outline-hidden"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void saveEdit(cat);
                                }
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => void saveEdit(cat)}
                              className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                              title="Cancel"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-bold text-slate-900">
                                {cat.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cat.itemCount ?? 0} item{(cat.itemCount ?? 0) === 1 ? "" : "s"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEdit(cat)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                              title="Edit name"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(cat)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              title="Remove category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setMode("menu")}
                className="mt-2 rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
