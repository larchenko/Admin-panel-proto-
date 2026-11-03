"""Synthetic wheels with known geometry: the fitted ellipses must come back within tolerance."""
import cv2
import numpy as np
import pytest

from wheelswap.geometry import Ellipse, dp_path, fit_ellipse_ransac, fit_wheel


def draw_wheel(e_rim: Ellipse, tyre_ratio: float, shape=(480, 640), spokes=5):
    """Grey background, dark tyre, light rim with dark gaps between spokes."""
    img = np.full(shape + (3,), 150, np.uint8)
    cv2.ellipse(img, e_rim.scaled(tyre_ratio).to_cv(), (30, 30, 30), -1)
    cv2.ellipse(img, e_rim.to_cv(), (200, 200, 205), -1)
    m = e_rim.affine
    for i in range(spokes):  # gaps between spokes, drawn in the rim frame
        a0 = 2 * np.pi * (i + 0.25) / spokes
        a1 = 2 * np.pi * (i + 0.75) / spokes
        t = np.linspace(a0, a1, 20)
        pts = np.concatenate([np.stack([0.3 * np.cos(t), 0.3 * np.sin(t)], 1), np.stack([0.85 * np.cos(t[::-1]), 0.85 * np.sin(t[::-1])], 1)])
        img_pts = pts @ m[:, :2].T + m[:, 2]
        cv2.fillPoly(img, [img_pts.astype(np.int32)], (40, 40, 40))
    mask = e_rim.scaled(tyre_ratio).mask(shape)
    return img, mask


@pytest.mark.parametrize("ratio,angle", [(1.0, 0), (0.6, 5), (0.45, -8), (0.8, 12)])
def test_fit_wheel_recovers_rim(ratio, angle):
    e = Ellipse(320, 240, 90 * ratio, 90, angle)
    img, mask = draw_wheel(e, 1.4)
    g = fit_wheel(img, mask)
    assert g is not None
    assert abs(g.rim.cx - e.cx) < 2 and abs(g.rim.cy - e.cy) < 2
    assert abs(g.rim.major - e.major) < 2.5
    assert abs(g.rim.axis_ratio - e.axis_ratio) < 0.03
    assert 1.3 < g.tyre_ratio < 1.5


def test_fit_wheel_with_fender_cut():
    """A fender hides the top of the tyre: the rim is still found."""
    e = Ellipse(320, 260, 70, 95, 0)
    img, mask = draw_wheel(e, 1.35)
    mask[: 260 - 110] = 0
    img[: 260 - 110] = (40, 40, 200)
    g = fit_wheel(img, mask)
    assert g is not None
    assert abs(g.rim.major - 95) < 3


def test_ransac_ignores_straight_occlusion():
    e = Ellipse(200, 200, 60, 100, 0)
    t = np.linspace(0, 2 * np.pi, 400, endpoint=False)
    pts = np.stack([200 + 60 * np.cos(t), 200 + 100 * np.sin(t)], 1)
    pts[pts[:, 1] < 130, 1] = 130  # flattened top
    fit, inl = fit_ellipse_ransac(pts, tol=2)
    assert abs(fit.b - 100) < 3 and abs(fit.a - 60) < 3


def test_affine_round_trip():
    e = Ellipse(10, 20, 30, 50, 33)
    p = np.array([[0.3, -0.2], [1, 0], [0, 1]])
    assert np.allclose(e.to_unit(e.from_unit(p)), p)


def test_dp_path_follows_ridge():
    n_t, n_r = 90, 50
    cost = np.zeros((n_t, n_r))
    ridge = (25 + 5 * np.sin(np.linspace(0, 2 * np.pi, n_t, endpoint=False))).astype(int)
    cost[np.arange(n_t), ridge] = -1
    path = dp_path(cost, max_step=2)
    assert np.abs(path - ridge).max() <= 1
