PY ?= .venv/bin/python

.PHONY: setup data test eval eval-product serve

setup:
	python3 -m venv .venv
	$(PY) -m pip install -r requirements.txt

data:
	$(PY) eval/fetch_data.py

test:
	$(PY) -m pytest -q

eval:
	$(PY) eval/run.py

eval-product:
	$(PY) eval/synth_product.py
	$(PY) eval/run_product.py

serve:
	$(PY) -m uvicorn app.server:app --host 0.0.0.0 --port $${PORT:-8000}
