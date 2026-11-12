import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Star,
  Trash2,
  RefreshCw,
  AlertCircle,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { MenuItem, MenuItemImage, MenuItemType, MenuItemIngredient } from "@/types/posMenu";
import {
  useAddMenuItem,
  useUpdateMenuItem,
  useMenuCategories,
  useAddMenuCategory,
} from "@/hooks/queries/usePosMenu";
import { useStockItems, INVENTORY_QUERY_KEYS } from "@/hooks/queries/usePosInventory";
import { posInventoryService } from "@/services/posInventoryService";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import { fileToDataUrl } from "@/utils/imageUtils";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function MenuItemEditModal({
  isOpen,
  onClose,
  item,
  defaultOutletId,
}: {
  isOpen: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  defaultOutletId: string;
}) {
  const queryClient = useQueryClient();
  const { data: stockItems = [] } = useStockItems();

  const addMutation = useAddMenuItem();
  const updateMutation = useUpdateMenuItem();
  const addCategoryMutation = useAddMenuCategory(defaultOutletId);
  const { data: outletCategories = [] } = useMenuCategories(defaultOutletId);
  const categoryOptions = outletCategories.map((c) => c.name);

  const [createdCategories, setCreatedCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const allCategoryOptions = Array.from(
    new Set([...categoryOptions, ...createdCategories, ...(item?.category ? [item.category] : [])].filter(Boolean))
  );

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [onlineDisplayName, setOnlineDisplayName] = useState("");
  const [category, setCategory] = useState("");
  const [itemType, setItemType] = useState<MenuItemType>("Veg");
  const [price, setPrice] = useState<number | string>("");
  const [taxRate, setTaxRate] = useState<number>(5);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<MenuItemImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Plates stock & Recipe Ingredients
  const [plates, setPlates] = useState<number | string>("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ rawMaterialId: string; quantity: number | string }>
  >([]);

  // Portion Pricing (Half & Full Plates)
  const [hasPortions, setHasPortions] = useState(false);
  const [fullPrice, setFullPrice] = useState<number | string>("");
  const [halfPrice, setHalfPrice] = useState<number | string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Initialize or reset form on open / item change
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setCode(item.code);
        setOnlineDisplayName(item.onlineDisplayName || item.name);
        setCategory(item.category || categoryOptions[0] || "");
        setItemType(item.itemType || "Veg");
        setPrice(item.price);
        setTaxRate(item.taxRate ?? 5);
        setStatus(item.status || "Active");
        setDescription(item.description || "");
        setImages(item.images || []);
        setPlates(item.plates !== undefined ? item.plates : "");
        setRecipeIngredients(
          item.rawMaterials && item.rawMaterials.length > 0
            ? item.rawMaterials.map((rm) => ({
                rawMaterialId: rm.rawMaterialId,
                quantity: rm.quantity,
              }))
            : [],
        );
        const halfVariant = item.variants?.find((v) =>
          v.name.toLowerCase().includes("half"),
        );
        const fullVariant = item.variants?.find((v) =>
          v.name.toLowerCase().includes("full"),
        );
        if (halfVariant || fullVariant) {
          setHasPortions(true);
          setHalfPrice(halfVariant ? halfVariant.price : "");
          setFullPrice(fullVariant ? fullVariant.price : item.price);
        } else {
          setHasPortions(false);
          setHalfPrice("");
          setFullPrice("");
        }
      } else {
        setName("");
        setCode("");
        setOnlineDisplayName("");
        setCategory(allCategoryOptions[0] || "");
        setItemType("Veg");
        setPrice("");
        setTaxRate(5);
        setStatus("Active");
        setDescription("");
        setImages([]);
        setPlates("");
        setRecipeIngredients([]);
        setHasPortions(false);
        setHalfPrice("");
        setFullPrice("");
      }
      setIsAddingCategory(false);
      setNewCategoryName("");
      setIsUploading(false);
      setUploadProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset from item/open; categories hydrate separately
  }, [isOpen, item]);

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    const existing = allCategoryOptions.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      setCategory(existing);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast.info(`Selected existing category "${existing}"`);
      return;
    }

    try {
      const created = await addCategoryMutation.mutateAsync(trimmed);
      const catName = created?.name || trimmed;
      setCreatedCategories((prev) => [...prev, catName]);
      setCategory(catName);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast.success(`Category "${catName}" created and selected`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { name?: string[]; detail?: string } } })?.response?.data;
      const errorText =
        (Array.isArray(msg?.name) ? msg.name[0] : msg?.name) ||
        msg?.detail ||
        (err as Error)?.message ||
        "Failed to create category";
      toast.error(String(errorText));
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!ALLOWED_EXTENSIONS.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
        toast.error(`"${file.name}" is not a supported image format. Use JPG, PNG, or WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const newImages: MenuItemImage[] = await Promise.all(
        validFiles.map(async (file, idx) => {
          setUploadProgress((prev) => Math.min(prev + 20, 85));
          const persistentUrl = await fileToDataUrl(file);
          const sizeKb = (file.size / 1024).toFixed(0);
          const formattedSize =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${sizeKb} KB`;

          return {
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            url: persistentUrl,
            name: file.name,
            isPrimary: images.length === 0 && idx === 0,
            size: formattedSize,
            type: file.type || "image/jpeg",
            uploadedAt: "Just now",
          };
        }),
      );

      setUploadProgress(100);

      if (replaceIndexRef.current !== null && newImages.length > 0) {
        const idx = replaceIndexRef.current;
        const wasPrimary = images[idx]?.isPrimary;
        const replacement = { ...newImages[0], isPrimary: wasPrimary };
        setImages((prev) => {
          const copy = [...prev];
          copy[idx] = replacement;
          return copy;
        });
        replaceIndexRef.current = null;
        toast.success("Image replaced successfully");
      } else {
        setImages((prev) => {
          const hasPrimary = prev.some((i) => i.isPrimary);
          if (!hasPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
          }
          return [...prev, ...newImages];
        });
        toast.success(`Added ${newImages.length} image(s)`);
      }
    } catch {
      toast.error("Failed to process image file(s)");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSetPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
    );
    toast.success("Cover image updated");
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const hadPrimary = prev.find((img) => img.id === id)?.isPrimary;
      if (hadPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
    toast.info("Image removed");
  };

  const triggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const handleAddIngredientRow = () => {
    const rawOptions = stockItems.filter((s) => !s.itemKind || s.itemKind === "RAW");
    const pool = rawOptions.length > 0 ? rawOptions : stockItems;
    const available = pool.find(
      (s) => !recipeIngredients.some((ri) => ri.rawMaterialId === s.id),
    );
    setRecipeIngredients((prev) => [
      ...prev,
      { rawMaterialId: available?.id || pool[0]?.id || "", quantity: "" },
    ]);
  };

  const handleUpdateIngredient = (index: number, field: "rawMaterialId" | "quantity", value: any) => {
    setRecipeIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the item name");
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter an item code / SKU");
      return;
    }
    if (!category.trim()) {
      toast.error("Please enter or select a category");
      return;
    }
    if (!itemType || !["Veg", "Non-Veg", "Egg"].includes(itemType)) {
      toast.error("Please select a food type");
      return;
    }
    if (price === "" || price === undefined || price === null) {
      toast.error("Please enter the base price");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid base price");
      return;
    }

    const matchedCategory = outletCategories.find(
      (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase(),
    );

    const parsedPlates =
      plates !== "" && !isNaN(Number(plates)) ? Math.max(0, Number(plates)) : undefined;

    const validIngredients: MenuItemIngredient[] = [];
    for (const ing of recipeIngredients) {
      const q = Number(ing.quantity);
      if (ing.rawMaterialId && !isNaN(q) && q > 0) {
        const mat = stockItems.find((s) => s.id === ing.rawMaterialId);
        validIngredients.push({
          rawMaterialId: ing.rawMaterialId,
          rawMaterialName: mat?.rawMaterial || mat?.name || "Raw Material",
          quantity: q,
          unit: mat?.unit || "unit",
        });
      }
    }

    let variants: Array<{ id: string; name: string; price: number }> | undefined = undefined;
    if (hasPortions) {
      const fPrice = fullPrice !== "" && !isNaN(Number(fullPrice)) ? Number(fullPrice) : numPrice;
      const hPrice =
        halfPrice !== "" && !isNaN(Number(halfPrice))
          ? Number(halfPrice)
          : Math.round(fPrice * 0.6);
      variants = [
        { id: "full", name: "Full", price: fPrice },
        { id: "half", name: "Half", price: hPrice },
      ];
    } else if (item?.variants && item.variants.length > 0) {
      variants = item.variants;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      onlineDisplayName: (onlineDisplayName || name).trim(),
      category: category.trim(),
      categoryId: matchedCategory?.id || item?.categoryId,
      itemType,
      price: hasPortions && fullPrice ? Number(fullPrice) : numPrice,
      taxRate: Number(taxRate) || 5,
      status,
      description: description.trim(),
      images,
      outletId: item?.outletId || defaultOutletId,
      baseMenu: item ? item.baseMenu : true,
      zomato: false,
      swiggy: false,
      // Single Status drives visibility on billing, printed menu, and Direct QR
      direct: status === "Active",
      plates: parsedPlates,
      rawMaterials: validIngredients,
      variants,
    };

    const deductStockAfterSave = async () => {
      for (const ing of validIngredients) {
        try {
          await posInventoryService.adjustStock(
            ing.rawMaterialId,
            -Math.abs(ing.quantity),
            "CONSUMPTION",
            `Recipe Preparation: ${name.trim()} (${parsedPlates || 0} plates)`,
            defaultOutletId,
          );
        } catch {
          // ignore
        }
      }
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pos", "stock"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "inventory"] });
    };

    if (item) {
      updateMutation.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: () => {
            void deductStockAfterSave();
            toast.success(`Updated "${name}" successfully`);
            onClose();
          },
          onError: (err: unknown) => {
            const detail = (err as { response?: { data?: unknown } })?.response?.data;
            const message =
              (typeof detail === "string" && detail) ||
              (typeof (detail as { detail?: string })?.detail === "string" &&
                (detail as { detail: string }).detail) ||
              "Failed to update item";
            toast.error(message);
          },
        },
      );
    } else {
      addMutation.mutate(payload, {
        onSuccess: () => {
          void deductStockAfterSave();
          toast.success(`Created "${name}" in menu`);
          onClose();
        },
        onError: (err: unknown) => {
          const detail = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
          const first =
            detail &&
            Object.values(detail)
              .flatMap((v) => (Array.isArray(v) ? v : [v]))
              .find((v) => typeof v === "string");
          toast.error((typeof first === "string" && first) || "Failed to create item");
        },
      });
    }
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title={item ? `Edit Menu Item: ${item.name}` : "Add New Menu Item"}
      description="Configure item pricing, tax category, dietary badge, and manage photo gallery."
      icon={ImageIcon}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <span className="mr-auto text-[12px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            Changes will apply to the active outlet catalog.
          </span>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={addMutation.isPending || updateMutation.isPending}>
            {addMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : item
                ? "Update Menu Item"
                : "Add Menu Item"}
          </PosCreateSubmitButton>
        </>
      }
    >
          {/* 1. Basic Info Grid: Name, Code/SKU, Category (in one clean row) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Item Name */}
            <div className="md:col-span-5">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Butter Chicken Boneless Gravy"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setOnlineDisplayName(e.target.value);
                }}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Item Code / SKU */}
            <div className="md:col-span-3">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Item Code / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. FD-104"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 font-mono focus:border-teal-500 focus:outline-hidden uppercase"
                required
              />
            </div>

            {/* Category — select existing or create inline on the fly */}
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12.5px] font-semibold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(true);
                      setNewCategoryName("");
                    }}
                    className="text-[11.5px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Add Category
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      } else if (e.key === "Escape") {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    className="flex-1 h-10 rounded-lg border border-teal-500 bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                    className="h-10 inline-flex items-center justify-center px-3 text-[12px] font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition cursor-pointer shrink-0"
                  >
                    {addCategoryMutation.isPending ? "Adding..." : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="h-10 px-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0 border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingCategory(true);
                      setNewCategoryName("");
                      return;
                    }
                    setCategory(e.target.value);
                  }}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- Select Category --
                  </option>
                  {allCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-teal-700">
                    + Add New Category...
                  </option>
                </select>
              )}
            </div>
          </div>

          {/* 2. Type, Price, Tax, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
            {/* Item Type (Veg / Non-Veg / Egg) */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Food Type <span className="text-red-500">*</span>
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as MenuItemType)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer"
                required
              >
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Egg">Egg</option>
              </select>
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[13px] font-bold text-slate-400 select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-[13px] font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Tax Rate (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer"
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% GST (Standard Food)</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Liquor & Beverage)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            {/* Single Status toggle — Active = Billing + printed menu; Inactive stays in list only */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-2 h-10 px-3 bg-white rounded-lg border border-slate-300">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={status === "Active"}
                    onChange={(e) => setStatus(e.target.checked ? "Active" : "Inactive")}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span
                  className={`text-[12px] font-semibold whitespace-nowrap ${
                    status === "Active" ? "text-teal-700" : "text-slate-500"
                  }`}
                >
                  {status === "Active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Portion Pricing (Half & Full Plates) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12.5px] font-bold text-slate-800">
                  Portion Pricing (Half & Full Plates)
                </span>
                <p className="text-[11px] text-slate-500">
                  Enable separate pricing for Full plate and Half plate portions. POS orders will deduct 1.0 or 0.5 plate accordingly.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPortions}
                  onChange={(e) => {
                    setHasPortions(e.target.checked);
                    if (e.target.checked && !fullPrice) {
                      setFullPrice(price || "");
                      setHalfPrice(price ? Math.round(Number(price) * 0.6) : "");
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {hasPortions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                    Full Plate Price (₹) — 1.0 Plate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[12px] font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={fullPrice}
                      onChange={(e) => {
                        setFullPrice(e.target.value);
                        setPrice(e.target.value);
                      }}
                      className="w-full h-9 rounded-lg border border-slate-300 pl-7 pr-3 text-[12.5px] font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                    Half Plate Price (₹) — 0.5 Plate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[12px] font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={halfPrice}
                      onChange={(e) => setHalfPrice(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-300 pl-7 pr-3 text-[12.5px] font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plates Yield & Raw Materials Recipe */}
          <div className="space-y-3.5 p-4 rounded-xl bg-teal-50/50 border border-teal-200/80">
            <div>
              <h3 className="text-[13.5px] font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-teal-600" />
                Plate Stock & Raw Material Consumption
              </h3>
              <p className="text-[11.5px] text-slate-500">
                Enter available plates prepared for this dish. Select raw materials consumed; their quantities will be automatically deducted from stock inventory.
              </p>
            </div>

            <div className="max-w-xs">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Plate (Available Stock) <span className="text-teal-700 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 20 plates"
                value={plates}
                onChange={(e) => setPlates(e.target.value)}
                className="w-full h-10 rounded-lg border border-teal-300 bg-white px-3 py-2 text-[13px] font-bold text-teal-900 focus:border-teal-500 focus:outline-hidden"
              />
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Waiter POS orders will deduct 1.0 plate for Full and 0.5 plate for Half.
              </span>
            </div>

            {/* Raw Materials Table */}
            <div className="space-y-2 pt-2 border-t border-teal-200/60">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-bold uppercase tracking-wider text-teal-900">
                  Raw Materials Consumed
                </label>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold text-teal-700 hover:text-teal-800 bg-teal-100/70 hover:bg-teal-100 px-2.5 py-1 rounded-md transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Raw Material
                </button>
              </div>

              {recipeIngredients.length === 0 ? (
                <p className="text-[11.5px] text-slate-500 italic bg-white/70 p-2.5 rounded-lg border border-teal-200/50">
                  No raw materials linked yet. Click "+ Add Raw Material" to select inventory items used for preparing these plates.
                </p>
              ) : (
                <div className="space-y-2">
                  {recipeIngredients.map((ing, idx) => {
                    const selectedStock = stockItems.find((s) => s.id === ing.rawMaterialId);
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white border border-teal-200/70 shadow-2xs"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                            Raw Material
                          </label>
                          <select
                            value={ing.rawMaterialId}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, "rawMaterialId", e.target.value)
                            }
                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
                          >
                            <option value="" disabled>
                              -- Choose material --
                            </option>
                            {stockItems.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.rawMaterial || s.name} ({s.availableStock} {s.unit} in stock)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                            Quantity Used
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={ing.quantity}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, "quantity", e.target.value)
                            }
                            className="w-full h-9 rounded-md border border-slate-300 px-2.5 text-[12px] font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="w-20">
                          <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                            Unit
                          </label>
                          <div className="h-9 flex items-center px-2 rounded-md bg-slate-100 text-[11.5px] font-semibold text-slate-700">
                            {selectedStock?.unit || "unit"}
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="h-9 w-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Remove material"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
              Short Description / Ingredients
            </label>
            <textarea
              rows={2}
              placeholder="Preparation method, key spices, portion size, and allergen notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* 4. Multiple Image Management Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13.5px] font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-teal-600" />
                  Item Photos ({images.length})
                </h3>
                <p className="text-[11.5px] text-slate-500">
                  Upload multiple photos. Mark one as the Primary Cover Image to show in menus &
                  tables.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  replaceIndexRef.current = null;
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50 px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100 transition cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Images
              </button>
            </div>

            {/* Hidden Input for File Picker */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />

            {/* Uploading progress indicator */}
            {isUploading && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                    Validating and uploading photo(s)...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-200">
                  <div
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Image Gallery Grid */}
            {images.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/20"
                    : "border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/20"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    isDragging ? "bg-teal-600 text-white scale-110" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="text-[13.5px] font-bold text-slate-800">
                  {isDragging ? "Drop images here to upload" : "Drag & drop dish photo(s) here, or browse"}
                </div>
                <div className="text-[11.5px] text-slate-500">
                  Click or drag and drop JPG, PNG, or WEBP files up to {MAX_FILE_SIZE_MB}MB.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative rounded-xl border p-2.5 transition flex flex-col justify-between ${
                      img.isPrimary
                        ? "border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Cover Image
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-[11.5px] text-slate-700 min-w-0">
                      <div className="truncate font-semibold text-slate-900" title={img.name}>
                        {img.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                        <span>{img.size || "1.1 MB"}</span>
                        <span>•</span>
                        <span>{img.uploadedAt || "Uploaded"}</span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      {!img.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          <Star className="h-3 w-3" />
                          Set Cover
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Primary
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => triggerReplace(idx)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          title="Replace Image"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Additional Drag & Drop Dropzone Card when images exist */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 min-h-[140px] ${
                    isDragging
                      ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/20"
                      : "border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/20"
                  }`}
                >
                  <Plus className="h-5 w-5 text-teal-600" />
                  <span className="text-[12px] font-bold text-teal-800">Add More Photos</span>
                  <span className="text-[10px] text-slate-400">Drag & drop or browse</span>
                </div>
              </div>
            )}
          </div>
    </PosCreatePanel>
  );
}
