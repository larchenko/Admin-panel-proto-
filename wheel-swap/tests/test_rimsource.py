"""Rim photo rules: the whole circle must be visible, and with enough detail."""
import cv2
import numpy as np
import pytest

from wheelswap.quality import LowResolution
from wheelswap.rimsource import RimNotFound, extract_rim


def product_shot(size=900, r=330, cx=450, cy=450, spokes=5):
    """A grey five-spoke rim on white, with see-through gaps and machined texture."""
    img = np.full((size, size, 3), 250, np.uint8)
    rng = np.random.default_rng(3)
    rim = np.zeros((size, size), np.uint8)
    cv2.circle(rim, (cx, cy), r, 1, -1)
    for i in range(spokes):  # gaps
        a0, a1 = 2 * np.pi * (i + 0.2) / spokes, 2 * np.pi * (i + 0.8) / spokes
        t = np.linspace(a0, a1, 30)
        pts = np.concatenate([np.stack([cx + 0.3 * r * np.cos(t), cy + 0.3 * r * np.sin(t)], 1), np.stack([cx + 0.86 * r * np.cos(t[::-1]), cy + 0.86 * r * np.sin(t[::-1])], 1)])
        cv2.fillPoly(rim, [pts.astype(np.int32)], 0)
    metal = np.clip(150 + rng.normal(0, 18, (size, size)), 0, 255).astype(np.uint8)
    metal = cv2.GaussianBlur(metal, (0, 0), 0.7)
    for c in range(3):
        img[..., c] = np.where(rim > 0, metal, img[..., c])
    cv2.circle(img, (cx, cy), r, (200, 200, 200), 6)
    return img


def test_full_rim_is_accepted():
    t = extract_rim(product_shot())
    assert t.kind == "product"
    # the gaps came out see-through
    assert (t.rgba[..., 3] == 0).mean() > 0.1


def test_rim_cut_by_frame_is_refused():
    img = product_shot(cx=300)[:, 100:]  # left part of the rim outside the photo
    with pytest.raises(RimNotFound, match="rim_cut"):
        extract_rim(img)


def test_blown_up_thumbnail_is_refused():
    img = product_shot()
    small = cv2.resize(img, None, fx=0.2, fy=0.2, interpolation=cv2.INTER_AREA)
    big = cv2.resize(small, (900, 900), interpolation=cv2.INTER_CUBIC)
    with pytest.raises(LowResolution):
        extract_rim(big)


def test_tiny_photo_is_refused():
    with pytest.raises(LowResolution):
        extract_rim(cv2.resize(product_shot(), (250, 250), interpolation=cv2.INTER_AREA))
