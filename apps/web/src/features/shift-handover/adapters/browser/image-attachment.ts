import type { ImageAttachment } from "../../domain/models";
/** Normalize selected raster files into small revision-owned images. */
export async function prepareImage(file: File): Promise<ImageAttachment> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("Choose a PNG, JPEG or WebP image up to 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("This image could not be read.");
    const canvas = document.createElement("canvas");
    for (const width of [1200, 900, 600, 400, 240]) {
      const scale = Math.min(
        1,
        width / Math.max(image.naturalWidth, image.naturalHeight),
      );
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This image could not be read.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      if (dataUrl.length <= 65536)
        return { name: file.name.slice(0, 160), dataUrl };
    }
    throw new Error("This image is too detailed. Choose a smaller image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
