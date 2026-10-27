import { useState, type ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const FALLBACK = "/product-placeholder.svg";

/** Store photo with lazy loading, a fade-in, and a single fallback (no error loops). */
export function ProductImage({ src, alt, className, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...props}
      src={src && !failed ? src : FALLBACK}
      alt={alt}
      loading={props.loading ?? "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn("transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
    />
  );
}
