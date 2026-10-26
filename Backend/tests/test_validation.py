import base64

import cv2
import numpy as np
import pytest

from validation import ValidationError, decode_image_data_url, is_valid_user_id, require_user_id


def png_data_url(width=40, height=30, kind='png'):
    image = np.full((height, width, 3), 180, dtype=np.uint8)
    ok, encoded = cv2.imencode('.png', image)
    assert ok
    return f"data:image/{kind};base64," + base64.b64encode(encoded.tobytes()).decode()


@pytest.mark.parametrize('user_id', ['user_1717171717', 'abc-DEF_123', 'a' * 64])
def test_valid_user_ids(user_id):
    assert is_valid_user_id(user_id)


@pytest.mark.parametrize('user_id', ['', '../etc/passwd', 'a/b', 'a' * 65, 'x.json', None, 123, 'name with space'])
def test_invalid_user_ids(user_id):
    assert not is_valid_user_id(user_id)
    with pytest.raises(ValidationError):
        require_user_id(user_id)


def test_decode_valid_png():
    image = decode_image_data_url(png_data_url())
    assert image.shape == (30, 40, 3)


def test_decode_downscales_large_images():
    image = decode_image_data_url(png_data_url(width=400, height=200), max_side=100)
    assert max(image.shape[:2]) == 100


@pytest.mark.parametrize('bad', [
    None, '', 'not a data url', 'data:text/plain;base64,aGVsbG8=',
    'data:image/svg+xml;base64,PHN2Zy8+', 'data:image/png;base64,@@@notbase64',
    'data:image/png;base64,aGVsbG8=',  # valid base64, not an image
])
def test_decode_rejects_bad_input(bad):
    with pytest.raises(ValidationError):
        decode_image_data_url(bad)
