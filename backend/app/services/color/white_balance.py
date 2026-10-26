"""Illumination correction before measuring skin.

Warm bulbs or a yellow wall can shift a measured skin tone by a whole season.
We estimate the light color and divide it out (von Kries scaling):

1. Preferred: the sclera (eye whites) is close to neutral on everyone, so its
   average color is a direct reading of the illuminant.
2. Fallback: shades-of-gray (Minkowski p-norm) over the whole image, applied at
   partial strength because large colored backgrounds bias it.
"""
from dataclasses import dataclass

import numpy as np

MAX_GAIN = 1.35  # never correct more than this per channel


@dataclass
class WhiteBalanceResult:
    image: np.ndarray       # corrected uint8 BGR
    method: str             # sclera | shades-of-gray | none
    cast_strength: float    # 0 = neutral light, ~0.2+ = strong color cast


def _gains_from_illuminant(illuminant_bgr: np.ndarray) -> np.ndarray:
    illuminant = np.maximum(illuminant_bgr.astype(np.float64), 1e-3)
    gains = illuminant.mean() / illuminant
    return np.clip(gains, 1 / MAX_GAIN, MAX_GAIN)


def _apply(image_bgr: np.ndarray, gains: np.ndarray, strength: float) -> np.ndarray:
    gains = 1 + (gains - 1) * strength
    return np.clip(image_bgr.astype(np.float32) * gains.astype(np.float32), 0, 255).astype(np.uint8)


def _cast(illuminant_bgr: np.ndarray) -> float:
    chroma = illuminant_bgr / max(float(illuminant_bgr.sum()), 1e-6)
    return float(np.abs(chroma - 1 / 3).sum())


def shades_of_gray_illuminant(image_bgr: np.ndarray, p: int = 6) -> np.ndarray:
    pixels = image_bgr.reshape(-1, 3).astype(np.float64)
    usable = pixels[(pixels.max(axis=1) < 250) & (pixels.min(axis=1) > 5)]  # drop clipped pixels
    if len(usable) < 100:
        usable = pixels
    return np.power(np.mean(np.power(usable, p), axis=0), 1 / p)


def sclera_illuminant(image_bgr: np.ndarray, sclera_mask: np.ndarray) -> np.ndarray | None:
    """Mean of the brightest, least saturated pixels inside the eye whites."""
    pixels = image_bgr[sclera_mask > 0].astype(np.float64)
    if len(pixels) < 30:
        return None
    brightness = pixels.mean(axis=1)
    spread = pixels.max(axis=1) - pixels.min(axis=1)
    candidates = pixels[(brightness >= np.percentile(brightness, 50)) & (spread <= np.percentile(spread, 60))]
    if len(candidates) < 15 or candidates.mean() < 90:  # too dark/small to trust
        return None
    return candidates.mean(axis=0)


def correct_white_balance(image_bgr: np.ndarray, sclera_mask: np.ndarray | None = None) -> WhiteBalanceResult:
    if sclera_mask is not None:
        illuminant = sclera_illuminant(image_bgr, sclera_mask)
        if illuminant is not None:
            return WhiteBalanceResult(_apply(image_bgr, _gains_from_illuminant(illuminant), 0.85), "sclera",
                                      _cast(illuminant))
    illuminant = shades_of_gray_illuminant(image_bgr)
    cast = _cast(illuminant)
    if cast < 0.03:
        return WhiteBalanceResult(image_bgr, "none", cast)
    return WhiteBalanceResult(_apply(image_bgr, _gains_from_illuminant(illuminant), 0.5), "shades-of-gray", cast)
