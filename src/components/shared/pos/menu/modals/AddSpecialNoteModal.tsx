import { useState } from "react";
import { StickyNote } from "lucide-react";
import { useAddSpecialNote } from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

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
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add Special Note"
      description="Create a billing and KOT note for this outlet."
      icon={StickyNote}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={addMutation.isPending}>
            {addMutation.isPending ? "Saving..." : "Save Note"}
          </PosCreateSubmitButton>
        </>
      }
    >
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Special Note Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Parcel, Non Spice, Extra Dip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-primary-tint/70 px-3.5 py-2 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary-tint/50 px-3 py-2.5">
        <div>
          <div className="text-[13px] font-medium text-foreground">Available Status</div>
          <div className="text-[11.5px] text-muted-foreground">
            Enable this note for billing and KOT customization
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
        </label>
      </div>
    </PosCreatePanel>
  );
}
