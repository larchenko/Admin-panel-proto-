"""Wheel geometry: ellipses of the tyre and the rim, and the frame that maps them to circles.

Model. The rim lip and the tyre's outer sidewall edge are two concentric coplanar
circles. Seen in a photo they are two ellipses. We work in the *rim frame*: the affine
map that sends the unit circle to the rim ellipse. In that frame the rim is the circle
rho = 1 and the tyre's outer edge is the circle rho = tyre_ratio (about 1.3-1.6).

The affine approximation ignores perspective foreshortening across one wheel, which
is small for a wheel at normal shooting distance.
"""
from dataclasses import dataclass, field

import cv2
import numpy as np


@dataclass
class Ellipse:
    cx: float
    cy: float
    a: float  # semi-axis along the rotated x
    b: float  # semi-axis along the rotated y
    angle: float  # degrees, OpenCV convention

    @classmethod
    def from_cv(cls, e):
        (cx, cy), (w, h), ang = e
        return cls(float(cx), float(cy), float(w) / 2, float(h) / 2, float(ang))

    def to_cv(self):
        return ((self.cx, self.cy), (2 * self.a, 2 * self.b), self.angle)

    @property
    def affine(self) -> np.ndarray:
        """2x3 matrix: unit-circle coordinates -> image pixels."""
        t = np.deg2rad(self.angle)
        r = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
        m = r @ np.diag([self.a, self.b])
        return np.hstack([m, [[self.cx], [self.cy]]])

    def to_unit(self, pts: np.ndarray) -> np.ndarray:
        """Image points (N,2) -> unit-circle frame."""
        m = self.affine
        inv = np.linalg.inv(m[:, :2])
        return (pts - m[:, 2]) @ inv.T

    def from_unit(self, pts: np.ndarray) -> np.ndarray:
        m = self.affine
        return pts @ m[:, :2].T + m[:, 2]

    @property
    def axis_ratio(self) -> float:
        return min(self.a, self.b) / max(self.a, self.b)

    @property
    def major(self) -> float:
        return max(self.a, self.b)

    def tilt_from_vertical(self) -> float:
        """Angle (deg) between the major axis and the image vertical."""
        ang = self.angle if self.b >= self.a else self.angle + 90
        d = abs(((ang % 180) + 90) % 180 - 90)  # angle of the 'height' axis vs vertical
        return d

    def scaled(self, s: float) -> "Ellipse":
        return Ellipse(self.cx, self.cy, self.a * s, self.b * s, self.angle)

    def mask(self, shape, scale: float = 1.0) -> np.ndarray:
        m = np.zeros(shape[:2], np.uint8)
        cv2.ellipse(m, self.scaled(scale).to_cv(), 1, -1, lineType=cv2.LINE_8)
        return m


@dataclass
class WheelGeom:
    rim: Ellipse
    tyre_ratio: float  # outer tyre radius / rim radius, in the rim frame
    rim_score: float  # mean edge strength along the rim path (confidence)
    outer: Ellipse  # initial ellipse fitted to the wheel mask
    debug: dict = field(default_factory=dict)

    @property
    def tyre(self) -> Ellipse:
        return self.rim.scaled(self.tyre_ratio)


def _contour_points(mask: np.ndarray) -> np.ndarray:
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs:
        return np.zeros((0, 2))
    c = max(cs, key=cv2.contourArea)
    return c[:, 0, :].astype(np.float64)


def _ellipse_residual(e: Ellipse, pts: np.ndarray) -> np.ndarray:
    """Approximate distance (pixels) from points to the ellipse."""
    u = e.to_unit(pts)
    rho = np.linalg.norm(u, axis=1)
    return np.abs(rho - 1) * min(e.a, e.b)


def _extent(e: Ellipse) -> tuple[float, float, float, float]:
    t = np.deg2rad(e.angle)
    hw = np.sqrt((e.a * np.cos(t)) ** 2 + (e.b * np.sin(t)) ** 2)
    hh = np.sqrt((e.a * np.sin(t)) ** 2 + (e.b * np.cos(t)) ** 2)
    return e.cx - hw, e.cy - hh, e.cx + hw, e.cy + hh


