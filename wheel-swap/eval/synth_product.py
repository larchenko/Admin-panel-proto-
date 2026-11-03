"""Synthetic product shots: a rim alone on a white background, with known geometry.

Open Images has almost no shop photos of rims. This takes the rim textures extracted
from on-car photos (eval set), turns the dark inside of the wheel into see-through
gaps, tilts the rim, adds a lip ring and a soft shadow, and pastes it on white.

    python eval/synth_product.py            -> data/synth/*.jpg + data/synth/truth.json
The truth is the rim ellipse in the synthetic image and the hole mask in the texture.
"""
import json
import pathlib
import sys

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from wheelswap.rimsource import N, RIM_R, RimNotFound, extract_rim  # noqa: E402

SETS = json.loads((ROOT / "eval" / "sets.json").read_text())


def make(tex_rgba: np.ndarray, rng: np.random.Generator, size=900):
    rgb = tex_rgba[..., :3].copy()
    yy, xx = np.mgrid[0:N, 0:N]
    rr = np.hypot(xx - N / 2, yy - N / 2) / RIM_R
    lab = cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB)
    # dark inside the wheel (seen between spokes) becomes background
    hole = (lab[..., 0] < 55) & (rr > 0.28) & (rr < 0.9)
    hole = cv2.morphologyEx(hole.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(bool)
    alpha = ((rr <= 1.0) & ~hole).astype(np.float32)
    # a light metal lip ring
    lip = (rr > 0.95) & (rr <= 1.0)
    rgb[lip] = (rgb[lip] * 0.4 + 200 * 0.6).astype(np.uint8)
    # tilt: squash horizontally, rotate a little, place in the frame
    ratio = rng.uniform(0.7, 1.0)
    ang = rng.uniform(-8, 8)
    scale = rng.uniform(0.75, 0.9) * size / (2 * RIM_R)
    c = size / 2 + rng.uniform(-30, 30, 2)
    t = np.deg2rad(ang)
    R = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
    A = R @ np.diag([scale * ratio, scale])
    M = np.hstack([A, (c - A @ np.array([N / 2, N / 2]))[:, None]])
    canvas = np.full((size, size, 3), 250, np.float32)
    # soft shadow, offset down-right
    sh = cv2.warpAffine(alpha, M, (size, size))
    sh = cv2.GaussianBlur(np.roll(sh, (18, 12), (0, 1)), (0, 0), 14)
    canvas *= (1 - 0.25 * sh)[..., None]
    a = cv2.warpAffine(alpha, M, (size, size), flags=cv2.INTER_LINEAR)[..., None]
    fg = cv2.warpAffine(rgb, M, (size, size), flags=cv2.INTER_LINEAR).astype(np.float32)
    out = canvas * (1 - a) + fg * a
    out = np.clip(out + rng.normal(0, 1.5, out.shape), 0, 255).astype(np.uint8)
    truth = dict(cx=float(c[0]), cy=float(c[1]), a=float(RIM_R * scale * ratio), b=float(RIM_R * scale), angle=float(ang), hole_frac=float(hole[rr <= 1].mean()))
    return out, truth, hole


def main():
    out_dir = ROOT / "data" / "synth"
    out_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(7)
    truth = {}
    for i, (rid, _) in enumerate(SETS["rims"]):
        img = cv2.imread(str(ROOT / "data" / "rims" / f"{rid}.jpg"))
        try:
            t = extract_rim(img)
        except RimNotFound:
            continue
        if t.kind != "on_car":
            continue
        im, tr, hole = make(t.rgba, rng)
        name = f"synth_{i:02d}"
        cv2.imwrite(str(out_dir / f"{name}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 92])
        np.save(out_dir / f"{name}_hole.npy", hole)
        truth[name] = tr
    (out_dir / "truth.json").write_text(json.dumps(truth, indent=1))
    print(f"{len(truth)} synthetic product shots in {out_dir}")


if __name__ == "__main__":
    main()
