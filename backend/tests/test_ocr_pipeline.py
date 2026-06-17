import io

import pytest
from PIL import Image, ImageDraw, ImageFont

from app.services.image_preprocessor import preprocess
from app.services.ocr_service import extract_text
from app.services.text_parser import parse_expiry, parse_medicine_info


def _font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _strip_image(brand: str, expiry_line: str) -> bytes:
    img = Image.new("RGB", (1600, 600), color=(235, 235, 230))
    draw = ImageDraw.Draw(img)
    # Brand name rendered larger, matching real strips — the parser's height
    # heuristic depends on this size difference.
    draw.text((100, 120), brand, fill=(20, 20, 20), font=_font(80))
    draw.text((100, 320), expiry_line, fill=(20, 20, 20), font=_font(45))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.parametrize(
    "brand,expiry_line,expected_expiry",
    [
        ("CROCIN 650", "EXP: 06/2027", "06/2027"),
        ("DOLO 650", "EXP 12/2026", "12/2026"),
        ("THYRONORM", "EXPIRY: 03-2028", "03-2028"),
    ],
)
def test_full_pipeline_extracts_name_and_expiry(brand, expiry_line, expected_expiry):
    raw = _strip_image(brand, expiry_line)
    processed = preprocess(raw)
    ocr_result = extract_text(processed)
    parsed = parse_medicine_info(ocr_result["raw_text"], ocr_result["words"])

    assert ocr_result["confidence"] > 50
    assert parsed["expiry_date"] == expected_expiry
    # OCR'd brand text should at least contain the brand's first word —
    # exact match isn't guaranteed even on clean synthetic text.
    assert brand.split()[0] in (parsed["medicine_name"] or "")


def test_parse_expiry_prefers_labeled_date_over_bare_date():
    text = "BATCH 04/2025 SOME TEXT EXP: 11/2026 MORE TEXT"
    assert parse_expiry(text) == "11/2026"


def test_parse_expiry_returns_none_when_absent():
    assert parse_expiry("NO DATE INFORMATION HERE") is None


def test_extract_text_on_blank_image_has_low_confidence():
    blank = Image.new("L", (400, 200), color=255)
    result = extract_text(blank)
    assert result["raw_text"] == ""
    assert result["confidence"] == 0.0