def _within(e: Ellipse, box, slack: float) -> bool:
    x0, y0, x1, y1 = _extent(e)
    bw, bh = box[2] - box[0], box[3] - box[1]
    return x0 > box[0] - slack * bw and y0 > box[1] - slack * bh and x1 < box[2] + slack * bw and y1 < box[3] + slack * bh


def fit_ellipse_ransac(pts: np.ndarray, tol: float, iters: int = 300, seed: int = 0, box=None, slack: float = 0.12) -> tuple[Ellipse | None, np.ndarray]:
    """Robust ellipse fit: occluders (fender, ground, kerb) cut straight chunks out of the contour.

    box (x0, y0, x1, y1): the ellipse may not reach further than `slack` beyond it.
    An occluded wheel is never much larger than its visible part.
    """
    if len(pts) < 20:
        return None, np.zeros(len(pts), bool)
    rng = np.random.default_rng(seed)
    best, best_in = None, np.zeros(len(pts), bool)
    n = len(pts)
    for _ in range(iters):
        idx = rng.choice(n, 6, replace=False)
        try:
            e = Ellipse.from_cv(cv2.fitEllipse(pts[idx].astype(np.float32)))
        except cv2.error:
            continue
        if not np.isfinite([e.a, e.b]).all() or min(e.a, e.b) < 3:
            continue
        if box is not None and not _within(e, box, slack):
            continue
        inl = _ellipse_residual(e, pts) < tol
        if inl.sum() > best_in.sum():
            best, best_in = e, inl
    if best is None:
        return None, best_in
    for _ in range(3):  # refine on inliers
        if best_in.sum() < 6:
            break
        ref = Ellipse.from_cv(cv2.fitEllipse(pts[best_in].astype(np.float32)))
        if box is not None and not _within(ref, box, slack):
            break
        best = ref
        best_in = _ellipse_residual(best, pts) < tol
    return best, best_in


def polar_unwrap(img: np.ndarray, e: Ellipse, rho_max: float, n_rho: int, n_theta: int = 360) -> np.ndarray:
    """Sample img on (theta, rho) of ellipse e's unit frame: out[theta, rho]."""
    th = np.linspace(0, 2 * np.pi, n_theta, endpoint=False)
    rho = np.linspace(0, rho_max, n_rho)
    x = np.cos(th)[:, None] * rho[None, :]
    y = np.sin(th)[:, None] * rho[None, :]
    m = e.affine
    mx = (m[0, 0] * x + m[0, 1] * y + m[0, 2]).astype(np.float32)
    my = (m[1, 0] * x + m[1, 1] * y + m[1, 2]).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def polar_unwrap_const(img: np.ndarray, e: Ellipse, rho_max: float, n_rho: int, n_theta: int = 360) -> np.ndarray:
    """polar_unwrap with zero outside the image (for validity masks)."""
    th = np.linspace(0, 2 * np.pi, n_theta, endpoint=False)
    rho = np.linspace(0, rho_max, n_rho)
    x = np.cos(th)[:, None] * rho[None, :]
    y = np.sin(th)[:, None] * rho[None, :]
    m = e.affine
    mx = (m[0, 0] * x + m[0, 1] * y + m[0, 2]).astype(np.float32)
    my = (m[1, 0] * x + m[1, 1] * y + m[1, 2]).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def dp_path(cost: np.ndarray, max_step: int) -> np.ndarray:
    """Minimum-cost closed path through a (theta, rho) cost map, one rho per theta.

    The theta axis is circular: run over three laps and keep the middle one.
    """
    n_t, n_r = cost.shape
    c3 = np.vstack([cost, cost, cost])
    acc = c3[0].copy()
    back = np.zeros(c3.shape, np.int32)
    offs = np.arange(-max_step, max_step + 1)
    for t in range(1, len(c3)):
        cand = np.full((len(offs), n_r), np.inf)
        for i, o in enumerate(offs):
            src = np.arange(n_r) - o
            ok = (src >= 0) & (src < n_r)
            cand[i, ok] = acc[src[ok]] + 0.02 * abs(o)
        k = np.argmin(cand, axis=0)
        back[t] = np.arange(n_r) - offs[k]
        acc = cand[k, np.arange(n_r)] + c3[t]
    path = np.zeros(len(c3), np.int32)
    path[-1] = int(np.argmin(acc))
    for t in range(len(c3) - 1, 0, -1):
        path[t - 1] = back[t, path[t]]
    return path[n_t : 2 * n_t]


