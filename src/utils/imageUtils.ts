/**
 * Utility to process, compress and convert image files to persistent Base64 Data URLs.
 * Storing images as Base64 Data URLs directly in the database ensures:
 * 1. The image is permanently saved with the menu item details in the database.
 * 2. It never expires or gets removed across browser sessions, page reloads, or devices
 *    (unlike temporary blob: URLs which are revoked when a session ends).
 * 3. Smart canvas compression downsizes large camera/phone uploads (e.g. 5MB)
 *    to a fast, crisp ~50-150KB image (max 1200x1200px, 82% quality) to keep
 *    database records and API payloads lightweight and performant.
 */
export async function fileToDataUrl(
  file: File,
  maxDimension = 1200,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve) => {
    // If not a standard bitmap image or is SVG, fallback to standard FileReader
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
