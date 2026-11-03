"""Model files: downloaded once from the Ultralytics GitHub releases into models/."""
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"

URLS = {
    "yolov8m-oiv7.pt": "https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8m-oiv7.pt",
    "isnet-general-use.onnx": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
    "mobile_sam.pt": "https://github.com/ultralytics/assets/releases/download/v8.4.0/mobile_sam.pt",
}


def path(name: str) -> pathlib.Path:
    p = MODELS / name
    if not p.exists():
        MODELS.mkdir(exist_ok=True)
        tmp = p.with_suffix(".part")
        with urllib.request.urlopen(URLS[name], timeout=300) as r:
            tmp.write_bytes(r.read())
        tmp.rename(p)
    return p
