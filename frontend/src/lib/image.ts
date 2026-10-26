/** Longest side sent for color analysis; the backend downsizes beyond this anyway. */
export const MAX_UPLOAD_SIDE = 1280;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export class ImageInputError extends Error {}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageInputError("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageInputError("That file doesn't look like a photo."));
    img.src = src;
  });
}

/** Scale (width, height) so the longest side is at most maxSide. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Validate a photo and return a JPEG data URL no larger than MAX_UPLOAD_SIDE.
 * Phone photos are often 4000px+ and 5-10 MB; shrinking first makes uploads
 * fast and keeps them under the server's request limit.
 */
export async function prepareImageForUpload(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageInputError("Please choose a JPEG, PNG or WebP photo.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageInputError("That photo is over 15 MB. Please choose a smaller one.");
  }
  return downscaleDataUrl(await readAsDataUrl(file));
}

/** Downscale an existing data URL (e.g. a webcam capture). */
export async function downscaleDataUrl(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_UPLOAD_SIDE);
  if (width === img.naturalWidth && height === img.naturalHeight && dataUrl.startsWith("data:image/jpeg")) {
    return dataUrl;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
