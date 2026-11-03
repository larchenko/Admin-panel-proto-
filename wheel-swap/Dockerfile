# CPU image. torch comes from the PyTorch CPU index (the PyPI wheel pulls CUDA, ~3 GB).
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt
COPY wheelswap wheelswap
COPY app app
# Weights download on first start into /app/models; mount a volume there to keep them.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT}"]
