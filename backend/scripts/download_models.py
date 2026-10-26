"""Download ML model files used by the backend (run once after install).

    uv run python -m scripts.download_models
"""
import hashlib
import sys
import urllib.request

from app.core.config import get_settings

MODELS = {
    # MediaPipe Face Landmarker (Google, Apache-2.0)
    "face_landmarker.task": (
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff",
    ),
    # OpenCV YuNet face detector (OpenCV Zoo, MIT)
    "face_detection_yunet_2023mar.onnx": (
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    ),
}


def main() -> int:
    models_dir = get_settings().models_dir
    models_dir.mkdir(parents=True, exist_ok=True)
    for name, (url, sha256) in MODELS.items():
        target = models_dir / name
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == sha256:
            print(f"{name}: up to date")
            continue
        print(f"{name}: downloading {url}")
        data = urllib.request.urlopen(url, timeout=60).read()  # noqa: S310 (fixed https URL)
        if hashlib.sha256(data).hexdigest() != sha256:
            print(f"{name}: checksum mismatch; not installed", file=sys.stderr)
            return 1
        target.write_bytes(data)
        print(f"{name}: saved ({len(data) / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
