import asyncio
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import USER_ID_PATTERN, ServicesDep, SessionDep, rate_limit
from app.core.errors import InvalidInputError, ServiceUnavailableError
from app.repositories import user_repository as users_repo
from app.schemas.analysis import ColorAnalysis

router = APIRouter(prefix="/analysis", tags=["color analysis"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}


def decode_photo(data: bytes, max_side: int) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise InvalidInputError("That file isn't a readable photo. Use JPEG, PNG or WebP.", code="bad_image")
    height, width = image.shape[:2]
    scale = max_side / max(height, width)
    if scale < 1:
        image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    return image


@router.post("/face", response_model=ColorAnalysis, dependencies=[rate_limit("analysis")],
             summary="Seasonal color analysis from a face photo (the photo is never stored)")
async def analyze_face(services: ServicesDep, session: SessionDep, photo: UploadFile = File(...),
                       user_id: str | None = Form(default=None, pattern=USER_ID_PATTERN)):
    if services.analyzer is None:
        raise ServiceUnavailableError("Color analysis is unavailable on this server right now.")
    if photo.content_type not in ALLOWED_TYPES:
        raise InvalidInputError("Please upload a JPEG, PNG or WebP photo.", code="bad_image_type")
    limit = services.settings.max_upload_bytes
    data = await photo.read(limit + 1)
    if len(data) > limit:
        raise InvalidInputError(f"Photos must be under {limit // (1024 * 1024)} MB.", code="image_too_large")

    started = time.perf_counter()
    image = await asyncio.to_thread(decode_photo, data, services.settings.max_image_side)
    result = await asyncio.to_thread(services.analyzer.analyze, image)
    result["elapsed_ms"] = int((time.perf_counter() - started) * 1000)
    if user_id:
        await users_repo.update_profile(session, user_id, {"color_analysis": result})
    return result