def _off_border(pts: np.ndarray, shape) -> np.ndarray:
    h, w = shape[:2]
    return (pts[:, 0] > 1) & (pts[:, 1] > 1) & (pts[:, 0] < w - 2) & (pts[:, 1] < h - 2)


def rim_contrast(img_lab: np.ndarray, e: Ellipse) -> float:
    """How much this ellipse looks like a rim lip: lighter or textured metal inside,
    plain dark rubber outside, around most of the circumference. 0..1."""
    pol = polar_unwrap(img_lab, e, 1.2, 60, 180).astype(np.float32)
    rho = np.linspace(0, 1.2, 60)
    inn = pol[:, (rho > 0.82) & (rho < 0.96)]
    out = pol[:, (rho > 1.04) & (rho < 1.16)]
    l_in, l_out = inn[..., 0].mean(1), out[..., 0].mean(1)
    chroma_out = np.abs(out[..., 1:] - 128).max(2).mean(1)
    tex_in = inn[..., 0].std(1)
    tex_out = out[..., 0].std(1)
    step = (l_in - l_out > 6) | ((tex_in > tex_out + 3) & (l_in - l_out > -4))
    rubber = chroma_out < 16
    return float((step & rubber).mean())


def _rim_by_polar(img, outer):
    """Strongest closed radial edge between 40% and 95% of the outer ellipse."""
    n_rho, r0, r1 = 160, 0.40, 0.95
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    k = max(1, int(round(outer.major / 150)))
    gray = cv2.GaussianBlur(gray, (0, 0), k)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    pol = polar_unwrap(gray, outer, r1 * 1.05, n_rho)
    pol_lab = polar_unwrap(lab, outer, r1 * 1.05, n_rho)
    rho = np.linspace(0, r1 * 1.05, n_rho)
    inside = np.ones(img.shape[:2], np.float32)
    inside[:2], inside[-2:], inside[:, :2], inside[:, -2:] = 0, 0, 0, 0
    in_frame = polar_unwrap_const(inside, outer, r1 * 1.05, n_rho) > 0.99
    g = np.gradient(pol, axis=1)
    gc = np.linalg.norm(np.gradient(pol_lab, axis=1), axis=2)
    # Rim is usually brighter than rubber: favour bright->dark going outward.
    edge = (np.maximum(-g, 0) * 1.0 + np.abs(g) * 0.3 + gc * 0.3) * in_frame
    band = (rho >= r0) & (rho <= r1)
    e_band = edge[:, band]
    e_norm = e_band / (np.percentile(e_band, 99) + 1e-6)
    prior = 0.15 * ((rho[band] - 0.70) / 0.25) ** 2  # rim around 0.70 of the outer ellipse
    path = dp_path(-e_norm + prior[None, :], max_step=2)
    rr = rho[band][path]
    th = np.linspace(0, 2 * np.pi, len(rr), endpoint=False)
    rim_pts = outer.from_unit(np.stack([np.cos(th) * rr, np.sin(th) * rr], 1))
    strength = e_norm[np.arange(len(path)), path]
    seen = in_frame[:, band][np.arange(len(path)), path]
    if seen.mean() < 0.4:
        return None, rim_pts
    good = seen & (strength > np.percentile(strength[seen], 30))
    rim, _ = fit_ellipse_ransac(rim_pts[good], tol=max(1.5, 0.015 * outer.major), iters=200)
    return rim, rim_pts


