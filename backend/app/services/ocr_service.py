import os

import pytesseract
from pytesseract import Output
from PIL import Image

# On Render (Linux), `apt-get install tesseract-ocr` puts the binary on PATH, so the
# pytesseract default works unmodified. TESSERACT_CMD is only for local dev on systems
# (e.g. Windows) where the binary isn't on PATH.
if os.environ.get("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]


def extract_text(image: Image.Image) -> dict:
    """Runs Tesseract over `image`, returning raw text, mean word confidence (0-100),
    and per-word data (text/confidence/line/height) for downstream parsing heuristics."""
    data = pytesseract.image_to_data(image, output_type=Output.DICT)

    words = []
    confidences = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if not text:
            continue
        conf = int(data["conf"][i])
        if conf < 0:  # Tesseract uses -1 for non-text regions
            continue
        words.append(
            {
                "text": text,
                "conf": conf,
                # Tesseract's line_num resets per block, so it's only unique combined
                # with block_num/par_num — never group lines by line_num alone.
                "block_num": data["block_num"][i],
                "par_num": data["par_num"][i],
                "line_num": data["line_num"][i],
                "height": data["height"][i],
            }
        )
        confidences.append(conf)

    raw_text = pytesseract.image_to_string(image).strip()
    confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return {"raw_text": raw_text, "confidence": confidence, "words": words}
