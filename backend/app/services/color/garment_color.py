"""Dominant garment color from a product photo.

Store titles often omit the color ("Embroidered Straight Kurta"), so we
measure it from the thumbnail:

1. Downscale and focus on the central torso area, where the garment usually is.
2. Remove the studio background: pixels close (ΔE2000) to the border color,
   plus near-white/near-grey backdrop.
3. Remove skin (models wear the clothes) unless that would remove most of the
   garment, which happens for beige/peach items.
4. k-means in CIELAB; the largest cluster is the garment color, named with the
   closest retail color.
"""
from dataclasses import dataclass

import cv2
import numpy as np

from app.services.color.color_names import nearest_color_name
from app.services.color.color_science import bgr_image_to_lab, delta_e_2000, lab_to_lch, lab_to_rgb, rgb_to_hex

WORK_SIDE = 160

# Vertical band (top, bottom) of a typical model/product shot where each kind of garment sits.
GARMENT_BANDS = {
    "top": (0.18, 0.55),
    "bottom": (0.50, 0.92),
    "full": (0.18, 0.80),
}
TOP_CATEGORIES = {"shirt", "t-shirt", "top", "blouse", "polo", "kurta", "kurti", "jacket", "blazer", "hoodie",
                  "sweatshirt", "sweater", "cardigan", "coat"}
BOTTOM_CATEGORIES = {"jeans", "trousers", "pants", "chinos", "joggers", "shorts", "skirt"}


def band_for_category(category: str | None) -> str:
    if category in TOP_CATEGORIES:
        return "top"
    if category in BOTTOM_CATEGORIES:
        return "bottom"
    return "full"


@dataclass(frozen=True)
class GarmentColor:
    name: str
    hex: str
    lab: tuple[float, float, float]
    coverage: float  # share of garment pixels in the winning cluster


def _skin_mask(lab: np.ndarray, image_bgr: np.ndarray) -> np.ndarray:
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)
    cr, cb = ycrcb[..., 1].astype(np.int16), ycrcb[..., 2].astype(np.int16)
    lch = lab_to_lch(lab)
    return ((cr > 135) & (cr < 175) & (cb > 85) & (cb < 130)
            & (lch[..., 2] > 25) & (lch[..., 2] < 75) & (lch[..., 1] > 10) & (lch[..., 1] < 45))


def dominant_garment_color(image_bytes: bytes, category: str | None = None) -> GarmentColor | None:
    image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        return None
    height, width = image.shape[:2]
    scale = WORK_SIDE / max(height, width)
    image = cv2.resize(image, (max(1, int(width * scale)), max(1, int(height * scale))), interpolation=cv2.INTER_AREA)
    height, width = image.shape[:2]
    lab = bgr_image_to_lab(image)

    # Background reference from the outer frame.
    border = max(2, int(min(height, width) * 0.06))
    frame = np.concatenate([lab[:border].reshape(-1, 3), lab[-border:].reshape(-1, 3),
                            lab[:, :border].reshape(-1, 3), lab[:, -border:].reshape(-1, 3)])
    background_lab = np.median(frame, axis=0)
    lch = lab_to_lch(lab)
    background = (delta_e_2000(lab, background_lab) < 10) | ((lch[..., 0] > 93) & (lch[..., 1] < 6))

    # Focus on where this kind of garment sits, weighting the center of that band most.
    top, bottom = GARMENT_BANDS[band_for_category(category)]
    focus = np.zeros((height, width), dtype=bool)
    focus[int(height * top):int(height * bottom), int(width * 0.2):int(width * 0.8)] = True
    ys, xs = np.mgrid[0:height, 0:width]
    cy, cx = height * (top + bottom) / 2, width / 2
    weight_map = np.exp(-(((ys - cy) / (height * (bottom - top) * 0.6)) ** 2 + ((xs - cx) / (width * 0.3)) ** 2))

    garment = focus & ~background
    without_skin = garment & ~_skin_mask(lab, image)
    if without_skin.sum() > 0.35 * garment.sum():
        garment = without_skin
    pixels = lab[garment].reshape(-1, 3).astype(np.float32)
    weights = weight_map[garment].ravel()
    if len(pixels) < 0.04 * height * width:
        return None

    k = min(4, max(1, len(pixels) // 50))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 25, 0.5)
    _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 2, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), weights=weights, minlength=k)
    winner = int(counts.argmax())
    center = centers[winner].astype(np.float64)
    name, _ = nearest_color_name(center)
    return GarmentColor(
        name=name,
        hex=rgb_to_hex(lab_to_rgb(center)),
        lab=tuple(round(float(v), 2) for v in center),
        coverage=round(float(counts[winner] / counts.sum()), 2),
    )
