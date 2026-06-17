from typing import Optional

from pydantic import BaseModel


class OCRScanResponse(BaseModel):
    medicine_name: Optional[str]
    expiry_date: Optional[str]
    confidence_score: float
    raw_text: str


class ErrorResponse(BaseModel):
    error: str
    message: str
