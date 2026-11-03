# CPU image for Hugging Face Spaces (Docker SDK) or any Docker host.
# torch comes from the PyTorch CPU index: the PyPI wheel pulls CUDA (~3 GB).
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*
# Spaces run the container as uid 1000
RUN useradd -m -u 1000 user
WORKDIR /app
ARG TORCH_INDEX=https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url ${TORCH_INDEX} \
 && pip install --no-cache-dir -r requirements.txt
COPY --chown=user wheelswap wheelswap
COPY --chown=user app app
RUN mkdir -p models && chown user models
USER user
ENV HOME=/home/user YOLO_CONFIG_DIR=/tmp/ultralytics
# Bake the weights (~400 MB, Ultralytics and rembg GitHub releases) into the image,
# so a cold start does not download them.
RUN python -c "from wheelswap import models; [models.path(n) for n in models.URLS]"
ENV PORT=7860
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT}"]
