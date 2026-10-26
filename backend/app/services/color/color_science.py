"""Color math: sRGB <-> CIELAB, CIEDE2000, LCh, and the Individual Typology Angle.

All functions are vectorized with NumPy and accept arrays of shape (..., 3).
"""
import cv2
import numpy as np


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def rgb_to_hex(rgb) -> str:
    r, g, b = (int(round(float(c))) for c in np.clip(rgb, 0, 255))
    return f"#{r:02X}{g:02X}{b:02X}"


def rgb_to_lab(rgb) -> np.ndarray:
    """sRGB (0-255) -> CIELAB (D65): L in [0, 100], a/b roughly [-128, 127]."""
    arr = np.asarray(rgb, dtype=np.float32).reshape(-1, 1, 3) / 255.0
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2Lab).reshape(-1, 3)
    return lab.reshape(np.asarray(rgb).shape).astype(np.float64)


def lab_to_rgb(lab) -> np.ndarray:
    arr = np.asarray(lab, dtype=np.float32).reshape(-1, 1, 3)
    rgb = cv2.cvtColor(arr, cv2.COLOR_Lab2RGB).reshape(-1, 3) * 255.0
    return np.clip(rgb, 0, 255).reshape(np.asarray(lab).shape)


def bgr_image_to_lab(image_bgr: np.ndarray) -> np.ndarray:
    """uint8 BGR image -> float CIELAB image (true L*a*b*, not OpenCV's 8-bit scaling)."""
    return cv2.cvtColor(image_bgr.astype(np.float32) / 255.0, cv2.COLOR_BGR2Lab)


def lab_to_lch(lab) -> np.ndarray:
    """CIELAB -> (L, C*ab chroma, h hue angle in degrees [0, 360))."""
    lab = np.asarray(lab, dtype=np.float64)
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    hue = np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) % 360
    return np.stack([lab[..., 0], chroma, hue], axis=-1)


def delta_e_2000(lab1, lab2) -> np.ndarray:
    """CIEDE2000 color difference (Sharma, Wu & Dalal 2005). Broadcasts over leading axes."""
    lab1 = np.asarray(lab1, dtype=np.float64)
    lab2 = np.asarray(lab2, dtype=np.float64)
    L1, a1, b1 = lab1[..., 0], lab1[..., 1], lab1[..., 2]
    L2, a2, b2 = lab2[..., 0], lab2[..., 1], lab2[..., 2]

    C1 = np.hypot(a1, b1)
    C2 = np.hypot(a2, b2)
    C_bar7 = ((C1 + C2) / 2) ** 7
    G = 0.5 * (1 - np.sqrt(C_bar7 / (C_bar7 + 25.0**7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360
    h2p = np.degrees(np.arctan2(b2, a2p)) % 360

    dLp = L2 - L1
    dCp = C2p - C1p
    dhp = h2p - h1p
    dhp = np.where(dhp > 180, dhp - 360, dhp)
    dhp = np.where(dhp < -180, dhp + 360, dhp)
    dhp = np.where(C1p * C2p == 0, 0, dhp)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dhp) / 2)

    Lp_bar = (L1 + L2) / 2
    Cp_bar = (C1p + C2p) / 2
    hp_sum = h1p + h2p
    hp_bar = np.where(
        C1p * C2p == 0,
        hp_sum,
        np.where(np.abs(h1p - h2p) <= 180, hp_sum / 2, np.where(hp_sum < 360, (hp_sum + 360) / 2, (hp_sum - 360) / 2)),
    )
    T = (1 - 0.17 * np.cos(np.radians(hp_bar - 30)) + 0.24 * np.cos(np.radians(2 * hp_bar))
         + 0.32 * np.cos(np.radians(3 * hp_bar + 6)) - 0.20 * np.cos(np.radians(4 * hp_bar - 63)))
    d_theta = 30 * np.exp(-(((hp_bar - 275) / 25) ** 2))
    Rc = 2 * np.sqrt(Cp_bar**7 / (Cp_bar**7 + 25.0**7))
    Sl = 1 + (0.015 * (Lp_bar - 50) ** 2) / np.sqrt(20 + (Lp_bar - 50) ** 2)
    Sc = 1 + 0.045 * Cp_bar
    Sh = 1 + 0.015 * Cp_bar * T
    Rt = -np.sin(np.radians(2 * d_theta)) * Rc
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def individual_typology_angle(lab) -> float:
    """ITA° = arctan((L* - 50) / b*) in degrees; a dermatology standard for skin tone."""
    L, b = float(lab[0]), float(lab[2])
    return float(np.degrees(np.arctan2(L - 50.0, b)))


ITA_CATEGORIES = [  # (lower bound, label) per Chardon et al.
    (55, "Very light"),
    (41, "Light"),
    (28, "Intermediate"),
    (10, "Tan"),
    (-30, "Brown"),
    (-90, "Dark"),
]


def ita_category(ita: float) -> str:
    for lower, label in ITA_CATEGORIES:
        if ita > lower:
            return label
    return "Dark"
