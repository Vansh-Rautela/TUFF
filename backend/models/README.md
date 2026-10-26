# Models

Downloaded, not committed. Run from `backend/`:

```bash
uv run python -m scripts.download_models
```

| File | Source | Used for |
|---|---|---|
| `face_landmarker.task` | MediaPipe (Google, Apache-2.0) | 478 face landmarks incl. irises |
| `face_detection_yunet_2023mar.onnx` | OpenCV Zoo (MIT) | Face boxes for small faces / fallback |

Both are checksum-verified on download.
