"""HTTP API and the static page.

    POST /api/swap   multipart: car, rim (images), d0, d1 (inches)
                     -> {"image": "data:image/jpeg;base64,...", "report": {...}}
                     or {"error": "no_wheels" | "no_rim" | "rim_cut" | "rim_unclear" | "bad_input"}
                     or {"error": "car_low_res" | "rim_low_res", "have": px, "need": px}
"""
import asyncio
import base64
import os
import pathlib
import sys
import time
from dataclasses import asdict

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from wheelswap import detect  # noqa: E402
from wheelswap.pipeline import NoWheels, swap  # noqa: E402
from wheelswap.quality import LowResolution  # noqa: E402
from wheelswap.rimsource import RimNotFound  # noqa: E402

MAX_SIDE = 2000  # larger photos are scaled down before processing
STATIC = pathlib.Path(__file__).resolve().parent / "static"

app = FastAPI(title="Wheel Swap")
app.mount("/static", StaticFiles(directory=STATIC), name="static")
_lock = asyncio.Lock()  # one job at a time: the models are not thread-safe and CPU-bound


@app.on_event("startup")
def _warm():
    if os.environ.get("WHEELSWAP_LAZY") != "1":
        detect._get_yolo()
        detect._get_sam()


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


def _decode(data: bytes, what: str) -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, f"{what}: the file is not an image")
    h, w = img.shape[:2]
    s = MAX_SIDE / max(h, w)
    if s < 1:
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return img


@app.post("/api/swap")
async def api_swap(car: UploadFile = File(...), rim: UploadFile = File(...), d0: float = Form(...), d1: float = Form(...)):
    car_img = _decode(await car.read(), "car photo")
    rim_img = _decode(await rim.read(), "rim photo")
    t0 = time.time()
    async with _lock:
        try:
            out, report = await asyncio.to_thread(swap, car_img, rim_img, d0, d1)
        # Expected refusals are answers, not failures: 200 with an "error" code, so the
        # page can explain them and the browser console stays clean.
        except NoWheels as e:
            return JSONResponse({"error": "no_wheels", "message": str(e)})
        except RimNotFound as e:
            return JSONResponse({"error": str(e) or "no_rim", "message": str(e)})
        except LowResolution as e:
            return JSONResponse({"error": e.code, "have": e.have, "need": e.need})
        except ValueError as e:
            return JSONResponse({"error": "bad_input", "message": str(e)})
    ok, buf = cv2.imencode(".jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 92])
    rep = asdict(report)
    rep["seconds"] = round(time.time() - t0, 2)
    return {"image": "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode(), "report": rep}
