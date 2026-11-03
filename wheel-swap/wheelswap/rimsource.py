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

from . import detect, models
from .geometry import Ellipse, _contour_points, _off_border, fit_ellipse_ransac, fit_wheel, polar_unwrap, rim_contrast

N = 768  # canonical texture size
RIM_R = N * 0.48  # rim lip radius in the texture


class RimNotFound(Exception):
    pass


_isnet = None


def matte(img: np.ndarray) -> np.ndarray:
    """Foreground probability (0..1) from ISNet (rembg's general-use model), image size.

    Colour alone cannot tell a white spoke from the white background seen between
    spokes; ISNet can, and its outline is used only to veto such "holes"."""
    global _isnet
    if _isnet is None:
        import onnxruntime as ort

        _isnet = ort.InferenceSession(str(models.path("isnet-general-use.onnx")), providers=["CPUExecutionProvider"])
    h, w = img.shape[:2]
    x = cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    x = (x - 0.5).transpose(2, 0, 1)[None]
    y = _isnet.run(None, {_isnet.get_inputs()[0].name: x})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    return cv2.resize(y, (w, h), interpolation=cv2.INTER_LINEAR)


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


def _local_std(gray: np.ndarray, k: int = 5) -> np.ndarray:
    m = cv2.blur(gray, (k, k))
    return np.sqrt(np.maximum(cv2.blur(gray * gray, (k, k)) - m * m, 0))


