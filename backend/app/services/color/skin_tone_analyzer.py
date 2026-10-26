"""Personal color analysis from a single photo.

Pipeline
    1. Locate the face (468+10 landmarks, or a box as fallback).
    2. Correct white balance using the eye whites as a neutral reference.
    3. Build a dense skin mask (face oval minus eyes, brows, lips, nostrils).
    4. Clean the pixels: drop shadows/highlights and non-skin hues, then take
       the dominant k-means cluster in CIELAB.
    5. Measure: ITA° (depth), hue angle (undertone), chroma, and contrast
       against brows (hair proxy) and irises.
    6. Score all 12 seasons on three axes (warmth, depth, clarity) and report
       the best match, alternatives and a confidence that accounts for photo
       quality.

This is an estimate from pixels, not a calibrated measurement; the response
says so and lists anything about the photo that reduced confidence.
"""
import math
from dataclasses import dataclass

import cv2
import numpy as np

from app.core.errors import InvalidInputError
from app.services.color.color_science import (
    bgr_image_to_lab,
    individual_typology_angle,
    ita_category,
    lab_to_lch,
    lab_to_rgb,
    rgb_to_hex,
)
from app.services.color.face_landmarks import (
    FACE_OVAL,
    LEFT_BROW,
    LEFT_EYE,
    LEFT_IRIS,
    LIPS,
    NOSTRILS,
    RIGHT_BROW,
    RIGHT_EYE,
    RIGHT_IRIS,
    FaceGeometry,
    FaceLocator,
    polygon_mask,
    region_mask,
)
from app.services.color.seasonal_palettes import SEASONS, Season
from app.services.color.white_balance import correct_white_balance

# Calibration constants (CIELAB). Typical skin hue angles fall between ~45° (pink/red)
# and ~70° (golden); the midpoint separates cool from warm undertones.
HUE_NEUTRAL = 57.0
HUE_SPAN = 7.0
ITA_MID = 28.0       # boundary between "light" and "deep" value
ITA_SPAN = 25.0
CONTRAST_MID = 42.0  # ΔL* between skin and brows/eyes
CONTRAST_SPAN = 18.0
CHROMA_MID = 26.0
CHROMA_SPAN = 10.0

FAMILY_WEIGHTS = {  # (warmth, depth->light, clarity)
    "Spring": (1.0, 0.7, 0.5),
    "Summer": (-1.0, 0.7, -0.5),
    "Autumn": (1.0, -0.7, -0.5),
    "Winter": (-1.0, -0.7, 0.5),
}
DOMINANT_AXIS = {"warm": (0, 1), "cool": (0, -1), "light": (1, 1), "deep": (1, -1), "bright": (2, 1), "soft": (2, -1)}


@dataclass
class _Measurement:
    lab: np.ndarray
    pixel_count: int


def _clip_unit(value: float) -> float:
    return float(max(-1.0, min(1.0, value)))


def _hex(lab) -> str:
    return rgb_to_hex(lab_to_rgb(np.asarray(lab, dtype=np.float64)))


def _iris_mask(shape, landmarks: np.ndarray, iris: tuple[int, int, int]) -> np.ndarray:
    center = landmarks[iris[0]]
    radius = max(2.0, float(np.linalg.norm(landmarks[iris[1]] - landmarks[iris[2]])) / 2)
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.circle(mask, (int(center[0]), int(center[1])), int(radius * 0.85), 255, -1)
    return mask


