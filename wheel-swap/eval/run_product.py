"""Product-shot check on the synthetic set (eval/synth_product.py) plus the real ones.

    python eval/run_product.py   -> eval/out/product.json, eval/out/product_sheet.jpg
Per synthetic shot: centre error and axis errors (% of the rim radius), and the IoU of
the detected see-through gaps with the true ones (both in the frontal texture).
"""
import json
import pathlib
import sys

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from wheelswap.rimsource import N, RIM_R, RimNotFound, extract_rim  # noqa: E402

SYN = ROOT / "data" / "synth"


def tile(img, tex, label, size=256):
    s = size / max(img.shape[:2])
    a = cv2.resize(img, None, fx=s, fy=s)
    a = cv2.copyMakeBorder(a, 0, size - a.shape[0], 0, size - a.shape[1], cv2.BORDER_CONSTANT)
    if tex is None:
        b = np.zeros((size, size, 3), np.uint8)
    else:
        al = tex.rgba[..., 3:] / 255.0
        b = (tex.rgba[..., :3] * al + np.array([255, 0, 255]) * (1 - al)).astype(np.uint8)
        b = cv2.resize(b, (size, size))
    t = np.hstack([a, b])
    cv2.putText(t, label, (4, 16), 0, 0.45, (0, 160, 255), 1)
    return t


def main():
    truth = json.loads((SYN / "truth.json").read_text())
    rows, tiles = [], []
    for name, tr in truth.items():
        img = cv2.imread(str(SYN / f"{name}.jpg"))
        try:
            t = extract_rim(img)
        except RimNotFound as e:
            rows.append(dict(name=name, fail=str(e)))
            tiles.append(tile(img, None, f"{name} {e}"))
            continue
        e = t.source_ellipse
        r = tr["b"]
        big, small = max(e.a, e.b), min(e.a, e.b)
        c_err = float(np.hypot(e.cx - tr["cx"], e.cy - tr["cy"]) / r * 100)
        ax_err = float(max(abs(big - max(tr["a"], tr["b"])), abs(small - min(tr["a"], tr["b"]))) / r * 100)
        hole_true = np.load(SYN / f"{name}_hole.npy")
        hole_pred = t.rgba[..., 3] == 0
        yy, xx = np.mgrid[0:N, 0:N]
        inside = np.hypot(xx - N / 2, yy - N / 2) <= RIM_R * 0.97
        inter = (hole_true & hole_pred & inside).sum()
        union = ((hole_true | hole_pred) & inside).sum()
        iou = float(inter / union) if union else 1.0
        rows.append(dict(name=name, kind=t.kind, center_err_pct=round(c_err, 2), axis_err_pct=round(ax_err, 2), hole_iou=round(iou, 3)))
        tiles.append(tile(img, t, f"{name} c{c_err:.1f}% ax{ax_err:.1f}% hole{iou:.2f}"))
    ok = [r for r in rows if "fail" not in r]
    summary = dict(
        shots=len(rows),
        extracted=len(ok),
        center_err_pct_max=max((r["center_err_pct"] for r in ok), default=None),
        axis_err_pct_max=max((r["axis_err_pct"] for r in ok), default=None),
        hole_iou_median=float(np.median([r["hole_iou"] for r in ok])) if ok else None,
        rows=rows,
    )
    out = ROOT / "eval" / "out"
    out.mkdir(parents=True, exist_ok=True)
    (out / "product.json").write_text(json.dumps(summary, indent=1))
    while len(tiles) % 3:
        tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(str(out / "product_sheet.jpg"), np.vstack([np.hstack(tiles[i : i + 3]) for i in range(0, len(tiles), 3)]))
    print(json.dumps({k: v for k, v in summary.items() if k != "rows"}, indent=1))
    for r in rows:
        print(r)


if __name__ == "__main__":
    main()
