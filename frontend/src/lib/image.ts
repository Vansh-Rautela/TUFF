export const MAX_UPLOAD_SIDE = 1280;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export class PhotoError extends Error {}

export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function validatePhoto(file: File): void {
  if (!ACCEPTED.includes(file.type)) throw new PhotoError("Please choose a JPEG, PNG or WebP photo.");
  if (file.size > MAX_FILE_BYTES) throw new PhotoError("That photo is over 15 MB. Please choose a smaller one.");
}

/** Downscale a photo in the browser to a JPEG Blob (fast uploads; the server would resize anyway). */
export async function preparePhoto(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source).catch(() => {
    throw new PhotoError("That file doesn't look like a photo.");
  });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_UPLOAD_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new PhotoError("Couldn't process that photo."))), "image/jpeg", 0.92),
  );
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
