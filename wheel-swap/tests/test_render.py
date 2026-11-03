"""Rendering on a synthetic wheel: sizes, untouched surroundings, no seams."""
import numpy as np

from wheelswap.geometry import Ellipse, fit_wheel
from wheelswap.render import render_wheel
from wheelswap.rimsource import N, RIM_R, RimTexture

from .test_geometry import draw_wheel


def flat_texture(color=(60, 200, 60)):
    rgba = np.zeros((N, N, 4), np.uint8)
    yy, xx = np.mgrid[0:N, 0:N]
    inside = np.hypot(xx - N / 2, yy - N / 2) <= RIM_R
    rgba[inside, :3] = color
    rgba[inside, 3] = 255
    return RimTexture(rgba, inside, 0, "product", Ellipse(0, 0, 1, 1, 0))


def setup():
    e = Ellipse(320, 240, 60, 90, 0)
    img, mask = draw_wheel(e, 1.45)
    g = fit_wheel(img, mask)
    return img, mask, g


def green_extent(out):
    """Vertical extent (px) of the new rim colour."""
    m = (out[..., 1].astype(int) - out[..., 0] > 60) & (out[..., 1].astype(int) - out[..., 2] > 60)
    ys = np.nonzero(m.any(1))[0]
    return ys.max() - ys.min() + 1


def test_same_size_keeps_rim_diameter():
    img, mask, g = setup()
    out, _ = render_wheel(img, mask, g, flat_texture(), 1.0)
    assert abs(green_extent(out) - 180) <= 6


def test_bigger_rim_scales_and_keeps_tyre_outer():
    img, mask, g = setup()
    out, _ = render_wheel(img, mask, g, flat_texture(), 18 / 16)
    assert abs(green_extent(out) - 180 * 18 / 16) <= 7
    # outside the tyre nothing changes
    far = np.ones(img.shape[:2], bool)
    far[240 - 150 : 240 + 150, 320 - 110 : 320 + 110] = False
    assert np.abs(out.astype(int) - img.astype(int))[far].max() == 0


def test_smaller_rim_fills_with_tyre():
    img, mask, g = setup()
    out, _ = render_wheel(img, mask, g, flat_texture(), 15 / 17)
    assert green_extent(out) < 170
    # where the old rim edge was, there is now dark rubber
    assert out[240 - 88, 320].mean() < 80


def test_too_big_rim_warns():
    img, mask, g = setup()
    _, info = render_wheel(img, mask, g, flat_texture(), 1.6)
    assert info.warning