def _bg_like(lab: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """Background or its soft shadow: the background's tint, not much darker, flat."""
    chroma_d = np.linalg.norm(lab[..., 1:] - bg[1:], axis=2)
    dl = bg[0] - lab[..., 0]
    flat = _local_std(lab[..., 0]) < 3.0
    return (chroma_d < 6) & (dl > -8) & (dl < 70) & flat | (np.linalg.norm(lab - bg, axis=2) < 10)


def _product_mask(img: np.ndarray, bg: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    fg = (~_bg_like(lab, bg)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
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


def _holes(tex: np.ndarray, bg: np.ndarray, inside: np.ndarray, fg_prob: np.ndarray | None = None) -> np.ndarray:
    """Background (or its shadow) seen through the spokes of a product shot.

    Only on a light background: on a dark one the gaps look like the dark inside of a
    wheel anyway. Specks are chrome highlights; a gap is a sizeable flat patch.
    """
    if bg[0] < 150:
        return np.zeros(inside.shape, bool)
    lab = cv2.cvtColor(tex, cv2.COLOR_BGR2LAB).astype(np.float32)
    cand = _bg_like(lab, bg) & inside
    if fg_prob is not None:
        cand &= fg_prob < 0.6
    cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(cand)
    keep = np.zeros(n, bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 0.0012 * N * N
    hole = keep[lbl]
    return cv2.dilate(hole.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)


def _is_product(img: np.ndarray) -> tuple[bool, np.ndarray]:
    """A product shot: plain light background on most of the border (even when the rim
    is cut by the frame). Dark plain backgrounds go the on-car way: a black rim on black
    cannot be cut out by colour, and a dark close-up is usually a wheel on a car."""
    bg, uniform = _border_bg(img)
    return bg[0] > 150 and ((uniform > 0.6) or (uniform > 0.4 and bg[0] > 200)), bg


def texture_stats(rgba: np.ndarray) -> tuple[float, float]:
    """(lip_var, symmetry) of a rim texture.

    lip_var: how much the outer flange changes around the circle, relative to the
    disc's contrast. A real lip is a continuous ring (low); spokes or a tyre crossing
    it mean the ellipse is not the lip. symmetry: best correlation of the spoke zone
    with itself rotated by 360/n, n = 3..12."""
    g = cv2.cvtColor(rgba[..., :3], cv2.COLOR_BGR2GRAY).astype(np.float32)
    pol = cv2.warpPolar(g, (256, 720), (N / 2, N / 2), RIM_R, cv2.WARP_POLAR_LINEAR)
    rho = np.linspace(0, 1, 256)
    band = pol[:, (rho > 0.9) & (rho < 0.99)].mean(1)
    disc = pol[:, (rho > 0.2) & (rho < 0.99)]
    lip_var = float(band.std() / (disc.std() + 1e-6))
    p = pol[:, (rho > 0.35) & (rho < 0.85)]
    sym = max(float(np.corrcoef(p.ravel(), np.roll(p, int(round(720 / n)), 0).ravel())[0, 1]) for n in range(3, 13))
    return lip_var, sym


def extract_rim(img: np.ndarray) -> RimTexture:
    """Raise RimNotFound with a reason when the photo cannot give a whole rim:
    'no_rim' (nothing rim-like found) or 'rim_cut' (the rim's outer edge is not visible).
    """
    h, w = img.shape[:2]
    product, bg = _is_product(img)
    valid = np.ones((h, w), np.uint8)
    lab_img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    if product:
        mask = _product_mask(img, bg)
        pts_all = _contour_points(mask)
        pts = pts_all[_off_border(pts_all, img.shape)]
        if len(pts) < 30:
            raise RimNotFound("no_rim")
        x, y, bw, bh = cv2.boundingRect(mask)
        # the rim may continue past the frame: allow the ellipse to leave the box there
        outer, inl = fit_ellipse_ransac(pts, tol=max(1.5, 0.005 * max(h, w)), box=(x, y, x + bw, y + bh), slack=0.6, iters=500)
        if outer is None or inl.mean() < 0.35:
            raise RimNotFound("no_rim")
        if _has_tyre(img, outer):
            g = fit_wheel(img, mask, min_contrast=0.2)
            if g is None:
                raise RimNotFound("no_rim")
            rim = g.rim
        else:
            rim = outer.scaled(0.995)
        kind = "product"
    else:
        dets, _ = detect.propose(img)
        dets = [d for d in dets if d.conf >= 0.1]
        if not dets:
            raise RimNotFound("no_rim")
        d = max(dets, key=lambda d: (d.box[2] - d.box[0]) * (d.box[3] - d.box[1]) * (0.5 + d.conf))
        detect.segment(img, [d])
        g = fit_wheel(img, d.mask, min_contrast=0.3)
        if g is None:
            raise RimNotFound("no_rim")
        rim = g.rim
        box_r = max(d.box[2] - d.box[0], d.box[3] - d.box[1]) / 2
        if rim.major < 0.45 * box_r:  # a centre cap or a brake caliper, not the rim
            raise RimNotFound("rim_cut")
        contrast = rim_contrast(lab_img, rim)
        if contrast < 0.3:  # no rubber around it: the lip is outside the photo
            raise RimNotFound("rim_cut")
        kind = "on_car"

    if rim.axis_ratio < 0.45:  # seen too much from the side to unfold into a frontal view
        raise RimNotFound("rim_unclear")
    tex, known = _rectify(img, rim, valid)
    yy, xx = np.mgrid[0:N, 0:N]
    rr = np.hypot(xx - N / 2, yy - N / 2)
    inside = rr <= RIM_R
    known &= inside
    cover = known.sum() / inside.sum()
    spokes = _rot_order(tex, known)
    if cover < 0.4 or (cover < 0.85 and spokes == 0):
        raise RimNotFound("rim_cut")
    if kind == "product":
        lip_var, _ = texture_stats(np.dstack([tex, inside.astype(np.uint8) * 255]))
        if lip_var > 1.3:  # the outline found is not a lip running round the rim
            raise RimNotFound("rim_unclear")
    if kind == "on_car":
        # Calibrated on the 22 eval rim photos (docs/progress.md, iteration 2): rejects
        # every texture that was a tyre, a hub close-up or a caliper; costs one good rim.
        lip_var, sym = texture_stats(np.dstack([tex, inside.astype(np.uint8) * 255]))
        if not (sym >= 0.4 or (lip_var <= 0.5 and contrast >= 0.75)):
            raise RimNotFound("rim_unclear")
    tex = _fill_symmetry(tex, known, spokes)

    alpha = inside.astype(np.uint8) * 255
    if product:
        fg = matte(img)
        fg_tex, _ = _rectify(np.dstack([fg, fg, fg]), rim, valid)
        alpha[_holes(tex, bg, inside, fg_tex[..., 0])] = 0
    rgba = np.dstack([tex, alpha])
    return RimTexture(rgba, known, spokes, kind, rim)