def _masks(face: FaceGeometry, shape: tuple[int, int]) -> dict[str, np.ndarray | None]:
    if face.landmarks is None:
        x, y, w, h = face.box
        skin = np.zeros(shape, dtype=np.uint8)
        cv2.ellipse(skin, (x + w // 2, y + int(h * 0.62)), (int(w * 0.32), int(h * 0.16)), 0, 0, 360, 255, -1)
        cv2.rectangle(skin, (x + int(w * 0.3), y + int(h * 0.12)), (x + int(w * 0.7), y + int(h * 0.27)), 255, -1)
        return {"skin": skin, "sclera": None, "iris": None, "brows": None}

    lm = face.landmarks
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    exclude = np.zeros(shape, dtype=np.uint8)
    for region in (LEFT_EYE, RIGHT_EYE, LEFT_BROW, RIGHT_BROW, LIPS, NOSTRILS):
        exclude |= region_mask(shape, lm, region)
    exclude = cv2.dilate(exclude, kernel, iterations=2)
    skin = cv2.erode(polygon_mask(shape, lm[FACE_OVAL]), kernel) & ~exclude

    iris = _iris_mask(shape, lm, LEFT_IRIS) | _iris_mask(shape, lm, RIGHT_IRIS)
    eyes = region_mask(shape, lm, LEFT_EYE) | region_mask(shape, lm, RIGHT_EYE)
    sclera = eyes & ~cv2.dilate(iris, kernel)
    brows = region_mask(shape, lm, LEFT_BROW) | region_mask(shape, lm, RIGHT_BROW)
    return {"skin": skin, "sclera": sclera, "iris": iris & eyes, "brows": brows}


def _measure_skin(lab_image: np.ndarray, mask: np.ndarray) -> _Measurement:
    pixels = lab_image[mask > 0].reshape(-1, 3)
    if len(pixels) < 150:
        raise InvalidInputError("We couldn't see enough skin. Use a front-facing photo without heavy shadows.",
                                code="not_enough_skin")
    lch = lab_to_lch(pixels)
    low, high = np.percentile(pixels[:, 0], [8, 97])
    keep = (pixels[:, 0] >= low) & (pixels[:, 0] <= high)     # shadows and specular highlights
    keep &= (lch[:, 1] > 4) & (lch[:, 1] < 60)                # grey/background and lipstick-like chroma
    keep &= (lch[:, 2] > 15) & (lch[:, 2] < 100)              # plausible skin hues
    pixels = pixels[keep]
    if len(pixels) < 100:
        raise InvalidInputError("The lighting makes skin hard to read. Try soft daylight facing a window.",
                                code="not_enough_skin")

    sample = pixels[np.random.default_rng(7).choice(len(pixels), size=min(len(pixels), 5000), replace=False)]
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    k = 3 if len(sample) >= 300 else 1
    _, labels, centers = cv2.kmeans(sample.astype(np.float32), k, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    dominant = int(np.bincount(labels.ravel()).argmax())
    cluster = sample[labels.ravel() == dominant]
    return _Measurement(lab=np.median(cluster, axis=0), pixel_count=int(len(pixels)))


def _measure_feature(lab_image: np.ndarray, mask: np.ndarray | None, darkest_fraction: float) -> np.ndarray | None:
    if mask is None:
        return None
    pixels = lab_image[mask > 0].reshape(-1, 3)
    if len(pixels) < 12:
        return None
    lightness = pixels[:, 0]
    # Skip pupils/lash shadow (darkest 5%) and reflections, keep the core of the feature.
    keep = (lightness > np.percentile(lightness, 5)) & (lightness <= np.percentile(lightness, darkest_fraction * 100))
    chosen = pixels[keep]
    return np.median(chosen, axis=0) if len(chosen) else None


def _quality(image_bgr: np.ndarray, face: FaceGeometry, face_count: int, cast: float) -> tuple[float, list[str]]:
    height, width = image_bgr.shape[:2]
    x, y, w, h = face.box
    crop = cv2.cvtColor(image_bgr[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY)
    issues = []
    if (w * h) / float(width * height) < 0.025:
        issues.append("Your face is small in the frame; move closer for more detail.")
    if crop.size and cv2.Laplacian(cv2.resize(crop, (256, 256)), cv2.CV_64F).var() < 40:
        issues.append("The photo looks blurry.")
    if crop.size and (crop < 25).mean() > 0.25:
        issues.append("The face is underexposed.")
    if crop.size and (crop > 245).mean() > 0.12:
        issues.append("Strong highlights on the face; avoid direct flash.")
    if cast > 0.12:
        issues.append("Colored lighting detected; natural daylight gives the most accurate result.")
    if face_count > 1:
        issues.append("More than one face found; we analyzed the largest.")
    if face.landmarks is None:
        issues.append("Detailed face mapping was unavailable, so this is a coarser reading.")
    return max(0.35, 1.0 - 0.15 * len(issues)), issues


def _season_scores(axes: tuple[float, float, float]) -> dict[str, float]:
    scores = {}
    for season in SEASONS.values():
        weights = FAMILY_WEIGHTS[season.family]
        family_score = sum(w * a for w, a in zip(weights, axes, strict=True))
        axis, sign = DOMINANT_AXIS[season.dominant]
        scores[season.name] = family_score + 0.6 * sign * axes[axis]
    return scores


def _season_payload(season: Season) -> dict:
    def swatches(items):
        return [{"name": s.name, "hex": s.hex} for s in items]

    return {
        "name": season.name,
        "family": season.family,
        "dominant": season.dominant,
        "tagline": season.tagline,
        "description": season.description,
        "palette": {
            "signature": swatches(season.signature),
            "neutrals": swatches(season.neutrals),
            "accents": swatches(season.accents),
            "avoid": swatches(season.avoid),
            "metals": list(season.metals),
        },
        "style_notes": list(season.style_notes),
    }


def _undertone(hue: float) -> str:
    if hue >= HUE_NEUTRAL + 2.5:
        return "Warm"
    if hue <= HUE_NEUTRAL - 2.5:
        return "Cool"
    return "Neutral"


def _contrast_label(value: float) -> str:
    return "High" if value >= 45 else "Medium" if value >= 28 else "Low"


class SkinToneAnalyzer:
    def __init__(self, locator: FaceLocator):
        self.locator = locator

    @property
    def detector(self) -> str:
        return self.locator.detector

    def close(self) -> None:
        self.locator.close()

    def analyze(self, image_bgr: np.ndarray) -> dict:
        faces = self.locator.locate(image_bgr)
        if not faces:
            raise InvalidInputError("No face found. Use a clear, front-facing photo in good light.", code="no_face")
        face = faces[0]
        shape = image_bgr.shape[:2]
        masks = _masks(face, shape)

        balanced = correct_white_balance(image_bgr, masks["sclera"])
        lab_image = bgr_image_to_lab(balanced.image)
        skin = _measure_skin(lab_image, masks["skin"])
        brows = _measure_feature(lab_image, masks["brows"], darkest_fraction=0.5)
        iris = _measure_feature(lab_image, masks["iris"], darkest_fraction=0.85)

        L, chroma, hue = (float(v) for v in lab_to_lch(skin.lab))
        ita = individual_typology_angle(skin.lab)
        contrasts = [abs(L - float(f[0])) for f in (brows, iris) if f is not None]
        contrast = max(contrasts) if contrasts else CONTRAST_MID

        warmth = _clip_unit((hue - HUE_NEUTRAL) / HUE_SPAN)
        lightness = _clip_unit((ita - ITA_MID) / ITA_SPAN)
        clarity = _clip_unit(0.6 * (contrast - CONTRAST_MID) / CONTRAST_SPAN
                             + 0.4 * (chroma - CHROMA_MID) / CHROMA_SPAN)
        scores = _season_scores((warmth, lightness, clarity))
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)

        # Softmax over the 12 seasons, then discounted by photo quality.
        exp = {name: math.exp(score / 0.35) for name, score in ranked}
        total = sum(exp.values())
        quality_score, issues = _quality(image_bgr, face, len(faces), balanced.cast_strength)
        best = SEASONS[ranked[0][0]]
        confidence = round((exp[best.name] / total) ** 0.5 * quality_score, 2)

        to_pct = lambda v: int(round((v + 1) * 50))  # noqa: E731
        return {
            "season": {**_season_payload(best), "confidence": confidence},
            "alternatives": [
                {"name": name, "family": SEASONS[name].family, "likelihood": round(exp[name] / total, 2)}
                for name, _ in ranked[1:3]
            ],
            "skin": {
                "hex": _hex(skin.lab),
                "lab": [round(float(v), 2) for v in skin.lab],
                "ita": round(ita, 1),
                "depth": ita_category(ita),
                "undertone": _undertone(hue),
                "hue_angle": round(hue, 1),
                "chroma": round(chroma, 1),
                "pixels_measured": skin.pixel_count,
            },
            "features": {
                "eyes_hex": _hex(iris) if iris is not None else None,
                "brows_hex": _hex(brows) if brows is not None else None,
                "contrast": _contrast_label(contrast),
                "contrast_value": round(contrast, 1),
            },
            "axes": {"warmth": to_pct(warmth), "lightness": to_pct(lightness), "clarity": to_pct(clarity)},
            "quality": {
                "score": round(quality_score, 2),
                "issues": issues,
                "white_balance": balanced.method,
                "detector": face.detector,
                "faces_found": len(faces),
            },
            "face_box": list(face.box),
            "disclaimer": "An estimate from photo pixels. Lighting, filters and makeup can shift the result.",
        }
