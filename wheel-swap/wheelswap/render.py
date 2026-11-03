"""Put a rim texture onto one wheel of the car photo.

Everything happens in the wheel's rim frame (geometry.WheelGeom): the old rim is the
unit circle, the tyre's outer sidewall edge the circle tyre_ratio. The new rim has
radius k = D1 / D0 there. The outer diameter of the tyre does not change (that is how
tyres are chosen for a bigger rim), so the sidewall [1, tyre_ratio] is remapped to
[k, tyre_ratio]. Beyond tyre_ratio the photo is untouched, so an under-estimated
tyre_ratio only shortens the remapped band and never leaves a seam.
"""
from dataclasses import dataclass

import cv2
import numpy as np

from .geometry import WheelGeom
from .rimsource import N as TEX_N, RIM_R as TEX_R, RimTexture


@dataclass
class RenderInfo:
    k: float
    tyre_ratio: float
    warning: str | None = None


def _canvas_frame(g: WheelGeom, rho_max: float, size: int):
    """Affine (2x3) from canvas pixels to image pixels; canvas centre = wheel centre."""
    a = np.vstack([g.rim.affine, [0, 0, 1]])
    half = size / 2
    s = np.array([[rho_max / half, 0, -rho_max], [0, rho_max / half, -rho_max], [0, 0, 1]])
    return (a @ s)[:2]


def _remap(img, m, size, flags=cv2.INTER_LINEAR, border=cv2.BORDER_REFLECT):
    mx, my = np.meshgrid(np.arange(size, dtype=np.float32), np.arange(size, dtype=np.float32))
    sx = (m[0, 0] * mx + m[0, 1] * my + m[0, 2]).astype(np.float32)
    sy = (m[1, 0] * mx + m[1, 1] * my + m[1, 2]).astype(np.float32)
    return cv2.remap(img, sx, sy, flags, borderMode=border)


