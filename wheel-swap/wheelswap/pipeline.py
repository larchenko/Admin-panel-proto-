"""Car photo + rim photo + sizes -> car photo with the new rims."""
from dataclasses import dataclass, field

import numpy as np

from . import detect, quality
from .geometry import WheelGeom, fit_wheel
from .render import render_wheel
from .rimsource import RimTexture, extract_rim

MIN_AXIS_RATIO = 0.18  # flatter than this the rim is seen edge-on: nothing to replace
MAX_TILT = 35  # degrees between the wheel's long axis and the vertical


class NoWheels(Exception):
    """The car photo shows no rim that can be replaced (e.g. a straight front view)."""


@dataclass
class Wheel:
    det: detect.Detection
    geom: WheelGeom


@dataclass
class Report:
    wheels: list = field(default_factory=list)  # dicts per replaced wheel
    skipped: list = field(default_factory=list)  # dicts per rejected candidate
    warnings: list = field(default_factory=list)
    rim_kind: str = ""
    spokes: int = 0


def _main_car(cars):
    if not cars:
        return None
    return max(cars, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))


def find_wheels(img: np.ndarray, report: Report | None = None) -> list[Wheel]:
    report = report or Report()
    dets, cars = detect.propose(img)
    car = _main_car(cars)
    cands = []
    for d in dets:
        cx, cy = (d.box[0] + d.box[2]) / 2, (d.box[1] + d.box[3]) / 2
        if d.conf < 0.12:
            continue
        if car is not None:
            bw, bh = car[2] - car[0], car[3] - car[1]
            inside = car[0] - 0.05 * bw <= cx <= car[2] + 0.05 * bw and car[1] + 0.3 * bh <= cy <= car[3] + 0.05 * bh
            if not inside:
                report.skipped.append(dict(box=d.box.tolist(), reason="not on the main car"))
                continue
            if (d.box[3] - d.box[1]) < 0.12 * bh:
                report.skipped.append(dict(box=d.box.tolist(), reason="too small"))
                continue
        cands.append(d)
    detect.segment(img, cands)
    wheels = []
    for d in cands:
        g = fit_wheel(img, d.mask, min_contrast=0.1 if d.conf >= 0.4 else 0.35)
        if g is None:
            report.skipped.append(dict(box=d.box.tolist(), reason="no wheel outline"))
            continue
        if g.rim.axis_ratio < MIN_AXIS_RATIO:
            report.skipped.append(dict(box=d.box.tolist(), reason="rim seen edge-on"))
            continue
        # The orientation of a near-circle is noise: only check tilt on flattened rims.
        if g.rim.axis_ratio < 0.8 and g.rim.tilt_from_vertical() > MAX_TILT:
            report.skipped.append(dict(box=d.box.tolist(), reason="not upright"))
            continue
        e = g.tyre
        box = (e.cx - e.major, e.cy - e.major, e.cx + e.major, e.cy + e.major)
        g.debug["eff_px"] = quality.effective_size(2 * g.rim.major, img, box)
        wheels.append(Wheel(d, g))
    if wheels:  # wheels of one car are of similar size in the photo
        top = max(w.geom.rim.major for w in wheels)
        keep = []
        for w in wheels:
            if w.geom.rim.major < 0.45 * top:
                report.skipped.append(dict(box=w.det.box.tolist(), reason="much smaller than the other wheels"))
            else:
                keep.append(w)
        wheels = keep
    if wheels:  # too little detail: say so rather than paint a smudge
        best = max(w.geom.debug["eff_px"] for w in wheels)
        if best < quality.MIN_MAIN_WHEEL_PX:
            raise quality.LowResolution("car", best, quality.MIN_MAIN_WHEEL_PX)
        keep = []
        for w in wheels:
            if w.geom.debug["eff_px"] < quality.MIN_WHEEL_PX:
                report.skipped.append(dict(box=w.det.box.tolist(), reason="too little detail"))
            else:
                keep.append(w)
        wheels = keep
    return wheels


def swap(car_img: np.ndarray, rim_img: np.ndarray, d0: float, d1: float, rim: RimTexture | None = None):
    """Replace every visible rim. d0: current rim diameter (inches), d1: new one."""
    report = Report()
    if not (10 <= d0 <= 26 and 10 <= d1 <= 26):
        raise ValueError("rim diameters are expected between 10 and 26 inches")
    if min(car_img.shape[:2]) < quality.MIN_SIDE_PX:
        raise quality.LowResolution("car", min(car_img.shape[:2]), quality.MIN_SIDE_PX)
    rim = rim or extract_rim(rim_img)
    report.rim_kind, report.spokes = rim.kind, rim.spokes
    wheels = find_wheels(car_img, report)
    if not wheels:
        raise NoWheels("no rim is visible on this photo; take it from the side or at an angle")
    k = d1 / d0
    out = car_img.copy()
    for w in sorted(wheels, key=lambda w: w.geom.rim.major):  # far wheels first
        out, info = render_wheel(out, w.det.mask, w.geom, rim, k)
        report.wheels.append(dict(box=w.det.box.tolist(), tyre_ratio=round(info.tyre_ratio, 3), rim_score=round(w.geom.rim_score, 3)))
        if info.warning and info.warning not in report.warnings:
            report.warnings.append(info.warning)
    return out, report
