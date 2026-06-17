from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse

from app.models.schemas import OCRScanResponse
from app.services.image_preprocessor import preprocess
from app.services.ocr_service import extract_text
from app.services.rate_limiter import is_rate_limited
from app.services.text_parser import parse_medicine_info

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/ocr/scan", response_model=OCRScanResponse)
async def scan(request: Request, file: UploadFile = File(...)):
    client_id = request.client.host if request.client else "unknown"
    if is_rate_limited(client_id):
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limited", "message": "Too many requests. Try again in a minute."},
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_file_type", "message": "Only JPEG and PNG images are accepted."},
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        return JSONResponse(
            status_code=413,
            content={"error": "file_too_large", "message": "Image must be under 5MB."},
        )

    try:
        processed = preprocess(image_bytes)
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_image", "message": "Couldn't read this image — try a different photo."},
        )

    ocr_result = extract_text(processed)
    parsed = parse_medicine_info(ocr_result["raw_text"], ocr_result["words"])

    return OCRScanResponse(
        medicine_name=parsed["medicine_name"],
        expiry_date=parsed["expiry_date"],
        confidence_score=ocr_result["confidence"],
        raw_text=ocr_result["raw_text"],
    )
