"""Find wheels on a car photo.

1. YOLOv8m trained on Open Images V7 proposes boxes for "Wheel" and "Tire" (and "Car").
   Confidence on wheels is often low (0.1-0.4), so proposals are kept generously and
   filtered by geometry later (geometry.fit_wheel rejects what is not a wheel).
2. MobileSAM, prompted with each box, cuts the wheel mask (tyre + rim).
"""
from dataclasses import dataclass

import cv2
import numpy as np

from . import models

WHEEL, TIRE, CAR, BICYCLE_WHEEL = 582, 536, 90, 44
_yolo = None
_sam = None


@dataclass
class Detection:
    box: np.ndarray  # x1, y1, x2, y2 (float, image pixels)
    conf: float
    mask: np.ndarray | None = None  # uint8 0/1, image size


def _get_yolo():
    global _yolo
    if _yolo is None:
        from ultralytics import YOLO

        _yolo = YOLO(str(models.path("yolov8m-oiv7.pt")))
    return _yolo


def _get_sam():
    global _sam
    if _sam is None:
        from ultralytics import SAM

        _sam = SAM(str(models.path("mobile_sam.pt")))
    return _sam


def _iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1])
    x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / ua if ua > 0 else 0


def propose(img: np.ndarray, conf: float = 0.08) -> tuple[list[Detection], list[np.ndarray]]:
    """Wheel proposals (Wheel and Tire merged) and car boxes. Bicycle wheels are dropped."""
    r = _get_yolo().predict(img, conf=conf, classes=[WHEEL, TIRE, CAR, BICYCLE_WHEEL], verbose=False, imgsz=960)[0]
    boxes = r.boxes.xyxy.cpu().numpy()
    confs = r.boxes.conf.cpu().numpy()
    cls = r.boxes.cls.cpu().numpy().astype(int)
    cars = [b for b, c, k in zip(boxes, confs, cls) if k == CAR and c >= 0.25]
    bikes = [b for b, c, k in zip(boxes, confs, cls) if k == BICYCLE_WHEEL and c >= 0.3]
    cand = sorted(
        [(float(c), b) for b, c, k in zip(boxes, confs, cls) if k in (WHEEL, TIRE)],
        key=lambda t: -t[0],
    )
    kept: list[Detection] = []
    for c, b in cand:  # Wheel and Tire boxes of the same wheel: keep the stronger one
        if any(_iou(b, bk) > 0.4 for bk in bikes):
            continue
        if all(_iou(b, k.box) < 0.5 for k in kept):
            kept.append(Detection(b.astype(float), c))
    return kept, cars


def segment(img: np.ndarray, dets: list[Detection]) -> None:
    """Fill det.mask with a MobileSAM mask prompted by the (slightly padded) box."""
    if not dets:
        return
    h, w = img.shape[:2]
    bxs = []
    for d in dets:
        x1, y1, x2, y2 = d.box
        p = 0.04 * max(x2 - x1, y2 - y1)
        bxs.append([max(0, x1 - p), max(0, y1 - p), min(w - 1, x2 + p), min(h - 1, y2 + p)])
    r = _get_sam().predict(img, bboxes=np.array(bxs), verbose=False)[0]
    masks = r.masks.data.cpu().numpy()
    for d, mk in zip(dets, masks):
        if mk.shape != (h, w):
            mk = cv2.resize(mk.astype(np.float32), (w, h))
        d.mask = (mk > 0.5).astype(np.uint8)
