import io

import cv2
import numpy as np
from PIL import Image

MAX_WIDTH = 2000


def preprocess(image_bytes: bytes) -> Image.Image:
    """Load -> resize -> grayscale -> deskew -> adaptive threshold.

    Produces a high-contrast, upright image for OCR. Returns a PIL Image
    (mode "L") rather than writing to disk — callers decide what to do with it.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    if image.width > MAX_WIDTH:
        ratio = MAX_WIDTH / image.width
        new_size = (MAX_WIDTH, round(image.height * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    gray = np.array(image.convert("L"))
    deskewed = _deskew(gray)
    thresholded = cv2.adaptiveThreshold(
        deskewed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )

    return Image.fromarray(thresholded)


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Rotation-correct using minAreaRect over an Otsu-thresholded text mask.

    Otsu's threshold here is only for angle *detection* — independent of the
    caller's final adaptive threshold — so detection isn't coupled to the
    final output's polarity.
    """
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(binary > 0))
    if coords.shape[0] < 10:
        return gray  # not enough foreground signal to estimate a reliable angle

    angle = cv2.minAreaRect(coords)[-1]
    # OpenCV's angle convention (4.5+) reports angles in [0, 90). For text that's
    # already near-horizontal (the common case — a strip held roughly straight),
    # this comes back near 90 rather than near 0. Normalize into (-45, 45] first,
    # or a small real skew gets corrected as a spurious ~90-degree rotation.
    if angle > 45:
        angle -= 90
    angle = -angle

    if abs(angle) < 0.5:
        return gray  # negligible rotation, skip the resample

    h, w = gray.shape
    matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(
        gray, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
