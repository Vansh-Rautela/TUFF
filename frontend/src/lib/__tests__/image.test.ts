import { describe, expect, it } from "vitest";
import { ImageInputError, MAX_UPLOAD_SIDE, fitWithin, prepareImageForUpload } from "../image";

describe("fitWithin", () => {
  it("leaves small images alone", () => {
    expect(fitWithin(800, 600, MAX_UPLOAD_SIDE)).toEqual({ width: 800, height: 600 });
  });

  it("scales the longest side down and keeps the aspect ratio", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });
});

describe("prepareImageForUpload", () => {
  it("rejects non-image files", async () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    await expect(prepareImageForUpload(file)).rejects.toBeInstanceOf(ImageInputError);
  });

  it("rejects very large files before reading them", async () => {
    const file = new File([new Uint8Array(16 * 1024 * 1024)], "huge.jpg", { type: "image/jpeg" });
    await expect(prepareImageForUpload(file)).rejects.toThrow(/over 15 MB/);
  });
});
