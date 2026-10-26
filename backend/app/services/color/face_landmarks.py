"""Face localisation.

1. MediaPipe Face Landmarker (Tasks API): 478 points incl. irises.
2. If it finds nothing (its detector is tuned for selfies and misses small
   faces in full-length photos), OpenCV's YuNet DNN detector finds face boxes
   and the landmarker re-runs on an upscaled crop of each.
3. If landmarks still fail, the YuNet box alone is used and the analyzer falls
   back to coarser box-based regions.
"""
import logging
import threading
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# MediaPipe face-mesh topology (canonical indices).
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
             152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
RIGHT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
LEFT_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
RIGHT_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]
LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
NOSTRILS = [98, 97, 2, 326, 327, 294, 278, 344, 440, 275, 4, 45, 220, 115, 48, 64]
LEFT_CHEEK = [116, 117, 118, 119, 100, 142, 203, 206, 216, 192, 213, 147, 123]
RIGHT_CHEEK = [345, 346, 347, 348, 329, 371, 423, 426, 436, 416, 433, 376, 352]
FOREHEAD = [109, 10, 338, 297, 299, 296, 336, 9, 107, 66, 69, 67]
LEFT_IRIS = (468, 469, 471)   # center, edge, opposite edge
RIGHT_IRIS = (473, 474, 476)


@dataclass
class FaceGeometry:
    box: tuple[int, int, int, int]          # x, y, w, h
    landmarks: np.ndarray | None            # (478, 2) pixel coords, or None for the box fallback
    detector: str
    confidence: float


class FaceLocator:
    CROP_SIDE = 512

    def __init__(self, landmarker_model: Path, detector_model: Path):
        self._lock = threading.Lock()  # MediaPipe graphs and YuNet are not thread-safe
        self._landmarker = None
        self._yunet = None
        try:
            from mediapipe.tasks.python import BaseOptions, vision

            if not landmarker_model.exists():
                raise FileNotFoundError(landmarker_model)
            options = vision.FaceLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=str(landmarker_model)),
                running_mode=vision.RunningMode.IMAGE,
                num_faces=2,
                min_face_detection_confidence=0.5,
            )
            self._landmarker = vision.FaceLandmarker.create_from_options(options)
        except Exception as error:
            logger.warning("Face Landmarker unavailable (%s). Run: uv run python -m scripts.download_models", error)
        if detector_model.exists():
            self._yunet = cv2.FaceDetectorYN.create(str(detector_model), "", (320, 320), 0.7, 0.3, 20)
        else:
            logger.warning("YuNet face detector model missing: %s", detector_model)
        if self._landmarker is None and self._yunet is None:
            raise RuntimeError("No face detection model available. Run: uv run python -m scripts.download_models")

    @property
    def detector(self) -> str:
        if self._landmarker is not None:
            return "mediapipe-face-landmarker"
        return "opencv-yunet"

    def locate(self, image_bgr: np.ndarray) -> list[FaceGeometry]:
        """All faces found, largest first."""
        with self._lock:
            faces = self._locate_landmarks(image_bgr) if self._landmarker else []
            if not faces:
                faces = self._locate_via_boxes(image_bgr)
        return sorted(faces, key=lambda f: f.box[2] * f.box[3], reverse=True)

    def _detect_landmarks(self, image_bgr: np.ndarray) -> list[np.ndarray]:
        """Landmarks in normalized 0-1 coordinates, one array per face."""
        import mediapipe as mp

        rgb = np.ascontiguousarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
        result = self._landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        return [np.array([[p.x, p.y] for p in points], dtype=np.float32) for points in result.face_landmarks]

    @staticmethod
    def _geometry(coords: np.ndarray, width: int, height: int, detector: str, confidence: float) -> FaceGeometry:
        coords = coords.astype(np.float32)
        x0, y0 = np.clip(coords.min(axis=0), 0, None)
        x1, y1 = coords.max(axis=0)
        box = (int(x0), int(y0), int(min(x1, width) - x0), int(min(y1, height) - y0))
        return FaceGeometry(box=box, landmarks=coords, detector=detector, confidence=confidence)

    def _locate_landmarks(self, image_bgr: np.ndarray) -> list[FaceGeometry]:
        height, width = image_bgr.shape[:2]
        scale = np.array([width, height], dtype=np.float32)
        return [self._geometry(points * scale, width, height, "mediapipe-face-landmarker", 0.95)
                for points in self._detect_landmarks(image_bgr)]

    def _detect_boxes(self, image_bgr: np.ndarray) -> list[tuple[tuple[int, int, int, int], float]]:
        if self._yunet is None:
            return []
        height, width = image_bgr.shape[:2]
        self._yunet.setInputSize((width, height))
        _, detections = self._yunet.detect(image_bgr)
        boxes = []
        for row in detections if detections is not None else []:
            x, y, w, h = (int(v) for v in row[:4])
            x, y = max(0, x), max(0, y)
            boxes.append(((x, y, min(w, width - x), min(h, height - y)), float(row[-1])))
        return boxes

    def _locate_via_boxes(self, image_bgr: np.ndarray) -> list[FaceGeometry]:
        height, width = image_bgr.shape[:2]
        faces = []
        for (x, y, w, h), score in self._detect_boxes(image_bgr)[:2]:
            if self._landmarker is not None:
                pad = int(max(w, h) * 0.6)
                x0, y0 = max(0, x - pad), max(0, y - pad)
                x1, y1 = min(width, x + w + pad), min(height, y + h + pad)
                scale = self.CROP_SIDE / max(y1 - y0, x1 - x0)
                crop = cv2.resize(image_bgr[y0:y1, x0:x1], None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
                found = self._detect_landmarks(crop)
                if found:
                    size = np.array([crop.shape[1], crop.shape[0]], dtype=np.float32)
                    coords = found[0] * size / scale + np.array([x0, y0], dtype=np.float32)
                    faces.append(self._geometry(coords, width, height, "yunet+face-landmarker", score))
                    continue
            faces.append(FaceGeometry(box=(x, y, w, h), landmarks=None, detector="opencv-yunet", confidence=score))
        return faces

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None


def polygon_mask(shape: tuple[int, int], points: np.ndarray) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.fillPoly(mask, [np.round(points).astype(np.int32)], 255)
    return mask


def region_mask(shape: tuple[int, int], landmarks: np.ndarray, indices: list[int]) -> np.ndarray:
    return polygon_mask(shape, cv2.convexHull(landmarks[indices]).reshape(-1, 2))
