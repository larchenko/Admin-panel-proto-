"""Evaluation run: every car photo with a rim and a size change, plus the front-view set.

    python eval/run.py [--cars N] [--rims i,j,...] [--out eval/out]

Writes:
  out/metrics.json       numbers to compare between iterations (docs/progress.md)
  out/sheet_XX.jpg       before/after crops of every replaced wheel, for the visual review
  out/full/<car>.jpg     full results
Wheel recall is measured against Open Images "Wheel" boxes of the main car that are at
least 45% of the largest wheel's height (far, tiny or other cars' wheels do not count).
"""
import argparse
import json
import pathlib
import sys
import time

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from wheelswap import detect  # noqa: E402
from wheelswap.pipeline import NoWheels, Report, find_wheels, swap  # noqa: E402
from wheelswap.rimsource import RimNotFound, extract_rim  # noqa: E402

SETS = json.loads((ROOT / "eval" / "sets.json").read_text())
SIZES = [(17, 17), (16, 18), (18, 17), (17, 19)]


def gt_boxes(image_id, shape, car_box):
    h, w = shape[:2]
    out = []
    for x0, x1, y0, y1 in SETS["wheel_boxes"].get(image_id, []):
        b = np.array([x0 * w, y0 * h, x1 * w, y1 * h])
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        if car_box is not None and not (car_box[0] <= cx <= car_box[2] and car_box[1] <= cy <= car_box[3] + 0.05 * (car_box[3] - car_box[1])):
            continue
        out.append(b)
    if out:
        top = max(b[3] - b[1] for b in out)
        out = [b for b in out if b[3] - b[1] >= 0.45 * top]
    return out


def iou(a, b):
    x1, y1, x2, y2 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    i = max(0, x2 - x1) * max(0, y2 - y1)
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i
    return i / u if u > 0 else 0


def crop(img, box, size=240):
    x1, y1, x2, y2 = [int(v) for v in box]
    p = int(0.2 * max(x2 - x1, y2 - y1))
    c = img[max(0, y1 - p) : y2 + p, max(0, x1 - p) : x2 + p]
    s = size / max(c.shape[:2])
    c = cv2.resize(c, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return cv2.copyMakeBorder(c, 0, size - c.shape[0], 0, size - c.shape[1], cv2.BORDER_CONSTANT)


def sheets(tiles, out, per=24, cols=6):
    for s in range(0, len(tiles), per):
        t = tiles[s : s + per]
        while len(t) % cols:
            t.append(np.zeros_like(t[0]))
        g = np.vstack([np.hstack(t[r * cols : (r + 1) * cols]) for r in range(len(t) // cols)])
        cv2.imwrite(str(out / f"sheet_{s // per:02d}.jpg"), g, [cv2.IMWRITE_JPEG_QUALITY, 88])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cars", type=int, default=0)
    ap.add_argument("--rims", default="")
    ap.add_argument("--out", default=str(ROOT / "eval" / "out"))
    args = ap.parse_args()
    out = pathlib.Path(args.out)
    (out / "full").mkdir(parents=True, exist_ok=True)

    rims = []
    rim_ids = [r for r, _ in SETS["rims"]]
    pick = [int(i) for i in args.rims.split(",")] if args.rims else range(len(rim_ids))
    rim_fail = []
    for i in pick:
        img = cv2.imread(str(ROOT / "data" / "rims" / f"{rim_ids[i]}.jpg"))
        try:
            rims.append((i, extract_rim(img)))
        except RimNotFound as e:
            rim_fail.append((i, str(e)))

    cars = SETS["cars"][: args.cars or None]
    tiles, per_car, times = [], [], []
    gt_total = gt_hit = found_total = 0
    for n, (cid, _) in enumerate(cars):
        img = cv2.imread(str(ROOT / "data" / "cars" / f"{cid}.jpg"))
        ri, rim = rims[n % len(rims)]
        d0, d1 = SIZES[n % len(SIZES)]
        t0 = time.time()
        try:
            res, rep = swap(img, None, d0, d1, rim=rim)
        except NoWheels:
            res, rep = img, Report()
        dt = time.time() - t0
        times.append(dt)
        _, cars_boxes = detect.propose(img)
        car_box = max(cars_boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1])) if cars_boxes else None
        gts = gt_boxes(cid, img.shape, car_box)
        hits = sum(any(iou(g, w["box"]) > 0.3 for w in rep.wheels) for g in gts)
        extra = sum(not any(iou(g, w["box"]) > 0.3 for g in gts) for w in rep.wheels)
        gt_total += len(gts)
        gt_hit += hits
        found_total += len(rep.wheels)
        per_car.append(dict(car=cid, rim=ri, sizes=[d0, d1], found=len(rep.wheels), gt=len(gts), hit=hits, extra=extra, seconds=round(dt, 2), skipped=[s["reason"] for s in rep.skipped], warnings=rep.warnings))
        cv2.imwrite(str(out / "full" / f"{n:02d}_{cid}.jpg"), np.hstack([img, res]), [cv2.IMWRITE_JPEG_QUALITY, 85])
        for w in rep.wheels:
            a, b = crop(img, w["box"]), crop(res, w["box"])
            pair = np.hstack([a, b])
            cv2.putText(pair, f"{n} r{ri} {d0}->{d1}", (4, 16), 0, 0.45, (0, 255, 255), 1)
            tiles.append(pair)
        print(f"{n:02d} {cid} found {len(rep.wheels)} gt {len(gts)} hit {hits} extra {extra} {dt:.1f}s", flush=True)

    rejected = 0
    for cid, _ in SETS["frontal"]:
        img = cv2.imread(str(ROOT / "data" / "frontal" / f"{cid}.jpg"))
        rejected += int(not find_wheels(img))

    metrics = dict(
        cars=len(cars),
        wheel_recall=round(gt_hit / max(gt_total, 1), 3),
        extra_wheels=sum(c["extra"] for c in per_car),
        wheels_replaced=found_total,
        frontal_rejected=f"{rejected}/{len(SETS['frontal'])}",
        rims_extracted=f"{len(rims)}/{len(pick)}",
        rim_failures=rim_fail,
        seconds_median=round(float(np.median(times)), 2) if times else 0,
        seconds_max=round(float(np.max(times)), 2) if times else 0,
        per_car=per_car,
    )
    (out / "metrics.json").write_text(json.dumps(metrics, indent=1))
    if tiles:
        sheets(tiles, out)
    print(json.dumps({k: v for k, v in metrics.items() if k != "per_car"}, indent=1))


if __name__ == "__main__":
    main()
