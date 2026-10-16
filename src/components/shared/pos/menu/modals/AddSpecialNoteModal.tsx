import { useState } from "react";
import { X } from "lucide-react";
import { useAddSpecialNote } from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";

export function AddSpecialNoteModal({
  isOpen,
  onClose,
  initialName = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
}) {
  const { activeOutlet } = useOutletContext();
  const [name, setName] = useState(initialName);
  const [available, setAvailable] = useState(true);
  const addMutation = useAddSpecialNote(activeOutlet?.id);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a special note name");
      return;
    }

    addMutation.mutate(
      { name: name.trim(), available },
      {
        onSuccess: () => {
          toast.success(`Special note "${name}" created successfully`);
          setName("");
          onClose();
        },
        onError: () => {
          toast.error("Failed to create special note");
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <h2 className="text-[16px] font-semibold text-slate-800">Add Special Note</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Special Note Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Parcel, Non Spice, Extra Dip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <div className="text-[13px] font-medium text-slate-700">Available Status</div>
              <div className="text-[11.5px] text-slate-500">
                Enable this note for billing and KOT customization
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded-lg bg-teal-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-teal-700 transition cursor-pointer disabled:opacity-50"
            >
              {addMutation.isPending ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
