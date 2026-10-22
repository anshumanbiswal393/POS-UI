import { useState } from "react";
import { Store } from "lucide-react";
import { useAddVirtualOutlet } from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function AddVirtualOutletModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const addMutation = useAddVirtualOutlet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a virtual outlet name");
      return;
    }

    addMutation.mutate(
      { name: name.trim(), cuisine: cuisine.trim() || "Multi-Cuisine" },
      {
        onSuccess: () => {
          toast.success(`Virtual outlet "${name}" added successfully`);
          setName("");
          setCuisine("");
          onClose();
        },
        onError: () => {
          toast.error("Failed to add virtual outlet");
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add Virtual Outlet"
      description="Create independent menu for cloud brand"
      icon={Store}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={addMutation.isPending}>
            {addMutation.isPending ? "Creating..." : "Add Outlet"}
          </PosCreateSubmitButton>
        </>
      }
    >
      <div>
        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
          Outlet / Brand Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Highway Inn - Burger Lab"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
          Cuisine / Concept
        </label>
        <input
          type="text"
          placeholder="e.g. Fast Food, Biryani, Mughlai"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="rounded-lg bg-teal-50 p-3 border border-blue-100 text-[12px] text-teal-800">
        A virtual outlet allows you to run separate online brand menus, different prices, and
        packaging charges from the same kitchen.
      </div>
    </PosCreatePanel>
  );
}
