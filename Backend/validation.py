"""
Request validation helpers shared by the API routes.
"""
import base64
import binascii
import re
from typing import Any, Optional

import numpy as np

# Client-generated ids look like "user_1717171717171" or a UUID. Restricting the
# alphabet keeps ids safe to use as file names (no "/", "..", or NUL).
USER_ID_PATTERN = re.compile(r'^[A-Za-z0-9_-]{1,64}$')

ALLOWED_IMAGE_TYPES = {'jpeg', 'jpg', 'png', 'webp', 'bmp'}
_DATA_URL_PATTERN = re.compile(r'^data:image/([a-zA-Z0-9.+-]+);base64,', re.ASCII)


class ValidationError(ValueError):
    """Raised when client input is malformed. The message is safe to return."""


def is_valid_user_id(user_id: Any) -> bool:
    return isinstance(user_id, str) and bool(USER_ID_PATTERN.match(user_id))


def require_user_id(user_id: Any) -> str:
    if not is_valid_user_id(user_id):
        raise ValidationError('Invalid userId: use 1-64 letters, digits, "_" or "-".')
    return user_id


def require_json_object(payload: Any) -> dict:
    if not isinstance(payload, dict):
        raise ValidationError('Request body must be a JSON object.')
    return payload


def decode_image_data_url(data_url: Any, max_side: Optional[int] = None) -> np.ndarray:
    """
    Decode a "data:image/<type>;base64,<payload>" string into a BGR image array.

    The image is decoded in memory, so user photos are never written to disk.
    Large images are downscaled so that analysis cost stays bounded.
    """
    # Imported here so that modules which only need user-id validation do not
    # pay for (or depend on) OpenCV.
    import cv2

    if not isinstance(data_url, str) or not data_url:
        raise ValidationError('No image data provided.')

    match = _DATA_URL_PATTERN.match(data_url)
    if not match:
        raise ValidationError('Image must be a base64 data URL (data:image/...;base64,...).')
    if match.group(1).lower() not in ALLOWED_IMAGE_TYPES:
        raise ValidationError('Unsupported image type. Use JPEG, PNG, WebP or BMP.')

    try:
        raw = base64.b64decode(data_url[match.end():], validate=True)
    except (binascii.Error, ValueError):
        raise ValidationError('Image data is not valid base64.')

    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValidationError('Could not decode image. Use a JPEG, PNG, WebP or BMP photo.')

    if max_side:
        height, width = image.shape[:2]
        longest = max(height, width)
        if longest > max_side:
            scale = max_side / float(longest)
            image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)

    return image
