"""
Integration test for the real face/color pipeline on a stock photo bundled with
the frontend. Skipped if the photo or the CV dependencies are unavailable.
"""
import os

import pytest

from color_palettes import get_season_palette

PHOTO = os.path.join(os.path.dirname(__file__), '..', '..', 'Frontend', 'TUFF-frontend', 'src', 'assets', 'girl-main.jpg')
SEASONS = {'Spring', 'Summer', 'Autumn', 'Winter'}


@pytest.mark.parametrize('season', sorted(SEASONS))
def test_palette_matches_frontend_contract(season):
    palette = get_season_palette(season)
    for key in ('primary', 'neutrals', 'accent', 'jewelry_metals'):
        assert palette['palettes'][key]
    for key in ('tonal', 'analogous', 'complementary_contrast'):
        assert all(c.startswith('#') for c in palette['color_relationships'][key])
    assert palette['key_characteristics'] and palette['description']


@pytest.fixture(scope='module')
def analyzer():
    pytest.importorskip('cv2')
    from facial_color_analyzer import FacialColorAnalyzer
    instance = FacialColorAnalyzer()
    yield instance
    instance.close()


@pytest.mark.skipif(not os.path.exists(PHOTO), reason='sample photo not present')
def test_analyzes_real_photo(analyzer):
    import cv2
    result = analyzer.analyze_image(cv2.imread(PHOTO))
    assert result.get('success'), result
    assert result['skintone']['season'] in SEASONS
    assert result['palette']['season'] == result['skintone']['season']
    assert result['method'] in ('mediapipe', 'opencv-haar')


def test_reports_no_face_on_blank_image(analyzer):
    import numpy as np
    result = analyzer.analyze_image(np.full((200, 200, 3), 255, dtype=np.uint8))
    assert 'error' in result
