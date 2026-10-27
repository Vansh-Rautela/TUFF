import cv2
import numpy as np
import pytest

from app.core.config import get_settings
from app.core.errors import InvalidInputError
from app.services.color.garment_color import band_for_category, dominant_garment_color
from app.services.color.seasonal_palettes import SEASONS, get_season
from app.services.color.skin_tone_analyzer import _season_scores
from app.services.color.white_balance import correct_white_balance
from tests.conftest import FACES, solid_image

# ---- seasons ---------------------------------------------------------------


def test_twelve_seasons_with_complete_palettes():
    assert len(SEASONS) == 12
    for season in SEASONS.values():
        assert len(season.signature) >= 6 and len(season.neutrals) >= 4 and season.avoid and season.metals
        assert all(s.hex.startswith("#") and len(s.hex) == 7 for s in season.wearable + season.avoid)


@pytest.mark.parametrize("axes, expected", [
    ((1.0, 0.2, 0.1), "Warm Spring"),
    ((0.3, 1.0, 0.0), "Light Spring"),
    ((0.2, 0.3, 1.0), "Bright Spring"),
    ((-1.0, 0.2, -0.1), "Cool Summer"),
    ((-0.2, 0.2, -1.0), "Soft Summer"),
    ((1.0, -0.2, -0.1), "Warm Autumn"),
    ((0.3, -1.0, 0.0), "Deep Autumn"),
    ((-0.3, -1.0, 0.0), "Deep Winter"),
    ((-0.2, -0.3, 1.0), "Bright Winter"),
])
def test_axes_map_to_expected_season(axes, expected):
    scores = _season_scores(axes)
    assert max(scores, key=scores.get) == expected


def test_legacy_four_season_names_still_resolve():
    assert get_season("Autumn").name == "Warm Autumn"
    assert get_season("nonsense") is None


# ---- white balance -----------------------------------------------------------


def test_sclera_reference_removes_color_cast():
    image = np.full((100, 100, 3), (150, 170, 200), dtype=np.uint8)  # warm (BGR) cast everywhere
    image[40:60, 40:60] = (190, 215, 250)                            # "eye whites" under the same light
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[40:60, 40:60] = 255
    result = correct_white_balance(image, mask)
    corrected = result.image[45, 45].astype(float)
    assert result.method == "sclera"
    assert corrected.max() - corrected.min() < 20  # close to neutral
    assert result.cast_strength > 0.05


def test_neutral_image_left_alone():
    image = np.full((50, 50, 3), 128, dtype=np.uint8)
    assert correct_white_balance(image).method == "none"


# ---- garment color --------------------------------------------------------------


@pytest.mark.parametrize("bgr, expected", [
    ((40, 40, 200), {"red", "scarlet"}), ((74, 42, 27), {"navy"}), ((46, 107, 107), {"olive", "khaki"}),
    ((20, 20, 20), {"black"}),
])
def test_garment_color_on_studio_shot(bgr, expected):
    color = dominant_garment_color(solid_image(bgr))
    assert color is not None and color.name in expected
    assert color.coverage > 0.5


def test_garment_color_ignores_background_only_and_junk():
    assert dominant_garment_color(solid_image((250, 250, 250))) is None
    assert dominant_garment_color(b"not an image") is None


def test_garment_band_by_category():
    assert band_for_category("shirt") == "top"
    assert band_for_category("jeans") == "bottom"
    assert band_for_category("dress") == "full"


# ---- full face pipeline (real models) -------------------------------------------

settings = get_settings()
models_present = settings.face_landmarker_model.exists() and settings.face_detector_model.exists()


@pytest.fixture(scope="module")
def analyzer():
    from app.services.color.face_landmarks import FaceLocator
    from app.services.color.skin_tone_analyzer import SkinToneAnalyzer

    locator = FaceLocator(settings.face_landmarker_model, settings.face_detector_model)
    yield SkinToneAnalyzer(locator)
    locator.close()


@pytest.mark.skipif(not models_present or not (FACES / "close_portrait.webp").exists(), reason="models/photo missing")
def test_real_photo_produces_complete_reading(analyzer):
    result = analyzer.analyze(cv2.imread(str(FACES / "close_portrait.webp")))
    assert result["season"]["name"] in SEASONS
    assert 0 < result["season"]["confidence"] <= 1
    assert result["skin"]["pixels_measured"] > 1000
    assert result["skin"]["undertone"] in {"Warm", "Cool", "Neutral"}
    assert result["features"]["eyes_hex"] and result["features"]["brows_hex"]
    assert result["quality"]["detector"].startswith("mediapipe")
    assert set(result["axes"]) == {"warmth", "lightness", "clarity"}


@pytest.mark.skipif(not models_present or not (FACES / "small_face_full_length.webp").exists(), reason="models/photo missing")
def test_small_face_found_via_detector_and_crop(analyzer):
    result = analyzer.analyze(cv2.imread(str(FACES / "small_face_full_length.webp")))
    assert result["quality"]["detector"] == "yunet+face-landmarker"


@pytest.mark.skipif(not models_present, reason="models missing")
def test_no_face_is_a_clear_error(analyzer):
    with pytest.raises(InvalidInputError) as error:
        analyzer.analyze(np.full((300, 300, 3), 200, dtype=np.uint8))
    assert error.value.code == "no_face"
