import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Star,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { MenuItem, MenuItemImage, MenuItemType } from "@/types/posMenu";
import {
  useAddMenuItem,
  useUpdateMenuItem,
  useMenuCategories,
} from "@/hooks/queries/usePosMenu";
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
  const addMutation = useAddMenuItem();
  const updateMutation = useUpdateMenuItem();
  const { data: outletCategories = [] } = useMenuCategories(defaultOutletId);
  const categoryOptions = outletCategories.map((c) => c.name);

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
      } else {
        setName("");
        setCode("");
        setOnlineDisplayName("");
        setCategory(categoryOptions[0] || "");
        setItemType("Veg");
        setPrice("");
        setTaxRate(5);
        setStatus("Active");
        setDescription("");
        setImages([]);
      }
      setIsUploading(false);
      setUploadProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset from item/open; categories hydrate separately
  }, [isOpen, item]);

  // When categories load after modal open, default blank category for new items
  useEffect(() => {
    if (isOpen && !item && !category && categoryOptions.length > 0) {
      setCategory(categoryOptions[0]);
    }
  }, [isOpen, item, category, categoryOptions]);

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
      toast.error("Please enter a category for this menu item");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const matchedCategory = outletCategories.find(
      (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase(),
    );
    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      onlineDisplayName: (onlineDisplayName || name).trim(),
      category: category.trim(),
      categoryId: matchedCategory?.id || item?.categoryId,
      itemType,
      price: numPrice,
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
    };

    if (item) {
      updateMutation.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: () => {
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
          {/* 1. Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Butter Chicken Boneless Gravy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Code / SKU */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Item Code / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. FD-104"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 font-mono focus:border-teal-500 focus:outline-hidden uppercase"
                required
              />
            </div>

            {/* Online Display Name */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Online Display Name (Direct QR Menu)
              </label>
              <input
                type="text"
                placeholder="Name shown on Direct QR digital menu..."
                value={onlineDisplayName}
                onChange={(e) => setOnlineDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Category — from outlet Category manager; also free-type if needed */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              {categoryOptions.length > 0 ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
                >
                  {!categoryOptions.includes(category) && category ? (
                    <option value={category}>{category}</option>
                  ) : null}
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Add a category first (Category button), or type one"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                />
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                Manage categories via the Category button. Once items use a category, it shows on
                Billing filters.
              </p>
            </div>
          </div>

          {/* 2. Type, Price, Tax, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
            {/* Item Type (Veg / Non-Veg / Egg) */}
            <div className="md:col-span-4">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Food Type
              </label>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1">
                {(["Veg", "Non-Veg", "Egg"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemType(type)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-1.5 py-1.5 text-[11.5px] font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                      itemType === type
                        ? type === "Veg"
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : type === "Non-Veg"
                            ? "bg-red-500 text-white shadow-2xs"
                            : "bg-amber-500 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        type === "Veg"
                          ? "bg-emerald-300"
                          : type === "Non-Veg"
                            ? "bg-red-300"
                            : "bg-amber-300"
                      }`}
                    />
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Price */}
            <div className="md:col-span-3">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[13px] font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-1.5 text-[13px] font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Tax Rate */}
            <div className="md:col-span-3">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Tax Rate (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer"
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% GST (Standard Food)</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Liquor & Beverage)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            {/* Single Status toggle — Active = Billing + printed menu; Inactive stays in list only */}
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Status
              </label>
              <div className="flex items-center gap-1.5 h-[34px] px-2 bg-white rounded-lg border border-slate-300">
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
                  className={`text-[11px] font-bold whitespace-nowrap ${
                    status === "Active" ? "text-teal-700" : "text-slate-400"
                  }`}
                >
                  {status === "Active" ? "Active" : "Inactive"}
                </span>
              </div>
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
                className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-teal-50/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500 mx-auto mb-2">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-[13px] font-bold text-slate-700">No images uploaded yet</div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">
                  Click or drag and drop JPG, PNG, or WEBP files up to 5MB.
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
              </div>
            )}
          </div>
    </PosCreatePanel>
  );
}
