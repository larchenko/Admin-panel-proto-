"""Turn a rim photo into a frontal, centred rim texture.

Accepts a product shot (rim alone, usually on a light background, sometimes with a
tyre) or a photo of a rim on a car (possibly cut off by the frame). Output: a square
RGBA image, the rim lip on the circle of radius RIM_R around the centre. Alpha 0 marks
holes between spokes where the background of a product shot shows through; the
renderer fills those with the dark inside of the wheel.
"""
from dataclasses import dataclass

import cv2
import numpy as np

from . import detect
from .geometry import Ellipse, fit_ellipse_ransac, fit_wheel, polar_unwrap, _contour_points

N = 768  # canonical texture size
RIM_R = N * 0.48  # rim lip radius in the texture


class RimNotFound(Exception):
    pass


@dataclass
class RimTexture:
    rgba: np.ndarray  # N x N x 4 uint8
    known: np.ndarray  # N x N bool: pixel came from the photo (not filled by symmetry)
    spokes: int  # detected rotational order (0 = none found)
    kind: str  # "product" or "on_car"
    source_ellipse: Ellipse


def _border_bg(img: np.ndarray) -> tuple[np.ndarray, float]:
    """Median border colour (Lab) and how uniform the border is (fraction close to it)."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    b = max(2, min(img.shape[:2]) // 50)
    border = np.concatenate([lab[:b].reshape(-1, 3), lab[-b:].reshape(-1, 3), lab[:, :b].reshape(-1, 3), lab[:, -b:].reshape(-1, 3)])
    med = np.median(border, 0)
    frac = float((np.linalg.norm(border - med, axis=1) < 12).mean())
    return med, frac


def _product_mask(img: np.ndarray, bg: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    d = np.linalg.norm(lab - bg, axis=2)
    fg = (d > 14).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n <= 1:
        return fg
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    obj = (lbl == i).astype(np.uint8)
    # fill holes for the outline (the spokes' gaps stay detectable through `d`)
    filled = obj.copy()
    cs, _ = cv2.findContours(obj, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(filled, cs, -1, 1, -1)
    return filled


def _has_tyre(img: np.ndarray, e: Ellipse) -> bool:
    """A dark rubber ring just inside the outline means the photo shows a tyre."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    pol = polar_unwrap(lab, e, 1.0, 100)
    ring = pol[:, 86:98].reshape(-1, 3).astype(np.float32)
    inner = pol[:, 30:70].reshape(-1, 3).astype(np.float32)
    dark = (ring[:, 0] < 0.6 * np.median(inner[:, 0]) + 10) & (np.abs(ring[:, 1:] - 128).max(1) < 14)
    return dark.mean() > 0.55


