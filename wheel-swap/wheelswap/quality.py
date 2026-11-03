"""Effective resolution of a photo region.

Photos from the internet are often thumbnails blown up, or soft: the pixel count says
1200 px, the detail says 300 px. The power spectrum tells them apart. A region that was
enlarged s times has almost no energy above 1/s of the Nyquist frequency, and a blurred
one behaves the same, which is what matters here: in both, the detail is not there.

cutoff = the frequency (cycles/px, Nyquist 0.5) below which 99% of the energy lies.
On the eval photos (tests/test_quality.py): sharp crops ~0.40-0.47, enlarged 2x ~0.22,
enlarged 3x ~0.17, close to the theory 0.5/s.
"""
import cv2
import numpy as np

SHARP_CUTOFF = 0.45  # cutoff of a sharp, native-resolution crop
# Thresholds, effective pixels. On the eval photos the lowest values seen were: rim
# photos 203, the largest wheel of a car 55 (a car small in a 1024 px photo), far
# wheels 23. A 1024 px photo blown up from 200 px falls below them.
MIN_RIM_PHOTO_PX = 200  # rim diameter on the rim photo
MIN_MAIN_WHEEL_PX = 45  # rim diameter of the largest wheel on the car photo
MIN_WHEEL_PX = 20  # rim diameter of any other wheel (smaller ones are skipped)
MIN_SIDE_PX = 300  # shorter side of either photo, in plain pixels


class LowResolution(Exception):
    """A photo has too little detail. which: "car" or "rim"; have/need in effective px."""

    def __init__(self, which: str, have: float, need: float):
        super().__init__(f"{which}_low_res")
        self.which, self.have, self.need = which, int(round(have)), int(need)

    @property
    def code(self) -> str:
        return f"{self.which}_low_res"


def spectral_cutoff(gray: np.ndarray, frac: float = 0.01) -> float:
    g = gray.astype(np.float32)
    g = g - g.mean()
    h, w = g.shape
    win = np.outer(np.hanning(h), np.hanning(w)).astype(np.float32)
    p = np.abs(np.fft.fftshift(np.fft.fft2(g * win))) ** 2
    yy, xx = np.mgrid[0:h, 0:w]
    fr = np.hypot((yy - h / 2) / h, (xx - w / 2) / w)
    m = (fr > 0.02) & (fr <= 0.5)
    order = np.argsort(fr[m])
    e, f = p[m][order], fr[m][order]
    if e.sum() <= 0:
        return 0.0
    c = np.cumsum(e) / e.sum()
    return float(f[min(np.searchsorted(c, 1 - frac), len(f) - 1)])


def upscale_factor(img: np.ndarray, box=None, max_side: int = 768) -> float:
    """How many times the region (x0, y0, x1, y1) looks enlarged; 1.0 = sharp native."""
    if box is not None:
        x0, y0, x1, y1 = [int(round(v)) for v in box]
        h, w = img.shape[:2]
        img = img[max(0, y0) : min(h, y1), max(0, x0) : min(w, x1)]
    if img.size == 0 or min(img.shape[:2]) < 32:
        return 1.0
    gray = img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Big regions: measure the central window at full resolution (shrinking would hide
    # the enlargement). Detail is about as fine everywhere in a wheel or a rim.
    h, w = gray.shape
    if max(h, w) > max_side:
        y0, x0 = max(0, (h - max_side) // 2), max(0, (w - max_side) // 2)
        gray = gray[y0 : y0 + max_side, x0 : x0 + max_side]
    return float(np.clip(SHARP_CUTOFF / max(spectral_cutoff(gray), 1e-3), 1.0, 16.0))


def effective_size(px: float, img: np.ndarray, box=None) -> float:
    """A length in pixels divided by the region's enlargement factor."""
    return px / upscale_factor(img, box)
