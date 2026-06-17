import io
import time

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

from app.services.image_preprocessor import preprocess


def _font():
    try:
        return ImageFont.truetype("arial.ttf", 60)
    except OSError:
        return ImageFont.load_default()


def _strip_image(text_lines, size=(1600, 600), rotate_deg=0, fmt="JPEG") -> bytes:
    img = Image.new("RGB", size, color=(235, 235, 230))
    draw = ImageDraw.Draw(img)
    font = _font()
    for i, line in enumerate(text_lines):
        draw.text((100, 150 + i * 130), line, fill=(20, 20, 20), font=font)
    if rotate_deg:
        img = img.rotate(rotate_deg, expand=True, fillcolor=(235, 235, 230))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def _has_dark_pixels(image: Image.Image) -> bool:
    return np.array(image).min() == 0


@pytest.mark.parametrize(
    "lines,size,rotate_deg,fmt",
    [
        (["CROCIN 650", "EXP: 06/2027"], (1600, 600), 4, "JPEG"),
        (["CROCIN 650", "EXP: 06/2027"], (1600, 600), 0, "JPEG"),
        (["DOLO 650 EXP 12/2026"], (3000, 500), 0, "PNG"),  # wide, single line — regression case
        (["DOLO 650 EXP 12/2026"], (3000, 500), -4, "PNG"),
    ],
)
def test_preprocess_keeps_text_visible_and_upright(lines, size, rotate_deg, fmt):
    raw = _strip_image(lines, size=size, rotate_deg=rotate_deg, fmt=fmt)

    start = time.time()
    result = preprocess(raw)
    elapsed = time.time() - start

    assert result.mode == "L"
    assert elapsed < 2.0
    assert _has_dark_pixels(result), "text vanished — deskew likely mis-rotated"


def test_preprocess_caps_width_at_max():
    raw = _strip_image(["DOLO 650 EXP 12/2026"], size=(3000, 500), fmt="PNG")
    result = preprocess(raw)
    assert result.width <= 2000


def test_preprocess_invalid_bytes_raises():
    with pytest.raises(Exception):
        preprocess(b"not an image")
