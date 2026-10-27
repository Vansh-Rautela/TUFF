"""Garment colour harmony in CIELAB / LCh.

Grounded in two findings rather than colour-wheel folklore:
  * Henry & Westland (AIC 2007): hues opposite each other in CIELAB are *not*
    reliably seen as complementary, so hue-opposition gets a cautious score.
  * Compatibility studies on real outfits (e.g. arXiv:1905.03703) find that
    well-rated outfits lean on neutrals or on colours close to the hero piece.

Pairs are therefore ranked: neutral pairing > analogous / tonal-with-contrast >
muted complement > bold complement > unrelated saturated hues.
"""
from dataclasses import dataclass

import numpy as np

from app.services.color.color_science import delta_e_2000, hex_to_rgb, lab_to_lch, rgb_to_lab

NEUTRAL_CHROMA = 12.0  # C*ab below this reads as grey/black/white


def is_fashion_neutral(L: float, C: float, h: float) -> bool:
    """Neutrals as dressing treats them: greys, plus low-chroma earth tones (cream, beige,
    khaki, taupe, brown) and dark low-chroma blues (navy, denim, charcoal)."""
    if C < NEUTRAL_CHROMA:
        return True
    if 40 <= h <= 110 and C < 25:
        return True
    return 230 <= h <= 300 and C < 26 and L < 50


@dataclass(frozen=True)
class Harmony:
    kind: str          # neutral | tonal | analogous | complementary | contrasting | clash
    score: float       # 0-1
    explanation: str


def hex_to_lab(hex_color: str) -> np.ndarray:
    return rgb_to_lab(np.array(hex_to_rgb(hex_color), dtype=np.float64))


def _hue_difference(h1: float, h2: float) -> float:
    diff = abs(h1 - h2) % 360
    return 360 - diff if diff > 180 else diff


def pair_harmony(lab_a, lab_b) -> Harmony:
    (L1, C1, h1), (L2, C2, h2) = lab_to_lch(np.asarray(lab_a)), lab_to_lch(np.asarray(lab_b))
    value_contrast = abs(float(L1) - float(L2))
    distance = float(delta_e_2000(lab_a, lab_b))

    if is_fashion_neutral(float(L1), float(C1), float(h1)) or is_fashion_neutral(float(L2), float(C2), float(h2)):
        score = 0.9 if value_contrast >= 20 else 0.8
        return Harmony("neutral", score, "A neutral anchors the colour — the safest, most polished pairing.")

    dh = _hue_difference(float(h1), float(h2))
    if dh <= 15:
        if distance < 8:
            return Harmony("tonal", 0.55, "Nearly the same shade — vary the texture or it reads as a uniform.")
        if value_contrast >= 15:
            return Harmony("tonal", 0.85, "Tone-on-tone with light-dark contrast: quietly expensive.")
        return Harmony("tonal", 0.7, "Same colour family; a deeper or lighter shade would sharpen it.")
    if dh <= 50:
        return Harmony("analogous", 0.8, "Neighbouring hues blend naturally and look considered.")
    if 150 <= dh <= 210:
        if min(C1, C2) < 25:
            return Harmony("complementary", 0.7, "A muted complement: contrast without shouting.")
        return Harmony("complementary", 0.5, "Opposite hues at full strength — bold; keep everything else simple.")
    if C1 > 45 and C2 > 45:
        return Harmony("clash", 0.25, "Two strong, unrelated colours compete for attention.")
    return Harmony("contrasting", 0.45, "An unexpected pairing; works best if one piece is small.")


def harmony_for_hex(hex_a: str, hex_b: str) -> Harmony:
    return pair_harmony(hex_to_lab(hex_a), hex_to_lab(hex_b))
