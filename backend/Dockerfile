FROM python:3.11-slim

# tesseract-ocr: the actual OCR binary pytesseract wraps — not installable via pip.
# libglib2.0-0/libsm6/libxext6/libxrender1: runtime libs opencv-python-headless still
# needs on Debian even though it skips the GUI (libgl1) dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
