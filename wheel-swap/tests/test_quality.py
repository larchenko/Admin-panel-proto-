"""Effective resolution and the refusals that depend on it."""
import cv2
import numpy as np
import pytest

from wheelswap import quality
from wheelswap.quality import LowResolution, upscale_factor


def texture(size=512, seed=0):
    """Sharp detail at every scale (like a photo of gravel)."""
    rng = np.random.default_rng(seed)
    img = np.zeros((size, size), np.float32)
    for s in (1, 2, 4, 8, 16, 32):
        n = rng.normal(0, 1, (size // s + 1, size // s + 1)).astype(np.float32)
        img += cv2.resize(n, (size, size), interpolation=cv2.INTER_NEAREST if s == 1 else cv2.INTER_CUBIC)[:size, :size] * 18
    return np.clip(img + 128, 0, 255).astype(np.uint8)


def enlarge(img, s):
    h, w = img.shape[:2]
    small = cv2.resize(img, (int(w / s), int(h / s)), interpolation=cv2.INTER_AREA)
    big = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)
    return cv2.imdecode(cv2.imencode(".jpg", big, [cv2.IMWRITE_JPEG_QUALITY, 85])[1], 0)


def test_sharp_is_native():
    assert upscale_factor(texture()) < 1.4


@pytest.mark.parametrize("s", [2, 3, 4])
def test_enlarged_is_detected(s):
    f = upscale_factor(enlarge(texture(), s))
    assert s * 0.7 < f < s * 1.5


def test_large_region_measured_on_a_native_window():
    """Measured on a window at full resolution. Cubic enlargement keeps some energy
    above the cut-off, so the factor comes out up to ~30% low: errs towards accepting."""
    big = cv2.resize(texture(512), (1400, 1400), interpolation=cv2.INTER_CUBIC)  # enlarged 2.7x
    f = upscale_factor(big)
    assert 1.8 < f < 4.0


def test_low_resolution_code():
    e = LowResolution("rim", 123.4, quality.MIN_RIM_PHOTO_PX)
    assert e.code == "rim_low_res" and e.have == 123 and e.need == quality.MIN_RIM_PHOTO_PX