def _lab(x):
    """8-bit Lab as float (L, a, b in 0..255); float input is clipped to uint8 first."""
    return cv2.cvtColor(np.clip(x, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)


def _bgr(x):
    return cv2.cvtColor(np.clip(x, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def render_wheel(img: np.ndarray, wheel_mask: np.ndarray, g: WheelGeom, tex: RimTexture, k: float) -> tuple[np.ndarray, RenderInfo]:
    """Return a copy of img with this wheel's rim replaced (and tyre resized)."""
    info = RenderInfo(k=k, tyre_ratio=g.tyre_ratio)
    R = float(np.clip(g.tyre_ratio, 1.08, 1.7))
    if k > R - 0.06:
        info.warning = "the new rim leaves almost no tyre; drawn with the thinnest tyre that still shows"
        k = R - 0.06
    rho_max = max(R, k) * 1.06
    # Canvas resolution: about 1.5x the wheel's size in the photo, capped.
    size = int(np.clip(2 * g.rim.major * rho_max * 1.5, 128, 1400))
    to_img = _canvas_frame(g, rho_max, size)

    orig = _remap(img, to_img, size)  # the wheel in its rim frame
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    ux, uy = (xx - size / 2) * (2 * rho_max / size), (yy - size / 2) * (2 * rho_max / size)
    rho = np.hypot(ux, uy)
    th = np.arctan2(uy, ux)

    # 1. Tyre: sidewall [1, R] -> [k, R].
    src_rho = np.where(rho >= R, rho, 1 + (rho - k) * (R - 1) / max(R - k, 1e-3))
    sx = (src_rho * np.cos(th)) / (2 * rho_max / size) + size / 2
    sy = (src_rho * np.sin(th)) / (2 * rho_max / size) + size / 2
    tyre = cv2.remap(orig, sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    # 2. New rim: texture scaled so its lip sits on rho = k.
    scale = TEX_R / (k * size / (2 * rho_max))  # texture px per canvas px
    m_tex = np.array([[scale, 0, TEX_N / 2 - scale * size / 2], [0, scale, TEX_N / 2 - scale * size / 2]])
    interp = cv2.INTER_AREA if scale > 1.5 else cv2.INTER_LINEAR
    if scale > 1.5:  # pre-shrink to avoid aliasing on small wheels
        f = 1 / scale
        small = cv2.resize(tex.rgba, None, fx=f * 1.5, fy=f * 1.5, interpolation=cv2.INTER_AREA)
        sc2 = small.shape[0] / TEX_N
        m_tex = np.array([[scale * sc2, 0, small.shape[1] / 2 - scale * sc2 * size / 2], [0, scale * sc2, small.shape[0] / 2 - scale * sc2 * size / 2]])
        rim = _remap(small, m_tex, size, border=cv2.BORDER_CONSTANT)
    else:
        rim = _remap(tex.rgba, m_tex, size, border=cv2.BORDER_CONSTANT)
    rim_rgb = rim[..., :3].astype(np.float32)
    rim_a = rim[..., 3].astype(np.float32) / 255

    # 3. Light: match exposure and colour cast of this photo, keep its shading.
    olab, rlab = _lab(orig), _lab(rim_rgb)
    old_rim = rho < 0.95
    tyre_band = (rho > 1.05) & (rho < min(R, 1.3))
    new_face = (rho < k * 0.95) & (rim_a > 0.5)
    if new_face.sum() > 50 and old_rim.sum() > 50:
        # exposure: the brightest parts (highlights) of a metal rim track scene exposure
        p_old = np.percentile(olab[..., 0][old_rim], 97)
        p_new = np.percentile(rlab[..., 0][new_face], 97)
        gain = float(np.clip((p_old / max(p_new, 1)) ** 0.5, 0.7, 1.15))
        rlab[..., 0] *= gain
        # colour cast: the tyre is neutral in reality, so its tint is the scene's tint
        if tyre_band.sum() > 50:
            cast = np.median(olab[..., 1:][tyre_band], axis=0) - 128
            rlab[..., 1:] = 128 + (rlab[..., 1:] - 128) * 0.9 + cast * 0.6
        # low-frequency shading across the wheel (top lit, bottom in shadow)
        L = olab[..., 0].copy()
        L[~old_rim] = np.median(L[old_rim])
        sig = size / 8
        shade = cv2.GaussianBlur(L, (0, 0), sig)
        shade = shade / max(np.median(shade[old_rim]), 1)
        rlab[..., 0] *= np.clip(shade, 0.6, 1.4) ** 0.6
    rim_rgb = _lab_to_bgr_f(rlab)

    # 4. Between the spokes: the dark inside of the wheel.
    inner_l = np.percentile(olab[..., 0][old_rim], 8) if old_rim.any() else 25
    dark = np.full_like(rim_rgb, 0)
    dark[...] = np.clip(inner_l * 0.8, 8, 45) * 255 / 100
    radial = np.clip(1 - (rho / max(k, 1e-3)) * 0.35, 0.6, 1)[..., None]
    dark = dark * radial
    face = rim_rgb * rim_a[..., None] + dark * (1 - rim_a[..., None])

    # 5. Match softness and grain of the photo.
    sharp_o = cv2.Laplacian(cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY), cv2.CV_32F)[old_rim].var() if old_rim.any() else 0
    gface = cv2.cvtColor(np.clip(face, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    sharp_n = cv2.Laplacian(gface, cv2.CV_32F)[rho < k * 0.95].var()
    if sharp_n > sharp_o * 1.5 and sharp_o > 0:
        sigma = float(np.clip(0.5 * np.log(sharp_n / sharp_o), 0.3, 2.0))
        face = cv2.GaussianBlur(face, (0, 0), sigma)
    noise_o = _noise_sigma(orig, tyre_band)
    if noise_o > 1:
        face = face + np.random.default_rng(0).normal(0, noise_o * 0.8, face.shape)

    # Compose on the canvas: new face inside k (soft lip edge), remapped tyre outside.
    edge = np.clip((k - rho) / (1.2 * 2 * rho_max / size) + 0.5, 0, 1)[..., None]
    canvas = face * edge + tyre.astype(np.float32) * (1 - edge)

    # Back to the photo (to_img is canvas -> image, i.e. warpAffine's forward map).
    # Change only the wheel itself: inside R and not an occluder.
    h, w = img.shape[:2]
    warped = cv2.warpAffine(np.clip(canvas, 0, 255).astype(np.uint8), to_img, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    region = np.zeros((size, size), np.float32)
    region[rho < R] = 1
    region = cv2.GaussianBlur(region, (0, 0), 0.8)
    reg_img = cv2.warpAffine(region, to_img, (w, h), flags=cv2.INTER_LINEAR)
    keep = _occluder_mask(img, wheel_mask, g, R)
    alpha = (reg_img * (1 - keep))[..., None]
    out = img.astype(np.float32) * (1 - alpha) + warped.astype(np.float32) * alpha
    return np.clip(out, 0, 255).astype(np.uint8), info


def _lab_to_bgr_f(lab):
    return _bgr(lab).astype(np.float32)


def _noise_sigma(img, region):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hp = g - cv2.GaussianBlur(g, (0, 0), 1.5)
    if region.sum() < 50:
        return 0.0
    return float(np.median(np.abs(hp[region])) * 1.4826)


def _occluder_mask(img, wheel_mask, g: WheelGeom, R: float) -> np.ndarray:
    """1 where something in front of the wheel must stay: fender, kerb, a leg.

    Inside the old rim, trust the rim ellipse (SAM sometimes drops spokes). In the tyre
    band, a pixel outside SAM's wheel mask that is also not rubber-dark is an occluder.
    """
    h, w = img.shape[:2]
    ring = g.rim.mask(img.shape, R).astype(bool)
    rim_in = g.rim.mask(img.shape, 0.98).astype(bool)
    wm = cv2.dilate(wheel_mask, np.ones((3, 3), np.uint8)).astype(bool)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    band = ring & ~rim_in
    if band.any() and wm[band].any():
        rubber_l = np.percentile(lab[..., 0][band & wm], 60)
    else:
        rubber_l = 60
    rubberish = (lab[..., 0] < rubber_l + 25) & (np.abs(lab[..., 1:] - 128).max(axis=2) < 18)
    occ = ring & ~wm & ~rubberish & ~rim_in
    occ = cv2.morphologyEx(occ.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return cv2.GaussianBlur(occ.astype(np.float32), (0, 0), 1.0)
