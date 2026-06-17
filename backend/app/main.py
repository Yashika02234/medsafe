import pytesseract
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS
from app.services import ocr_service  # noqa: F401 — import applies TESSERACT_CMD override

app = FastAPI(title="MedSafe OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    try:
        tesseract_version = str(pytesseract.get_tesseract_version())
    except Exception as e:
        tesseract_version = f"unavailable: {e}"
    return {"status": "ok", "tesseract_version": tesseract_version}
