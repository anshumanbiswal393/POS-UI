import { useState, useRef } from "react";
import { Lightbulb, Play, Upload, Image as ImageIcon, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export function MultiItemImagesUploadView() {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [selectedModule, setSelectedModule] = useState<"Item" | "Category" | "Addons">("Item");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "POS Counter",
    "Direct QR Menu",
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p],
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} images queued for matching`);
    }
  };

  const handleReset = () => {
    setSelectedModule("Item");
    setSelectedPlatforms(["POS Counter", "Direct QR Menu"]);
    setUploadedFiles([]);
    setActiveStep(1);
    toast.info("Image upload form reset");
  };

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please select at least one image to upload");
      return;
    }
    setActiveStep(2);
    toast.success(`Matched ${uploadedFiles.length} images to menu items! Ready for review.`);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} images queued for matching`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. "How It Works" Banner from Petpooja Screenshot 2 */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <Lightbulb className="h-4 w-4" />
            </span>
            How It Works
          </div>
          <ul className="space-y-2 text-[13px] text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-teal-800 shrink-0">• Choose</span>
              <span>
                - Rename your image files to match menu item names for bulk uploads. Then, select
                your platforms, choose the images from your computer, and submit them.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-teal-800 shrink-0">• Process</span>
              <span>
                - The system will automatically match images to items based on file names,
                streamlining the process.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-teal-800 shrink-0">• Review</span>
              <span>
                - Review all matches to ensure accuracy. For any unmatched or similarly named items,
                just select and upload them manually.
              </span>
            </li>
          </ul>
        </div>

        {/* Video Tutorial Preview Thumbnail */}
        <div className="relative w-full md:w-64 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md group cursor-pointer shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-11 w-11 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center text-teal-600 shadow-lg group-hover:scale-110 transition duration-150">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono text-white">
            3:45
          </div>
          <div className="absolute bottom-2 left-2 text-[11px] font-medium text-white">
            Bulk Upload Tutorial
          </div>
        </div>
      </div>

      {/* 2. Stepper Indicator from Petpooja Screenshot 2 */}
      <div className="flex items-center justify-center gap-3 py-2">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-2 text-[13px] font-semibold cursor-pointer ${
            activeStep === 1 ? "text-red-600" : "text-slate-500"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
              activeStep === 1 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            1
          </span>
          Select Platform and Add Images
        </button>
        <div className="h-[2px] w-12 bg-slate-300" />
        <button
          type="button"
          onClick={() => uploadedFiles.length > 0 && setActiveStep(2)}
          className={`flex items-center gap-2 text-[13px] font-semibold ${
            activeStep === 2 ? "text-red-600" : "text-slate-400"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
              activeStep === 2 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            2
          </span>
          Review and Confirm to Upload
        </button>
      </div>

      {/* 3. Main Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {activeStep === 1 ? (
          <>
            {/* Module Radio Selector */}
            <div className="flex flex-wrap items-center gap-6 border-b border-slate-100 pb-5">
              <span className="text-[13.5px] font-bold text-slate-800 min-w-[70px]">Module</span>
              {(["Item", "Category", "Addons"] as const).map((mod) => (
                <label
                  key={mod}
                  className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-700 font-medium"
                >
                  <input
                    type="radio"
                    name="module"
                    value={mod}
                    checked={selectedModule === mod}
                    onChange={() => setSelectedModule(mod)}
                    className="h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  {mod}
                </label>
              ))}
            </div>

            {/* Target Platforms */}
            <div className="flex flex-wrap items-center gap-6 border-b border-slate-100 pb-5">
              <span className="text-[13.5px] font-bold text-slate-800 min-w-[70px]">Platforms</span>
              {["POS Counter", "Direct QR Menu"].map((plat) => (
                <label
                  key={plat}
                  className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-700 font-medium"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(plat)}
                    onChange={() => togglePlatform(plat)}
                    className="h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  {plat}
                </label>
              ))}
            </div>

            {/* File Upload Drag & Drop Area */}
            <div>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20"
                    : "border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 mx-auto mb-3 border border-teal-200">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-[14px] font-bold text-slate-800">
                  {isDragging ? "Drop your images now!" : "Click to select images or drag and drop files here"}
                </h4>
                <p className="text-[12px] text-slate-500 mt-1 max-w-md mx-auto">
                  Images will be matched automatically by filename to menu items (e.g.{" "}
                  <span className="font-mono text-slate-700">butter_chicken.jpg</span> matches
                  "Butter Chicken").
                </p>
                <span className="inline-block mt-3 rounded-full bg-slate-100 px-3 py-1 text-[11.5px] font-medium text-slate-600">
                  JPG, PNG, WEBP up to 5MB each
                </span>
              </div>
            </div>

            {/* File Preview list if any */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-slate-800">
                  Selected Images ({uploadedFiles.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border border-slate-200 bg-slate-50 p-2 text-center"
                    >
                      <ImageIcon className="h-8 w-8 text-teal-600 mx-auto mb-1" />
                      <div className="truncate text-[11px] font-medium text-slate-800">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles((f) => f.filter((_, i) => i !== idx));
                        }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Step 2: Review and Confirm */
          <div className="space-y-4">
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
              <div>
                <div className="text-[13px] font-bold text-teal-900">
                  {uploadedFiles.length} Images matched successfully
                </div>
                <div className="text-[12px] text-teal-700">
                  Ready to deploy to {selectedPlatforms.join(", ")}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="h-4 w-4 text-teal-600" />
                    <span className="font-medium text-slate-800">{file.name}</span>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
                    Matched
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions: Reset & Submit from Petpooja Screenshot 2 */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-teal-600 px-6 py-2 text-[13px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            {activeStep === 1 ? "Submit" : "Confirm & Deploy Images"}
          </button>
        </div>
      </div>
    </div>
  );
}
