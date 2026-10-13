import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  RefreshCw,
  Check,
  Plus,
  Link as LinkIcon,
  Globe,
  Eye,
  FileImage,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { MenuItem, MenuItemImage } from "@/types/posMenu";
import {
  useAddItemImages,
  useRemoveItemImage,
  useSetPrimaryImage,
} from "@/hooks/queries/usePosMenu";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/avif"];

export function ItemImageManagerModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}) {
  const addImagesMutation = useAddItemImages();
  const removeImageMutation = useRemoveItemImage();
  const setPrimaryMutation = useSetPrimaryImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!item) return;
      const validFiles: File[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const isImage =
          ALLOWED_EXTENSIONS.includes(file.type) ||
          !!file.name.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i);

        if (!isImage) {
          toast.error(`"${file.name}" is not a supported image format.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        const existingCount = item.images?.length ?? 0;
        const newImages: MenuItemImage[] = await Promise.all(
          validFiles.map(
            (file, idx) =>
              new Promise<MenuItemImage>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const sizeKb = (file.size / 1024).toFixed(0);
                  const formattedSize =
                    file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${sizeKb} KB`;

                  resolve({
                    id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
                    url: String(reader.result || ""),
                    name: file.name,
                    isPrimary: existingCount === 0 && idx === 0,
                    size: formattedSize,
                    type: file.type || "image/jpeg",
                    uploadedAt: "Just now",
                  });
                };
                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsDataURL(file);
              }),
          ),
        );

        addImagesMutation.mutate(
          { itemId: item.id, images: newImages },
          {
            onSuccess: () => {
              toast.success(`Uploaded ${newImages.length} image(s) for ${item.name}`);
              setIsUploading(false);
            },
            onError: () => {
              toast.error("Failed to upload images");
              setIsUploading(false);
            },
          },
        );
      } catch {
        toast.error("Failed to read image file(s)");
        setIsUploading(false);
      }
    },
    [item, addImagesMutation],
  );

  const handleAddImageUrl = (urlToAdd?: string) => {
    const rawUrl = (urlToAdd || imageUrlInput).trim();
    if (!rawUrl || !item) {
      toast.error("Please enter a valid image link/URL");
      return;
    }

    // Check if it's a valid url format or data URI
    const isUrl = /^https?:\/\/.+/i.test(rawUrl) || rawUrl.startsWith("data:image/");
    if (!isUrl) {
      toast.error("Please enter a valid image URL starting with http://, https://, or data:image");
      return;
    }

    setIsUploading(true);

    // Extract a friendly name from URL
    let derivedName = "Online Image";
    try {
      if (rawUrl.startsWith("http")) {
        const parsed = new URL(rawUrl);
        const pathnameParts = parsed.pathname.split("/").filter(Boolean);
        const lastPart = pathnameParts[pathnameParts.length - 1];
        if (lastPart && lastPart.length < 40) {
          derivedName = decodeURIComponent(lastPart);
        } else {
          derivedName = `${parsed.hostname} image`;
        }
      } else {
        derivedName = "Pasted Base64 Image";
      }
    } catch {
      derivedName = "Web Image";
    }

    const newImage: MenuItemImage = {
      id: `url-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: rawUrl,
      name: derivedName,
      isPrimary: (item.images?.length ?? 0) === 0,
      size: "Online Link",
      type: "image/url",
      uploadedAt: "Just now",
    };

    addImagesMutation.mutate(
      { itemId: item.id, images: [newImage] },
      {
        onSuccess: () => {
          toast.success(`Online image added successfully!`);
          setImageUrlInput("");
          setIsUploading(false);
        },
        onError: () => {
          toast.error("Failed to add online image");
          setIsUploading(false);
        },
      },
    );
  };

  // Drag and drop handlers
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
    // Only set to false if leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      return;
    }

    // Check if a URL was dragged from another browser tab / image
    const htmlData = e.dataTransfer.getData("text/html");
    const textData = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");

    if (htmlData) {
      const match = htmlData.match(/src=["'](https?:\/\/[^"']+)["']/i);
      if (match && match[1]) {
        handleAddImageUrl(match[1]);
        return;
      }
    }

    if (textData && (/^https?:\/\/.+/i.test(textData.trim()) || textData.trim().startsWith("data:image/"))) {
      handleAddImageUrl(textData.trim());
    }
  };

  // Clipboard paste listener (Ctrl+V)
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!isOpen || !item) return;

      // Avoid capturing paste when user is typing in standard inputs other than the modal's URL input
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        target.id !== "image-url-input"
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check for image files in clipboard
      const items = clipboardData.items;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        toast.info("Pasting image from clipboard...");
        processFiles(imageFiles);
        return;
      }

      // 2. Check for image URL text in clipboard
      const pastedText = clipboardData.getData("text").trim();
      if (
        /^https?:\/\/.+(\.(jpg|jpeg|png|webp|gif|avif|svg)|\/image|\/img|\?.*image|unsplash\.com|cloudinary\.com|images\.pexels\.com|googleusercontent\.com).*/i.test(
          pastedText,
        ) ||
        pastedText.startsWith("data:image/") ||
        (/^https?:\/\/.+/i.test(pastedText) && activeTab === "url")
      ) {
        e.preventDefault();
        toast.info("Detected image URL in clipboard!");
        handleAddImageUrl(pastedText);
      }
    },
    [isOpen, item, processFiles, activeTab],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen, handlePaste]);

  if (!isOpen || !item) return null;

  const handleSetPrimary = (imageId: string) => {
    setPrimaryMutation.mutate(
      { itemId: item.id, imageId },
      {
        onSuccess: () => {
          toast.success("Primary cover image updated");
        },
      },
    );
  };

  const handleRemove = (imageId: string) => {
    removeImageMutation.mutate(
      { itemId: item.id, imageId },
      {
        onSuccess: () => {
          toast.info("Image removed");
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border transition-all duration-200 overflow-hidden animate-in fade-in zoom-in-95 ${
          isDragging ? "border-teal-500 ring-4 ring-teal-500/20 scale-[1.01]" : "border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Overlay Banner when active */}
        {isDragging && (
          <div className="bg-teal-600 text-white px-4 py-2.5 text-center text-[13px] font-bold flex items-center justify-center gap-2 animate-pulse">
            <Upload className="h-4 w-4" /> Drop image files or web links here to add to {item.name}!
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="h-4.5 w-4.5 text-teal-600" />
              Manage Images: {item.name}
            </h2>
            <p className="text-[12px] text-slate-500">
              Code: <span className="font-mono">{item.code}</span> • Category: {item.category} •{" "}
              Diet: <span className="font-semibold">{item.itemType}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Methods Selector: Upload/Drag OR Online Link */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold border-b-2 transition cursor-pointer ${
                activeTab === "upload"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload & Drag-Drop Files
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold border-b-2 transition cursor-pointer ${
                activeTab === "url"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe className="h-4 w-4" />
              Paste Online Image Link / URL
            </button>
          </div>

          {/* 1. File Upload & Drag & Drop Tab */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-teal-500 bg-teal-50/50"
                    : "border-slate-300 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/20"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shadow-2xs">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-slate-800">
                    Drag & drop dish images here, or{" "}
                    <span className="text-teal-700 hover:underline">browse files</span>
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP, AVIF up to {MAX_FILE_SIZE_MB}MB. You can also press{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                      Ctrl+V
                    </kbd>{" "}
                    to paste any copied image.
                  </div>
                </div>
              </div>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) => {
                  if (e.target.files) processFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          )}

          {/* 2. Online Image URL Input Tab */}
          {activeTab === "url" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="image-url-input"
                  className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-teal-600" />
                  Online Image Web Link (URL)
                </label>
                <span className="text-[11px] text-slate-500">
                  Direct image links from Google, Unsplash, CDN, etc.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="image-url-input"
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="https://example.com/images/dish.jpg or paste image URL"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddImageUrl()}
                  disabled={!imageUrlInput.trim() || isUploading}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-[12.5px] font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Image
                </button>
              </div>

              {/* Quick URL Preview if typed */}
              {imageUrlInput.trim() && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={imageUrlInput.trim()}
                      alt="URL Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/100x100?text=Invalid+URL";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-[11.5px] text-slate-600 truncate">
                    <span className="font-semibold text-slate-800">Preview: </span>
                    {imageUrlInput.trim()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Uploading Status Banner */}
          {isUploading && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 flex items-center gap-2.5 text-[12.5px] font-semibold text-teal-800 animate-in fade-in">
              <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
              Processing and saving image(s)...
            </div>
          )}

          {/* 3. Existing Images List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-teal-600" />
                Uploaded Dish Photos ({item.images?.length ?? 0})
              </span>
              {(item.images?.length ?? 0) > 0 && (
                <span className="text-[11px] font-medium text-slate-500">
                  Select a photo to set as the primary cover.
                </span>
              )}
            </div>

            {(item.images?.length ?? 0) === 0 ? (
              <div className="border border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
                <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <div className="text-[13px] font-bold text-slate-600">No images attached yet</div>
                <div className="text-[11.5px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Upload photos from your computer, paste an online image link, or drop files directly onto this window.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(item.images ?? []).map((img) => (
                  <div
                    key={img.id}
                    className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                      img.isPrimary
                        ? "border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div
                      className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group cursor-pointer"
                      onClick={() => setPreviewingImageUrl(img.url)}
                      title="Click to zoom preview"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-150"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/150x150?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                        <Eye className="h-4 w-4" />
                      </div>
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 rounded bg-teal-600 px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          Cover
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between h-20">
                      <div>
                        <div
                          className="truncate text-[12.5px] font-bold text-slate-800"
                          title={img.name}
                        >
                          {img.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{img.size || "Image"}</span>
                          <span>•</span>
                          <span>{img.uploadedAt || "Uploaded"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        {!img.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition cursor-pointer"
                          >
                            <Star className="h-3 w-3" /> Set Cover
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                            <Check className="h-3 w-3 text-teal-600" /> Primary Cover
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {img.url.startsWith("http") && (
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Open original URL"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemove(img.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between">
          <div className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Tip: Drag files or press <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">Ctrl+V</kbd> anywhere in this dialog
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-[12.5px] font-bold text-white transition cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* Zoom / Full Preview Lightbox Modal */}
      {previewingImageUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewingImageUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewingImageUrl(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewingImageUrl}
              alt="Preview"
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

