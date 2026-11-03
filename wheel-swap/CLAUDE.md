# Wheel Swap

A separate project inside this repository: nothing here belongs to the Admin panel
prototype, and the Admin panel's rules (spacing ladder, lint hook, decisions log,
worklog) do not apply in this folder.

Web app: car photo + rim photo + two rim diameters → the car with the new rims, in
perspective, with the tyre's sidewall redrawn for the new size. Plan and phases:
`docs/PLAN.md`. Iteration log: `docs/progress.md`.

## Run

```bash
make setup      # venv + requirements (CPU torch from PyPI)
make data       # evaluation photos from Open Images into data/ (not committed)
make test       # unit tests on synthetic wheels
make eval       # full evaluation → eval/out/metrics.json + contact sheets
make eval-product  # synthetic product shots (rim on white) → eval/out/product.json
make serve      # http://localhost:8000
```

Model weights download on first use into `models/` (not committed), from the
Ultralytics and rembg GitHub releases. HuggingFace is not reachable from the cloud sessions.

## Layout

```
wheelswap/detect.py     YOLOv8m-OIV7 boxes (Wheel, Tire, Car) + MobileSAM masks
wheelswap/geometry.py   ellipses: RANSAC outline, polar DP for the rim lip, rim frame
wheelswap/rimsource.py  rim photo → frontal RGBA texture (product shot or on a car),
                        quality gate (RimNotFound: no_rim, rim_cut, rim_unclear),
                        ISNet (rembg ONNX) vetoes "holes" that are white spokes
wheelswap/render.py     texture into the rim frame, tyre remap, light, grain, occluders
wheelswap/pipeline.py   filtering rules and the public swap()
app/                    FastAPI + one static page, no build step
eval/                   sets.json (photo ids + wheel boxes), fetch_data.py, run.py
```

## Rules

- Fully automatic: no manual correction in the UI. When unsure, skip the wheel and
  say why (`Report.skipped`), never draw a doubtful wheel.
- Straight front or rear views with no visible rim are rejected (`NoWheels`).
- The tyre's outer diameter is fixed; the new rim is `k = d1 / d0` of the old one.
- Every quality change goes through the loop in `docs/PLAN.md`: run `make eval`, look
  at the sheets, record the numbers in `docs/progress.md`, keep only improvements.
