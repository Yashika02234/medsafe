import io

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app.main import app
from app.services import rate_limiter

client = TestClient(app)


def _font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _strip_jpeg() -> bytes:
    img = Image.new("RGB", (1600, 600), color=(235, 235, 230))
    draw = ImageDraw.Draw(img)
    draw.text((100, 150), "CROCIN 650", fill=(20, 20, 20), font=_font(80))
    draw.text((100, 320), "EXP: 06/2027", fill=(20, 20, 20), font=_font(45))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def setup_function():
    rate_limiter._request_log.clear()


def test_scan_returns_parsed_result():
    res = client.post(
        "/ocr/scan",
        files={"file": ("strip.jpg", _strip_jpeg(), "image/jpeg")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["expiry_date"] == "06/2027"
    assert "CROCIN" in (body["medicine_name"] or "")
    assert body["confidence_score"] > 0


def test_scan_rejects_invalid_content_type():
    res = client.post(
        "/ocr/scan",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert res.status_code == 400
    assert res.json()["error"] == "invalid_file_type"


def test_scan_rejects_oversized_file():
    big = b"\x00" * (5 * 1024 * 1024 + 1)
    res = client.post(
        "/ocr/scan",
        files={"file": ("big.jpg", big, "image/jpeg")},
    )
    assert res.status_code == 413
    assert res.json()["error"] == "file_too_large"


def test_scan_rejects_corrupt_image():
    res = client.post(
        "/ocr/scan",
        files={"file": ("fake.jpg", b"not a real image", "image/jpeg")},
    )
    assert res.status_code == 400
    assert res.json()["error"] == "invalid_image"


def test_scan_rate_limits_after_threshold():
    payload = _strip_jpeg()
    for _ in range(10):
        res = client.post("/ocr/scan", files={"file": ("strip.jpg", payload, "image/jpeg")})
        assert res.status_code == 200

    res = client.post("/ocr/scan", files={"file": ("strip.jpg", payload, "image/jpeg")})
    assert res.status_code == 429
    assert res.json()["error"] == "rate_limited"