def _rim_by_tyre_split(img, mask, outer):
    """Remove the dark rubber connected to the wheel's outline; the rest is the rim."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    m = mask.astype(bool)
    ring = m & ~outer.mask(img.shape, 0.85).astype(bool)
    core = m & outer.mask(img.shape, 0.5).astype(bool)
    if ring.sum() < 30 or core.sum() < 30:
        return None
    l_tyre = np.percentile(lab[..., 0][ring], 30)
    l_rim = np.median(lab[..., 0][core])
    if l_rim - l_tyre < 15:
        return None  # dark rim on dark rubber: leave it to the edge search
    thr = (l_tyre + l_rim) / 2
    chroma = np.abs(lab[..., 1:] - 128).max(2)
    rubber = m & (lab[..., 0] < thr) & (chroma < 20)
    rubber = cv2.morphologyEx(rubber.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # keep the rubber that touches the outline (gaps between spokes are dark too)
    n, lbl = cv2.connectedComponents(rubber)
    edge_lbls = set(np.unique(lbl[ring & (rubber > 0)])) - {0}
    tyre = np.isin(lbl, list(edge_lbls))
    rim_region = (m & ~tyre).astype(np.uint8)
    rim_region = cv2.morphologyEx(rim_region, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(rim_region)
    if n <= 1:
        return None
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    region = (lbl == big).astype(np.uint8)
    pts = _contour_points(region)
    pts = pts[_off_border(pts, img.shape)]
    if len(pts) < 30:
        return None
    x, y, w, h = cv2.boundingRect(region)
    rim, inl = fit_ellipse_ransac(pts, tol=max(1.5, 0.012 * outer.major), iters=200, box=(x, y, x + w, y + h), slack=0.08)
    if rim is None or inl.mean() < 0.4:
        return None
    return rim


def fit_wheel(img: np.ndarray, mask: np.ndarray, min_contrast: float = 0.35) -> WheelGeom | None:
    """min_contrast: required rim_contrast of the chosen lip. Black rims on black rubber
    score low by nature, so the caller lowers it for confident detections."""
    pts_all = _contour_points(mask)
    pts = pts_all[_off_border(pts_all, mask.shape)]  # the frame edge is not the wheel's outline
    if len(pts) < 30:
        return None
    x, y, w, h = cv2.boundingRect(mask)
    tol = max(2.0, 0.02 * max(w, h))
    outer, inl = fit_ellipse_ransac(pts, tol, box=(x, y, x + w, y + h))
    # A 3/4 view shows the tread and the mask grabs the shadow: the outline is then no
    # ellipse. Keep a rough one and let only the rubber/metal split find the rim.
    weak = outer is None or inl.mean() < 0.35
    if weak:
        outer = Ellipse.from_cv(cv2.fitEllipse(pts.astype(np.float32)))
        inl = np.ones(len(pts), bool)

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    cands = []
    rim_pts = np.zeros((0, 2))
    if not weak:
        rim_p, rim_pts = _rim_by_polar(img, outer)
        if rim_p is not None:
            cands.append(("polar", rim_p))
    rim_t = _rim_by_tyre_split(img, mask, outer)
    if rim_t is not None:
        cands.append(("split", rim_t))
        rim_r, _ = _rim_by_polar(img, rim_t.scaled(1 / 0.72))  # edge search around it
        if rim_r is not None:
            cands.append(("split+polar", rim_r))
    # SAM sometimes returns the rim alone: then the outline itself is the lip.
    if not weak:
        cands.append(("outline", outer))
    best, best_s, best_name = None, -1.0, ""
    for name, e in cands:
        if e.major > outer.major * 1.03 or e.major < outer.major * 0.4:
            continue
        sc = rim_contrast(lab, e)
        if name == "outline":
            sc -= 0.15  # only when clearly better: usually the outline is the tyre
        if sc > best_s:
            best, best_s, best_name = e, sc, name
    if best is None or best_s < (max(0.55, min_contrast) if weak else min_contrast):
        return None
    rim = best

    # Tyre outer edge in the rim frame: mode of the mask boundary radius.
    u = rim.to_unit(pts)
    rr_mask = np.linalg.norm(u, axis=1)
    rr_mask = rr_mask[inl]
    rr_mask = rr_mask[(rr_mask > 1.1) & (rr_mask < 2.0)]
    if len(rr_mask) > 20:
        hist, edges = np.histogram(rr_mask, bins=45, range=(1.1, 2.0))
        hist = np.convolve(hist, [1, 2, 3, 2, 1], "same")
        i = int(np.argmax(hist))
        tyre_ratio = float((edges[i] + edges[i + 1]) / 2)
    else:
        tyre_ratio = 1.25

    return WheelGeom(rim, tyre_ratio, best_s, outer, debug=dict(rim_pts=rim_pts, method=best_name))
