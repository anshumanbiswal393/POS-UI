import React, { useState } from "react";
import { Plus, Layers } from "lucide-react";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArea: (areaName: string) => void;
  existingAreas: string[];
}

export function AddAreaModal({ isOpen, onClose, onAddArea, existingAreas }: AddAreaModalProps) {
  const [areaName, setAreaName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = areaName.trim();
    if (!trimmed) {
      setError("Please enter an area name");
      return;
    }
    if (existingAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setError("An area with this name already exists");
      return;
    }
    onAddArea(trimmed);
    setAreaName("");
    setError("");
    onClose();
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add New Floor / Area"
      description="Create a new dining section (e.g. Terrace, Outdoor, Rooftop)"
      icon={Layers}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>
            <Plus className="h-3.5 w-3.5" />
            Add Area
          </PosCreateSubmitButton>
        </>
      }
    >
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          Area / Floor Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          autoFocus
          placeholder="e.g. Rooftop Lounge, Garden Terrace, Poolside"
          value={areaName}
          onChange={(e) => {
            setAreaName(e.target.value);
            if (error) setError("");
          }}
          className="w-full rounded-xl border border-border bg-primary-tint/70 px-3.5 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {error ? <p className="mt-1 text-xs font-medium text-rose-500">{error}</p> : null}
      </div>
    </PosCreatePanel>
  );
}
