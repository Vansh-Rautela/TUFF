import numpy as np
import pytest

from app.services.color.color_names import canonical_color, color_from_text, nearest_color_name
from app.services.color.color_science import (
    delta_e_2000,
    hex_to_rgb,
    individual_typology_angle,
    ita_category,
    lab_to_lch,
    lab_to_rgb,
    rgb_to_hex,
    rgb_to_lab,
)

# Reference pairs from Sharma, Wu & Dalal (2005), "The CIEDE2000 color-difference formula".
SHARMA = [
    ((50.0, 2.6772, -79.7751), (50.0, 0.0, -82.7485), 2.0425),
    ((50.0, 3.1571, -77.2803), (50.0, 0.0, -82.7485), 2.8615),
    ((50.0, -1.3802, -84.2814), (50.0, 0.0, -82.7485), 1.0000),
    ((50.0, 2.5, 0.0), (50.0, 0.0, -2.5), 4.3065),
    ((50.0, 2.5, 0.0), (73.0, 25.0, -18.0), 27.1492),
    ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387), 1.2644),
    ((22.7233, 20.0904, -46.6940), (23.0331, 14.9730, -42.5619), 2.0373),
    ((90.8027, -2.0831, 1.4410), (91.1528, -1.6435, 0.0447), 1.4441),
]


@pytest.mark.parametrize("lab1, lab2, expected", SHARMA)
def test_ciede2000_matches_reference(lab1, lab2, expected):
    assert float(delta_e_2000(lab1, lab2)) == pytest.approx(expected, abs=1e-4)


def test_ciede2000_broadcasts_and_is_symmetric():
    a = np.array([[50, 10, 10], [70, -5, 20]], dtype=float)
    b = np.array([60, 0, 0], dtype=float)
    assert delta_e_2000(a, b).shape == (2,)
    assert np.allclose(delta_e_2000(a, b), delta_e_2000(b, a))


def test_lab_round_trip_and_known_white():
    white = rgb_to_lab(np.array([255, 255, 255], dtype=float))
    assert white[0] == pytest.approx(100, abs=0.1) and abs(white[1]) < 0.5 and abs(white[2]) < 0.5
    rgb = np.array([180, 120, 90], dtype=float)
    assert np.allclose(lab_to_rgb(rgb_to_lab(rgb)), rgb, atol=1.0)
    assert rgb_to_hex(hex_to_rgb("#A1B2C3")) == "#A1B2C3"


def test_lch_hue_angle():
    L, C, h = lab_to_lch(np.array([50.0, 0.0, 20.0]))
    assert pytest.approx(20) == C and h == pytest.approx(90)


@pytest.mark.parametrize("lab, category", [
    ((80, 5, 12), "Very light"), ((70, 10, 20), "Light"), ((60, 12, 15), "Intermediate"),
    ((55, 12, 20), "Tan"), ((45, 12, 20), "Brown"), ((25, 10, 10), "Dark"),
])
def test_ita_categories(lab, category):
    assert ita_category(individual_typology_angle(lab)) == category


def test_color_vocabulary():
    assert color_from_text("Women Navy Blue Slim Shirt") == "navy"
    assert color_from_text("Off-White linen kurta") == "off white"
    assert color_from_text("Embroidered Straight Kurta") is None
    assert canonical_color("Multi") is None and canonical_color("Gray") == "grey"
    assert nearest_color_name(rgb_to_lab(np.array([200, 20, 40], dtype=float)))[0] in {"red", "scarlet"}
