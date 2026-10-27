import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, ImageUp, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PhotoError, dataUrlToBlob, preparePhoto, validatePhoto } from "@/lib/image";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  onPhoto: (photo: Blob, previewUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Upload or take a portrait; returns a downscaled JPEG. */
export function PhotoCapture({ onPhoto, disabled, className }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<"choose" | "camera">("choose");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async (source: Blob) => {
    try {
      setError(null);
      const photo = await preparePhoto(source);
      onPhoto(photo, URL.createObjectURL(photo));
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : "Couldn't use that photo.");
    }
  };

  const fromFile = (file: File | undefined) => {
    if (!file) return;
    try {
      validatePhoto(file);
      accept(file);
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : "Couldn't use that photo.");
    }
  };

  if (mode === "camera") {
    return (
      <div className={cn("space-y-5", className)}>
        <div className="relative aspect-[4/5] overflow-hidden bg-noir">
          <Webcam ref={webcamRef} audio={false} mirrored screenshotFormat="image/jpeg" screenshotQuality={0.95}
            videoConstraints={{ facingMode: "user", width: 1280, height: 1600 }}
            onUserMediaError={() => { setError("Camera unavailable. Please upload a photo instead."); setMode("choose"); }}
            className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-[18%_22%] rounded-[50%] border border-ivory/40" />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setMode("choose")} className="flex-1"><RotateCcw />Back</Button>
          <Button className="flex-1" disabled={disabled} onClick={async () => {
            const shot = webcamRef.current?.getScreenshot();
            if (shot) await accept(await dataUrlToBlob(shot));
          }}><Camera />Capture</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); fromFile(e.dataTransfer.files?.[0]); }}
        className={cn(
          "group flex aspect-[4/5] w-full flex-col items-center justify-center border border-dashed bg-porcelain/70 px-8 text-center transition-all duration-500",
          dragging ? "border-champagne bg-champagne-soft/40" : "border-ink/25 hover:border-ink/60",
        )}
      >
        <span className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-ink/20 transition-transform duration-700 ease-couture group-hover:scale-110">
          <ImageUp className="h-6 w-6" strokeWidth={1.2} />
        </span>
        <span className="font-display text-3xl font-light">Upload a portrait</span>
        <span className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
          Face the light, no filters, hair off the face. Drop a photo here or browse.
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { fromFile(e.target.files?.[0]); e.target.value = ""; }} />
      <Button variant="outline" className="w-full" disabled={disabled} onClick={() => setMode("camera")}>
        <Camera />Use camera instead
      </Button>
      {error && <p role="alert" className="text-sm text-bordeaux">{error}</p>}
    </div>
  );
}
