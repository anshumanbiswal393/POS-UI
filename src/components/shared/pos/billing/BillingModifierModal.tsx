import { useState, useEffect } from "react";
import { X, Plus, Minus, Check, Sparkles } from "lucide-react";
import type {
  BillingMenuItem,
  BillingItemVariant,
  BillingSelectedModifier,
  BillingCartItem,
} from "@/types/posBilling";

type BillingModifierModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: BillingMenuItem | null;
  onConfirmAddToCart: (
    item: BillingMenuItem,
    variant: BillingItemVariant | undefined,
    modifiers: BillingSelectedModifier[],
    instructions: string,
    quantity: number,
  ) => void;
};

const QUICK_INSTRUCTIONS = [
  "Less Spicy",
  "Extra Spicy",
  "No Onion / Garlic",
  "Less Oil / Butter",
  "Serve Hot First",
  "Pack Separate Dip",
];

export function BillingModifierModal({
  isOpen,
  onClose,
  item,
  onConfirmAddToCart,
}: BillingModifierModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<BillingItemVariant | undefined>(
    item?.variants?.[0],
  );
  const [selectedModifiers, setSelectedModifiers] = useState<BillingSelectedModifier[]>([]);
  const [instructions, setInstructions] = useState("");

  // Reset when item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedVariant(item.variants?.[0]);
      setSelectedModifiers([]);
      setInstructions("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleToggleModifier = (
    groupId: string,
    groupName: string,
    optionId: string,
    optionName: string,
    price: number,
    maxSelect: number,
  ) => {
    setSelectedModifiers((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some((m) => m && m.groupId === groupId && m.optionId === optionId);

      if (exists) {
        return list.filter((m) => m && !(m.groupId === groupId && m.optionId === optionId));
      }

      const currentInGroup = list.filter((m) => m && m.groupId === groupId);

      if (maxSelect === 1) {
        // Single select replacement
        return [
          ...list.filter((m) => m && m.groupId !== groupId),
          { groupId, groupName, optionId, optionName, price },
        ];
      }

      if (currentInGroup.length >= maxSelect) {
        return list;
      }

      return [...list, { groupId, groupName, optionId, optionName, price }];
    });
  };

  const handleQuickInstruction = (tag: string) => {
    if (instructions.includes(tag)) {
      setInstructions(
        instructions
          .replace(tag, "")
          .replace(/,\s*,/g, ",")
          .replace(/^,\s*|,\s*$/g, "")
          .trim(),
      );
    } else {
      setInstructions((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  // Calculate Unit Price with variant & modifiers
  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              {item.diet === "veg" && (
                <span className="flex h-3.5 w-3.5 items-center justify-center border border-emerald-600 p-0.5 rounded-[2px] bg-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </span>
              )}
              {item.diet === "non_veg" && (
                <span className="flex h-3.5 w-3.5 items-center justify-center border border-rose-600 p-0.5 rounded-[2px] bg-white">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                </span>
              )}
              {item.diet === "egg" && (
                <span className="flex h-3.5 w-3.5 items-center justify-center border border-amber-600 p-0.5 rounded-[2px] bg-white">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                </span>
              )}
              <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize portions, spice preferences & add-ons
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Variants / Portions */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Select Portion Size</span>
                <span className="text-[11px] font-normal text-teal-700">Required (1)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? "bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-600"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="font-bold">₹{v.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Modifier Groups (Spice, Addons, Dips) */}
          {item.modifierGroups &&
            item.modifierGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">{group.name}</label>
                  <span className="text-[11px] text-slate-500">
                    {group.maxSelect === 1 ? "Choose 1" : `Up to ${group.maxSelect}`}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.options.map((opt) => {
                    const isChecked = selectedModifiers.some(
                      (m) => m.groupId === group.id && m.optionId === opt.id,
                    );
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleToggleModifier(
                            group.id,
                            group.name,
                            opt.id,
                            opt.name,
                            opt.price,
                            group.maxSelect,
                          )
                        }
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition cursor-pointer ${
                          isChecked
                            ? "bg-teal-50/80 border-teal-500 text-teal-950 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                              isChecked
                                ? "bg-teal-600 border-teal-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span>{opt.name}</span>
                        </div>
                        <span className="font-bold text-slate-600">
                          {opt.price > 0 ? `+₹${opt.price}` : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* 3. Special Cooking Instructions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Kitchen Special Note / Instructions</span>
            </label>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INSTRUCTIONS.map((chip) => {
                const isActive = instructions.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickInstruction(chip)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                      isActive
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Extra crispy, serve in separate bowls, less sodium..."
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer transition"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center font-bold text-xs text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="h-7 w-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition shadow-2xs"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => {
              onConfirmAddToCart(item, selectedVariant, selectedModifiers, instructions, quantity);
              onClose();
            }}
            className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-[0.99]"
          >
            <span>Add Item to Bill</span>
            <span className="text-sm font-extrabold bg-teal-800/80 px-2 py-0.5 rounded-lg">
              ₹{totalPrice.toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
