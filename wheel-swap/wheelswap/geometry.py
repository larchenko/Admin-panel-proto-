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


def fit_ellipse_ransac(pts: np.ndarray, tol: float, iters: int = 300, seed: int = 0) -> tuple[Ellipse | None, np.ndarray]:
    """Robust ellipse fit: occluders (fender, ground, kerb) cut straight chunks out of the contour."""
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
        inl = _ellipse_residual(e, pts) < tol
        if inl.sum() > best_in.sum():
            best, best_in = e, inl
    if best is None:
        return None, best_in
    for _ in range(3):  # refine on inliers
        if best_in.sum() < 6:
            break
        best = Ellipse.from_cv(cv2.fitEllipse(pts[best_in].astype(np.float32)))
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


def fit_wheel(img: np.ndarray, mask: np.ndarray) -> WheelGeom | None:
    pts_all = _contour_points(mask)
    pts = pts_all[_off_border(pts_all, mask.shape)]  # the frame edge is not the wheel's outline
    if len(pts) < 30:
        return None
    x, y, w, h = cv2.boundingRect(mask)
    tol = max(2.0, 0.02 * max(w, h))
    outer, inl = fit_ellipse_ransac(pts, tol)
    if outer is None or inl.mean() < 0.45:
        return None

    # Rim boundary: strongest closed radial edge between 45% and 92% of the outer ellipse.
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
    # Prior: rim radius around 0.70 of the outer ellipse.
    prior = 0.15 * ((rho[band] - 0.70) / 0.25) ** 2
    cost = -e_norm + prior[None, :]
    path = dp_path(cost, max_step=2)
    rr = rho[band][path]
    th = np.linspace(0, 2 * np.pi, len(rr), endpoint=False)
    unit = np.stack([np.cos(th) * rr, np.sin(th) * rr], 1)
    rim_pts = outer.from_unit(unit)
    strength = e_norm[np.arange(len(path)), path]
    seen = in_frame[:, band][np.arange(len(path)), path]
    if seen.mean() < 0.4:
        return None
    good = seen & (strength > np.percentile(strength[seen], 30))
    rim, rin = fit_ellipse_ransac(rim_pts[good], tol=max(1.5, 0.015 * outer.major), iters=200)
    if rim is None:
        return None
    rim_score = float(strength[seen].mean())

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
        tyre_ratio = float(np.median(np.linalg.norm(outer.to_unit(rim_pts), axis=1)) ** -1)

    return WheelGeom(rim, tyre_ratio, rim_score, outer, debug=dict(rim_pts=rim_pts, path=rr, strength=strength))