def _rectify(img: np.ndarray, rim: Ellipse, valid: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Warp so the rim ellipse becomes the circle of radius RIM_R at the texture centre."""
    a = rim.affine  # unit -> image
    s = np.array([[1 / RIM_R, 0, -N / 2 / RIM_R], [0, 1 / RIM_R, -N / 2 / RIM_R], [0, 0, 1]])
    m = np.vstack([a, [0, 0, 1]]) @ s  # texture px -> image px
    mx, my = np.meshgrid(np.arange(N, dtype=np.float32), np.arange(N, dtype=np.float32))
    sx = (m[0, 0] * mx + m[0, 1] * my + m[0, 2]).astype(np.float32)
    sy = (m[1, 0] * mx + m[1, 1] * my + m[1, 2]).astype(np.float32)
    tex = cv2.remap(img, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    ok = cv2.remap(valid.astype(np.float32), sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.5
    return tex, ok


def _rot_order(tex: np.ndarray, known: np.ndarray) -> int:
    """Spoke count from the angular autocorrelation of the rim face."""
    c = (N / 2, N / 2)
    pol = cv2.warpPolar(cv2.cvtColor(tex, cv2.COLOR_BGR2GRAY).astype(np.float32), (256, 720), c, RIM_R, cv2.WARP_POLAR_LINEAR)
    kpol = cv2.warpPolar(known.astype(np.float32), (256, 720), c, RIM_R, cv2.WARP_POLAR_LINEAR) > 0.5
    band = slice(int(256 * 0.35), int(256 * 0.85))
    p, k = pol[:, band], kpol[:, band]
    rows = k.mean(1) > 0.8
    if rows.mean() < 0.3:
        return 0
    best, best_n = -1.0, 0
    for n in range(3, 13):
        shift = int(round(720 / n))
        q, kq = np.roll(p, shift, 0), np.roll(k, shift, 0)
        both = k & kq
        if both.sum() < 1000:
            continue
        a, b = p[both], q[both]
        r = np.corrcoef(a, b)[0, 1]
        if r > best + 0.03:  # prefer the lower order unless clearly better
            best, best_n = r, n
    return best_n if best > 0.55 else 0


def _fill_symmetry(tex: np.ndarray, known: np.ndarray, n: int) -> np.ndarray:
    """Fill unknown pixels with the same pixel rotated by k*360/n degrees."""
    out = tex.copy()
    todo = ~known
    if n <= 0 or not todo.any():
        return out
    for k in range(1, n):
        if not todo.any():
            break
        m = cv2.getRotationMatrix2D((N / 2, N / 2), 360.0 * k / n, 1.0)
        rt = cv2.warpAffine(tex, m, (N, N), flags=cv2.INTER_LINEAR)
        rk = cv2.warpAffine(known.astype(np.uint8), m, (N, N), flags=cv2.INTER_NEAREST).astype(bool)
        take = todo & rk
        out[take] = rt[take]
        todo &= ~take
    return out


def extract_rim(img: np.ndarray) -> RimTexture:
    h, w = img.shape[:2]
    bg, uniform = _border_bg(img)
    product = uniform > 0.6
    valid = np.ones((h, w), np.uint8)
    if product:
        mask = _product_mask(img, bg)
        pts = _contour_points(mask)
        if len(pts) < 30:
            raise RimNotFound("no object on the rim photo")
        outer, _ = fit_ellipse_ransac(pts, tol=max(2.0, 0.01 * max(h, w)))
        if outer is None:
            raise RimNotFound("rim outline not found")
        if _has_tyre(img, outer):
            g = fit_wheel(img, mask)
            if g is None:
                raise RimNotFound("rim edge not found")
            rim = g.rim
        else:
            rim = outer.scaled(0.995)
        kind = "product"
    else:
        dets, _ = detect.propose(img)
        dets = [d for d in dets if d.conf >= 0.1]
        if not dets:
            raise RimNotFound("no wheel on the rim photo")
        d = max(dets, key=lambda d: (d.box[2] - d.box[0]) * (d.box[3] - d.box[1]) * (0.5 + d.conf))
        detect.segment(img, [d])
        g = fit_wheel(img, d.mask)
        if g is None:
            raise RimNotFound("rim edge not found")
        rim = g.rim
        kind = "on_car"

    tex, known = _rectify(img, rim, valid)
    yy, xx = np.mgrid[0:N, 0:N]
    rr = np.hypot(xx - N / 2, yy - N / 2)
    inside = rr <= RIM_R
    known &= inside
    spokes = _rot_order(tex, known)
    tex = _fill_symmetry(tex, known, spokes)

    alpha = inside.astype(np.uint8) * 255
    if product:  # background seen between spokes
        lab = cv2.cvtColor(tex, cv2.COLOR_BGR2LAB).astype(np.float32)
        hole = (np.linalg.norm(lab - bg, axis=2) < 10) & inside
        hole = cv2.morphologyEx(hole.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
        alpha[hole] = 0
    rgba = np.dstack([tex, alpha])
    return RimTexture(rgba, known, spokes, kind, rim)
